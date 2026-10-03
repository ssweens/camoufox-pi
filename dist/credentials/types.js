export const CREDENTIAL_SERVICE_NAME = "camoufox-pi";
export function makeNamespacedKey(source, key) {
    if (source.includes(":") || key.includes(":")) {
        throw new Error(`credential key parts cannot contain ':' (got source=${source}, key=${key})`);
    }
    return `${CREDENTIAL_SERVICE_NAME}:${source}:${key}`;
}
export function parseNamespacedKey(full) {
    const parts = full.split(":");
    if (parts.length !== 3)
        return null;
    if (parts[0] !== CREDENTIAL_SERVICE_NAME)
        return null;
    return { source: parts[1] ?? "", key: parts[2] ?? "" };
}
//# sourceMappingURL=types.js.map