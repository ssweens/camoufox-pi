import { promises as dns } from "node:dns";
export declare function isPrivateIPv4Int(ip: number): boolean;
export declare function parseIPv4(input: string): number | null;
export declare function parseIPv6(input: string): Uint8Array | null;
export declare function isPrivateIPv6Bytes(bytes: Uint8Array): boolean;
export declare function isPrivateIPv4(ip: string): boolean;
export declare function isPrivateIPv6(ip: string): boolean;
export type LookupFn = typeof dns.lookup;
export declare function assertSafeTarget(url: string, opts?: {
    lookup?: LookupFn;
}): Promise<void>;
export declare function isMetadataEndpoint(url: string): boolean;
//# sourceMappingURL=ssrf.d.ts.map