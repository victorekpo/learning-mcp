
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../workspace"
);

// registerTool() defines tools that clients can discover and call.
export function registerTools(server) {
  server.registerTool(
    "get_system_info",
    {
      description: "Get information about the local computer"
    },
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
