export declare const CREDENTIAL_SERVICE_NAME = "camoufox-pi";
export type CredentialKind = "api_key" | "bearer_token" | "app_password" | "cookie_jar";
export interface CredentialSpec {
    readonly kind: CredentialKind;
    /** Short identifier within the adapter's namespace. Colon-safe. */
    readonly key: string;
    readonly description: string;
    /** URL the user visits to acquire this credential. For cookie_jar this is the site's login URL. */
    readonly obtainUrl?: string;
    readonly loginUrl?: string;
}
export declare function makeNamespacedKey(source: string, key: string): string;
export declare function parseNamespacedKey(full: string): {
    source: string;
    key: string;
} | null;
//# sourceMappingURL=types.d.ts.map