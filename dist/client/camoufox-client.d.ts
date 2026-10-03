import type { Browser, BrowserContext, Page } from "playwright-core";
import type { RawResult, SearchEngineChoice, SearchEngineName } from "../search/types.js";
import { type SsrfGuard } from "../security/redirect-guard.js";
import { type LookupFn } from "../security/ssrf.js";
import type { FetchSourcesResult, SourceAdapter, SourceName } from "../sources/types.js";
import type { CamoufoxConfig } from "../types.js";
import type { CredentialsConfig } from "./credentials-config.js";
import { type CamoufoxEventEmitter } from "./events.js";
import { type Format, type RenderMode, type ScreenshotOpts, type ScreenshotResult } from "./fetch-pipeline.js";
import { type HttpFetch } from "./http-fetch.js";
import type { Launcher } from "./launcher.js";
export interface HealthStatus {
    status: "launching" | "ready" | "failed" | "closed";
    browserConnected: boolean;
    browserVersion: string | null;
    launchedAt: number | null;
    uptimeMs: number | null;
    lastError: import("../errors.js").CamoufoxError | null;
    probe?: {
        ok: boolean;
        roundTripMs: number;
        error: import("../errors.js").CamoufoxError | null;
    };
}
export interface CamoufoxClientOptions {
    readonly launcher: Launcher;
    readonly config?: CamoufoxConfig;
    /** Optional DNS lookup override; used to inject stubs in tests. */
    readonly ssrfLookup?: LookupFn;
    readonly sources?: readonly SourceAdapter[];
    readonly credentials?: CredentialsConfig;
    readonly httpFetch?: HttpFetch;
}
export declare class CamoufoxClient {
    readonly events: CamoufoxEventEmitter;
    private readonly launcher;
    readonly config: CamoufoxConfig;
    private readonly ssrfLookup;
    private state;
    private searchContext;
    private readonly sources;
    private readonly credentialsConfig;
    private readonly httpFetchInjected;
    private credentialBackendCache;
    private httpFetchCache;
    constructor(opts: CamoufoxClientOptions);
    isAlive(): boolean;
    checkHealth(opts?: {
        probe?: boolean;
        signal?: AbortSignal;
    }): Promise<HealthStatus>;
    private emitError;
    ensureReady(signal?: AbortSignal): Promise<void>;
    fetchUrl(url: string, opts: {
        signal: AbortSignal;
        timeoutMs?: number;
        maxBytes?: number;
        isolate?: boolean;
        renderMode?: RenderMode;
        waitForSelector?: string;
        selector?: string;
        format?: Format;
        screenshot?: ScreenshotOpts;
    }): Promise<{
        html: string;
        markdown?: string;
        screenshot?: ScreenshotResult;
        status: number;
        finalUrl: string;
        bytes: number;
        truncated: boolean;
    }>;
    private getOrCreateSearchContext;
    search(query: string, opts: {
        signal: AbortSignal;
        maxResults?: number;
        timeoutMs?: number;
        engine?: SearchEngineChoice;
    }): Promise<{
        results: RawResult[];
        engine: SearchEngineName;
        query: string;
    }>;
    fetchSources(query: string, opts: {
        readonly sources: readonly SourceName[];
        readonly lookbackDays?: number;
        readonly perSourceLimit?: number;
        readonly signal?: AbortSignal;
    }): Promise<FetchSourcesResult>;
    /**
     * Lazy-init the credential backend on first source call. Concurrent calls
     * race harmlessly: two parallel keyring loads both succeed and the second
     * overwrites the first with an equivalent backend. Failure is not cached
     * (rethrown each time), so a user fixing keyring mid-session can retry.
     */
    private getOrInitCredentialBackend;
    private getOrInitHttpFetch;
    protected navigate(url: string, opts: {
        signal: AbortSignal;
        timeoutMs: number;
        waitUntil: "load" | "domcontentloaded" | "networkidle";
        isolate?: boolean;
    }): Promise<{
        page: Page;
        response: {
            status(): number;
            url(): string;
        };
        cleanup: () => void;
        guard: SsrfGuard;
    }>;
    close(): Promise<void>;
    protected getConfig(): CamoufoxConfig;
    protected getContext(): BrowserContext;
    protected getBrowser(): Browser;
    private doLaunch;
    private awaitWithSignal;
}
//# sourceMappingURL=camoufox-client.d.ts.map