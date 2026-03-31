import express from "express";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import type { Request, Response } from "express";
import { APIError, NetworkError, ToolError } from "./types/errors.js";

process.env.DEBUG = "mcp:*";

const app = express();
app.use(express.json());

const server = new McpServer({
  name: "Echo",
  version: "1.0.0"
});

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

const PORT = process.env.MCP_SERVER_PORT || 4000;
app.listen(PORT, () => {
  console.log(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`);
});

const API_URL = process.env.MCP_API_URL || "https://api.hr-solx-mobile.com";

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
      throw new APIError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        url.replace(API_URL, ''),
      );
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof APIError) {
      console.error(`API Error [${error.statusCode}] ${error.endpoint}: ${error.message}`);
    } else if (error instanceof NetworkError) {
      console.error(`Network Error: ${error.message}`, error.originalError);
    } else {
      console.error("Error making API request:", error);
    }
    return null;
  }
}

function formatToolError(toolName: string, error: unknown): string {
  if (error instanceof APIError) {
    return `Error in ${toolName}: ${error.message} (endpoint: ${error.endpoint})`;
  }
  if (error instanceof NetworkError) {
    return `Error in ${toolName}: Network failure - ${error.message}`;
  }
  if (error instanceof ToolError) {
    return `Error in ${toolName}: ${error.message}`;
  }
  return `Error in ${toolName}: An unexpected error occurred`;
}

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

// @ts-ignore
server.tool(
  "basic-health-check",
  "Basic health check",
  {},
  async () => {
    try {
      const healthData = await makeAPIRequest<HealthCheckResponse>(`${API_URL}/health`);
      if (!healthData) {
        return { content: [{ type: "text", text: "Failed to retrieve health status. The API may be unreachable." }] };
      }
      return { content: [{ type: "text", text: `API Status: ${healthData.status}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: formatToolError("basic-health-check", error) }] };
    }
  },
);

// @ts-ignore
server.tool(
  "detailed-health-check",
  "Comprehensive health check",
  {},
  async () => {
    try {
      const healthData = await makeAPIRequest<HealthCheckResponse>(`${API_URL}/health/detailed`);
      if (!healthData) {
        return { content: [{ type: "text", text: "Failed to retrieve detailed health status. The API may be unreachable." }] };
      }
      return { content: [{ type: "text", text: `Detailed Health Status: ${JSON.stringify(healthData)}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: formatToolError("detailed-health-check", error) }] };
    }
  },
);

// @ts-ignore
server.tool(
  "get-countries",
  "Get countries list",
  {},
  async () => {
    try {
      const countries = await makeAPIRequest<Country[]>(`${API_URL}/countries`);
      if (!countries) {
        return { content: [{ type: "text", text: "Failed to retrieve countries. The API may be unreachable." }] };
      }
      return { content: [{ type: "text", text: `Countries: ${countries.map(c => c.name).join(", ")}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: formatToolError("get-countries", error) }] };
    }
  },
);

// @ts-ignore
server.tool(
  "get-states",
  "Get states list",
  {},
  async () => {
    try {
      const states = await makeAPIRequest<State[]>(`${API_URL}/states`);
      if (!states) {
        return { content: [{ type: "text", text: "Failed to retrieve states. The API may be unreachable." }] };
      }
      return { content: [{ type: "text", text: `States: ${states.map(s => s.name).join(", ")}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: formatToolError("get-states", error) }] };
    }
  },
);

// @ts-ignore
server.tool(
  "get-cities",
  "Get cities list",
  {},
  async () => {
    try {
      const cities = await makeAPIRequest<City[]>(`${API_URL}/cities`);
      if (!cities) {
        return { content: [{ type: "text", text: "Failed to retrieve cities. The API may be unreachable." }] };
      }
      return { content: [{ type: "text", text: `Cities: ${cities.map(c => c.name).join(", ")}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: formatToolError("get-cities", error) }] };
    }
  },
);

// @ts-ignore
server.tool(
  "get-skills",
  "Get skills list",
  {},
  async () => {
    try {
      const skills = await makeAPIRequest<Skill[]>(`${API_URL}/skills`);
      if (!skills) {
        return { content: [{ type: "text", text: "Failed to retrieve skills. The API may be unreachable." }] };
      }
      return { content: [{ type: "text", text: `Skills: ${skills.map(s => s.name).join(", ")}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: formatToolError("get-skills", error) }] };
    }
  },
);

// @ts-ignore
server.tool(
  "get-languages",
  "Get languages list",
  {},
  async () => {
    try {
      const languages = await makeAPIRequest<Language[]>(`${API_URL}/languages`);
      if (!languages) {
        return { content: [{ type: "text", text: "Failed to retrieve languages. The API may be unreachable." }] };
      }
      return { content: [{ type: "text", text: `Languages: ${languages.map(l => l.name).join(", ")}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: formatToolError("get-languages", error) }] };
    }
  },
);

// @ts-ignore
server.tool(
  "get-working-statuses",
  "Get working statuses list",
  {},
  async () => {
    try {
      const workingStatuses = await makeAPIRequest<WorkingStatus[]>(`${API_URL}/working-statuses`);
      if (!workingStatuses) {
        return { content: [{ type: "text", text: "Failed to retrieve working statuses. The API may be unreachable." }] };
      }
      return { content: [{ type: "text", text: `Working Statuses: ${workingStatuses.map(ws => ws.name).join(", ")}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: formatToolError("get-working-statuses", error) }] };
    }
  },
);

// @ts-ignore
server.tool(
  "get-roles",
  "Get roles list",
  {},
  async () => {
    try {
      const roles = await makeAPIRequest<Role[]>(`${API_URL}/roles`);
      if (!roles) {
        return { content: [{ type: "text", text: "Failed to retrieve roles. The API may be unreachable." }] };
      }
      return { content: [{ type: "text", text: `Roles: ${roles.map(r => r.name).join(", ")}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: formatToolError("get-roles", error) }] };
    }
  },
);

// @ts-ignore
server.tool(
  "get-users",
  "List users",
  {},
  async () => {
    try {
      const users = await makeAPIRequest<User[]>(`${API_URL}/users`);
      if (!users) {
        return { content: [{ type: "text", text: "Failed to retrieve users. The API may be unreachable." }] };
      }
      return { content: [{ type: "text", text: `Users: ${users.map(u => u.name).join(", ")}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: formatToolError("get-users", error) }] };
    }
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
    try {
      const newUser = await makeAPIRequest<User>(`${API_URL}/users`, 'POST', { name, email, mobile });
      if (!newUser) {
        return { content: [{ type: "text", text: "Failed to create user. The API may be unreachable or the request was invalid." }] };
      }
      return { content: [{ type: "text", text: `User created: ${newUser.name}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: formatToolError("create-user", error) }] };
    }
  },
);
