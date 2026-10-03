#!/usr/bin/env node
const USAGE = `camoufox-pi — stealth browser + source adapters

Usage:
  camoufox-pi <command> [options]

Commands:
  setup              Audit and configure source credentials
  setup --check      Audit only, nonzero exit if any credential missing

Options:
  --help             Show this message`;
export async function runCli(argv, deps) {
    if (argv.length === 0 || argv[0] === "--help" || argv[0] === "help") {
        deps.log(USAGE);
        return 0;
    }
    const [cmd, ...rest] = argv;
    if (cmd === "setup") {
        if (rest.includes("--check")) {
            const handler = deps.handlers["setup:check"];
            if (!handler) {
                deps.log("setup:check not wired");
                return 1;
            }
            return handler();
        }
        const handler = deps.handlers.setup;
        if (!handler) {
            deps.log("setup not wired");
            return 1;
        }
        return handler();
    }
    deps.log(`unknown command: ${cmd}\n\n${USAGE}`);
    return 2;
}
// Allow invocation as `node dist/cli/index.js setup`.
if (import.meta.url === `file://${process.argv[1]}`) {
    const { registerSetupHandlers } = await import("./setup.js");
    const handlers = registerSetupHandlers();
    runCli(process.argv.slice(2), { handlers, log: (l) => console.log(l) }).then((code) => process.exit(code), (err) => {
        console.error(err);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map