// Single seam for turning Playwright / camoufox-js exceptions into typed
// CamoufoxError values. Spec: §4.2, §5.1.
// Strip absolute/file-URL paths and truncate before embedding third-party
// exception messages in config_invalid.reason. Prevents leaking node_modules
// paths or user file paths into logs / error responses.
export function sanitizeReason(msg, maxChars = 200) {
    let out = msg;
    out = out.replace(/file:\/\/[^\s)]+/g, "[file]");
    out = out.replace(/(?<![\w@])\/(?:[A-Za-z0-9_.+-]+\/)+[A-Za-z0-9_.+-]+/g, "[path]");
    out = out.replace(/[A-Za-z]:\\(?:[^\\\s]+\\)+[^\\\s]+/g, "[path]");
    if (out.length > maxChars)
        out = `${out.slice(0, maxChars)}…`;
    return out;
}
const UNIX_PATH_RE = /(?<![\w@])(?:\/(?:Users|home|root|var|tmp|opt)\/[^\s"'<>)]+)/g;
const WIN_PATH_RE = /(?:[A-Za-z]:\\(?:[^\\"'<>|]+\\)+[^\\"'<>|\s]+|\\\\[^\\"'<>|]+\\(?:[^\\"'<>|]+\\)*[^\\"'<>|\s]+)/g;
const ENV_VAR_RE = /(?:\$\{[A-Za-z_][A-Za-z0-9_]*\}|\$[A-Za-z_][A-Za-z0-9_]*|%[A-Za-z_][A-Za-z0-9_]*%)/g;
function redactSensitiveStrings(s) {
    return s
        .replace(UNIX_PATH_RE, "<redacted>")
        .replace(WIN_PATH_RE, "<redacted>")
        .replace(ENV_VAR_RE, "<redacted>");
}
function redactErrorFields(err) {
    const redacted = { ...err };
    for (const key of Object.keys(redacted)) {
        const v = redacted[key];
        if (typeof v === "string") {
            redacted[key] = redactSensitiveStrings(v);
        }
    }
    return redacted;
}
function sanitizeForMessage(err) {
    // Scrub sensitive strings first, then cap stderr, then strip URL query
    // strings. Redacting before capping prevents the greedy path/env-var
    // regexes from consuming the truncation marker at the cut boundary.
    const redacted = redactErrorFields(err);
    // Recursively redact nested CamoufoxError objects in all_sources_failed.
    if (err.type === "all_sources_failed") {
        redacted.errors = err.errors.map(({ source, error }) => ({
            source,
            error: redactErrorFields(error),
        }));
    }
    if (typeof redacted.stderr === "string" && redacted.stderr.length > 500) {
        redacted.stderr = `${redacted.stderr.slice(0, 500)}…[${redacted.stderr.length} bytes]`;
    }
    if (typeof redacted.url === "string") {
        try {
            const u = new URL(redacted.url);
            redacted.url = `${u.origin}${u.pathname}`;
        }
        catch {
            // leave as-is if unparseable
        }
    }
    try {
        return JSON.stringify(redacted);
    }
    catch {
        return "[unserializable error payload]";
    }
}
export class CamoufoxErrorBox extends Error {
    err;
    constructor(err) {
        super(`${err.type}: ${sanitizeForMessage(err)}`);
        this.name = "CamoufoxError";
        this.err = err;
    }
}
const NETWORK_PATTERN = /net::ERR_|NS_ERROR_NET_|getaddrinfo/;
export function mapPlaywrightError(err, ctx) {
    if (!(err instanceof Error)) {
        // Unknown non-Error throwable — can't safely classify. Wrap as unknown.
        return { type: "browser_launch_failed", stderr: String(err) };
    }
    // TimeoutError is a distinct signal even when abort also fired — classify
    // it first so internal-timeout-via-combined-signal doesn't swallow a
    // genuine page timeout.
    if (err.name === "TimeoutError") {
        return { type: "timeout", phase: ctx.phase ?? "nav", elapsedMs: ctx.elapsedMs ?? 0 };
    }
    if (err.name === "AbortError" || ctx.signal?.aborted) {
        return { type: "aborted" };
    }
    if (NETWORK_PATTERN.test(err.message)) {
        return { type: "network", cause: err.message, url: ctx.url ?? "" };
    }
    // Unknown Error — classify as launch-failed with stderr for
    // observability. Tool callers see CamoufoxErrorBox uniformly.
    return { type: "browser_launch_failed", stderr: err.message };
}
//# sourceMappingURL=errors.js.map