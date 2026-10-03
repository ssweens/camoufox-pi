import type { Page } from "playwright-core";
import { type LookupFn } from "./ssrf.js";
export interface BlockedHop {
    hop: "initial" | "redirect" | "subframe" | "subresource";
    url: string;
    reason: string;
}
export interface SsrfGuard {
    /** Unregister all route handlers and popup listeners. Idempotent. */
    detach(): Promise<void>;
    /** Returns the first recorded block, or null. */
    getBlockedHop(): BlockedHop | null;
    /** If a block was recorded, throws ssrf_blocked; otherwise no-op. */
    assertNotBlocked(): void;
}
export declare function attachSsrfGuard(page: Page, opts?: {
    lookup?: LookupFn;
}): Promise<SsrfGuard>;
//# sourceMappingURL=redirect-guard.d.ts.map