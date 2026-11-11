import fs from "node:fs/promises";
import { workspace } from "../../constants/index.js";

export const registerListFilesTool = (server) => {
  // registerTool() defines tools that clients can discover and call.
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
}