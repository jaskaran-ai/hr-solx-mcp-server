import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerEchoCapabilities(
  server: McpServer,
  ResourceTemplate: any,
) {
  server.resource(
    "echo",
    new ResourceTemplate("echo://{message}", { list: undefined }),
    async (uri, { message }) => ({
      contents: [{
        uri: uri.href,
        text: `Resource echo: ${message}`
      }]
    })
  );

  server.tool(
    "echo",
    { message: z.string() },
    async ({ message }) => ({
      content: [{ type: "text", text: `Tool echo: ${message}` }]
    })
  );

  server.prompt(
    "echo",
    { message: z.string() },
    ({ message }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please process this message: ${message}`
        }
      }]
    })
  );
}
