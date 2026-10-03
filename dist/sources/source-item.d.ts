import type { SourceName } from "./types.js";
export interface SourceItem {
    readonly source: SourceName;
    readonly id: string;
    readonly url: string;
    readonly title: string | null;
    readonly text: string | null;
    readonly author: string | null;
    /** ISO-8601 UTC; required. Adapters that cannot date an item drop it. */
    readonly publishedAt: string;
    readonly engagement: {
        readonly score?: number;
        readonly comments?: number;
        readonly shares?: number;
    };
    /** Per-adapter escape hatch. Stripped from sanitizeForMessage paths. */
    readonly raw?: unknown;
}
/**
 * Newest first. Stable for equal timestamps (items with the same
 * publishedAt keep their input order). Does not mutate input.
 */
export declare function sortByPublishedDesc(items: readonly SourceItem[]): SourceItem[];
//# sourceMappingURL=source-item.d.ts.map