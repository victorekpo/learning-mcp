# 10 — Real-World Use Cases

## Overview

MCP is designed to be the universal glue between AI and the external world. Here are the most common and powerful real-world patterns.

---

## 1. File System Access

Give an AI assistant access to your local or remote files.

**Tools to expose:**
- `read_file` — read a file by path
- `write_file` — write content to a file
- `list_directory` — list files in a directory
- `search_files` — grep/search within files
- `create_directory`, `delete_file`, `move_file`

**Example use:** Claude Desktop + a filesystem MCP server = AI that can read your codebase, edit files, and run refactors on your behalf.

```javascript
server.registerTool("read_file", {
  inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] }
}, async ({ path }) => {
  const text = await fs.readFile(path, "utf8");
  return { content: [{ type: "text", text }] };
});
```

---

## 2. Database Access

Let the AI query and explore your database.

**Tools to expose:**
- `query` — run a SELECT query
- `list_tables` — show available tables
- `describe_table` — show schema for a table
- `execute` — run INSERT/UPDATE (with confirmation)

**Resources to expose:**
- `postgres://mydb/schema` — the full DB schema as a resource

**Example use:** Ask your AI "Show me all users who signed up last week and had a failed payment" — it writes and runs the SQL.

```javascript
server.registerTool("query", {
  inputSchema: {
    type: "object",
    properties: { sql: { type: "string", description: "SELECT query to run" } },
    required: ["sql"]
  }
}, async ({ sql }) => {
  if (!sql.trim().toUpperCase().startsWith("SELECT")) {
    return { isError: true, content: [{ type: "text", text: "Only SELECT queries allowed" }] };
  }
  const rows = await db.query(sql);
  return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
});
```

---

## 3. GitHub Integration

Connect AI to your GitHub repositories.

**Tools to expose:**
- `list_repos` — list user's repos
- `get_file` — read a file from a repo
- `create_issue` — open a GitHub issue
- `list_prs` — list open pull requests
- `create_pr` — open a pull request
- `get_diff` — get a PR diff

**Example use:** "Create an issue for the bug I just described, assign it to me, and add the `bug` label."

**Existing server:** Anthropic publishes an official [GitHub MCP server](https://github.com/modelcontextprotocol/servers/tree/main/src/github).

---

## 4. Web Search & Browsing

Give the AI live access to the internet.

**Tools to expose:**
- `search` — web search (Brave, Google, Bing APIs)
- `fetch_page` — fetch and parse a webpage
- `screenshot` — take a screenshot of a URL

**Example use:** "What are the top 3 MCP server libraries available right now?" — AI searches and summarizes.

```javascript
server.registerTool("search", {
  inputSchema: {
    type: "object",
    properties: { query: { type: "string" }, limit: { type: "number" } },
    required: ["query"]
  }
}, async ({ query, limit = 5 }) => {
  const results = await braveSearch(query, limit);
  return { content: [{ type: "text", text: JSON.stringify(results) }] };
});
```

---

## 5. Terminal / Shell Execution

Let the AI run shell commands (carefully!).

**Tools to expose:**
- `run_command` — run a shell command in a sandboxed environment
- `run_script` — run a Python/Node/Bash script
- `get_process_list` — list running processes

**Security:** This is the most dangerous tool type. Always:
- Sandbox in Docker or a VM
- Whitelist allowed commands
- Require user confirmation for destructive commands

**Example use:** AI-powered DevOps agent that can deploy, restart services, and check logs.

---

## 6. Slack / Communication

Connect AI to your team's communication.

**Tools to expose:**
- `send_message` — post a message to a channel
- `list_channels` — list available channels
- `get_messages` — read recent messages
- `create_reminder` — set a reminder

**Example use:** "Post a summary of this week's work to #engineering-updates."

**Existing server:** Anthropic's [Slack MCP server](https://github.com/modelcontextprotocol/servers/tree/main/src/slack).

---

## 7. Memory and Knowledge Base

Give the AI persistent memory across sessions.

**Tools to expose:**
- `store_memory` — save a fact or note
- `recall_memory` — search stored memories
- `delete_memory` — remove a memory

**Resources to expose:**
- `memory://all` — all stored memories as a resource

**Example use:** "Remember that our API key rotation policy is every 90 days." — AI stores it and recalls it in future sessions.

---

## 8. Code Execution Sandbox

Let the AI run and test code.

**Tools to expose:**
- `execute_python` — run Python code in a sandbox
- `execute_javascript` — run JS in a sandbox
- `install_package` — install a package in the sandbox

**Example use:** "Write a function to parse this CSV and test it on this sample data." — AI writes the code and runs it to verify.

---

## 9. Cloud Infrastructure (AWS, GCP, Azure)

Connect AI to your cloud.

**Tools to expose:**
- `list_s3_buckets`, `get_s3_object`, `put_s3_object`
- `list_ec2_instances`, `start_instance`, `stop_instance`
- `get_cloudwatch_logs`
- `deploy_lambda`

**Example use:** "What Lambda functions errored in the last hour?" — AI queries CloudWatch and summarizes errors.

---

## 10. Agentic Loops (Sampling + Tools)

The most powerful pattern: a server that uses **sampling** to run multi-step AI workflows.

```
Server Tool Called
  → Server fetches data
  → Server asks client's LLM to analyze (sampling)
  → LLM decides next action
  → Server calls another tool
  → Server asks LLM again
  → ... loop until done
  → Return final result
```

**Example use:** "Research this topic, find 5 sources, extract key points, and write a summary."

```javascript
server.registerTool("research", {
  inputSchema: { type: "object", properties: { topic: { type: "string" } }, required: ["topic"] }
}, async ({ topic }) => {
  // 1. Search the web
  const results = await webSearch(topic);

  // 2. Ask LLM to pick the best 3 (sampling)
  const selection = await server.requestSampling({
    messages: [{
      role: "user",
      content: { type: "text", text: `Pick the 3 most useful results:\n${JSON.stringify(results)}` }
    }],
    maxTokens: 300
  });

  // 3. Fetch and summarize each
  const summaries = await Promise.all(
    parseSelection(selection.content.text).map(url => fetchAndSummarize(url))
  );

  // 4. Ask LLM to write the final report (sampling)
  const report = await server.requestSampling({
    messages: [{
      role: "user",
      content: { type: "text", text: `Write a research summary on "${topic}" using:\n${summaries.join("\n\n")}` }
    }],
    maxTokens: 1000
  });

  return { content: [{ type: "text", text: report.content.text }] };
});
```

---

## Existing MCP Servers (Official + Community)

| Server | What it exposes |
|---|---|
| `@modelcontextprotocol/server-filesystem` | Local filesystem |
| `@modelcontextprotocol/server-github` | GitHub repos, issues, PRs |
| `@modelcontextprotocol/server-slack` | Slack messages, channels |
| `@modelcontextprotocol/server-postgres` | PostgreSQL queries |
| `@modelcontextprotocol/server-brave-search` | Brave web search |
| `@modelcontextprotocol/server-puppeteer` | Browser control |
| `@modelcontextprotocol/server-sqlite` | SQLite databases |
| `@modelcontextprotocol/server-google-maps` | Maps, directions, places |

Browse more at: https://github.com/modelcontextprotocol/servers

---

## Summary

MCP is a **universal adapter** between AI and the world. With the right servers, an AI assistant can:

- Read and write your files
- Query your databases
- Search the web
- Talk to your APIs
- Control your infrastructure
- Remember things across sessions
- Run code
- Collaborate via your team's tools

The ecosystem is growing rapidly — and because MCP is an open standard, any server you build today works with every MCP-compatible AI client.

