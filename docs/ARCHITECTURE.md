# Architecture

## Overview

This project is a **Model Context Protocol (MCP) server** that acts as a bridge between AI models and a REST API (`api.hr-solx-mobile.com`). It exposes HR-related endpoints as MCP tools that AI clients can discover and invoke.

## System Architecture

```mermaid
graph LR
    AI["AI Client\n(Claude, GPT, etc)"] -->|"POST /mcp\nJSON-RPC 2.0"| Express["Express Server\n(Port 4000)"]
    Express -->|"fetch"| API["HR API\napi.hr-solx-mobile.com"]
    API -->|"JSON Response"| Express
    Express -->|"SSE Stream"| AI

    subgraph "Server Middleware"
        RateLimit["Rate Limiter\nIP-based"]
        Auth["Auth Middleware\nX-API-Key"]
        Express
    end

    subgraph "MCP Components"
        Tools["Tool Registry\n12 tools"]
        Resources["Resources\necho://"]
        Prompts["Prompts\necho template"]
    end

    Express --> Tools
    Express --> Resources
    Express --> Prompts

    classDef ai fill:#e1f5fe,stroke:#01579b
    classDef server fill:#fff3e0,stroke:#e65100
    classDef api fill:#e8f5e9,stroke:#2e7d32
    classDef mcp fill:#f3e5f5,stroke:#6a1b9a
    class AI ai
    class Express,RateLimit,Auth server
    class API api
    class Tools,Resources,Prompts mcp
```

## Components

### 1. Express Server (`src/index.ts`)
- HTTP server handling `/mcp` endpoint
- Supports POST (primary), GET, DELETE methods
- Stateless mode — no session management
- Runs on configurable port (default: 4000)
- Applies middleware chain: rate limiting → authentication → handler

### 2. MCP Server (`@modelcontextprotocol/sdk`)
- Implements Model Context Protocol specification
- Registers tools, resources, and prompts
- Handles JSON-RPC 2.0 message routing
- Uses Streamable HTTP transport

### 3. API Client (`src/client/api-client.ts`)
- Generic HTTP client for upstream API
- Handles GET and POST requests
- Returns typed responses via generics
- Error handling with typed errors (`APIError`, `NetworkError`)
- Supports optional Bearer token authentication

### 4. Tool Registry (`src/tools/`)
- 12 registered tools mapping to API endpoints
- Zod schemas for input validation
- TypeScript interfaces for response types
- Organized by domain: echo, health, reference, users

### 5. Middleware (`src/middleware/`)
- **Authentication** (`auth.ts`) — API key validation via `X-API-Key` header
- **Rate Limiting** (`rate-limit.ts`) — IP-based throttling with configurable limits

## Middleware Chain

```mermaid
graph LR
    Request["HTTP Request"] --> RateLimit["Rate Limit\nCheck IP count"]
    RateLimit -->|Allowed| Auth["Auth Check\nX-API-Key"]
    RateLimit -->|Exceeded| 429["429 Too Many Requests"]
    Auth -->|Valid| Handler["MCP Handler"]
    Auth -->|Invalid| 401["401 Unauthorized"]
    Auth -->|Not Set| Handler
    Handler --> Response["SSE Response"]

    classDef req fill:#e1f5fe,stroke:#01579b
    classDef middleware fill:#fff3e0,stroke:#e65100
    classDef error fill:#ffebee,stroke:#c62828
    classDef success fill:#e8f5e9,stroke:#2e7d32
    class Request req
    class RateLimit,Auth,Handler middleware
    class 429,401 error
    class Response success
```

## Data Flow

```mermaid
sequenceDiagram
    participant AI as AI Client
    participant Express as Express Server
    participant RateLimit as Rate Limiter
    participant Auth as Auth Middleware
    participant MCP as MCP Server
    participant Tool as Tool Handler
    participant APIClient as API Client
    participant HR as HR API

    AI->>Express: POST /mcp (JSON-RPC 2.0)
    Express->>RateLimit: Check IP rate
    RateLimit-->>Express: Allowed
    Express->>Auth: Validate X-API-Key
    Auth-->>Express: Valid
    Express->>MCP: Connect transport
    MCP->>Tool: Route to tool handler
    Tool->>APIClient: makeAPIRequest()
    APIClient->>HR: GET /users
    HR-->>APIClient: JSON response
    APIClient-->>Tool: Typed data
    Tool-->>MCP: Content array
    MCP-->>Express: SSE stream
    Express-->>AI: JSON-RPC response
```

## Key Design Decisions

### Stateless Transport
```typescript
sessionIdGenerator: undefined
```
- No session persistence between requests
- Simpler deployment, no state management
- Each request creates fresh transport

### Modular Architecture
- Code organized by concern: types, client, tools, middleware
- Each tool module exports a registration function
- Easy to add new tools without modifying core server
- Clear separation of concerns for testing and maintenance

### Typed Error Handling
- Custom error classes: `APIError`, `NetworkError`, `ToolError`
- Structured error logging with context
- Descriptive error messages returned to AI clients

## Deployment

### Docker Architecture

```mermaid
graph TD
    subgraph "Stage 1: Build"
        B1["node:20-alpine"] --> B2["npm ci\n(all deps)"]
        B2 --> B3["Copy src/ + tsconfig.json"]
        B3 --> B4["tsc --outDir dist"]
    end

    subgraph "Stage 2: Production"
        P1["node:20-alpine"] --> P2["npm ci --omit=dev"]
        P2 --> P3["Copy dist/ from build"]
        P3 --> P4["Add non-root user"]
        P4 --> P5["EXPOSE 4000 + HEALTHCHECK"]
    end

    B4 -.->|Copy dist/| P3

    classDef build fill:#e3f2fd,stroke:#1565c0
    classDef prod fill:#e8f5e9,stroke:#2e7d32
    class B1,B2,B3,B4 build
    class P1,P2,P3,P4,P5 prod
```

**Production image features:**
- **Base image:** Node 20 Alpine (~180MB final)
- **No dev dependencies:** ts-node, nodemon, typescript excluded
- **Non-root user:** Security best practice
- **Health check:** HTTP check to `/mcp` endpoint
- **Restart policy:** `unless-stopped`

**Development setup:**
- Volume mount: `./src:/app/src` for live editing
- Hot-reload via nodemon (watches `src/` directory)
- Debug logging enabled by default

### Container Orchestration

```mermaid
graph LR
    subgraph "docker-compose.yml (Production)"
        P1["Build target: production"]
        P2["Port: 4000:4000"]
        P3["Env file: .env"]
        P4["Restart: unless-stopped"]
        P5["Health check"]
        P6["Network: mcp-network"]
    end

    subgraph "docker-compose.dev.yml (Development)"
        D1["Build target: build"]
        D2["Port: 4000:4000"]
        D3["Volume: ./src:/app/src"]
        D4["NODE_ENV=development"]
        D5["Command: nodemon --watch src"]
    end

    classDef prod fill:#e8f5e9,stroke:#2e7d32
    classDef dev fill:#fff3e0,stroke:#e65100
    class P1,P2,P3,P4,P5,P6 prod
    class D1,D2,D3,D4,D5 dev
```

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `MCP_SERVER_PORT` | `4000` | Server listening port |
| `MCP_API_URL` | `https://api.hr-solx-mobile.com` | Upstream API base URL |
| `MCP_API_KEY` | — | API key for MCP endpoint auth |
| `API_TOKEN` | — | Bearer token for upstream API |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `DEBUG` | `mcp:*` | Debug logging for MCP SDK |

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | ^1.26.0 | MCP protocol implementation |
| `express` | ^5.2.1 | HTTP server framework |
| `zod` | ^4.3.6 | Schema validation |
| `node-fetch` | ^3.3.2 | HTTP client (fallback) |
| `typescript` | ^5.2.2 | Type checking |
| `ts-node` | ^10.9.2 | Direct TS execution / dev |
| `nodemon` | ^3.1.0 | File watching (dev) |
