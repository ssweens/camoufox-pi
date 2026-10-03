import type { Browser, Page } from "playwright-core";
import { type SsrfGuard } from "../security/redirect-guard.js";
import type { LookupFn } from "../security/ssrf.js";
import type { BlockSignal } from "./types.js";
export interface SearchContext {
    acquirePage(): Promise<{
        page: Page;
        guard: SsrfGuard;
    }>;
    markBlocked(signal: BlockSignal): void;
    recycle(): Promise<void>;
    queryCount(): number;
}
export declare function createSearchContext(getBrowser: () => Browser, opts?: {
    ssrfLookup?: LookupFn;
}): SearchContext;
//# sourceMappingURL=search-context.d.ts.map