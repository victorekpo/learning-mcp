# 08 — Sampling

## What Is Sampling?

Sampling is the ability for an **MCP server to ask the client's LLM to generate text**. It's the reverse of the normal flow — instead of the client asking the server to do something, the server asks the client to run an inference.

```
Normal flow:    Client ──▶ Server  (call tool)
Sampling flow:  Server ──▶ Client  (please run this through your LLM)
```

---

## Why Sampling?

Sampling enables **agentic server behaviors**. A server can:

- Use the LLM to process data it fetches (summarize a webpage it scraped)
- Run multi-step reasoning loops where it calls a tool, reflects on the result, then calls another tool
- Generate structured output (parse unstructured text into JSON)
- Self-evaluate its own tool results

This is what makes MCP more powerful than simple function calling — servers can be **intelligent agents**, not just dumb APIs.

---

## How Sampling Works

1. Server sends a `sampling/createMessage` request to the client
2. The host/client shows the request to the user (optional confirmation)
3. The client forwards it to the LLM
4. The LLM generates a response
5. The client returns the response to the server

```
Server ──▶ sampling/createMessage { messages: [...], maxTokens: 500 } ──▶ Client
Server ◀── result: { role: "assistant", content: { type: "text", text: "..." } }
```

---

## Sampling Request Structure

```javascript
// Inside a tool handler on the server:
const result = await server.requestSampling({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: `Summarize this data:\n${JSON.stringify(data)}`
      }
    }
  ],
  modelPreferences: {
    hints: [{ name: "claude-3-5-sonnet" }],
    intelligencePriority: 0.8,   // 0–1, prefer intelligence over speed/cost
    speedPriority: 0.2
  },
  systemPrompt: "You are a data analyst. Be concise.",
  maxTokens: 500
});

console.log(result.content.text);  // LLM's response
```

---

## Sampling Parameters

| Parameter | Type | Description |
|---|---|---|
| `messages` | array | The conversation to send to the LLM |
| `maxTokens` | number | Max tokens to generate |
| `systemPrompt` | string | Optional system prompt |
| `modelPreferences` | object | Hints for model selection |
| `stopSequences` | string[] | Stop generation at these strings |
| `temperature` | number | Randomness (0–1) |
| `includeContext` | string | `"none"`, `"thisServer"`, or `"allServers"` |

---

## includeContext

The `includeContext` field tells the client whether to inject conversation history:

| Value | Behavior |
|---|---|
| `"none"` | Only the messages you provide |
| `"thisServer"` | Include context from interactions with this server |
| `"allServers"` | Include context from all MCP servers in the session |

---

## Human-in-the-Loop

A key design principle: **the client/host must approve sampling requests**. The server cannot silently run LLM calls without the user knowing. Good hosts:
- Show the sampling request to the user
- Let the user approve, modify, or reject it
- Log all sampling interactions

This prevents malicious or runaway servers from abusing LLM access.

---

## Enabling Sampling

The client must declare the `sampling` capability during the handshake:

```javascript
const client = new Client(
  { name: "my-client", version: "1.0.0" },
  { capabilities: { sampling: {} } }  // ← enables sampling
);
```

If the client doesn't declare this, the server cannot use sampling.

---

## Practical Example: Agentic Tool

```javascript
server.registerTool(
  "analyze_logs",
  { description: "Analyze error logs and suggest fixes" },
  async () => {
    // 1. Read the logs
    const logs = await fs.readFile("workspace/error.log", "utf8");

    // 2. Ask the LLM to analyze them (sampling)
    const analysis = await server.requestSampling({
      messages: [{
        role: "user",
        content: { type: "text", text: `Analyze these logs and suggest fixes:\n\n${logs}` }
      }],
      maxTokens: 1000
    });

    // 3. Return the LLM's analysis as the tool result
    return {
      content: [{ type: "text", text: analysis.content.text }]
    };
  }
);
```

---

## Sampling vs Direct LLM Calls

| | Sampling | Direct LLM API call |
|---|---|---|
| Who runs the LLM | The client's LLM | Server's own LLM |
| Auth/billing | Client's account | Server's account |
| Human oversight | Built into protocol | Server's responsibility |
| Model selection | Client decides | Server decides |

---

## Next

→ [09-security.md](09-security.md)

