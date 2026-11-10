# 03 — stdio Transport

## What It Is

The **stdio transport** runs the MCP server as a **child process** of the client. The two communicate over standard input/output pipes (stdin/stdout). No network, no ports, no HTTP.

```
Client Process
  │
  ├── spawns ──▶ Server Process
  │                │
  │◀── stdout ─────│  (server → client messages)
  │──── stdin ────▶│  (client → server messages)
```

---

## When to Use stdio

- The server and client run on the **same machine**
- You're building **local tools** (file access, system info, CLI wrappers)
- You want **zero network overhead**
- You're using Claude Desktop or any host that launches local MCP servers

---

## How This Repo Uses It

**server.js** connects via stdio:
```javascript
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";

const server = new McpServer({ name: "vic-mcp-server", version: "1.0.0" });

// ... register tools ...

await server.connect(new StdioServerTransport());
```

**client.js** spawns the server as a subprocess:
```javascript
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const transport = new StdioClientTransport({
  command: process.execPath,   // path to node
  args: ["src/server.js"]      // server entry point
});

await client.connect(transport);
```

The `StdioClientTransport` will:
1. Spawn `node src/server.js` as a child process
2. Wire up stdin/stdout as the communication channel
3. Handle JSON-RPC message framing automatically

---

## Message Framing

Each JSON-RPC message is sent as a **single line of JSON** followed by a newline (`\n`). The receiver reads line by line and parses each line as a message.

```
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}\n
{"jsonrpc":"2.0","id":1,"result":{...}}\n
```

---

## ⚠️ Critical Rule: No console.log() in stdio Servers

Because **stdout is the protocol channel**, any stray `console.log()` in the server will corrupt the message stream and break the client.

✅ Use `console.error()` for debug output (goes to stderr, not stdout):
```javascript
console.error("Debug: tool called");   // safe
console.log("Debug: tool called");     // ❌ BREAKS the protocol
```

---

## stdio Security Properties

- **No network exposure** — the server is never accessible over the internet
- **Process isolation** — each server is its own OS process with its own permissions
- **Controlled spawning** — the client decides when and how the server starts
- **No auth needed** — the OS user running the client implicitly authorizes the server

---

## Limitations of stdio

| Limitation | Workaround |
|---|---|
| Local only (same machine) | Use Streamable HTTP for remote servers |
| One client per server instance | Use Streamable HTTP for multi-client |
| Server dies if client exits | Use process supervision (pm2, systemd) |

---

## Next

→ [04-streamable-http-transport.md](04-streamable-http-transport.md)

