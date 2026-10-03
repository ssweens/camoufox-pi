import type { CredentialBackend } from "./backend.js";
export interface KeyringLike {
    getPassword(service: string, account: string): string | null;
    setPassword(service: string, account: string, password: string): void;
    deletePassword(service: string, account: string): boolean;
    findCredentials(service: string): Array<{
        account: string;
        password: string;
    }>;
}
export interface KeyringBackendOptions {
    readonly keyring?: KeyringLike;
}
export declare function createKeyringBackend(opts?: KeyringBackendOptions): Promise<CredentialBackend>;
//# sourceMappingURL=keyring-backend.d.ts.map