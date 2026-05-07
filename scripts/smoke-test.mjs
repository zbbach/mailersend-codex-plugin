import { spawn } from "node:child_process";
import { once } from "node:events";

const child = spawn(process.execPath, ["./scripts/mailersend-mcp.mjs"], {
  cwd: new URL("..", import.meta.url),
  stdio: ["pipe", "pipe", "inherit"],
  env: { ...process.env, MAILERSEND_API_TOKEN: "test-token" }
});

const messages = [];
child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  for (const line of chunk.trim().split("\n")) {
    if (line) messages.push(JSON.parse(line));
  }
});

child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }) + "\n");
child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }) + "\n");
child.stdin.end();

await once(child, "exit");

const toolList = messages.find((message) => message.id === 2)?.result?.tools || [];
if (!toolList.some((tool) => tool.name === "mailersend_send_email")) {
  throw new Error("mailersend_send_email was not listed by the MCP server");
}

console.log(`Smoke test passed: ${toolList.length} tools listed.`);
