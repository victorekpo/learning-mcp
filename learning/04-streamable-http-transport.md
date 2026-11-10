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

## How It Works

### Client → Server: HTTP POST

The client sends JSON-RPC messages via HTTP POST to a single endpoint (e.g., `/mcp`):

```
POST /mcp HTTP/1.1
Content-Type: application/json

{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```

### Server → Client: SSE or HTTP Response

The server can respond:
1. **Directly in the HTTP response body** (for simple request/response)
2. **Via Server-Sent Events (SSE)** for streaming results or notifications

---

## Server Example (Node.js)

```javascript
import { McpServer } from "@modelcontextprotocol/server";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/server/streamable-http";
import express from "express";

const app = express();
app.use(express.json());

const server = new McpServer({ name: "my-http-server", version: "1.0.0" });

server.registerTool("ping", { description: "Ping the server" }, async () => ({
  content: [{ type: "text", text: "pong" }]
}));

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ req, res });
  await server.connect(transport);
});

app.listen(3000, () => console.log("MCP server on http://localhost:3000/mcp"));
```

## Client Example

```javascript
import { Client } from "@modelcontextprotocol/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/client/streamable-http";

const client = new Client({ name: "my-client", version: "1.0.0" });

const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3000/mcp")
);

await client.connect(transport);
const { tools } = await client.listTools();
console.log(tools);
```

---

## Session Management

Streamable HTTP uses a **session ID** (sent as a header) so a stateful server can track which client is which across multiple HTTP requests:

```
Mcp-Session-Id: abc123xyz
```

The server assigns this ID during `initialize` and the client includes it in every subsequent request.

---

## Streaming Responses

For long-running tools (file processing, web scraping, etc.), the server can stream partial results back using SSE:

```
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: {"jsonrpc":"2.0","method":"notifications/progress","params":{"progress":0.5}}

data: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"done"}]}}
```

---

## Stateless vs Stateful Servers

| Mode | Description | Use Case |
|---|---|---|
| **Stateless** | Each request is independent, no session | Simple tools, serverless |
| **Stateful** | Session ID ties requests together | Multi-step workflows, subscriptions |

---

## Security Considerations

Unlike stdio, HTTP servers are network-exposed. See [09-security.md](09-security.md) for auth patterns. Key points:
- Always use **HTTPS** in production
- Validate the `Origin` header (DNS rebinding protection)
- Require an **API key** or **OAuth token** in headers

---

## stdio vs Streamable HTTP Summary

| | stdio | Streamable HTTP |
|---|---|---|
| Location | Same machine | Any network |
| Clients | 1 (spawning process) | Many |
| Auth needed | No | Yes |
| Streaming | No | Yes (SSE) |
| Deployment | Local subprocess | Server / cloud |

---

## Next

→ [05-tools.md](05-tools.md)

