import { CREDENTIAL_SERVICE_NAME, parseNamespacedKey } from "./types.js";
export async function createKeyringBackend(opts = {}) {
    const k = opts.keyring ?? (await loadKeyring());
    return {
        async get(key) {
            const account = accountPart(key);
            try {
                return k.getPassword(CREDENTIAL_SERVICE_NAME, account);
            }
            catch {
                return null;
            }
        },
        async set(key, value) {
            k.setPassword(CREDENTIAL_SERVICE_NAME, accountPart(key), value);
        },
        async delete(key) {
            try {
                return k.deletePassword(CREDENTIAL_SERVICE_NAME, accountPart(key));
            }
            catch {
                return false;
            }
        },
        async list() {
            const found = k.findCredentials(CREDENTIAL_SERVICE_NAME);
            return found.map((f) => `${CREDENTIAL_SERVICE_NAME}:${f.account}`);
        },
    };
}
async function loadKeyring() {
    try {
        // @napi-rs/keyring exposes the same sync API shape as node-keytar.
        const mod = (await import("@napi-rs/keyring"));
        return wrapNapiKeyring(mod);
    }
    catch (err) {
        throw new Error(`credential backend unavailable: ${err instanceof Error ? err.message : String(err)}`);
    }
}
function wrapNapiKeyring(mod) {
    // @napi-rs/keyring's API is class-based: `new Entry(service, account)` with
    // getPassword / setPassword / deletePassword. findCredentials is not part
    // of the API; emulate via a local key index stored in a single known
    // entry. This keeps parity with the CredentialBackend contract.
    const EntryCtor = mod.Entry;
    const INDEX_ACCOUNT = "__index__";
    const readIndex = (service) => {
        try {
            const raw = new EntryCtor(service, INDEX_ACCOUNT).getPassword();
            return raw ? JSON.parse(raw) : [];
        }
        catch {
            return [];
        }
    };
    const writeIndex = (service, accounts) => {
        new EntryCtor(service, INDEX_ACCOUNT).setPassword(JSON.stringify([...new Set(accounts)]));
    };
    return {
        getPassword(service, account) {
            return new EntryCtor(service, account).getPassword();
        },
        setPassword(service, account, password) {
            new EntryCtor(service, account).setPassword(password);
            writeIndex(service, [...readIndex(service), account]);
        },
        deletePassword(service, account) {
            const ok = new EntryCtor(service, account).deletePassword();
            writeIndex(service, readIndex(service).filter((a) => a !== account));
            return ok;
        },
        findCredentials(service) {
            const accounts = readIndex(service);
            return accounts.map((account) => ({
                account,
                password: new EntryCtor(service, account).getPassword() ?? "",
            }));
        },
    };
}
function accountPart(fullKey) {
    const parsed = parseNamespacedKey(fullKey);
    if (!parsed) {
        throw new Error(`keyring backend expected a camoufox-pi:* key, got ${fullKey}`);
    }
    return `${parsed.source}:${parsed.key}`;
}
//# sourceMappingURL=keyring-backend.js.map