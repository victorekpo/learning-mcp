// Log incoming HTTP requests and responses.
export function logRequest(req, res) {
  console.log(`${req.method} ${req.url}`);

  console.log("Request headers:", {
    accept: req.headers.accept,
    contentType: req.headers["content-type"],
    protocolVersion: req.headers["mcp-protocol-version"],
    sessionId: req.headers["mcp-session-id"]
  });

  res.on("finish", () => {
    console.log("Response status:", res.statusCode);
  });
}