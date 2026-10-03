import "./formats.js";
import { Type } from "typebox";
import type { CamoufoxClient } from "../client/camoufox-client.js";
import type { ToolDefinition } from "./types.js";
export declare const searchWebParams: Type.TObject<{
    query: Type.TString;
    max_results: Type.TOptional<Type.TInteger>;
    timeout_ms: Type.TOptional<Type.TInteger>;
    engine: Type.TOptional<Type.TUnion<[Type.TLiteral<"auto">, Type.TLiteral<"google">, Type.TLiteral<"duckduckgo">]>>;
}>;
export declare function createSearchWebTool(client: CamoufoxClient): ToolDefinition<typeof searchWebParams>;
//# sourceMappingURL=search-web.d.ts.map