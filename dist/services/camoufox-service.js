import { createClient } from "../client/create-client.js";
import { DEFAULT_CONFIG } from "../types.js";
/**
 * Thin PI-binding adapter. Constructs one CamoufoxClient up front (via
 * createClient, which kicks off ensureReady in the background) and
 * bridges client.events → pi.events (with "camoufox:" prefix). Drives
 * pi.ui.setStatus for binary-download progress. Wires session_start /
 * session_shutdown hooks to client lifecycle.
 *
 * Non-PI consumers should prefer `createClient()` directly.
 */
export class CamoufoxService {
    client;
    config;
    bridges = [];
    basePath = null;
    constructor(opts = {}) {
        this.config = { ...DEFAULT_CONFIG, ...opts.config };
        const createOpts = {};
        if (opts.config !== undefined)
            createOpts.config = opts.config;
        if (opts.launcher !== undefined)
            createOpts.launcher = opts.launcher;
        if (opts.ssrfLookup !== undefined)
            createOpts.ssrfLookup = opts.ssrfLookup;
        this.client = createClient(createOpts);
    }
    /**
     * Wire this service into a PI extension host.
     *
     * IMPORTANT: `attach(pi)` must be called SYNCHRONOUSLY after
     * `new CamoufoxService(...)`. The constructor fires `ensureReady()` in
     * the background, which can emit `binary_download_progress` events
     * before listeners are registered. `src/index.ts` calls `attach(pi)`
     * immediately after construction, so the race window is sub-millisecond
     * in practice. Any caller that defers `attach()` past a microtask boundary
     * risks dropping early progress events.
     */
    attach(pi) {
        const EVENT_NAMES = [
            "search",
            "fetch_url",
            "browser_launch",
            "binary_download_progress",
            "error",
        ];
        for (const name of EVENT_NAMES) {
            if (name === "binary_download_progress") {
                const handler = (e) => {
                    pi.events.emit(`camoufox:${name}`, e);
                    const pct = e.bytesTotal ? Math.floor((e.bytesDownloaded / e.bytesTotal) * 100) : null;
                    const msg = pct !== null
                        ? `Downloading Camoufox… ${pct}%`
                        : `Downloading Camoufox… ${Math.floor(e.bytesDownloaded / 1_048_576)} MiB`;
                    pi.ui?.setStatus?.("camoufox:binary", msg);
                };
                this.client.events.on(name, handler);
                this.bridges.push(() => this.client.events.off(name, handler));
                continue;
            }
            const forward = (payload) => {
                pi.events.emit(`camoufox:${name}`, payload);
            };
            // biome-ignore lint/suspicious/noExplicitAny: typed dispatch across heterogeneous event payloads
            this.client.events.on(name, forward);
            this.bridges.push(() => {
                // biome-ignore lint/suspicious/noExplicitAny: paired with the `on` cast above
                this.client.events.off(name, forward);
            });
        }
        const onLaunch = () => {
            pi.ui?.setStatus?.("camoufox:binary", null);
        };
        this.client.events.on("browser_launch", onLaunch);
        this.bridges.push(() => this.client.events.off("browser_launch", onLaunch));
        pi.on("session_start", async (_e, ctx) => {
            const cwd = ctx?.cwd ?? pi.cwd ?? process.cwd();
            await this.initialize(cwd);
        });
        pi.on("session_shutdown", () => this.shutdown());
    }
    async initialize(cwd, signal) {
        this.basePath = cwd;
        await this.client.ensureReady(signal);
    }
    async shutdown() {
        for (const off of this.bridges)
            off();
        this.bridges = [];
        this.basePath = null;
        await this.client.close();
    }
    getConfig() {
        return this.config;
    }
    getBasePath() {
        return this.basePath;
    }
    getClient() {
        return this.client;
    }
}
//# sourceMappingURL=camoufox-service.js.map