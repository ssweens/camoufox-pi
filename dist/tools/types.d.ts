import type { Static, TObject } from "typebox";
export interface ToolDefinition<S extends TObject = TObject> {
    name: string;
    readOnly?: boolean;
    label: string;
    description: string;
    promptSnippet: string;
    promptGuidelines: string[];
    parameters: S;
    execute(toolCallId: string, input: Static<S>, signal: AbortSignal | undefined): Promise<ToolExecuteResult>;
}
export interface ToolExecuteResult {
    content: Array<{
        type: "text";
        text: string;
    }>;
    details: Record<string, ToolDetailValue>;
}
export type ToolDetailValue = string | number | boolean | null | ToolDetailValue[] | {
    [key: string]: ToolDetailValue;
};
//# sourceMappingURL=types.d.ts.map