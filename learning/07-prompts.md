# 07 — Prompts

## What Are Prompts?

Prompts are **reusable prompt templates** that an MCP server provides to the client. They allow servers to package expert knowledge about *how to use their tools and data* into structured templates the LLM can invoke.

Think of them as "slash commands" or "macros" — the user (or the host UI) picks a prompt, fills in some arguments, and gets back a ready-to-use set of messages for the LLM.

---

## Why Prompts?

Without prompts, users have to know how to phrase requests to get the best results from a server's tools. With prompts, the server author can encode that knowledge:

- "Here's the best way to ask for a code review"
- "Here's how to query our database effectively"
- "Here's a template for generating a git commit message from a diff"

---

## Defining a Prompt (Server Side)

```javascript
server.addPrompt(
  {
    name: "summarize_file",
    description: "Summarize the contents of a file in the workspace",
    arguments: [
      {
        name: "filename",
        description: "Name of the file to summarize",
        required: true
      },
      {
        name: "style",
        description: "Summary style: brief, detailed, or bullet-points",
        required: false
      }
    ]
  },
  async ({ filename, style = "brief" }) => {
    const content = await fs.readFile(`workspace/${filename}`, "utf8");
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please give me a ${style} summary of this file:\n\n${content}`
          }
        }
      ]
    };
  }
);
```

---

## Prompt Arguments

Arguments are like tool inputs but simpler — just name, description, and required flag. No JSON Schema.

```javascript
arguments: [
  { name: "topic",    description: "Topic to explain",    required: true  },
  { name: "audience", description: "Target audience",     required: false }
]
```

---

## Prompt Result: Messages

A prompt returns an array of **messages** (like a conversation starter). Each message has:
- `role`: `"user"` or `"assistant"`
- `content`: text, image, or embedded resource

```javascript
return {
  messages: [
    {
      role: "user",
      content: { type: "text", text: "Review this code:\n\n```js\n...\n```" }
    }
  ]
};
```

### With an embedded resource:
```javascript
return {
  messages: [
    {
      role: "user",
      content: {
        type: "resource",
        resource: {
          uri: "file:///workspace/hello.txt",
          mimeType: "text/plain",
          text: await fs.readFile("workspace/hello.txt", "utf8")
        }
      }
    },
    {
      role: "user",
      content: { type: "text", text: "Summarize this file for me." }
    }
  ]
};
```

---

## Listing Prompts (Client Side)

```javascript
const { prompts } = await client.listPrompts();

prompts.forEach(p => {
  console.log(p.name);         // "summarize_file"
  console.log(p.description);  // "Summarize the contents..."
  console.log(p.arguments);    // [{ name, description, required }]
});
```

---

## Getting a Prompt (Client Side)

```javascript
const result = await client.getPrompt({
  name: "summarize_file",
  arguments: {
    filename: "hello.txt",
    style: "bullet-points"
  }
});

// result.messages is ready to send to the LLM
console.log(result.messages);
```

---

## Prompts vs Tools

| | Prompts | Tools |
|---|---|---|
| Purpose | Generate LLM messages | Perform actions |
| Returns | Messages array | Content array |
| Side effects | None | Possible |
| Invoked by | User / host UI | LLM autonomously |

---

## Common Use Cases

- **Code review** — template that includes a file's content and asks for a review
- **Commit message** — template from `git diff` output
- **Database query helper** — template with schema context pre-loaded
- **Onboarding wizard** — multi-step guided conversation starters
- **Debugging assistant** — template pre-loaded with logs and error messages

---

## Best Practices

- Name prompts clearly with **verb_noun** style: `review_code`, `explain_error`
- Pre-load relevant data (files, records) inside the prompt handler so the LLM has full context
- Keep prompts focused — one prompt per use case
- Use `role: "assistant"` to include example AI responses that guide tone/format

---

## Next

→ [08-sampling.md](08-sampling.md)

