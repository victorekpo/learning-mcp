import http from "node:http";
import express from "express";
import { createSession, handleSessionRequest } from "./utils/sessions.js";
import { logRequest } from "./utils/logger.js";

const app = express();

// Handle incoming MCP HTTP requests for all methods.
// app.all("/mcp", ...) handles POST, GET, DELETE, and other methods,
// leaving the existing session transport to process them.
app.all("/mcp", async (req, res) => {
  try {
    logRequest(req, res);

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
});

// JSON parsing for any additional API routes goes AFTER /mcp.
app.use(express.json());

// Example regular Express route.
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Handle unmatched routes.
app.use((req, res) => {
  res.status(404).send("Not Found");
});

// Instantiate the HTTP server
const server = http.createServer(app);

// Listen on port and start the server
server.listen(3000, "127.0.0.1", () => {
  console.log("Express server running at http://localhost:3000");
  console.log("MCP endpoint: http://localhost:3000/mcp");
});

// Temporary tunnel to expose server
// cloudflared --config /dev/null tunnel --url http://127.0.0.1:3000
