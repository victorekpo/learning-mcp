# 01 — What is MCP?

## The Problem MCP Solves

Before MCP, every AI application that needed to access external tools or data had to invent its own integration layer. There was no standard way for an AI client to:
- Discover what tools are available
- Call a tool and get a structured result back
- Read data from a resource
- Ask a server to run an LLM inference on its behalf

This led to fragmented, one-off integrations that were hard to reuse, maintain, or secure.

---

## What MCP Is

**Model Context Protocol (MCP)** is an open protocol introduced by Anthropic in November 2024. It standardizes communication between:

- **AI clients** (Claude Desktop, ChatGPT, custom AI agents, AIOS, etc.)
- **MCP servers** (programs that expose tools, data, and prompt templates)

Think of it like **HTTP for AI tool use** — a universal contract both sides agree on so they can interoperate without custom glue code.

---

## Core Idea

```
AI Client  ←——— MCP Protocol ———→  MCP Server
(Claude,                            (your tools,
 ChatGPT,                            databases,
 custom agent)                       file systems,
                                     APIs)
```

The AI client doesn't need to know *how* the server works internally. It only needs to know what the server advertises via MCP.

---

## Key Primitives

| Primitive | Description |
|---|---|
| **Tools** | Functions the AI can call (e.g., `search_web`, `query_db`) |
| **Resources** | Read-only data the AI can access (e.g., files, DB rows) |
| **Prompts** | Reusable prompt templates the server provides |
| **Sampling** | Server asks the client's LLM to run an inference |

---

## Protocol Basics

MCP is built on **JSON-RPC 2.0**. Every message is a JSON object with a method and params. The two sides:

1. Exchange a **handshake** (`initialize` / `initialized`) to agree on capabilities
2. The client calls **lifecycle methods** (`tools/list`, `tools/call`, `resources/list`, etc.)
3. The server responds with structured JSON results

---

## Why MCP Matters

- **Reusability** — build one MCP server, any MCP-compatible client can use it
- **Standardization** — no more custom plugin formats per AI product
- **Security** — well-defined surface area for access control and sandboxing
- **Ecosystem** — a growing registry of MCP servers for common services (GitHub, Slack, Postgres, etc.)

---

## MCP vs Function Calling

| | OpenAI Function Calling | MCP |
|---|---|---|
| Scope | Single LLM API | Protocol between any client & server |
| Discovery | Defined per-request | Server advertises at runtime |
| Transport | HTTP only | stdio or Streamable HTTP |
| Reusable servers | No | Yes |

---

## Next

→ [02-architecture.md](02-architecture.md)

