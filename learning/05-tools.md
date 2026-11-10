# 05 — Tools

## What Are Tools?

Tools are **functions the AI can call** via an MCP server. They are the most commonly used MCP primitive. When an AI decides it needs to do something (search the web, run a query, read a file), it calls a tool.

```
AI Client ──▶ tools/call { name: "search", arguments: { q: "MCP" } } ──▶ Server
AI Client ◀── result: [{ type: "text", text: "..." }] ◀────────────────── Server
```

---

## Defining a Tool (Server Side)

```javascript
server.registerTool(
  "tool_name",                      // unique name
  {
    description: "What this does",  // shown to the LLM
    inputSchema: {                  // JSON Schema for arguments
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        limit: { type: "number", description: "Max results", default: 10 }
      },
      required: ["query"]
    }
  },
  async ({ query, limit = 10 }) => {
    const results = await doSearch(query, limit);
    return {
      content: [{ type: "text", text: JSON.stringify(results) }]
    };
  }
);
```

---

## Tool Input Schema

The `inputSchema` is a **JSON Schema** object. The LLM uses it to know what arguments to pass. Always be descriptive — the description is part of the prompt the LLM sees.

```javascript
inputSchema: {
  type: "object",
  properties: {
    path: {
      type: "string",
      description: "Absolute path to the file to read"
    },
    encoding: {
      type: "string",
      enum: ["utf8", "base64"],
      description: "Output encoding, default utf8"
    }
  },
  required: ["path"]
}
```

---

## Tool Return: Content Types

A tool returns a `content` array. Each item has a `type`:

| Type | Description | Example |
|---|---|---|
| `text` | Plain text or JSON string | `{ type: "text", text: "hello" }` |
| `image` | Base64-encoded image | `{ type: "image", data: "...", mimeType: "image/png" }` |
| `resource` | Reference to a resource URI | `{ type: "resource", resource: { uri: "file:///..." } }` |

### Text result:
```javascript
return {
  content: [{ type: "text", text: "Result: 42" }]
};
```

### Image result:
```javascript
return {
  content: [{
    type: "image",
    data: base64EncodedString,
    mimeType: "image/png"
  }]
};
```

### Error result:
```javascript
return {
  isError: true,
  content: [{ type: "text", text: "File not found: /foo/bar.txt" }]
};
```

---

## Calling a Tool (Client Side)

```javascript
const result = await client.callTool({
  name: "search",
  arguments: { query: "MCP protocol", limit: 5 }
});

console.log(result.content[0].text);
```

### Listing available tools:
```javascript
const { tools } = await client.listTools();

tools.forEach(t => {
  console.log(t.name);           // "search"
  console.log(t.description);    // "Search the web"
  console.log(t.inputSchema);    // JSON Schema object
});
```

---

## Tools in This Repo

### `get_system_info`
No arguments. Returns hostname, platform, architecture, CPU count.

```javascript
server.registerTool(
  "get_system_info",
  { description: "Get information about the local computer" },
  async () => ({
    content: [{
      type: "text",
      text: JSON.stringify({
        hostname: os.hostname(),
        platform: os.platform(),
        architecture: os.arch(),
        cpuCount: os.cpus().length
      }, null, 2)
    }]
  })
);
```

### `list_files`
No arguments. Lists files in the `workspace/` folder.

```javascript
server.registerTool(
  "list_files",
  { description: "List files in the MCP workspace" },
  async () => ({
    content: [{
      type: "text",
      text: JSON.stringify(await fs.readdir(workspace))
    }]
  })
);
```

---

## Tool Annotations

Tools can include **annotations** to hint at behavior:

```javascript
{
  description: "Delete a file permanently",
  annotations: {
    destructive: true,       // modifies/deletes data
    readOnlyHint: false,     // not read-only
    idempotentHint: false,   // not safe to retry
    openWorldHint: false     // doesn't access external services
  }
}
```

Clients (and users) can use these hints to decide whether to confirm before calling.

---

## Dynamic Tool Lists

Servers can notify the client that the tool list has changed:

```javascript
server.sendToolListChanged();
```

The client should then call `tools/list` again to get the updated list.

---

## Best Practices

- Keep tool names **lowercase with underscores** (`get_weather`, not `GetWeather`)
- Write **clear descriptions** — the LLM uses them to decide which tool to call
- Always **validate inputs** — don't trust arguments blindly
- Return **structured JSON** in `text` fields for complex data
- Use `isError: true` instead of throwing — it gives the LLM a chance to recover
- Keep tools **focused** — one tool, one responsibility

---

## Next

→ [06-resources.md](06-resources.md)

