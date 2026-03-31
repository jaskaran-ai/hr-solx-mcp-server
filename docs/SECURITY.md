# Security Considerations

## Current Security Posture

This server implements multiple layers of security:

- **API Key Authentication** — Protects the MCP endpoint via `X-API-Key` header
- **Upstream API Authentication** — Bearer token for HR API calls
- **Rate Limiting** — IP-based request throttling
- **Typed Error Handling** — Controlled error messages without leaking internals
- **Container Security** — Non-root user, minimal base image, no dev dependencies in production

## Security Features

### 1. API Key Authentication
- **Location**: `src/middleware/auth.ts`
- **Mechanism**: Validates `X-API-Key` header against `MCP_API_KEY` env var
- **Behavior**: Returns JSON-RPC 401 error for invalid/missing keys
- **Graceful fallback**: Passes through when `MCP_API_KEY` is not set (dev mode)

### 2. Upstream API Authentication
- **Location**: `src/client/api-client.ts`
- **Mechanism**: Adds `Authorization: Bearer <token>` header when `API_TOKEN` is set
- **Impact**: All upstream API calls are authenticated

### 3. Rate Limiting
- **Location**: `src/middleware/rate-limit.ts`
- **Mechanism**: In-memory IP-based counter with configurable window
- **Default**: 100 requests per 15 minutes
- **Headers**: Returns `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Response**: JSON-RPC 429 error when limit exceeded

### 4. Container Security
- **Non-root user**: Production image runs as `nodejs:1001`
- **Minimal base**: Alpine Linux reduces attack surface (~180MB final image)
- **No dev dependencies**: Production image excludes ts-node, nodemon, typescript
- **Multi-stage build**: Source code and build tools not present in final image
- **Health check**: Automatic container health monitoring

## Remaining Vulnerabilities

### 1. No Input Sanitization
- **Risk**: Medium
- **Issue**: Zod validates types but not malicious content
- **Impact**: Potential injection attacks
- **Mitigation**: Add input validation middleware

### 2. Verbose Request Logging
- **Risk**: Low
- **Location**: `src/index.ts`
- **Issue**: Request bodies logged to console
- **Impact**: Sensitive data in logs
- **Mitigation**: Sanitize logs before output

### 3. In-Memory Rate Limit Store
- **Risk**: Low
- **Issue**: Rate limits reset on container restart
- **Impact**: Temporary bypass on restart
- **Mitigation**: Use Redis for distributed rate limiting

## Environment Variables for Security

```bash
# Required in production
MCP_API_KEY=your-secret-key-here
API_TOKEN=upstream-api-token-here
NODE_ENV=production

# Optional
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Production Checklist

- [x] API key authentication implemented
- [x] Upstream API credentials support
- [x] Rate limiting enabled
- [ ] Sanitize log output
- [ ] Validate all incoming requests with JSON-RPC schema
- [x] Use non-root user in Docker
- [ ] Use HTTPS in production (reverse proxy)
- [ ] Set secure CORS headers
- [ ] Add request timeout handling
- [x] Implement proper error handling
- [ ] Add monitoring and alerting
- [ ] Rotate API keys regularly
- [ ] Audit tool permissions
- [ ] Add request ID tracing
- [ ] Implement audit logging

## Recommended Improvements

### 1. Sanitize Logs

```typescript
function sanitizeLog(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  const sanitized = { ...obj as Record<string, unknown> };
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.apiKey;
  return sanitized;
}
```

### 2. Add Request Validation

```typescript
import { z } from "zod";

const jsonRpcSchema = z.object({
  jsonrpc: z.literal("2.0"),
  method: z.string(),
  params: z.record(z.unknown()).optional(),
  id: z.union([z.string(), z.number(), z.null()]),
});

app.post('/mcp', async (req: Request, res: Response) => {
  const validation = jsonRpcSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid Request' },
      id: null,
    });
  }
  // ... continue with valid request
});
```

### 3. Add HTTPS via Reverse Proxy

Use nginx or Caddy as a reverse proxy:

```nginx
server {
    listen 443 ssl;
    server_name mcp.example.com;

    location /mcp {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Distributed Rate Limiting

For multi-instance deployments, use Redis:

```bash
npm install express-rate-limit rate-limit-redis
```
