import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeAPIRequest, API_URL } from "../client/api-client.js";
import type { HealthCheckResponse } from "../types/api.js";

export function registerHealthTools(server: McpServer) {
  // @ts-ignore
  server.tool(
    "basic-health-check",
    "Basic health check",
    {},
    async () => {
      const healthData = await makeAPIRequest<HealthCheckResponse>(`${API_URL}/health`);
      if (!healthData) {
        return { content: [{ type: "text", text: "Failed to retrieve health status." }] };
      }
      return { content: [{ type: "text", text: `API Status: ${healthData.status}` }] };
    },
  );

  // @ts-ignore
  server.tool(
    "detailed-health-check",
    "Comprehensive health check",
    {},
    async () => {
      const healthData = await makeAPIRequest<HealthCheckResponse>(`${API_URL}/health/detailed`);
      if (!healthData) {
        return { content: [{ type: "text", text: "Failed to retrieve detailed health status." }] };
      }
      return { content: [{ type: "text", text: `Detailed Health Status: ${JSON.stringify(healthData)}` }] };
    },
  );
}
