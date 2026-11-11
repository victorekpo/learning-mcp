import {
  Client,
  StreamableHTTPClientTransport
} from "@modelcontextprotocol/client";

const SERVER_URL = "http://localhost:3000/mcp";

const client = new Client({
  name: "vic-mcp-client",
  version: "1.0.0"
});

// Connect to the independently running MCP server over HTTP.
// Unlike stdio, the client does not launch the server process.
const transport = new StreamableHTTPClientTransport(
  new URL(SERVER_URL)
);

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
