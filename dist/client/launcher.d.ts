import { type Browser, type BrowserContext } from "playwright-core";
import type { BinaryDownloadProgressEvent } from "./events.js";
export interface LaunchedBrowser {
    readonly browser: Browser;
    readonly context: BrowserContext;
    readonly version: string;
}
export interface LaunchOpts {
    readonly onProgress?: (e: BinaryDownloadProgressEvent) => void;
}
export interface Launcher {
    /**
     * Launch the browser. Cancellation of an in-flight launch is not
     * supported in this slice — `ensureReady()` awaits the launch
     * regardless. If this becomes needed, thread an AbortSignal through.
     */
    launch(opts?: LaunchOpts): Promise<LaunchedBrowser>;
}
export interface RealLauncherOptions {
    /** Headless? Default: true. Override for local debugging. */
    readonly headless?: boolean;
    /** Override the Camoufox binary path. */
    readonly binaryPath?: string;
}
/**
 * Real launcher: calls camoufox-js for fingerprint + binary-aware
 * launch options, then drives playwright-core's firefox.launch.
 * This is the ONLY file in the codebase that may import camoufox-js.
 * Spec: §2, §8.
 *
 * Note on onProgress: camoufox-js v0.9 does not expose a download progress
 * hook on launchOptions(). Rather than introduce a fragile partial-file
 * polling fallback now, we accept the opts for interface uniformity and
 * simply never fire onProgress. The fake launcher fires synthetic events so
 * the client-side plumbing is exercised end-to-end. When a future
 * camoufox-js version exposes a hook, this is the only file that needs to
 * change.
 */
export declare class RealLauncher implements Launcher {
    private readonly headless;
    private readonly binaryPath;
    constructor(opts?: RealLauncherOptions);
    launch(_opts?: LaunchOpts): Promise<LaunchedBrowser>;
}
//# sourceMappingURL=launcher.d.ts.map