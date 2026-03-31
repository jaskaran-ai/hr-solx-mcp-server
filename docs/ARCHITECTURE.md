# Architecture

## Overview

This project is a **Model Context Protocol (MCP) server** that acts as a bridge between AI models and a REST API (`api.hr-solx-mobile.com`). It exposes HR-related endpoints as MCP tools that AI clients can discover and invoke.

## System Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│  AI Client  │ ─POST─▶ │  Express Server  │ ─fetch─▶ │  Upstream HR API    │
│  (Claude,   │  /mcp   │  (MCP Protocol)  │         │  api.hr-solx.com    │
│   GPT, etc) │ ◀────── │                  │ ◀────── │                     │
└─────────────┘   SSE   └──────────────────┘   JSON  └─────────────────────┘
```

## Components

### 1. Express Server (`src/index.ts`)
- HTTP server handling `/mcp` endpoint
- Supports POST (primary), GET, DELETE methods
- Stateless mode — no session management
- Runs on configurable port (default: 4000)

### 2. MCP Server (`@modelcontextprotocol/sdk`)
- Implements Model Context Protocol specification
- Registers tools, resources, and prompts
- Handles JSON-RPC 2.0 message routing
- Uses Streamable HTTP transport

### 3. API Client (`makeAPIRequest`)
- Generic HTTP client for upstream API
- Handles GET and POST requests
- Returns typed responses via generics
- Error handling with null fallback

### 4. Tool Registry
- 12 registered tools mapping to API endpoints
- Zod schemas for input validation
- TypeScript interfaces for response types

## Data Flow

1. AI client sends JSON-RPC 2.0 POST to `/mcp`
2. Express parses JSON body
3. New `StreamableHTTPServerTransport` created per request
4. MCP server routes to appropriate tool handler
5. Tool calls upstream API via `makeAPIRequest()`
6. Response formatted as MCP content array
7. Transport streams SSE response back to client

## Key Design Decisions

### Stateless Transport
```typescript
sessionIdGenerator: undefined
```
- No session persistence between requests
- Simpler deployment, no state management
- Each request creates fresh transport

### Single File Architecture
- All code in `src/index.ts` (350+ lines)
- Quick to understand, harder to maintain
- Opportunity for refactoring into modules

### Generic Error Handling
- All API failures return `null`
- Tools return generic "Failed to retrieve..." messages
- No detailed error context passed to clients

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `MCP_SERVER_PORT` | `4000` | Server listening port |
| `MCP_API_URL` | `https://api.hr-solx-mobile.com` | Upstream API base URL |
| `DEBUG` | `mcp:*` | Debug logging for MCP SDK |

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | ^1.26.0 | MCP protocol implementation |
| `express` | ^5.2.1 | HTTP server framework |
| `zod` | ^4.3.6 | Schema validation |
| `node-fetch` | ^3.3.2 | HTTP client (fallback) |
| `typescript` | ^5.2.2 | Type checking |
| `ts-node` | ^10.9.2 | Direct TS execution |
