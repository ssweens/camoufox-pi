import { type LookupFn } from "../security/ssrf.js";
import type { SearchContext } from "./search-context.js";
import type { BlockSignal, RawResult, SearchEngineAdapter, SearchEngineChoice, SearchEngineName } from "./types.js";
export interface SearchEventPayload {
    readonly engine: SearchEngineName;
    readonly query: string;
    readonly maxResults: number;
    readonly durationMs: number;
    readonly resultCount: number;
    readonly atLimit: boolean;
    readonly fallback_reason?: BlockSignal["kind"];
}
export interface RunSearchOpts {
    readonly maxResults: number;
    readonly engine: SearchEngineChoice;
    readonly signal: AbortSignal;
    readonly adapters: ReadonlyArray<SearchEngineAdapter>;
    readonly context: Pick<SearchContext, "acquirePage" | "markBlocked">;
    readonly emitSearchEvent: (payload: SearchEventPayload) => void;
    readonly timeoutMs?: number;
    readonly ssrfLookup?: LookupFn;
}
export declare function runSearch(query: string, opts: RunSearchOpts): Promise<{
    results: RawResult[];
    engine: SearchEngineName;
    query: string;
}>;
//# sourceMappingURL=orchestrator.d.ts.map