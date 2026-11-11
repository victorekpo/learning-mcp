import os from "node:os";

export const registerGetSystemInfoTool = (server) => {
  // registerTool() defines tools that clients can discover and call.
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
}