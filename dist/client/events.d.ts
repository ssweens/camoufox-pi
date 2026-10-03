import type { CamoufoxError } from "../errors.js";
import type { BlockSignal, SearchEngineName } from "../search/types.js";
export interface SearchEvent {
    readonly spanId: string;
    readonly engine: SearchEngineName;
    readonly query: string;
    readonly maxResults: number;
    readonly durationMs: number;
    readonly resultCount: number;
    readonly atLimit: boolean;
    readonly fallback_reason?: BlockSignal["kind"];
}
export interface FetchUrlEvent {
    readonly spanId: string;
    readonly url: string;
    readonly finalUrl: string;
    readonly status: number;
    readonly bytes: number;
    readonly truncated: boolean;
    readonly isolate: boolean;
    readonly durationMs: number;
    readonly renderMode: "static" | "render" | "render-and-wait";
    readonly usedWaitForSelector: boolean;
    readonly usedSelector: boolean;
    readonly format: "html" | "markdown";
    readonly screenshotBytes: number | null;
}
export interface BrowserLaunchEvent {
    readonly spanId: string;
    readonly browserVersion: string;
    readonly durationMs: number;
}
export interface BinaryDownloadProgressEvent {
    readonly bytesDownloaded: number;
    readonly bytesTotal: number | null;
}
export interface ErrorEvent {
    readonly spanId: string | null;
    readonly op: "ensureReady" | "fetchUrl" | "search" | "checkHealth";
    readonly error: CamoufoxError;
}
export interface SourceFetchEvent {
    readonly spanId: string;
    readonly source: string;
    readonly query: string;
    readonly tier: 0 | 1 | 2 | 4;
    readonly outcome: "ok" | "error";
    readonly itemCount: number;
    readonly durationMs: number;
    readonly error?: CamoufoxError;
}
export interface HttpFetchEvent {
    readonly spanId: string;
    readonly source?: string;
    readonly url: string;
    readonly status: number;
    readonly durationMs: number;
}
export interface CamoufoxEvents {
    search: (e: SearchEvent) => void;
    fetch_url: (e: FetchUrlEvent) => void;
    browser_launch: (e: BrowserLaunchEvent) => void;
    binary_download_progress: (e: BinaryDownloadProgressEvent) => void;
    error: (e: ErrorEvent) => void;
    source_fetch: (e: SourceFetchEvent) => void;
    http_fetch: (e: HttpFetchEvent) => void;
}
export interface CamoufoxEventEmitter {
    on<K extends keyof CamoufoxEvents>(event: K, listener: CamoufoxEvents[K]): this;
    off<K extends keyof CamoufoxEvents>(event: K, listener: CamoufoxEvents[K]): this;
    once<K extends keyof CamoufoxEvents>(event: K, listener: CamoufoxEvents[K]): this;
    emit<K extends keyof CamoufoxEvents>(event: K, payload: Parameters<CamoufoxEvents[K]>[0]): boolean;
    listenerCount(event: keyof CamoufoxEvents): number;
}
export declare function createEventEmitter(): CamoufoxEventEmitter;
export declare function newSpanId(): string;
//# sourceMappingURL=events.d.ts.map