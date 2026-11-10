# Learning MCP — Model Context Protocol

A hands-on repo for learning the **Model Context Protocol (MCP)** — the open standard that lets AI clients talk to tools, data sources, and services in a structured way.

---

## What is MCP?

MCP is an open protocol that standardizes how AI clients (like Claude, ChatGPT, or custom agents) communicate with external tools and data sources.

| Transport | When to use |
|---|---|
| **stdio** | AI client and server on the same machine (local tools, subprocesses) |
| **Streamable HTTP** | AI client connects to a server over a network (remote APIs, cloud) |

---

## This Repo

```
src/
  1-stdio/
    server.js         → MCP server (stdio transport)
    client.js         → MCP client — spawns server as subprocess
  2-streaming-http/
    server.js         → MCP HTTP server (port 3000)
    client.js         → MCP client — connects over HTTP
    utils/
      mcp.js          → McpServer factory (one per session)
      tools.js        → tool definitions
      sessions.js     → session lifecycle (create, route, close)
      logger.js       → request/response logger
workspace/
  hello.txt           → sandbox folder the server can read
learning/             → deep-dive markdown notes
```

---

## Quick Start

```bash
npm install

# stdio (client spawns the server automatically)
npm run start:stdio

# streamable HTTP (run in two terminals)
node src/2-streaming-http/server.js
node src/2-streaming-http/client.js
```

---

## Learning Notes

| File | Topic |
|---|---|
| [01-what-is-mcp.md](learning/01-what-is-mcp.md) | What MCP is, why it exists, key concepts |
| [02-architecture.md](learning/02-architecture.md) | Hosts, clients, servers, transports |
| [03-stdio-transport.md](learning/03-stdio-transport.md) | stdio transport deep dive |
| [04-streamable-http-transport.md](learning/04-streamable-http-transport.md) | Streamable HTTP transport deep dive |
| [05-tools.md](learning/05-tools.md) | Defining and calling tools |
| [06-resources.md](learning/06-resources.md) | Resources — exposing data to AI |
| [07-prompts.md](learning/07-prompts.md) | Prompt templates |
| [08-sampling.md](learning/08-sampling.md) | Sampling — server-initiated LLM calls |
| [09-security.md](learning/09-security.md) | Security, auth, and best practices |
| [10-real-world-use-cases.md](learning/10-real-world-use-cases.md) | Real-world use cases |

---

## References

- [MCP Official Docs](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Specification](https://spec.modelcontextprotocol.io)
