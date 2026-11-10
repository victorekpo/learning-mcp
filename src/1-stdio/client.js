import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const client = new Client({
  name: "vic-mcp-client",
  version: "1.0.0"
});

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["src/server.js"]
});

try {
  await client.connect(transport);

  console.log(" Connected to MCP Server!");

  const { tools } = await client.listTools();

  console.log("\nAvailable tools:");
  console.log(tools.map(t => t.name));

  for (const name of ["get_system_info", "list_files"]) {
    const result = await client.callTool({
      name,
      arguments: {}
    });

    console.log(`\n${name}:`);
    console.log(JSON.stringify(result, null, 2));
  }
} finally {
  await client.close();
}