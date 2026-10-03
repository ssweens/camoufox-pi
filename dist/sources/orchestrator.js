import { newSpanId } from "../client/events.js";
import { createCredentialReader } from "../credentials/reader.js";
import { CamoufoxErrorBox } from "../errors.js";
import { sortByPublishedDesc } from "./source-item.js";
export async function fetchSources(query, opts) {
    if (opts.sources.length === 0) {
        throw new CamoufoxErrorBox({
            type: "config_invalid",
            field: "sources",
            reason: "at least one source is required",
        });
    }
    const adapterByName = new Map();
    for (const a of opts.adapters)
        adapterByName.set(a.name, a);
    const unknown = opts.sources.filter((s) => !adapterByName.has(s));
    if (unknown.length > 0) {
        throw new CamoufoxErrorBox({
            type: "config_invalid",
            field: "sources",
            reason: `unknown sources: ${unknown.join(", ")}`,
        });
    }
    const results = await Promise.allSettled(opts.sources.map((name) => runOneSource(query, name, adapterByName.get(name), opts)));
    const items = [];
    const errors = [];
    const stats = [];
    for (let i = 0; i < results.length; i++) {
        const name = opts.sources[i];
        const adapter = adapterByName.get(name);
        const r = results[i];
        if (r && r.status === "fulfilled") {
            items.push(...r.value.items);
            stats.push({
                source: name,
                itemCount: r.value.items.length,
                durationMs: r.value.durationMs,
                tier: adapter.tier,
            });
        }
        else {
            const err = r.reason;
            const cfxErr = err instanceof CamoufoxErrorBox
                ? err.err
                : { type: "source_unavailable", source: name, cause: String(err) };
            errors.push({ source: name, error: cfxErr });
            stats.push({
                source: name,
                itemCount: 0,
                durationMs: 0,
                tier: adapter.tier,
            });
        }
    }
    if (errors.length === opts.sources.length) {
        throw new CamoufoxErrorBox({
            type: "all_sources_failed",
            errors: errors.map((e) => ({ source: e.source, error: e.error })),
        });
    }
    return {
        items: sortByPublishedDesc(items),
        errors,
        stats,
    };
}
async function runOneSource(query, name, adapter, opts) {
    const reader = createCredentialReader(opts.credentialBackend, name);
    const ctx = {
        httpFetch: opts.httpFetch,
        credentials: reader,
        emit: opts.emit,
    };
    const start = Date.now();
    const spanId = newSpanId();
    try {
        const fetchOpts = {
            lookbackDays: opts.lookbackDays,
            limit: opts.perSourceLimit,
            ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
        };
        const items = await adapter.fetch(query, fetchOpts, ctx);
        const durationMs = Date.now() - start;
        opts.emit({
            spanId,
            source: name,
            query,
            tier: adapter.tier,
            outcome: "ok",
            itemCount: items.length,
            durationMs,
        });
        return { items, durationMs };
    }
    catch (err) {
        const durationMs = Date.now() - start;
        const cfxErr = err instanceof CamoufoxErrorBox
            ? err.err
            : { type: "source_unavailable", source: name, cause: String(err) };
        opts.emit({
            spanId,
            source: name,
            query,
            tier: adapter.tier,
            outcome: "error",
            itemCount: 0,
            durationMs,
            error: cfxErr,
        });
        throw err;
    }
}
//# sourceMappingURL=orchestrator.js.map