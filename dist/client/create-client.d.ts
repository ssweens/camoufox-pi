import type { LookupFn } from "../security/ssrf.js";
import type { SourceAdapter } from "../sources/types.js";
import type { CamoufoxConfig } from "../types.js";
import { CamoufoxClient } from "./camoufox-client.js";
import type { CredentialsConfig } from "./credentials-config.js";
import type { HttpFetch } from "./http-fetch.js";
import { type Launcher } from "./launcher.js";
export type { CredentialsConfig };
export interface CreateClientOptions {
    readonly config?: Partial<CamoufoxConfig>;
    readonly launcher?: Launcher;
    /** Optional DNS lookup override; forwarded to CamoufoxClient for test injection. */
    readonly ssrfLookup?: LookupFn;
    readonly sources?: readonly SourceAdapter[];
    readonly credentials?: CredentialsConfig;
    /** Test seam: inject a fake HttpFetch, bypassing createHttpFetch. */
    readonly httpFetch?: HttpFetch;
}
/**
 * Factory for library-mode consumers. Constructs a CamoufoxClient with
 * either an injected launcher or a RealLauncher, shallow-merges config
 * over DEFAULT_CONFIG, and fires ensureReady() in the background. First op
 * awaits the in-flight launch promise via ensureReady.
 *
 * Returns synchronously. Factory caller that wants eager behavior writes
 * `const c = createClient(); await c.ensureReady();` — one explicit line.
 */
export declare function createClient(opts?: CreateClientOptions): CamoufoxClient;
//# sourceMappingURL=create-client.d.ts.map