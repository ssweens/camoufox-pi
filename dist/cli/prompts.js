export async function promptLine(message) {
    process.stdout.write(message);
    return new Promise((resolve) => {
        const chunks = [];
        const onData = (chunk) => {
            chunks.push(chunk);
            if (chunk.includes(0x0a)) {
                process.stdin.off("data", onData);
                resolve(Buffer.concat(chunks)
                    .toString("utf8")
                    .replace(/\r?\n$/, ""));
            }
        };
        process.stdin.on("data", onData);
    });
}
export async function promptSecret(message) {
    process.stdout.write(message);
    const wasRaw = process.stdin.isTTY ? process.stdin.isRaw : false;
    if (process.stdin.isTTY)
        process.stdin.setRawMode(true);
    try {
        const chunks = [];
        return await new Promise((resolve) => {
            const onData = (chunk) => {
                const s = chunk.toString("utf8");
                for (const ch of s) {
                    if (ch === "\r" || ch === "\n") {
                        process.stdout.write("\n");
                        process.stdin.off("data", onData);
                        resolve(chunks.join(""));
                        return;
                    }
                    if (ch === "\u0003") {
                        process.stdin.off("data", onData);
                        process.exit(130);
                    }
                    chunks.push(ch);
                }
            };
            process.stdin.on("data", onData);
        });
    }
    finally {
        if (process.stdin.isTTY)
            process.stdin.setRawMode(wasRaw);
    }
}
//# sourceMappingURL=prompts.js.map