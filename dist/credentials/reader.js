import { CamoufoxErrorBox } from "../errors.js";
import { makeNamespacedKey } from "./types.js";
export function createCredentialReader(backend, source) {
    const toFull = (k) => makeNamespacedKey(source, k);
    const reader = {
        async get(credentialKey) {
            return backend.get(toFull(credentialKey));
        },
        async require(credentialKey) {
            const value = await backend.get(toFull(credentialKey));
            if (value === null) {
                throw new CamoufoxErrorBox({
                    type: "credential_missing",
                    source,
                    credentialKey,
                });
            }
            return value;
        },
        async getJson(credentialKey) {
            const raw = await backend.get(toFull(credentialKey));
            if (raw === null)
                return null;
            try {
                return JSON.parse(raw);
            }
            catch {
                throw new CamoufoxErrorBox({
                    type: "credential_invalid",
                    source,
                    credentialKey,
                });
            }
        },
        async requireJson(credentialKey) {
            const value = await reader.getJson(credentialKey);
            if (value === null) {
                throw new CamoufoxErrorBox({
                    type: "credential_missing",
                    source,
                    credentialKey,
                });
            }
            return value;
        },
    };
    return reader;
}
//# sourceMappingURL=reader.js.map