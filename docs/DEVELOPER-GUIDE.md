# Developer Guide

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Server runs at http://localhost:4000/mcp
```

## Running with Docker

### Production

```bash
# Copy environment template
cp .env.example .env

# Start in background
docker compose up -d

# View logs
docker compose logs -f
```

### Development (Hot-Reload)

```bash
# Uses docker-compose.dev.yml with volume mounts and nodemon
docker compose -f docker-compose.dev.yml up
```

Features:
- **Volume mounts** — `./src:/app/src` for live editing
- **Hot-reload** — Nodemon watches for file changes automatically
- **Debug logging** — Enabled by default (`DEBUG=mcp:*`)

### Common Docker Commands

```bash
# View logs
docker compose logs -f

# Rebuild after dependency changes
docker compose up -d --build

# Stop containers
docker compose down

# Exec into running container
docker compose exec mcp-server sh

# Development mode
docker compose -f docker-compose.dev.yml up
docker compose -f docker-compose.dev.yml down
```

## Project Structure

```
mcp-server/
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md
│   ├── MCP-PROTOCOL.md
│   ├── TOOLS-REFERENCE.md
│   ├── DEVELOPER-GUIDE.md
│   ├── SECURITY.md
│   └── TROUBLESHOOTING.md
├── src/
│   ├── index.ts             # Server entry point
│   ├── types/
│   │   ├── api.ts           # API response interfaces
│   │   └── errors.ts        # Custom error types
│   ├── client/
│   │   └── api-client.ts    # Upstream API client
│   ├── tools/
│   │   ├── echo.ts          # Echo tool/resource/prompt
│   │   ├── health.ts        # Health check tools
│   │   ├── reference.ts     # Reference data tools
│   │   └── users.ts         # User management tools
│   └── middleware/
│       ├── auth.ts          # API key authentication
│       └── rate-limit.ts    # Rate limiting
├── .env.example             # Environment template
├── Dockerfile               # Multi-stage production build
├── docker-compose.yml       # Production orchestration
├── docker-compose.dev.yml   # Development with hot-reload
├── package.json
└── tsconfig.json
```

## Adding a New Tool

### Step 1: Define TypeScript Interface

Add interface to `src/types/api.ts`:

```typescript
interface Department {
  id: number;
  name: string;
  description?: string;
}
```

### Step 2: Register the Tool

Add tool registration in the appropriate module under `src/tools/`:

```typescript
// In src/tools/reference.ts (or create a new module)
server.tool(
  "get-departments",
  "Get list of departments",
  {},
  async () => {
    const departments = await makeAPIRequest<Department[]>(
      `${API_URL}/departments`
    );
    if (!departments) {
      return { content: [{ type: "text", text: "Failed to retrieve departments." }] };
    }
    return { content: [{ type: "text", text: `Departments: ${departments.map(d => d.name).join(", ")}` }] };
  },
);
```

### Step 3: Import and Register in index.ts

If you created a new module, import and register it in `src/index.ts`:

```typescript
import { registerDepartmentTools } from "./tools/departments.js";

// In the server setup section:
registerDepartmentTools(server);
```

### Tool with Parameters

```typescript
server.tool(
  "get-user-by-id",
  "Get a specific user by ID",
  {
    id: z.number().describe("User ID"),
  },
  async ({ id }) => {
    const user = await makeAPIRequest<User>(
      `${API_URL}/users/${id}`
    );
    if (!user) {
      return { content: [{ type: "text", text: `User ${id} not found.` }] };
    }
    return { content: [{ type: "text", text: `User: ${user.name} (${user.email})` }] };
  },
);
```

### Tool with POST Request

```typescript
server.tool(
  "update-user",
  "Update an existing user",
  {
    id: z.number().describe("User ID"),
    name: z.string().optional().describe("New name"),
    email: z.string().email().optional().describe("New email"),
  },
  async ({ id, name, email }) => {
    const body: Record<string, unknown> = {};
    if (name) body.name = name;
    if (email) body.email = email;
    
    const updated = await makeAPIRequest<User>(
      `${API_URL}/users/${id}`,
      'PATCH',
      body
    );
    if (!updated) {
      return { content: [{ type: "text", text: "Failed to update user." }] };
    }
    return { content: [{ type: "text", text: `User updated: ${updated.name}` }] };
  },
);
```

## Testing

### Using Test Clients

```bash
# Test echo tool
node src/echo_client.js

# List server capabilities
npx ts-node src/get_capabilities.ts
```

### Using curl

```bash
# List all tools
curl -X POST http://localhost:4000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'

# Call a tool
curl -X POST http://localhost:4000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"basic-health-check","arguments":{}},"id":1}'
```

### Using Node.js

```javascript
import fetch from 'node-fetch';

const response = await fetch('http://localhost:4000/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'get-users',
      arguments: {}
    },
    id: 1
  })
});

// Parse SSE response
const text = await response.text();
const match = text.match(/data: (.*)/);
if (match) {
  console.log(JSON.parse(match[1]));
}
```

## Debugging

### Enable Debug Logging

Already enabled in `index.ts`:
```typescript
process.env.DEBUG = "mcp:*";
```

### View Request/Response Logs

Server logs all incoming requests:
```
Received request: {
  "jsonrpc": "2.0",
  "method": "tools/call",
  ...
}
```

### Common Debug Steps

1. Check server is running: `curl http://localhost:4000/mcp`
2. Verify upstream API: `curl https://api.hr-solx-mobile.com/health`
3. Check environment variables: `echo $MCP_API_URL`
4. Review console output for errors

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_SERVER_PORT` | `4000` | Port for MCP server |
| `MCP_API_URL` | `https://api.hr-solx-mobile.com` | Upstream API URL |
| `MCP_API_KEY` | — | API key for MCP endpoint auth |
| `API_TOKEN` | — | Bearer token for upstream API |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `DEBUG` | `mcp:*` | Debug logging filter |

### Setting Variables

```bash
# macOS/Linux
export MCP_SERVER_PORT=3000
export MCP_API_URL=https://api.example.com

# Windows (PowerShell)
$env:MCP_SERVER_PORT = 3000
$env:MCP_API_URL = "https://api.example.com"
```

## Code Patterns

### API Request Helper

Located in `src/client/api-client.ts`:

```typescript
async function makeAPIRequest<T>(
  url: string,
  method: string = 'GET',
  body?: unknown
): Promise<T | null> {
  // Returns typed response or null on error
}
```

### Tool Return Format

All tools return:
```typescript
{
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
}
```

### Error Handling

Tools use `try/catch` with `formatToolError()` helper:

```typescript
try {
  const data = await makeAPIRequest<SomeType>(`${API_URL}/endpoint`);
  if (!data) {
    return { content: [{ type: "text", text: "Descriptive error message." }] };
  }
  return { content: [{ type: "text", text: `Success: ${data}` }] };
} catch (error) {
  return { content: [{ type: "text", text: formatToolError("tool-name", error) }] };
}
```

## Current Architecture

The codebase uses a **modular architecture**:
- **`src/types/`** — TypeScript interfaces and custom error types
- **`src/client/`** — Upstream API client
- **`src/tools/`** — Tool modules organized by domain
- **`src/middleware/`** — Auth and rate limiting middleware
- **`src/index.ts`** — Server entry point, imports and registers all modules

## Recommended Improvements

1. Add pagination parameters to list tools
2. Create automated tests (unit + integration)
3. Add OpenAPI/Swagger documentation
4. Add request validation middleware
5. Implement structured logging (e.g., Pino)
6. Add metrics/monitoring (Prometheus)
7. Support streaming tool responses
8. Add tool caching for reference data
