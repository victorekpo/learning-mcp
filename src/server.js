import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";

// McpServer creates the server and advertises its identity.
const server = new McpServer({
  name: "vic-mcp-server",
  version: "1.0.0"
});

const workspace = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../workspace"
);

// registerTool() defines a tool that clients can discover and call.
server.registerTool(
  "get_system_info",
  {
    description: "Get information about the local computer"
  },
  async () => ({
    // content is the structured result returned by the tool.
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
)

server.registerTool(
  "list_files",
  {
    description: "List files in the MCP workspace"
  },
  async () => ({
    content: [{
      type: "text",
      text: JSON.stringify(await fs.readdir(workspace))
    }]
  })
);

// StdioServerTransport connects the server to a client using standard input/output.
// Important: Avoid console.log() inside a stdio MCP server.
// Standard output carries protocol messages.
// Use console.error() for debugging.
await server.connect(new StdioServerTransport());
