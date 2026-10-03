import type { CamoufoxService } from "../services/camoufox-service.js";
export interface HookDefinition {
    event: string;
    handler: (event: unknown, ctx: unknown) => unknown | Promise<unknown>;
}
export declare function createAllHooks(_service: CamoufoxService): HookDefinition[];
//# sourceMappingURL=index.d.ts.map