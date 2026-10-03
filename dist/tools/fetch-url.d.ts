import { Type } from "typebox";
import type { CamoufoxClient } from "../client/camoufox-client.js";
import "./formats.js";
import type { ToolDefinition } from "./types.js";
export declare const fetchUrlParams: Type.TObject<{
    url: Type.TString;
    timeout_ms: Type.TOptional<Type.TInteger>;
    max_bytes: Type.TOptional<Type.TInteger>;
    isolate: Type.TOptional<Type.TBoolean>;
    render_mode: Type.TOptional<Type.TUnion<[Type.TLiteral<"static">, Type.TLiteral<"render">, Type.TLiteral<"render-and-wait">]>>;
    wait_for_selector: Type.TOptional<Type.TString>;
    selector: Type.TOptional<Type.TString>;
    format: Type.TOptional<Type.TUnion<[Type.TLiteral<"html">, Type.TLiteral<"markdown">]>>;
    screenshot: Type.TOptional<Type.TObject<{
        full_page: Type.TOptional<Type.TBoolean>;
        format: Type.TOptional<Type.TUnion<[Type.TLiteral<"png">, Type.TLiteral<"jpeg">]>>;
        quality: Type.TOptional<Type.TInteger>;
    }>>;
}>;
export declare function createFetchUrlTool(client: CamoufoxClient): ToolDefinition<typeof fetchUrlParams>;
//# sourceMappingURL=fetch-url.d.ts.map