import type { CamoufoxClient } from "../client/camoufox-client.js";
import type { Launcher } from "../client/launcher.js";
import type { LookupFn } from "../security/ssrf.js";
import type { CamoufoxConfig } from "../types.js";
/**
 * Minimal shapes for the PI extension API surface this service depends on.
 * Kept structural so the service can be unit-tested without the peer
 * @earendil-works/pi-coding-agent dep installed.
 */
interface MinimalPiEvents {
    emit(event: string, payload: unknown): boolean;
}
interface MinimalPiUi {
    setStatus?: (key: string, message: string | null) => void;
    notify?: (message: string, level?: string) => void;
}
export interface PiAttachable {
    on(event: string, handler: (e: unknown, ctx: unknown) => unknown | Promise<unknown>): void;
    events: MinimalPiEvents;
    ui?: MinimalPiUi;
    cwd?: string;
}
export interface CamoufoxServiceOptions {
    readonly config?: Partial<CamoufoxConfig>;
    readonly launcher?: Launcher;
    /** Optional DNS lookup override; forwarded to the client for test injection. */
    readonly ssrfLookup?: LookupFn;
}
/**
 * Thin PI-binding adapter. Constructs one CamoufoxClient up front (via
 * createClient, which kicks off ensureReady in the background) and
 * bridges client.events → pi.events (with "camoufox:" prefix). Drives
 * pi.ui.setStatus for binary-download progress. Wires session_start /
 * session_shutdown hooks to client lifecycle.
 *
 * Non-PI consumers should prefer `createClient()` directly.
 */
export declare class CamoufoxService {
    readonly client: CamoufoxClient;
    private readonly config;
    private bridges;
    private basePath;
    constructor(opts?: CamoufoxServiceOptions);
    /**
     * Wire this service into a PI extension host.
     *
     * IMPORTANT: `attach(pi)` must be called SYNCHRONOUSLY after
     * `new CamoufoxService(...)`. The constructor fires `ensureReady()` in
     * the background, which can emit `binary_download_progress` events
     * before listeners are registered. `src/index.ts` calls `attach(pi)`
     * immediately after construction, so the race window is sub-millisecond
     * in practice. Any caller that defers `attach()` past a microtask boundary
     * risks dropping early progress events.
     */
    attach(pi: PiAttachable): void;
    initialize(cwd: string, signal?: AbortSignal): Promise<void>;
    shutdown(): Promise<void>;
    getConfig(): CamoufoxConfig;
    getBasePath(): string | null;
    getClient(): CamoufoxClient;
}
export {};
//# sourceMappingURL=camoufox-service.d.ts.map