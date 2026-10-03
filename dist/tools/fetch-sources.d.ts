import "./formats.js";
import { Type } from "typebox";
import type { CamoufoxClient } from "../client/camoufox-client.js";
import type { ToolDefinition } from "./types.js";
export declare const fetchSourcesParams: Type.TObject<{
    query: Type.TString;
    sources: Type.TArray<Type.TString>;
    lookback_days: Type.TOptional<Type.TInteger>;
    per_source_limit: Type.TOptional<Type.TInteger>;
}>;
export declare function createFetchSourcesTool(client: CamoufoxClient): ToolDefinition<typeof fetchSourcesParams>;
//# sourceMappingURL=fetch-sources.d.ts.map