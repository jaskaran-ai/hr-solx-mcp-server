# AGENTS.md

## Project Overview

Model Context Protocol (MCP) server built with Express.js and TypeScript. Implements the MCP Streamable HTTP transport for AI tool interactions.

## Commands

### Development
```bash
npm run dev          # Start with ts-node loader
npm run dev:watch    # Start with nodemon auto-reload
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled dist/index.js
```

### Testing & Linting
No test framework or linter is currently configured. Consider adding:
- `vitest` or `jest` for testing
- `eslint` for linting
- `prettier` for formatting

## Code Style

### Imports
- Use `.js` extensions for local imports (ESM requirement): `import { x } from "./module.js"`
- Group imports: external packages first, then local imports
- Use `type` imports for TypeScript types: `import type { Request } from "express"`

### TypeScript
- `strict: true` enabled in tsconfig.json
- Target: ES2017, Module: ESNext, ModuleResolution: bundler
- Path alias: `@/*` maps to `./src/*`
- Avoid `@ts-ignore` comments; fix type issues properly
- Use interfaces for API types, classes for custom errors

### Naming Conventions
- Files: kebab-case (`api-client.ts`, `rate-limit.ts`)
- Functions: camelCase (`registerEchoCapabilities`, `makeAPIRequest`)
- Types/Interfaces: PascalCase (`HealthCheckResponse`, `APIError`)
- Constants: UPPER_SNAKE_CASE (`API_URL`, `WINDOW_MS`)

### Error Handling
- Custom error classes in `src/types/errors.ts` (APIError, NetworkError, ToolError)
- MCP JSON-RPC error format for API responses:
  ```typescript
  { jsonrpc: "2.0", error: { code: -32603, message: "..." }, id: null }
  ```
- Use try/catch with console.error for logging
- Return null on API failures rather than throwing

### Architecture
```
src/
├── index.ts           # Express app, MCP server setup, routes
├── tools/             # MCP tool registrations (echo, health, users, reference)
├── middleware/        # Express middleware (auth, rate-limit)
├── client/            # External API client
└── types/             # TypeScript types and error classes
```

### Patterns
- Tool registration: `registerXxxTools(server: McpServer)` functions
- Zod for input validation schemas
- Environment variables for configuration (port, API keys, URLs)
- JSON-RPC 2.0 response format for all MCP communications

### Environment Variables
- `MCP_SERVER_PORT` - Server port (default: 4000)
- `MCP_API_KEY` - Authentication key
- `MCP_API_URL` - Upstream API URL
- `RATE_LIMIT_WINDOW_MS` - Rate limit window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window
