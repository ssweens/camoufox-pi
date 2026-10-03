import { CamoufoxErrorBox } from "../../errors.js";
const USER_AGENT_PREFIX = "camoufox-pi";
export function redditAdapter() {
    return {
        name: "reddit",
        tier: 0,
        requiredCredentials: [],
        async fetch(query, opts, ctx) {
            const url = buildUrl(query, opts);
            const res = await ctx.httpFetch(url, {
                headers: {
                    "user-agent": `${USER_AGENT_PREFIX} (+https://github.com/MonsieurBarti/camoufox-pi)`,
                    accept: "application/json",
                },
                ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
            });
            if (res.status === 429) {
                const retryAfter = res.headers["retry-after"];
                const parsed = retryAfter ? Number.parseInt(retryAfter, 10) : Number.NaN;
                throw new CamoufoxErrorBox({
                    type: "source_rate_limited",
                    source: "reddit",
                    ...(Number.isFinite(parsed) ? { retryAfterSec: parsed } : {}),
                });
            }
            if (res.status !== 200) {
                throw new CamoufoxErrorBox({
                    type: "source_unavailable",
                    source: "reddit",
                    cause: `HTTP ${res.status}`,
                });
            }
            let listing;
            try {
                listing = JSON.parse(res.body);
            }
            catch {
                throw new CamoufoxErrorBox({
                    type: "source_unavailable",
                    source: "reddit",
                    cause: "malformed JSON",
                });
            }
            const cutoff = Date.now() - opts.lookbackDays * 86_400_000;
            const items = [];
            for (const child of listing.data.children) {
                if (child.kind !== "t3")
                    continue;
                const item = toSourceItem(child);
                if (Date.parse(item.publishedAt) < cutoff)
                    continue;
                items.push(item);
                if (items.length >= opts.limit)
                    break;
            }
            return items;
        },
    };
}
function buildUrl(query, opts) {
    const params = new URLSearchParams({
        q: query,
        t: "month",
        sort: "relevance",
        limit: String(opts.limit),
    });
    return `https://www.reddit.com/search.json?${params.toString()}`;
}
function toSourceItem(child) {
    const d = child.data;
    const author = d.author === "[deleted]" ? null : d.author;
    return {
        source: "reddit",
        id: `t3_${d.id}`,
        url: `https://reddit.com${d.permalink}`,
        title: d.title,
        text: d.selftext ? d.selftext : null,
        author,
        publishedAt: new Date(d.created_utc * 1000).toISOString(),
        engagement: {
            score: d.score,
            comments: d.num_comments,
        },
    };
}
//# sourceMappingURL=reddit.js.map