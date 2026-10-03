export type TimeoutPhase = "nav" | "wait_ready" | "wait_for_selector" | "screenshot" | "extract";
export type CamoufoxError = {
    type: "timeout";
    phase: TimeoutPhase;
    elapsedMs: number;
} | {
    type: "network";
    cause: string;
    url: string;
} | {
    type: "http";
    status: number;
    url: string;
} | {
    type: "browser_launch_failed";
    stderr: string;
} | {
    type: "playwright_disconnected";
} | {
    type: "aborted";
} | {
    type: "config_invalid";
    field: string;
    reason: string;
} | {
    type: "ssrf_blocked";
    hop: "initial" | "redirect" | "subframe" | "subresource";
    url: string;
    reason: string;
} | {
    type: "search_all_engines_blocked";
    lastSignal: "http_status" | "sorry_interstitial" | "consent_drift" | "empty_results" | "navigation_failed";
} | {
    type: "credential_missing";
    source: string;
    credentialKey: string;
} | {
    type: "credential_invalid";
    source: string;
    credentialKey: string;
} | {
    type: "source_rate_limited";
    source: string;
    retryAfterSec?: number;
} | {
    type: "source_unavailable";
    source: string;
    cause?: string;
} | {
    type: "all_sources_failed";
    errors: Array<{
        source: string;
        error: CamoufoxError;
    }>;
} | {
    type: "credential_backend_unavailable";
    backend: "keyring" | "file";
    reason: string;
};
export declare function sanitizeReason(msg: string, maxChars?: number): string;
export declare class CamoufoxErrorBox extends Error {
    readonly err: CamoufoxError;
    constructor(err: CamoufoxError);
}
export interface MapContext {
    readonly url?: string;
    readonly phase?: TimeoutPhase;
    readonly elapsedMs?: number;
    readonly signal?: AbortSignal;
}
export declare function mapPlaywrightError(err: unknown, ctx: MapContext): CamoufoxError;
//# sourceMappingURL=errors.d.ts.map