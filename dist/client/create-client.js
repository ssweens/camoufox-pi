import { DEFAULT_CONFIG } from "../types.js";
import { CamoufoxClient } from "./camoufox-client.js";
import { RealLauncher } from "./launcher.js";
/**
 * Factory for library-mode consumers. Constructs a CamoufoxClient with
 * either an injected launcher or a RealLauncher, shallow-merges config
 * over DEFAULT_CONFIG, and fires ensureReady() in the background. First op
 * awaits the in-flight launch promise via ensureReady.
 *
 * Returns synchronously. Factory caller that wants eager behavior writes
 * `const c = createClient(); await c.ensureReady();` — one explicit line.
 */
export function createClient(opts = {}) {
    const launcher = opts.launcher ?? new RealLauncher();
    const config = { ...DEFAULT_CONFIG, ...opts.config };
    const client = new CamoufoxClient({
        launcher,
        config,
        ...(opts.ssrfLookup !== undefined ? { ssrfLookup: opts.ssrfLookup } : {}),
        ...(opts.sources !== undefined ? { sources: opts.sources } : {}),
        ...(opts.credentials !== undefined ? { credentials: opts.credentials } : {}),
        ...(opts.httpFetch !== undefined ? { httpFetch: opts.httpFetch } : {}),
    });
    // Fire-and-forget: first op awaits the in-flight promise via ensureReady.
    client.ensureReady().catch(() => undefined);
    return client;
}
//# sourceMappingURL=create-client.js.map