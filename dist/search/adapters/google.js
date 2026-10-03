const CONSENT_HOST_RE = /(?:^|\.)consent\.google\.com$/i;
const SORRY_URL_RE = /\/sorry\//;
const REJECT_SELECTORS = [
    'button[jsname="tWT92d"]',
    'button[aria-label*="Reject" i]',
    'form[action*="consent"] button[type="submit"]:nth-of-type(1)',
];
async function hasConsentForm(page) {
    try {
        const host = new URL(page.url()).hostname;
        if (CONSENT_HOST_RE.test(host))
            return true;
    }
    catch {
        // unparseable URL — fall through to DOM check
    }
    const match = await page.$('form[action*="consent"]');
    return match !== null;
}
async function dismissConsent(page) {
    if (!(await hasConsentForm(page)))
        return "skip";
    for (const sel of REJECT_SELECTORS) {
        const handle = await page.$(sel);
        if (handle) {
            try {
                await handle.click({ timeout: 2_000 });
                return "dismissed";
            }
            catch {
                // selector found but click failed (e.g. element not interactable).
                // Try next selector rather than giving up.
            }
        }
    }
    return "drift";
}
async function parseResults(page, maxResults) {
    const raw = await page.$$eval("div#search div[data-sokoban-container]", (els, max) => {
        const out = [];
        const limit = Math.max(0, Math.min(50, Number(max) || 10));
        for (const el of els) {
            if (out.length >= limit)
                break;
            const h3 = el.querySelector("h3");
            const a = el.querySelector("a[jsname]");
            const snip = el.querySelector("div[data-sncf] span") ??
                el.querySelector('div[style*="-webkit-line-clamp"]');
            if (!h3 || !a)
                continue;
            const title = (h3.textContent ?? "").trim();
            const url = a.getAttribute("href") ?? "";
            if (!title || !url)
                continue;
            try {
                const u = new URL(url);
                if (u.protocol !== "http:" && u.protocol !== "https:")
                    continue;
            }
            catch {
                continue;
            }
            const snippet = (snip?.textContent ?? "").trim();
            out.push({ title, url, snippet });
        }
        return out;
    }, maxResults);
    return raw.map((r, i) => ({ ...r, rank: i + 1 }));
}
async function detectBlock(page, response) {
    if (response) {
        const status = response.status();
        if (status === 429 || status === 503) {
            return { kind: "http_status", status };
        }
    }
    const url = page.url();
    if (SORRY_URL_RE.test(url)) {
        return { kind: "sorry_interstitial", url };
    }
    return null;
}
export const googleAdapter = {
    name: "google",
    buildUrl(query) {
        return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    },
    waitStrategy: { readyState: "domcontentloaded" },
    parseResults,
    dismissConsent,
    detectBlock,
};
//# sourceMappingURL=google.js.map