# AGENTS.md

## Project Overview
This repository contains a Model Context Protocol (MCP) server built with **Express.js** and **TypeScript**. It implements the MCP **Streamable HTTP transport**, allowing AI models (like Claude or GPT) to interact with HR Solx API endpoints as tools.

## Setup & Environment
- **Node Version**: >= 18.0.0
- **Environment**: Copy `.env.example` to `.env` and configure:
  - `MCP_API_URL`: Upstream HR API URL.
  - `MCP_API_KEY`: Key to protect the `/mcp` endpoint.
  - `API_TOKEN`: Bearer token for upstream API authentication.

## Commands

### Development & Build
```bash
npm install          # Install dependencies
npm run dev          # Start server with ts-node (auto-reloads via nodemon)
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled server from dist/
```

### Testing & Linting
Currently, no test framework or linter is configured. **Recommended additions**:
- **Testing**: `vitest` or `jest`.
- **Linting**: `eslint` with TypeScript support.
- **Formatting**: `prettier`.

**Running a single test (Recommended pattern)**:
If `vitest` is added, use: `npx vitest src/tools/users.test.ts`

## Directory Structure
- `src/index.ts`: Entry point. Express app setup, middleware, and MCP server initialization.
- `src/tools/`: Tool registration modules (e.g., `users.ts`, `health.ts`).
- `src/middleware/`: Express middleware for auth and rate limiting.
- `src/client/`: Upstream API client (`api-client.ts`).
- `src/types/`: TypeScript interfaces and custom error classes.
- `docs/`: Comprehensive documentation for architecture, protocol, and tools.

## Code Style & Conventions

### 1. TypeScript & ESM
- **Strict Mode**: `strict: true` is enabled in `tsconfig.json`.
- **ESM Imports**: You **MUST** use `.js` extensions for local imports (e.g., `import { x } from "./utils.js"`). This is a Node.js ESM requirement.
- **Path Aliases**: Use `@/*` for absolute-like paths mapping to `./src/*`.
- **Type Imports**: Prefer `import type { ... }` for TypeScript-only entities.

### 2. Naming Conventions
- **Files**: `kebab-case.ts` (e.g., `api-client.ts`, `user-management.ts`).
- **Functions**: `camelCase` (e.g., `registerUserTools`, `makeAPIRequest`).
- **Interfaces/Types**: `PascalCase` (e.g., `UserResponse`, `ToolConfig`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_PORT`, `API_RETRY_LIMIT`).

### 3. Tool Registration Pattern
Tools should be modularized in `src/tools/` and registered using a standard function:
```typescript
export function registerExampleTools(server: McpServer) {
  server.tool(
    "tool-name",
    "Description of what the tool does",
    { param: z.string().describe("Param description") },
    async ({ param }) => {
      // Implementation
      return { content: [{ type: "text", text: "Result" }] };
    }
  );
}
```
*Note: Use `zod` for input schema validation.*

### 4. Error Handling
- Use custom error classes from `src/types/errors.ts`: `APIError`, `NetworkError`, `ToolError`.
- MCP responses should follow the JSON-RPC 2.0 error format:
  ```typescript
  { 
    jsonrpc: "2.0", 
    error: { code: -32603, message: "Contextual message" }, 
    id: null 
  }
  ```
- Catch errors at the top-level route in `index.ts` to prevent server crashes.
- Prefer returning `null` or a descriptive error object from low-level clients rather than throwing, unless it's an unrecoverable state.

### 5. API Client
- Always use `src/client/api-client.ts` for upstream requests.
- Pass generic types to `makeAPIRequest<T>` to ensure type safety for responses.

## Best Practices for AI Agents

1. **Self-Correction**: If a tool call fails, check the logs (the server uses `DEBUG=mcp:*`).
2. **Security**: NEVER commit `.env` files or hardcode secrets. Use the provided environment variable pattern.
3. **Documentation**: When adding a new tool, update `docs/TOOLS-REFERENCE.md` and the `README.md` catalog.
4. **Validation**: Always use Zod schemas for tool inputs to provide clear feedback to the calling model.
5. **State Management**: The server is designed to be stateless. Avoid using global variables to store request-specific data.

## Cursor & Copilot Rules
No specific `.cursorrules` or `.github/copilot-instructions.md` are defined for this project. Follow the general standards outlined above.
