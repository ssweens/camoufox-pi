#!/usr/bin/env node
export type CliHandler = () => Promise<number>;
export interface RunCliDeps {
    readonly handlers: Partial<Record<string, CliHandler>>;
    readonly log: (line: string) => void;
}
export declare function runCli(argv: readonly string[], deps: RunCliDeps): Promise<number>;
//# sourceMappingURL=index.d.ts.map