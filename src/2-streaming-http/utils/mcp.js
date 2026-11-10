import { McpServer } from "@modelcontextprotocol/server";
import { registerTools } from "./tools.js";

// Create a separate MCP server for each client session.
export function createMcpServer() {
  const server = new McpServer({
    name: "vic-mcp-server",
    version: "1.0.0"
  });

  server.onerror = (error) => {
    console.error("MCP Server Error:", error);
  };

  registerTools(server);

  return server;
}
