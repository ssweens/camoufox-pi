// Dedicated long-lived BrowserContext for SERP queries. Isolated from the
// client's main fetchUrl context so SERP behavioral signals (NID/AEC/SOCS
// cookies, consent state, click history) don't contaminate page-fetch
// traffic and vice versa.
//
// Recycle policy: tear down + rebuild the BrowserContext on first block
// signal from any adapter, OR after 50 successful queries (whichever first).
// Both Google and DDG share the same SearchContext, so the counter is shared.
import { attachSsrfGuard } from "../security/redirect-guard.js";
const RECYCLE_AFTER_N_QUERIES = 50;
export function createSearchContext(getBrowser, opts = {}) {
    let context = null;
    let initPromise = null;
    let queries = 0;
    let blockedFlag = false;
    const ensureContext = () => {
        if (context !== null)
            return Promise.resolve(context);
        if (initPromise !== null)
            return initPromise;
        const browser = getBrowser();
        initPromise = browser.newContext().then((ctx) => {
            context = ctx;
            initPromise = null;
            return ctx;
        });
        return initPromise;
    };
    const doRecycle = async () => {
        const ctx = context;
        context = null;
        initPromise = null;
        queries = 0;
        blockedFlag = false;
        if (ctx)
            await ctx.close().catch(() => undefined);
    };
    return {
        async acquirePage() {
            if (blockedFlag || queries >= RECYCLE_AFTER_N_QUERIES) {
                await doRecycle();
            }
            const ctx = await ensureContext();
            const page = await ctx.newPage();
            const guard = await attachSsrfGuard(page, opts.ssrfLookup ? { lookup: opts.ssrfLookup } : {});
            queries += 1;
            return { page, guard };
        },
        markBlocked(_signal) {
            // Binary flag in v1 — kind of block doesn't change recycle behavior.
            blockedFlag = true;
        },
        async recycle() {
            await doRecycle();
        },
        queryCount() {
            return queries;
        },
    };
}
//# sourceMappingURL=search-context.js.map