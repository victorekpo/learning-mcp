import { randomUUID } from "node:crypto";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { createMcpServer } from "./mcp.js";

// Store each client's MCP server and transport by session ID.
const sessions = new Map();

// Create and initialize a new MCP session.
export async function createSession(req, res) {
  const server = createMcpServer();

  // Stateful mode assigns a unique ID to each client session.
  const transport = new NodeStreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID()
  });

  transport.onerror = (error) => {
    console.error("MCP Transport Error:", error);
  };

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
      console.log("Session closed:", transport.sessionId);
    }
  };

  await server.connect(transport);
  await transport.handleRequest(req, res);

  if (transport.sessionId) {
    sessions.set(transport.sessionId, { server, transport });
    console.log("Session created:", transport.sessionId);
  } else {
    await server.close();
  }
}

// Find a session using its ID.
export function getSession(sessionId) {
  return sessions.get(sessionId);
}

// Close and remove a session.
export async function closeSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;

  sessions.delete(sessionId);
  await session.server.close();

  console.log("Session terminated:", sessionId);
}

// Route an existing session's HTTP request.
export async function handleSessionRequest(sessionId, req, res) {
  const session = getSession(sessionId);

  if (!session) {
    res.writeHead(404);
    res.end("MCP session not found");
    return;
  }

  await session.transport.handleRequest(req, res);

  if (req.method === "DELETE" && res.statusCode >= 200 && res.statusCode < 300) {
    await closeSession(sessionId);
  }
}
