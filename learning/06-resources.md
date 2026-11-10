# 06 — Resources

## What Are Resources?

Resources are **read-only data** that an MCP server exposes to the client. While tools are for *doing things*, resources are for *reading things* — files, database records, API responses, documentation, etc.

The LLM (via the host) can read resources to add context to its conversation.

```
Client ──▶ resources/read { uri: "file:///workspace/hello.txt" } ──▶ Server
Client ◀── content: [{ type: "text", text: "Hello, World!" }] ◀────── Server
```

---

## Defining a Resource (Server Side)

```javascript
server.addResource(
  {
    uri: "file:///workspace/hello.txt",
    name: "Hello File",
    description: "A sample text file in the workspace",
    mimeType: "text/plain"
  },
  async () => ({
    contents: [{
      uri: "file:///workspace/hello.txt",
      mimeType: "text/plain",
      text: await fs.readFile("workspace/hello.txt", "utf8")
    }]
  })
);
```

---

## Resource URIs

Every resource has a **URI** — a unique identifier. URIs follow standard URL format and can use any scheme:

| Scheme | Example | Use Case |
|---|---|---|
| `file://` | `file:///home/user/notes.txt` | Local files |
| `postgres://` | `postgres://db/users/42` | Database records |
| `https://` | `https://api.example.com/data` | Remote data |
| `custom://` | `memory://session/context` | App-specific data |

---

## Resource Content Types

Each resource can return one or more content blocks:

### Text content:
```javascript
{
  uri: "file:///readme.md",
  mimeType: "text/markdown",
  text: "# Hello"
}
```

### Binary content (base64):
```javascript
{
  uri: "file:///photo.png",
  mimeType: "image/png",
  blob: "iVBORw0KGgo..."   // base64 encoded
}
```

---

## Listing Resources (Client Side)

```javascript
const { resources } = await client.listResources();

resources.forEach(r => {
  console.log(r.uri);          // "file:///workspace/hello.txt"
  console.log(r.name);         // "Hello File"
  console.log(r.description);  // "A sample text file"
  console.log(r.mimeType);     // "text/plain"
});
```

---

## Reading a Resource (Client Side)

```javascript
const result = await client.readResource({
  uri: "file:///workspace/hello.txt"
});

result.contents.forEach(c => {
  if (c.text) console.log(c.text);
  if (c.blob) console.log("Binary data:", c.blob.length, "chars (base64)");
});
```

---

## Resource Templates (Dynamic Resources)

For dynamic resources (like a DB row by ID), use **resource templates** with URI templates:

```javascript
server.addResourceTemplate(
  {
    uriTemplate: "postgres://mydb/users/{id}",
    name: "User record",
    description: "Fetch a user by ID",
    mimeType: "application/json"
  },
  async ({ id }) => ({
    contents: [{
      uri: `postgres://mydb/users/${id}`,
      mimeType: "application/json",
      text: JSON.stringify(await db.getUser(id))
    }]
  })
);
```

The client can then read `postgres://mydb/users/42` and the template fills in `id = "42"`.

---

## Subscriptions

If the server declares `resources.subscribe: true` in its capabilities, clients can **subscribe** to resource changes:

```javascript
// Client subscribes
await client.subscribeResource({ uri: "file:///workspace/data.json" });

// Server notifies when the resource changes
server.sendResourceUpdated({ uri: "file:///workspace/data.json" });

// Client receives a notification and can re-read the resource
```

---

## Resources vs Tools

| | Resources | Tools |
|---|---|---|
| Purpose | Read data | Perform actions |
| Side effects | None (read-only) | Possible |
| Addressed by | URI | Name |
| Arguments | URI only | Arbitrary JSON schema |
| Typical use | Context, documents | Actions, queries |

---

## Best Practices

- Use meaningful, stable URIs — clients may cache them
- Always set `mimeType` so the client knows how to handle the content
- Keep resources **read-only** — use tools for anything that mutates state
- Use templates for parametric data (users, records, pages)
- Notify subscribers via `sendResourceUpdated` when data changes

---

## Next

→ [07-prompts.md](07-prompts.md)

