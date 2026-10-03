import type { CredentialBackend } from "./backend.js";
export interface CredentialReader {
    get(credentialKey: string): Promise<string | null>;
    require(credentialKey: string): Promise<string>;
    getJson<T = unknown>(credentialKey: string): Promise<T | null>;
    requireJson<T = unknown>(credentialKey: string): Promise<T>;
}
export declare function createCredentialReader(backend: CredentialBackend, source: string): CredentialReader;
//# sourceMappingURL=reader.d.ts.map