/**
 * Update check for camoufox-pi extension
 *
 * Fetches the latest version from npm registry and compares with current version
 * to notify users when an update is available.
 */
export interface UpdateInfo {
    currentVersion: string;
    latestVersion: string;
    updateAvailable: boolean;
}
/**
 * Check if an update is available
 * Returns null if check fails (silently)
 */
export declare function checkForUpdates(pi: {
    exec: (cmd: string, args: string[], opts?: {
        timeout?: number;
    }) => Promise<{
        stdout: string;
        code: number;
    }>;
}): Promise<UpdateInfo | null>;
//# sourceMappingURL=update-check.d.ts.map