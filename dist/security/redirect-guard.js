// Intercepts every request a page issues via Playwright page.route and applies
// a tiered policy:
//   * Document-type requests (main-frame nav, main-frame redirect, subframe)
//     → full assertSafeTarget (scheme allowlist + private-IP check on literal
//     or DNS-resolved address).
//   * Sub-resource requests (image, script, xhr, fetch, ws, beacon, …)
//     → isMetadataEndpoint only. Blocking every RFC1918 sub-resource would
//     create a stealth-detectable abort pattern on corporate-network fetches.
// Popups are covered via page.on("popup") — each spawned page gets its own
// handler registered and shares the parent's BlockedHop slot.
// Spec: docs/superpowers/specs/2026-04-13-redirect-ssrf-design.md §4 (+addendum 2026-04-13b).
import { CamoufoxErrorBox, sanitizeReason } from "../errors.js";
import { assertSafeTarget, isMetadataEndpoint } from "./ssrf.js";
function classifyDocumentHop(request, mainFrame) {
    const sameFrame = request.frame() === mainFrame;
    if (sameFrame && request.isNavigationRequest()) {
        return request.redirectedFrom() === null ? "initial" : "redirect";
    }
    return "subframe";
}
function makeHandler(state, mainFrame, lookup) {
    return async (route, request) => {
        const url = request.url();
        const resourceType = request.resourceType();
        try {
            if (resourceType === "document") {
                await assertSafeTarget(url, lookup ? { lookup } : {});
                await route.continue();
                return;
            }
            // Sub-resource tier: only block well-known cloud-metadata endpoints.
            // Does NOT do DNS resolution — hostname/IP-literal check only, so
            // overhead on normal traffic is negligible and there's no detectable
            // abort pattern on legitimate private-network assets.
            if (isMetadataEndpoint(url)) {
                throw new Error("SSRF: sub-resource targets a cloud-metadata endpoint");
            }
            await route.continue();
        }
        catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            if (state.blockedHop === null) {
                // Intentional: first writer wins. Outer navigate()/fetchUrl throws
                // on any recorded block, so either concurrent racer is correct.
                const hop = resourceType === "document" ? classifyDocumentHop(request, mainFrame) : "subresource";
                state.blockedHop = { hop, url, reason };
            }
            await route.abort("blockedbyclient");
        }
    };
}
export async function attachSsrfGuard(page, opts = {}) {
    const state = { blockedHop: null };
    // Pages (main + popups) to which we've attached a handler. Each entry's
    // handler must be unroute'd on detach.
    const attached = [];
    const attachTo = async (p) => {
        const handler = makeHandler(state, p.mainFrame(), opts.lookup);
        await p.route("**/*", handler);
        attached.push({ page: p, handler });
    };
    const popupHandler = (popup) => {
        // Cover popups-of-popups.
        popup.on("popup", popupHandler);
        // Attach asynchronously. If attachment fails (page closed between the
        // popup event and our route() call), record a subframe block so the
        // outer fetch aborts — better fail-closed than leak content.
        attachTo(popup).catch((err) => {
            if (state.blockedHop === null) {
                state.blockedHop = {
                    hop: "subframe",
                    url: popup.url(),
                    reason: `SSRF: failed to attach guard to popup: ${err instanceof Error ? err.message : String(err)}`,
                };
            }
        });
    };
    page.on("popup", popupHandler);
    await attachTo(page);
    let detached = false;
    const guard = {
        async detach() {
            if (detached)
                return;
            detached = true;
            page.off("popup", popupHandler);
            for (const { page: p, handler } of attached) {
                await p.unroute("**/*", handler).catch(() => undefined);
            }
        },
        getBlockedHop() {
            return state.blockedHop;
        },
        assertNotBlocked() {
            const b = state.blockedHop;
            if (b === null)
                return;
            throw new CamoufoxErrorBox({
                type: "ssrf_blocked",
                hop: b.hop,
                url: b.url,
                reason: sanitizeReason(b.reason),
            });
        },
    };
    return guard;
}
//# sourceMappingURL=redirect-guard.js.map