import { createKeyringBackend } from "../credentials/keyring-backend.js";
import { CamoufoxErrorBox, mapPlaywrightError, sanitizeReason } from "../errors.js";
import { duckduckgoAdapter } from "../search/adapters/duckduckgo.js";
import { googleAdapter } from "../search/adapters/google.js";
import { runSearch } from "../search/orchestrator.js";
import { createSearchContext } from "../search/search-context.js";
import { attachSsrfGuard } from "../security/redirect-guard.js";
import { assertSafeTarget } from "../security/ssrf.js";
import { fetchSources } from "../sources/orchestrator.js";
import { DEFAULT_CONFIG } from "../types.js";
import { createEventEmitter, newSpanId, } from "./events.js";
import { SCREENSHOT_MAX_BYTES, capturePageScreenshot, extractSlice, htmlToMarkdown, resolveWaitUntil, validateFetchUrlOpts, waitForSelectorOrThrow, } from "./fetch-pipeline.js";
import { createHttpFetch } from "./http-fetch.js";
import { combineSignals } from "./signal.js";
export class CamoufoxClient {
    events = createEventEmitter();
    launcher;
    config;
    ssrfLookup;
    state = { status: "idle" };
    searchContext = null;
    sources;
    credentialsConfig;
    httpFetchInjected;
    credentialBackendCache = null;
    httpFetchCache = null;
    constructor(opts) {
        this.launcher = opts.launcher;
        this.config = opts.config ?? DEFAULT_CONFIG;
        this.ssrfLookup = opts.ssrfLookup;
        this.sources = opts.sources ?? [];
        this.credentialsConfig = opts.credentials;
        this.httpFetchInjected = opts.httpFetch;
    }
    isAlive() {
        return this.state.status === "ready" && this.state.browser?.isConnected() === true;
    }
    async checkHealth(opts = {}) {
        const status = this.state.status === "idle" ? "launching" : this.state.status;
        const snapshot = {
            status,
            browserConnected: this.state.status === "ready" ? this.state.browser?.isConnected() === true : false,
            browserVersion: this.state.version ?? null,
            launchedAt: this.state.launchedAt ?? null,
            uptimeMs: this.state.status === "ready" && this.state.launchedAt
                ? Date.now() - this.state.launchedAt
                : null,
            lastError: this.state.status === "failed" && this.state.error ? this.state.error.err : null,
        };
        if (opts.probe) {
            if (this.state.status !== "ready" || !this.state.context || !this.state.browser) {
                snapshot.probe = {
                    ok: false,
                    roundTripMs: 0,
                    error: { type: "playwright_disconnected" },
                };
                return snapshot;
            }
            const probeStarted = Date.now();
            try {
                const page = await this.state.context.newPage();
                try {
                    await page.goto("about:blank", { timeout: 2_000, waitUntil: "load" });
                    snapshot.probe = {
                        ok: true,
                        roundTripMs: Date.now() - probeStarted,
                        error: null,
                    };
                }
                finally {
                    await page.close().catch(() => undefined);
                }
            }
            catch (err) {
                const mapped = mapPlaywrightError(err, {
                    url: "about:blank",
                    phase: "nav",
                    elapsedMs: Date.now() - probeStarted,
                    ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
                });
                snapshot.probe = {
                    ok: false,
                    roundTripMs: Date.now() - probeStarted,
                    error: mapped,
                };
            }
        }
        return snapshot;
    }
    emitError(spanId, op, err) {
        if (err instanceof CamoufoxErrorBox) {
            this.events.emit("error", { spanId, op, error: err.err });
        }
    }
    async ensureReady(signal) {
        if (this.state.status === "ready")
            return;
        if (this.state.status === "failed" && this.state.error)
            throw this.state.error;
        if (this.state.status === "closed") {
            throw new CamoufoxErrorBox({ type: "playwright_disconnected" });
        }
        if (this.state.status === "launching" && this.state.launchPromise) {
            await this.awaitWithSignal(this.state.launchPromise, signal);
            return;
        }
        const spanId = newSpanId();
        const launchPromise = this.doLaunch(spanId);
        this.state = { status: "launching", launchPromise };
        await this.awaitWithSignal(launchPromise, signal);
    }
    async fetchUrl(url, opts) {
        const spanId = newSpanId();
        const started = Date.now();
        try {
            await this.ensureReady(opts.signal);
            const { renderMode, format } = validateFetchUrlOpts(opts);
            try {
                await assertSafeTarget(url, this.ssrfLookup ? { lookup: this.ssrfLookup } : {});
            }
            catch (err) {
                throw new CamoufoxErrorBox({
                    type: "ssrf_blocked",
                    hop: "initial",
                    url,
                    reason: sanitizeReason(err instanceof Error ? err.message : String(err)),
                });
            }
            const navOpts = {
                signal: opts.signal,
                timeoutMs: opts.timeoutMs ?? this.config.timeoutMs,
                waitUntil: resolveWaitUntil(renderMode),
            };
            if (opts.isolate !== undefined)
                navOpts.isolate = opts.isolate;
            const { page, response, cleanup, guard } = await this.navigate(url, navOpts);
            let currentPhase = "nav";
            try {
                if (opts.waitForSelector !== undefined) {
                    currentPhase = "wait_for_selector";
                    const remaining = Math.max(0, (opts.timeoutMs ?? this.config.timeoutMs) - (Date.now() - started));
                    await waitForSelectorOrThrow(page, opts.waitForSelector, remaining);
                }
                let screenshotResult;
                if (opts.screenshot !== undefined) {
                    currentPhase = "screenshot";
                    screenshotResult = await capturePageScreenshot(page, opts.screenshot);
                    if (screenshotResult.bytes > SCREENSHOT_MAX_BYTES) {
                        throw new CamoufoxErrorBox({
                            type: "config_invalid",
                            field: "screenshot",
                            reason: `exceeds 10 MiB cap (got ${screenshotResult.bytes} bytes)`,
                        });
                    }
                }
                currentPhase = "extract";
                const { html: rawHtml } = await extractSlice(page, opts.selector);
                const finalUrl = response.url();
                let body;
                if (format === "markdown") {
                    try {
                        body = htmlToMarkdown(rawHtml, finalUrl);
                    }
                    catch (err) {
                        throw new CamoufoxErrorBox({
                            type: "config_invalid",
                            field: "markdown",
                            reason: sanitizeReason(`markdown conversion failed: ${err instanceof Error ? err.message : String(err)}`),
                        });
                    }
                }
                else {
                    body = rawHtml;
                }
                const maxBytes = opts.maxBytes ?? this.config.maxBytes;
                const rawBytes = Buffer.byteLength(body, "utf8");
                let cappedBody = body;
                let bytes = rawBytes;
                let truncated = false;
                if (rawBytes > maxBytes) {
                    const buf = Buffer.from(body, "utf8");
                    cappedBody = buf.subarray(0, maxBytes).toString("utf8");
                    bytes = Buffer.byteLength(cappedBody, "utf8");
                    truncated = true;
                }
                const result = {
                    html: format === "html" ? cappedBody : rawHtml,
                    status: response.status(),
                    finalUrl,
                    bytes,
                    truncated,
                };
                if (format === "markdown")
                    result.markdown = cappedBody;
                if (screenshotResult)
                    result.screenshot = screenshotResult;
                guard.assertNotBlocked();
                this.events.emit("fetch_url", {
                    spanId,
                    url,
                    finalUrl: result.finalUrl,
                    status: result.status,
                    bytes: result.bytes,
                    truncated: result.truncated,
                    isolate: opts.isolate ?? false,
                    durationMs: Date.now() - started,
                    renderMode,
                    usedWaitForSelector: opts.waitForSelector !== undefined,
                    usedSelector: opts.selector !== undefined,
                    format,
                    screenshotBytes: screenshotResult?.bytes ?? null,
                });
                return result;
            }
            catch (err) {
                // A guard-recorded block takes precedence over any pipeline error:
                // the fetch already touched an unsafe hop, so classifying the
                // result as ssrf_blocked (not config_invalid / network / timeout)
                // preserves the security-signal visibility for callers.
                guard.assertNotBlocked();
                if (opts.signal.aborted) {
                    throw new CamoufoxErrorBox({ type: "aborted" });
                }
                if (err instanceof CamoufoxErrorBox)
                    throw err;
                const mapped = mapPlaywrightError(err, {
                    url: response.url(),
                    phase: currentPhase,
                    elapsedMs: Date.now() - started,
                    signal: opts.signal,
                });
                throw new CamoufoxErrorBox(mapped);
            }
            finally {
                cleanup();
                await page.close().catch(() => undefined);
            }
        }
        catch (err) {
            this.emitError(spanId, "fetchUrl", err);
            throw err;
        }
    }
    getOrCreateSearchContext() {
        if (this.searchContext === null) {
            this.searchContext = createSearchContext(() => this.getBrowser(), this.ssrfLookup ? { ssrfLookup: this.ssrfLookup } : {});
        }
        return this.searchContext;
    }
    async search(query, opts) {
        const spanId = newSpanId();
        try {
            // Defensive runtime guard: callers bypassing TypeScript may still set isolate.
            // Per-call isolation is no longer supported; SearchContext recycles automatically.
            if (opts.isolate === true) {
                throw new CamoufoxErrorBox({
                    type: "config_invalid",
                    field: "isolate",
                    reason: "per-call isolate is no longer supported; SearchContext recycles automatically on block or every 50 queries",
                });
            }
            await this.ensureReady(opts.signal);
            const maxResults = opts.maxResults ?? 10;
            if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 50) {
                throw new CamoufoxErrorBox({
                    type: "config_invalid",
                    field: "maxResults",
                    reason: `must be integer in [1, 50], got ${maxResults}`,
                });
            }
            if (opts.timeoutMs !== undefined &&
                (!Number.isInteger(opts.timeoutMs) || opts.timeoutMs < 1_000 || opts.timeoutMs > 120_000)) {
                throw new CamoufoxErrorBox({
                    type: "config_invalid",
                    field: "timeoutMs",
                    reason: `must be integer in [1000, 120000], got ${opts.timeoutMs}`,
                });
            }
            const engine = opts.engine ?? "auto";
            const context = this.getOrCreateSearchContext();
            const out = await runSearch(query, {
                maxResults,
                engine,
                signal: opts.signal,
                adapters: [googleAdapter, duckduckgoAdapter],
                context,
                emitSearchEvent: (payload) => this.events.emit("search", { spanId, ...payload }),
                timeoutMs: opts.timeoutMs ?? this.config.timeoutMs,
                ...(this.ssrfLookup ? { ssrfLookup: this.ssrfLookup } : {}),
            });
            return out;
        }
        catch (err) {
            this.emitError(spanId, "search", err);
            throw err;
        }
    }
    async fetchSources(query, opts) {
        const backend = await this.getOrInitCredentialBackend();
        const httpFetch = this.getOrInitHttpFetch();
        const orchestratorOpts = {
            sources: opts.sources,
            lookbackDays: opts.lookbackDays ?? 30,
            perSourceLimit: opts.perSourceLimit ?? 25,
            adapters: this.sources,
            credentialBackend: backend,
            httpFetch,
            emit: (e) => {
                this.events.emit("source_fetch", e);
            },
            ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
        };
        return fetchSources(query, orchestratorOpts);
    }
    /**
     * Lazy-init the credential backend on first source call. Concurrent calls
     * race harmlessly: two parallel keyring loads both succeed and the second
     * overwrites the first with an equivalent backend. Failure is not cached
     * (rethrown each time), so a user fixing keyring mid-session can retry.
     */
    async getOrInitCredentialBackend() {
        if (this.credentialBackendCache)
            return this.credentialBackendCache;
        const cfg = this.credentialsConfig;
        if (cfg?.backend === "custom") {
            if (!cfg.customBackend) {
                throw new CamoufoxErrorBox({
                    type: "config_invalid",
                    field: "credentials.customBackend",
                    reason: "backend=custom requires customBackend",
                });
            }
            this.credentialBackendCache = cfg.customBackend;
            return this.credentialBackendCache;
        }
        // No credentials config, or backend !== "custom" → default to keyring.
        try {
            this.credentialBackendCache = await createKeyringBackend();
        }
        catch (err) {
            throw new CamoufoxErrorBox({
                type: "credential_backend_unavailable",
                backend: "keyring",
                reason: err instanceof Error ? err.message : String(err),
            });
        }
        return this.credentialBackendCache;
    }
    getOrInitHttpFetch() {
        if (this.httpFetchInjected)
            return this.httpFetchInjected;
        if (this.httpFetchCache)
            return this.httpFetchCache;
        this.httpFetchCache = createHttpFetch({
            ...(this.ssrfLookup ? { lookup: this.ssrfLookup } : {}),
            emit: (e) => {
                this.events.emit("http_fetch", e);
            },
        });
        return this.httpFetchCache;
    }
    async navigate(url, opts) {
        let context;
        let ownContext = false;
        if (opts.isolate) {
            const browser = this.getBrowser();
            context = await browser.newContext();
            ownContext = true;
        }
        else {
            context = this.getContext();
        }
        const combined = combineSignals(opts.signal, opts.timeoutMs);
        const page = await context.newPage();
        const guard = await attachSsrfGuard(page, this.ssrfLookup ? { lookup: this.ssrfLookup } : {});
        const abortHandler = () => {
            page.close().catch(() => undefined);
        };
        combined.signal.addEventListener("abort", abortHandler, { once: true });
        let cleanupRan = false;
        const cleanup = () => {
            if (cleanupRan)
                return;
            cleanupRan = true;
            combined.signal.removeEventListener("abort", abortHandler);
            combined.cleanup();
            guard.detach().catch(() => undefined);
            if (ownContext) {
                context.close().catch(() => undefined);
            }
        };
        const started = Date.now();
        try {
            let response;
            try {
                response = await page.goto(url, {
                    timeout: opts.timeoutMs,
                    waitUntil: opts.waitUntil,
                });
            }
            catch (err) {
                guard.assertNotBlocked();
                throw err;
            }
            if (!response) {
                throw new CamoufoxErrorBox({
                    type: "network",
                    cause: "goto returned null",
                    url,
                });
            }
            guard.assertNotBlocked();
            const status = response.status();
            if (status >= 400) {
                throw new CamoufoxErrorBox({ type: "http", status, url: response.url() });
            }
            return { page, response, cleanup, guard };
        }
        catch (err) {
            cleanup();
            await page.close().catch(() => undefined);
            if (err instanceof CamoufoxErrorBox)
                throw err;
            const mapped = mapPlaywrightError(err, {
                url,
                phase: "nav",
                elapsedMs: Date.now() - started,
                signal: opts.signal,
            });
            throw new CamoufoxErrorBox(mapped);
        }
    }
    async close() {
        const browser = this.state.browser;
        const sc = this.searchContext;
        this.searchContext = null;
        this.state = { status: "closed" };
        if (sc) {
            await sc.recycle().catch(() => undefined);
        }
        if (browser) {
            try {
                await browser.close();
            }
            catch {
                // browser already dead — ignore
            }
        }
    }
    getConfig() {
        return this.config;
    }
    getContext() {
        if (this.state.status !== "ready" || !this.state.context) {
            throw new CamoufoxErrorBox({ type: "playwright_disconnected" });
        }
        if (this.state.browser?.isConnected() !== true) {
            throw new CamoufoxErrorBox({ type: "playwright_disconnected" });
        }
        return this.state.context;
    }
    getBrowser() {
        if (this.state.status !== "ready" || !this.state.browser) {
            throw new CamoufoxErrorBox({ type: "playwright_disconnected" });
        }
        if (!this.state.browser.isConnected()) {
            throw new CamoufoxErrorBox({ type: "playwright_disconnected" });
        }
        return this.state.browser;
    }
    async doLaunch(spanId) {
        const started = Date.now();
        try {
            const { browser, context, version } = await this.launcher.launch({
                onProgress: (e) => this.events.emit("binary_download_progress", e),
            });
            // If close() was called while we were launching, tear down the fresh
            // browser instead of resurrecting into ready. Leaves state as "closed".
            if (this.state.status !== "launching") {
                await browser.close().catch(() => undefined);
                return;
            }
            this.state = {
                status: "ready",
                browser,
                context,
                version,
                launchedAt: Date.now(),
            };
            const payload = {
                spanId,
                browserVersion: version,
                durationMs: Date.now() - started,
            };
            this.events.emit("browser_launch", payload);
        }
        catch (err) {
            const stderr = err instanceof Error ? err.message : String(err);
            const camErr = { type: "browser_launch_failed", stderr };
            const boxed = new CamoufoxErrorBox(camErr);
            // If close() was called during the failed launch, keep the closed
            // state (don't overwrite it with failed — closed is terminal).
            if (this.state.status === "launching") {
                this.state = { status: "failed", error: boxed };
            }
            const errPayload = { spanId, op: "ensureReady", error: camErr };
            this.events.emit("error", errPayload);
            throw boxed;
        }
    }
    async awaitWithSignal(p, signal) {
        if (!signal)
            return p;
        if (signal.aborted)
            throw new CamoufoxErrorBox({ type: "aborted" });
        return new Promise((resolve, reject) => {
            const onAbort = () => {
                signal.removeEventListener("abort", onAbort);
                reject(new CamoufoxErrorBox({ type: "aborted" }));
            };
            signal.addEventListener("abort", onAbort, { once: true });
            p.then((v) => {
                signal.removeEventListener("abort", onAbort);
                resolve(v);
            }, (e) => {
                signal.removeEventListener("abort", onAbort);
                reject(e);
            });
        });
    }
}
//# sourceMappingURL=camoufox-client.js.map