import type { TObject } from "typebox";
import { type Launcher } from "./client/launcher.js";
import type { ToolDefinition } from "./tools/index.js";
export { CamoufoxClient } from "./client/camoufox-client.js";
export { createClient } from "./client/create-client.js";
export { RealLauncher } from "./client/launcher.js";
export { CamoufoxService } from "./services/camoufox-service.js";
export { createAllTools } from "./tools/index.js";
export { createAllCommands } from "./commands/index.js";
export { createAllHooks } from "./hooks/index.js";
export { CamoufoxErrorBox } from "./errors.js";
export type { CamoufoxConfig } from "./types.js";
export type { ToolDefinition } from "./tools/index.js";
export type { CommandDefinition, CommandContext } from "./commands/index.js";
export type { HookDefinition } from "./hooks/index.js";
export type { Launcher, LaunchedBrowser, LaunchOpts } from "./client/launcher.js";
export type { CreateClientOptions } from "./client/create-client.js";
export type { HealthStatus } from "./client/camoufox-client.js";
export type { CamoufoxEvents, CamoufoxEventEmitter, SearchEvent, FetchUrlEvent, BrowserLaunchEvent, BinaryDownloadProgressEvent, ErrorEvent, } from "./client/events.js";
export type { CamoufoxError } from "./errors.js";
export type { RawResult, SearchEngineChoice, SearchEngineName } from "./search/types.js";
export type { SourceName, KnownSourceName, SourceAdapter, SourceFetchOptions, AdapterContext, FetchSourcesResult, BrowserSession, } from "./sources/types.js";
export type { SourceItem } from "./sources/source-item.js";
export { redditAdapter } from "./sources/adapters/reddit.js";
export type { CredentialBackend } from "./credentials/backend.js";
export type { CredentialSpec, CredentialKind } from "./credentials/types.js";
export type { CredentialReader } from "./credentials/reader.js";
export type { CredentialsConfig } from "./client/credentials-config.js";
export type { HttpFetch, HttpFetchInit, HttpResponse } from "./client/http-fetch.js";
export type { SourceFetchEvent, HttpFetchEvent } from "./client/events.js";
type PiEventHandler = (event: unknown, ctx: unknown) => unknown | Promise<unknown>;
interface PiToolExecuteResult {
    content: Array<{
        type: "text";
        text: string;
    }>;
    details: unknown;
}
interface PiRegisteredTool {
    name: string;
    label: string;
    description: string;
    promptSnippet: string;
    promptGuidelines: string[];
    parameters: unknown;
    execute(toolCallId: string, input: unknown, signal?: AbortSignal, onUpdate?: unknown, ctx?: unknown): Promise<PiToolExecuteResult>;
}
interface PiRegisteredCommand {
    description?: string | undefined;
    handler(args: string, ctx: PiCommandContext): Promise<void>;
}
interface PiCommandContext {
    ui?: {
        notify?: (message: string, level?: string) => void;
    };
    cwd?: string;
}
export interface PiExtensionApi {
    on(event: string, handler: PiEventHandler): void;
    registerTool(tool: PiRegisteredTool): void;
    registerCommand(name: string, config: PiRegisteredCommand): void;
    exec: (cmd: string, args: string[], opts?: {
        timeout?: number;
    }) => Promise<{
        stdout: string;
        code: number;
    }>;
    events: {
        emit(event: string, payload: unknown): boolean;
        on?: (event: string, fn: (p: unknown) => void) => void;
    };
    ui?: {
        setStatus?: (key: string, message: string | null) => void;
        notify?: (message: string, level?: string) => void;
    };
    cwd?: string;
}
declare function wrapTool<S extends TObject>(def: ToolDefinition<S>): PiRegisteredTool;
export declare const __test_wrapTool__: typeof wrapTool;
/**
 * @internal Test-only seam. Unit tests swap `fn` to inject a fake Launcher.
 * Do NOT read or mutate this from production code. The identifier is
 * intentionally SCREAMING_CASE to signal "you are editing an internal
 * contract".
 */
export declare const __TEST_LAUNCHER_FACTORY__: {
    fn: () => Launcher;
};
export default function camoufoxExtension(pi: PiExtensionApi): void;
//# sourceMappingURL=index.d.ts.map