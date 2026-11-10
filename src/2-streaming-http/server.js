
import http from "node:http";
import { createSession, handleSessionRequest } from "./utils/sessions.js";
import { logRequest } from "./utils/logger.js";

// Handle incoming MCP HTTP requests.
async function handleRequest(req, res) {
  try {
    logRequest(req, res);

    if (req.url !== "/mcp") {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const sessionId = req.headers["mcp-session-id"];

    // Requests without a session ID can initialize a new session.
    if (!sessionId && req.method === "POST") {
      await createSession(req, res);
      return;
    }

    await handleSessionRequest(sessionId, req, res);
  } catch (error) {
    console.error("MCP HTTP error:", error);

    if (!res.headersSent) res.writeHead(500);
    if (!res.writableEnded) res.end("Internal Server Error");
  }
}

// Expose the MCP endpoint on port 3000.
http.createServer(handleRequest).listen(3000, "127.0.0.1", () => {
  console.log("MCP server running at http://localhost:3000/mcp");
});
