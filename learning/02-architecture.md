# 02 — Architecture

## The Three Roles

Every MCP system has three roles:

```
┌─────────────────────────────────────────┐
│                  HOST                   │
│  (Claude Desktop, VS Code, custom app)  │
│                                         │
│   ┌──────────┐     ┌──────────────────┐ │
│   │  CLIENT  │────▶│   MCP SERVER A   │ │
│   └──────────┘     └──────────────────┘ │
│   ┌──────────┐     ┌──────────────────┐ │
│   │  CLIENT  │────▶│   MCP SERVER B   │ │
│   └──────────┘     └──────────────────┘ │
└─────────────────────────────────────────┘
```

### Host
The application the user interacts with. It owns the LLM conversation and manages one or more MCP clients. Examples: Claude Desktop, VS Code Copilot, a custom agent framework.

### Client
A connector inside the host. Each client maintains a **1:1 connection** with one MCP server. The client speaks the MCP protocol on behalf of the host/LLM.

### Server
An independent process (or remote service) that exposes capabilities — tools, resources, prompts. The server does **not** talk directly to the LLM; it only responds to client requests.

---

## Connection Lifecycle

```
Client                          Server
  │                               │
  │──── initialize ──────────────▶│  (send client info + capabilities)
  │◀─── initialize response ──────│  (server info + capabilities)
  │──── initialized (notify) ────▶│  (handshake complete)
  │                               │
  │──── tools/list ──────────────▶│
  │◀─── tools/list response ──────│
  │                               │
  │──── tools/call ──────────────▶│
  │◀─── tools/call response ──────│
  │                               │
  │──── (close) ─────────────────▶│
```

---

## Capability Negotiation

During `initialize`, both sides declare what they support:

**Client capabilities example:**
```json
{
  "roots": { "listChanged": true },
  "sampling": {}
}
```

**Server capabilities example:**
```json
{
  "tools": { "listChanged": true },
  "resources": { "subscribe": true, "listChanged": true },
  "prompts": { "listChanged": true }
}
```

If a capability isn't declared, neither side should attempt to use it.

---

## Transports

| Transport | Use Case | Communication |
|---|---|---|
| **stdio** | Server is a local subprocess | stdin/stdout pipes |
| **Streamable HTTP** | Server is remote/networked | HTTP + SSE |

See [03-stdio-transport.md](03-stdio-transport.md) and [04-streamable-http-transport.md](04-streamable-http-transport.md) for deep dives.

---

## Message Types

MCP uses **JSON-RPC 2.0** with three message shapes:

### Request (expects a response)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": { "name": "get_system_info", "arguments": {} }
}
```

### Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { "content": [{ "type": "text", "text": "..." }] }
}
```

### Notification (no response expected)
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/tools/list_changed"
}
```

---

## Server Isolation

Each MCP server runs in its **own process** (or its own network endpoint). This provides:
- **Security isolation** — a compromised server can't directly affect others
- **Independent lifecycle** — servers can start/stop without affecting the host
- **Language freedom** — servers can be written in any language (Node, Python, Go, Rust, etc.)

---

## Next

→ [03-stdio-transport.md](03-stdio-transport.md)

