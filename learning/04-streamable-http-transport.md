# 04 — Streamable HTTP Transport

## What It Is

The **Streamable HTTP transport** lets a client connect to an MCP server over a **network** using HTTP. Unlike stdio, the server is a persistent network service — not a subprocess.

It supports both:
- **Request/response** (standard HTTP POST)
- **Server-sent events (SSE)** for streaming and server-initiated messages

---

## When to Use Streamable HTTP

- Server is **remote** (cloud, another machine, Docker container)
- **Multiple clients** need to connect to the same server simultaneously
- You want to **deploy** MCP servers as microservices or APIs
- You need server-to-client **streaming** or progress notifications

---

## How This Repo Uses It (`src/2-streaming-http/`)

The implementation is split into focused files:

```
src/2-streaming-http/
  server.js          → HTTP server entry point (port 3000)
  client.js          → MCP client over HTTP
  utils/
    mcp.js           → creates a new McpServer per session
    tools.js         → registers tools on the server
    sessions.js      → manages session lifecycle (create, route, close)
    logger.js        → logs incoming requests and response status
```

---

## Server Entry Point (`server.js`)

The server is a plain Node.js `http.createServer`. All MCP logic is delegated to the session utilities.

```javascript
import http from "node:http";
import { createSession, handleSessionRequest } from "./utils/sessions.js";
import { logRequest } from "./utils/logger.js";

async function handleRequest(req, res) {
  logRequest(req, res);

  if (req.url !== "/mcp") {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const sessionId = req.headers["mcp-session-id"];

  // Requests without a session ID initialize a new session.
  if (!sessionId && req.method === "POST") {
    await createSession(req, res);
    return;
  }

  await handleSessionRequest(sessionId, req, res);
}

http.createServer(handleRequest).listen(3000, "127.0.0.1", () => {
  console.log("MCP server running at http://localhost:3000/mcp");
});
```

---

## Transport: `NodeStreamableHTTPServerTransport`

Comes from `@modelcontextprotocol/node`. Used in **stateful mode** — each session gets a unique ID via `sessionIdGenerator`.

```javascript
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";

const transport = new NodeStreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID()
});
```

> For **stateless** mode (e.g. serverless), pass `sessionIdGenerator: undefined` — no session ID is assigned and no state is kept between requests.

---

## Session Management (`utils/sessions.js`)

Each connected client gets its own `McpServer` + `transport` pair, stored in a `Map` by session ID.

```javascript
// In-memory session store
const sessions = new Map();  // sessionId → { server, transport }

export async function createSession(req, res) {
  const server = createMcpServer();
  const transport = new NodeStreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID()
  });

  transport.onclose = () => sessions.delete(transport.sessionId);

  await server.connect(transport);
  await transport.handleRequest(req, res);  // responds with the session ID

  if (transport.sessionId) {
    sessions.set(transport.sessionId, { server, transport });
  }
}

export async function handleSessionRequest(sessionId, req, res) {
  const session = sessions.get(sessionId);
  if (!session) { res.writeHead(404); res.end("MCP session not found"); return; }

  await session.transport.handleRequest(req, res);

  // Clean up on DELETE
  if (req.method === "DELETE") await closeSession(sessionId);
}
```

---

## MCP Server Factory (`utils/mcp.js`)

A new `McpServer` is created for every session. This gives each client full isolation.

```javascript
import { McpServer } from "@modelcontextprotocol/server";
import { registerTools } from "./tools.js";

export function createMcpServer() {
  const server = new McpServer({ name: "vic-mcp-server", version: "1.0.0" });
  server.onerror = (error) => console.error("MCP Server Error:", error);
  registerTools(server);
  return server;
}
```

---

## Client (`client.js`)

The client uses `StreamableHTTPClientTransport` from `@modelcontextprotocol/client`. It connects to the running server over HTTP — **it does not spawn a subprocess**.

```javascript
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const client = new Client({ name: "vic-mcp-client", version: "1.0.0" });

// Unlike stdio, the client does not launch the server process.
const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3000/mcp")
);

await client.connect(transport);
```

The transport automatically sends the `Mcp-Session-Id` header on all requests after the initial `initialize`.

---

## Request Flow

```
Client                              Server (port 3000)
  │                                       │
  │── POST /mcp (no session ID) ─────────▶│  createSession()
  │◀─ 200 + Mcp-Session-Id: abc123 ───────│  sessions.set("abc123", ...)
  │                                       │
  │── POST /mcp (Mcp-Session-Id: abc123) ─▶│  handleSessionRequest()
  │◀─ tools/list response ─────────────────│
  │                                       │
  │── POST /mcp (Mcp-Session-Id: abc123) ─▶│  tools/call
  │◀─ tool result ──────────────────────────│
  │                                       │
  │── DELETE /mcp (Mcp-Session-Id: abc123)─▶│  closeSession()
```

---

## Running It

Start the server first (it's a persistent process):
```bash
node src/2-streaming-http/server.js
```

Then in a separate terminal, run the client:
```bash
node src/2-streaming-http/client.js
```

---

## Stateless vs Stateful

| Mode | `sessionIdGenerator` | Use Case |
|---|---|---|
| **Stateful** | `() => randomUUID()` | Multi-step workflows, persistent sessions |
| **Stateless** | `undefined` | Serverless, single-request tools |

This repo uses **stateful** mode.

---

## stdio vs Streamable HTTP — This Repo

| | `src/1-stdio/` | `src/2-streaming-http/` |
|---|---|---|
| Transport | `StdioServerTransport` / `StdioClientTransport` | `NodeStreamableHTTPServerTransport` / `StreamableHTTPClientTransport` |
| Server start | Client spawns it as subprocess | Started independently on port 3000 |
| Sessions | One client only | Many clients, each with their own session |
| `console.log` safe? | ❌ corrupts stdio | ✅ fine |
| Auth needed | No | Yes in production |

---

## Security Considerations

Unlike stdio, HTTP servers are network-exposed. See [09-security.md](09-security.md) for auth patterns. Key points:
- Always use **HTTPS** in production
- Validate the `Origin` header (DNS rebinding protection)
- Require an **API key** or **OAuth token** in headers

---

## Next

→ [05-tools.md](05-tools.md)
