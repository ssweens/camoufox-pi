import { Value } from "typebox/value";
import { RealLauncher } from "./client/launcher.js";
import { createAllCommands } from "./commands/index.js";
import { CamoufoxErrorBox } from "./errors.js";
import { createAllHooks } from "./hooks/index.js";
import { CamoufoxService } from "./services/camoufox-service.js";
import { createAllTools } from "./tools/index.js";
import { checkForUpdates } from "./update-check.js";
// ---------------------------------------------------------------------------
// Library-style named exports — non-PI consumers (TFF daemon, scripts, CI)
// import directly. This is off-label per PI docs but mechanically sound
// because CamoufoxClient has no runtime dependency on pi-coding-agent.
// ---------------------------------------------------------------------------
export { CamoufoxClient } from "./client/camoufox-client.js";
export { createClient } from "./client/create-client.js";
export { RealLauncher } from "./client/launcher.js";
export { CamoufoxService } from "./services/camoufox-service.js";
export { createAllTools } from "./tools/index.js";
export { createAllCommands } from "./commands/index.js";
export { createAllHooks } from "./hooks/index.js";
export { CamoufoxErrorBox } from "./errors.js";
export { redditAdapter } from "./sources/adapters/reddit.js";
// ---------------------------------------------------------------------------
// Boundary adapters: bridge tool/command definitions to PI's structural
// shape without casts. `wrapTool` uses TypeBox's runtime Value.Check to
// narrow the unknown input to Static<S> before delegating to the typed
// execute().
// ---------------------------------------------------------------------------
function wrapTool(def) {
    const guidelines = [...def.promptGuidelines];
    if (def.readOnly) {
        guidelines.push("This tool is read-only (no side effects). Safe to call in parallel with other read-only tools.");
    }
    return {
        name: def.name,
        label: def.label,
        description: def.description,
        promptSnippet: def.promptSnippet,
        promptGuidelines: guidelines,
        parameters: def.parameters,
        async execute(toolCallId, input, signal) {
            if (!Value.Check(def.parameters, input)) {
                const first = [...Value.Errors(def.parameters, input)][0];
                throw new CamoufoxErrorBox({
                    type: "config_invalid",
                    field: first?.instancePath ?? "(root)",
                    reason: first?.message ?? "validation failed",
                });
            }
            return def.execute(toolCallId, input, signal);
        },
    };
}
// Exposed for unit tests only. Not part of the public API.
export const __test_wrapTool__ = wrapTool;
function wrapCommand(def) {
    return {
        description: def.description,
        async handler(args, piCtx) {
            const ctx = {
                cwd: piCtx.cwd ?? process.cwd(),
                ui: {
                    notify: (message, level = "info") => {
                        piCtx.ui?.notify?.(message, level);
                    },
                },
            };
            await def.handler(args, ctx);
        },
    };
}
// ---------------------------------------------------------------------------
// Test seam — unit tests swap the factory to inject a fake Launcher.
// Production code calls camoufoxExtension(pi) and gets a RealLauncher.
// ---------------------------------------------------------------------------
/**
 * @internal Test-only seam. Unit tests swap `fn` to inject a fake Launcher.
 * Do NOT read or mutate this from production code. The identifier is
 * intentionally SCREAMING_CASE to signal "you are editing an internal
 * contract".
 */
export const __TEST_LAUNCHER_FACTORY__ = {
    fn: () => new RealLauncher(),
};
// ---------------------------------------------------------------------------
// Default export — called by PI with its ExtensionAPI instance at startup.
// Tools and hooks are registered at LOAD TIME so they appear in PI's
// startup system prompt. Service attaches session hooks and the event
// bridge synchronously after construction.
// ---------------------------------------------------------------------------
export default function camoufoxExtension(pi) {
    const service = new CamoufoxService({ launcher: __TEST_LAUNCHER_FACTORY__.fn() });
    for (const def of createAllTools(service))
        pi.registerTool(wrapTool(def));
    for (const def of createAllCommands(service))
        pi.registerCommand(def.name, wrapCommand(def));
    for (const hook of createAllHooks(service))
        pi.on(hook.event, hook.handler);
    service.attach(pi);
    queueMicrotask(() => {
        void checkForUpdates(pi).then((info) => {
            if (info?.updateAvailable) {
                pi.ui?.notify?.(`📦 Update available: ${info.latestVersion} (you have ${info.currentVersion}). Run: pi install npm:@the-forge-flow/camoufox-pi`, "info");
            }
        });
    });
}
//# sourceMappingURL=index.js.map