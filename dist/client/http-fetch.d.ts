import type { LookupFn } from "../security/ssrf.js";
import type { HttpFetchEvent } from "./events.js";
export interface HttpFetchInit {
    readonly method?: "GET" | "POST";
    readonly headers?: Readonly<Record<string, string>>;
    readonly body?: string;
    readonly signal?: AbortSignal;
    readonly maxBytes?: number;
    readonly timeoutMs?: number;
}
export interface HttpResponse {
    readonly status: number;
    /** Lowercased header names. HTTP headers are case-insensitive; this
     * normalization is stable so adapters can look up e.g. "retry-after". */
    readonly headers: Readonly<Record<string, string>>;
    readonly body: string;
    readonly url: string;
}
export type HttpFetch = (url: string, init?: HttpFetchInit) => Promise<HttpResponse>;
export interface CreateHttpFetchOptions {
    readonly lookup?: LookupFn;
    readonly fetchImpl?: typeof fetch;
    readonly emit?: (e: HttpFetchEvent) => void;
    readonly spanIdFor?: () => string;
    readonly source?: string;
}
export declare function createHttpFetch(opts: CreateHttpFetchOptions): HttpFetch;
//# sourceMappingURL=http-fetch.d.ts.map