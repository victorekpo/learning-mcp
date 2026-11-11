import { McpServer } from "@modelcontextprotocol/server";
import { registerGetSystemInfoTool } from "../tools/systemInfo/index.js";
import { registerListFilesTool } from "../tools/listFiles/index.js";

// Create a separate MCP server for each client session.
export function createMcpServer() {
  const server = new McpServer({
    name: "vic-mcp-server",
    version: "1.0.0"
  });

  server.onerror = (error) => {
    console.error("MCP Server Error:", error);
  };

  // Register tools
  registerGetSystemInfoTool(server);
  registerListFilesTool(server);

  return server;
}
