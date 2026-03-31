import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeAPIRequest, API_URL } from "../client/api-client.js";
import type { User } from "../types/api.js";

export function registerUserTools(server: McpServer) {
  // @ts-ignore
  server.tool(
    "get-users",
    "List users",
    {},
    async () => {
      const users = await makeAPIRequest<User[]>(`${API_URL}/users`);
      if (!users) {
        return { content: [{ type: "text", text: "Failed to retrieve users." }] };
      }
      return { content: [{ type: "text", text: `Users: ${users.map(u => u.name).join(", ")}` }] };
    },
  );

  // @ts-ignore
  server.tool(
    "create-user",
    "Create user",
    {
      name: z.string().describe("Name of the user"),
      email: z.string().email().describe("Email of the user"),
      mobile: z.string().describe("Mobile number of the user"),
    },
    async ({ name, email, mobile }) => {
      const newUser = await makeAPIRequest<User>(`${API_URL}/users`, 'POST', { name, email, mobile });
      if (!newUser) {
        return { content: [{ type: "text", text: "Failed to create user." }] };
      }
      return { content: [{ type: "text", text: `User created: ${newUser.name}` }] };
    },
  );
}
