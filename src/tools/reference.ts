import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeAPIRequest, API_URL } from "../client/api-client.js";
import type { Country, State, City, Skill, Language, WorkingStatus, Role } from "../types/api.js";

export function registerReferenceTools(server: McpServer) {
  // @ts-ignore
  server.tool(
    "get-countries",
    "Get countries list",
    {},
    async () => {
      const countries = await makeAPIRequest<Country[]>(`${API_URL}/countries`);
      if (!countries) {
        return { content: [{ type: "text", text: "Failed to retrieve countries." }] };
      }
      return { content: [{ type: "text", text: `Countries: ${countries.map(c => c.name).join(", ")}` }] };
    },
  );

  // @ts-ignore
  server.tool(
    "get-states",
    "Get states list",
    {},
    async () => {
      const states = await makeAPIRequest<State[]>(`${API_URL}/states`);
      if (!states) {
        return { content: [{ type: "text", text: "Failed to retrieve states." }] };
      }
      return { content: [{ type: "text", text: `States: ${states.map(s => s.name).join(", ")}` }] };
    },
  );

  // @ts-ignore
  server.tool(
    "get-cities",
    "Get cities list",
    {},
    async () => {
      const cities = await makeAPIRequest<City[]>(`${API_URL}/cities`);
      if (!cities) {
        return { content: [{ type: "text", text: "Failed to retrieve cities." }] };
      }
      return { content: [{ type: "text", text: `Cities: ${cities.map(c => c.name).join(", ")}` }] };
    },
  );

  // @ts-ignore
  server.tool(
    "get-skills",
    "Get skills list",
    {},
    async () => {
      const skills = await makeAPIRequest<Skill[]>(`${API_URL}/skills`);
      if (!skills) {
        return { content: [{ type: "text", text: "Failed to retrieve skills." }] };
      }
      return { content: [{ type: "text", text: `Skills: ${skills.map(s => s.name).join(", ")}` }] };
    },
  );

  // @ts-ignore
  server.tool(
    "get-languages",
    "Get languages list",
    {},
    async () => {
      const languages = await makeAPIRequest<Language[]>(`${API_URL}/languages`);
      if (!languages) {
        return { content: [{ type: "text", text: "Failed to retrieve languages." }] };
      }
      return { content: [{ type: "text", text: `Languages: ${languages.map(l => l.name).join(", ")}` }] };
    },
  );

  // @ts-ignore
  server.tool(
    "get-working-statuses",
    "Get working statuses list",
    {},
    async () => {
      const workingStatuses = await makeAPIRequest<WorkingStatus[]>(`${API_URL}/working-statuses`);
      if (!workingStatuses) {
        return { content: [{ type: "text", text: "Failed to retrieve working statuses." }] };
      }
      return { content: [{ type: "text", text: `Working Statuses: ${workingStatuses.map(ws => ws.name).join(", ")}` }] };
    },
  );

  // @ts-ignore
  server.tool(
    "get-roles",
    "Get roles list",
    {},
    async () => {
      const roles = await makeAPIRequest<Role[]>(`${API_URL}/roles`);
      if (!roles) {
        return { content: [{ type: "text", text: "Failed to retrieve roles." }] };
      }
      return { content: [{ type: "text", text: `Roles: ${roles.map(r => r.name).join(", ")}` }] };
    },
  );
}
