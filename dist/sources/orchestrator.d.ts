import { type SourceFetchEvent } from "../client/events.js";
import type { HttpFetch } from "../client/http-fetch.js";
import type { CredentialBackend } from "../credentials/backend.js";
import type { FetchSourcesResult, SourceAdapter, SourceName } from "./types.js";
export interface FetchSourcesOptions {
    readonly sources: readonly SourceName[];
    readonly lookbackDays: number;
    readonly perSourceLimit: number;
    readonly adapters: readonly SourceAdapter[];
    readonly credentialBackend: CredentialBackend;
    readonly httpFetch: HttpFetch;
    readonly emit: (event: SourceFetchEvent) => void;
    readonly signal?: AbortSignal;
}
export declare function fetchSources(query: string, opts: FetchSourcesOptions): Promise<FetchSourcesResult>;
//# sourceMappingURL=orchestrator.d.ts.map