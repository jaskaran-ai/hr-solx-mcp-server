# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

### Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server with ts-node (port 4000)
npm run dev:watch    # Start with nodemon auto-reload
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled JavaScript from dist/
```

### Environment Setup

Copy `.env.example` to `.env` and configure:
- `MCP_API_KEY` - API key for MCP endpoint authentication
- `API_TOKEN` - Bearer token for upstream HR API access
- `MCP_API_URL` - Upstream API URL (default: https://api.hr-solx-mobile.com)
- `MCP_SERVER_PORT` - Server port (default: 4000)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

## Architecture Overview

### High-Level Flow

```
AI Client → Express Server (/mcp endpoint) → MCP Server → Tool Handler → API Client → HR API
```

The server implements the Model Context Protocol (MCP) Streamable HTTP transport:
- **Express** handles HTTP POST requests to `/mcp`
- **MCP SDK** processes JSON-RPC 2.0 messages
- **Middleware chain**: Rate limiting → Authentication → MCP handler
- Each tool makes typed requests to the upstream HR API

### Code Structure

```
src/
├── index.ts                    # Express app, server setup, /mcp routes
├── client/
│   └── api-client.ts          # Generic typed HTTP client for upstream API
├── tools/
│   ├── echo.ts                # Echo tool, resource, prompt
│   ├── health.ts              # Health check tools
│   ├── reference.ts           # Geographic/reference data tools
│   └── users.ts               # User management tools
├── middleware/
│   ├── auth.ts                # X-API-Key authentication
│   └── rate-limit.ts          # IP-based rate limiting
└── types/
    ├── api.ts                 # TypeScript interfaces for API responses
    └── errors.ts              # Custom error classes
```

### Key Patterns

**Tool Registration Pattern:**
Each tool module exports a `registerXxxTools(server: McpServer)` function that calls `server.tool()` with Zod schema validation.

**API Client Pattern:**
`makeAPIRequest<T>(url, method?, body?)` returns typed data or null on failure. Use this for all upstream API calls.

**Middleware Order:**
Rate limiting is applied before authentication in `src/index.ts` (line 16). Both are optional if environment variables not set.

**Error Handling:**
- Custom errors: `APIError`, `NetworkError`, `ToolError` (see `src/types/errors.ts`)
- MCP responses use JSON-RPC 2.0 error format with appropriate codes
- Return `null` from `makeAPIRequest` on failures, not thrown errors

## Important Files

- `README.md` - Project overview, API docs, usage examples
- `docs/ARCHITECTURE.md` - Detailed architecture diagrams and design decisions
- `docs/DEVELOPER-GUIDE.md` - How to add new tools
- `docs/TOOLS-REFERENCE.md` - Complete tool catalog
- `docs/SECURITY.md` - Security considerations and production checklist

## TypeScript Standards

- ESM modules: Use `.js` extensions in imports (e.g., `import x from "./module.js"`)
- Strict mode enabled
- Use `import type` for TypeScript type-only imports
- Avoid `@ts-ignore` - fix type issues properly
- Interfaces for API types, classes for custom errors

## Development Workflow

1. Make changes to TypeScript files in `src/`
2. Server auto-reloads with `npm run dev:watch` (nodemon watches `src/`)
3. Test with curl examples from README.md or direct MCP client
4. Build with `npm run build` before committing
5. Run `npm start` to verify production build

## Testing Notes

No test framework is currently configured. Consider adding vitest or jest. If adding tests:
- Place tests alongside source files or in `__tests__/` directories
- Test both tool registration and API client functionality
- Mock upstream API responses for integration tests

## Common Tasks

### Adding a New Tool

1. Define Zod schema for input validation
2. Create handler function that uses `makeAPIRequest`
3. Call `server.tool()` in appropriate `registerXxxTools()` function
4. Import and call registration in `src/index.ts`
5. Update `docs/TOOLS-REFERENCE.md` with new tool documentation

### Modifying API Endpoints

All upstream API calls go through `src/client/api-client.ts`. Update `API_URL` constant if base URL changes. Add new helper functions there if needed.

### Environment Variables

All configuration via environment variables (see table above). Auth disabled if `MCP_API_KEY` not set. Bearer token required for upstream API if protected.

## Production Deployment

- Build with `npm run build`
- Run with `npm start` (uses compiled `dist/index.js`)
- Dockerfile available - see docs/ARCHITECTURE.md for multi-stage build details
- Use non-root user in production
- Set all required environment variables
- Configure health check to `/mcp` endpoint

## Security Considerations

- MCP endpoint protected by `X-API-Key` header (optional but recommended)
- Rate limiting applied per IP address
- Bearer token for upstream API stored in environment
- Do not commit `.env` file or any credentials
- Review `docs/SECURITY.md` before production deployment
