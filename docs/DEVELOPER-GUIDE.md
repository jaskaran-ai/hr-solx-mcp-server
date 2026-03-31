# Developer Guide

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Server runs at http://localhost:4000/mcp
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
│   ├── index.ts             # Main server (all code here)
│   ├── echo_client.js       # Test client for echo tool
│   └── get_capabilities.ts  # Test client for capabilities
├── package.json
├── tsconfig.json
└── README.md
```

## Adding a New Tool

### Step 1: Define TypeScript Interface

Add interface near other interfaces (~line 139):

```typescript
interface Department {
  id: number;
  name: string;
  description?: string;
}
```

### Step 2: Register the Tool

Add tool registration after existing tools (~line 349):

```typescript
// @ts-ignore
server.tool(
  "get-departments",
  "Get list of departments",
  {},  // Empty object = no parameters
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

### Tool with Parameters

```typescript
// @ts-ignore
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
// @ts-ignore
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

```typescript
async function makeAPIRequest<T>(
  url: string,
  method: string = 'GET',
  body?: any
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

## Current Limitations

- Single file architecture (harder to maintain)
- No authentication
- No pagination support
- Generic error messages
- `@ts-ignore` used throughout (SDK type issues)
- No request validation middleware
- No rate limiting

## Recommended Improvements

1. Split into modules (tools, api-client, types, server)
2. Add authentication middleware
3. Implement proper error handling with context
4. Add pagination parameters to list tools
5. Fix TypeScript issues (remove `@ts-ignore`)
6. Add request logging middleware
7. Implement rate limiting
8. Add input validation beyond Zod schemas
9. Create automated tests
10. Add OpenAPI/Swagger documentation
