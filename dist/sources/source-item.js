/**
 * Newest first. Stable for equal timestamps (items with the same
 * publishedAt keep their input order). Does not mutate input.
 */
export function sortByPublishedDesc(items) {
    // Decorate-sort-undecorate to keep stable ordering even though V8's
    // Array.sort is already stable — this makes the stability contract
    // independent of any future runtime change.
    return items
        .map((item, index) => ({ item, index, ts: Date.parse(item.publishedAt) }))
        .sort((a, b) => {
        if (b.ts !== a.ts)
            return b.ts - a.ts;
        return a.index - b.index;
    })
        .map((w) => w.item);
}
//# sourceMappingURL=source-item.js.map