import type { CredentialBackend } from "../credentials/backend.js";
import type { SourceAdapter } from "../sources/types.js";
import type { CliHandler } from "./index.js";
export interface RunSetupDeps {
    readonly mode: "full" | "check";
    readonly adapters: readonly SourceAdapter[];
    readonly backend: CredentialBackend;
    readonly log: (line: string) => void;
    readonly promptLine: (msg: string) => Promise<string>;
    readonly promptSecret: (msg: string) => Promise<string>;
}
export declare function runSetup(deps: RunSetupDeps): Promise<number>;
export declare function registerSetupHandlers(): Partial<Record<string, CliHandler>>;
//# sourceMappingURL=setup.d.ts.map