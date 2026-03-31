import express from "express";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
// Import Express types correctly
import type { Request, Response } from "express";

// Enable debug logging to see what's happening
process.env.DEBUG = "mcp:*";

const app = express();
app.use(express.json());

const server = new McpServer({
  name: "Echo",
  version: "1.0.0"
});

// Register our capabilities
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

app.post('/mcp', async (req: Request, res: Response) => {
  try {
    // Log incoming request for debugging
    console.log('Received request:', JSON.stringify(req.body, null, 2));
    
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    
    res.on('close', () => {
      console.log('Request closed');
      transport.close();
    });
    
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

app.get('/mcp', async (req: Request, res: Response) => {
  console.log('Received GET MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed. Use POST to interact with the MCP server. Follow README for details."
    },
    id: null
  }));
});

app.delete('/mcp', async (req: Request, res: Response) => {
  console.log('Received DELETE MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed. Use POST to interact with the MCP server. Follow README for details."
    },
    id: null
  }));
});

// Start the server
const PORT = process.env.MCP_SERVER_PORT || 4000;
app.listen(PORT, () => {
  console.log(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`);
});

// Base URL for the API, can be overridden by the environment variable MCP_API_URL
const API_URL = process.env.MCP_API_URL || "https://api.hr-solx-mobile.com";

// Helper function for making API requests
async function makeAPIRequest<T>(url: string, method: string = 'GET', body?: any): Promise<T | null> {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making API request:", error);
    return null;
  }
}

// Interfaces for API responses
interface HealthCheckResponse {
  status: string;
}

interface Country {
  id: number;
  name: string;
}

interface State {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
}

interface Skill {
  id: number;
  name: string;
}

interface Language {
  id: number;
  name: string;
}

interface WorkingStatus {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
}

interface CandidateProfile {
  id: number;
  name: string;
  skills: Skill[];
}

// Register health check tools
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

// Additional tools can be registered similarly...