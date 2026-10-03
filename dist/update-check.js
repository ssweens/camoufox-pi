/**
 * Update check for camoufox-pi extension
 *
 * Fetches the latest version from npm registry and compares with current version
 * to notify users when an update is available.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_NAME = "@the-forge-flow/camoufox-pi";
/**
 * Read current version from package.json
 */
function getCurrentVersion() {
    try {
        const packageJsonPath = join(__dirname, "..", "package.json");
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
        return packageJson.version || "0.0.0";
    }
    catch {
        return "0.0.0";
    }
}
/**
 * Compare semantic versions (returns true if latest > current)
 */
function compareVersions(current, latest) {
    const cleanVersion = (v) => v.replace(/^v/, "");
    const currentParts = cleanVersion(current).split(".").map(Number);
    const latestParts = cleanVersion(latest).split(".").map(Number);
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const curr = currentParts[i] || 0;
        const lat = latestParts[i] || 0;
        if (lat > curr)
            return true;
        if (lat < curr)
            return false;
    }
    return false;
}
/**
 * Fetch latest version from npm registry
 * Uses pi.exec for command execution (integrated with pi infrastructure)
 */
async function fetchLatestVersion(pi) {
    try {
        const result = await pi.exec("npm", ["view", PACKAGE_NAME, "version"], {
            timeout: 5000,
        });
        if (result.code === 0) {
            const version = result.stdout.trim();
            if (version) {
                return version;
            }
        }
    }
    catch {
        try {
            const url = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;
            const result = await pi.exec("curl", ["-s", url], {
                timeout: 5000,
            });
            if (result.code === 0) {
                const data = JSON.parse(result.stdout);
                if (data.version) {
                    return data.version;
                }
            }
        }
        catch {
            // Silently fail - update check is not critical
        }
    }
    return null;
}
/**
 * Check if an update is available
 * Returns null if check fails (silently)
 */
export async function checkForUpdates(pi) {
    const currentVersion = getCurrentVersion();
    const latestVersion = await fetchLatestVersion(pi);
    if (!latestVersion) {
        return null;
    }
    const updateAvailable = compareVersions(currentVersion, latestVersion);
    return {
        currentVersion,
        latestVersion,
        updateAvailable,
    };
}
//# sourceMappingURL=update-check.js.map