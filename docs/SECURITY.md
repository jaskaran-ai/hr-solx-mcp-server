# Security Considerations

## Current Security Posture

**This server has NO authentication or authorization.** Anyone who can reach the server can:

- Discover all available tools
- Invoke any tool with arbitrary parameters
- Access all upstream API endpoints
- Potentially create/modify data via POST tools

## Vulnerabilities

### 1. Open MCP Endpoint
- **Risk**: High
- **Location**: `src/index.ts:53-82`
- **Issue**: No authentication middleware on `/mcp` route
- **Impact**: Unauthorized tool execution

### 2. Unprotected API Calls
- **Risk**: High
- **Location**: `src/index.ts:118-137`
- **Issue**: No auth headers sent to upstream API
- **Impact**: API calls made without credentials

```typescript
const headers = {
  "Content-Type": "application/json",
  // Missing: Authorization header
};
```

### 3. No Rate Limiting
- **Risk**: Medium
- **Issue**: No request throttling
- **Impact**: Potential DoS or API abuse

### 4. No Input Sanitization
- **Risk**: Medium
- **Issue**: Zod validates types but not malicious content
- **Impact**: Potential injection attacks

### 5. Verbose Error Messages
- **Risk**: Low
- **Location**: `src/index.ts:56`
- **Issue**: Request bodies logged to console
- **Impact**: Sensitive data in logs

```typescript
console.log('Received request:', JSON.stringify(req.body, null, 2));
```

## Recommended Fixes

### 1. Add API Key Authentication

```typescript
import type { Request, Response, NextFunction } from "express";

function authenticate(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.MCP_API_KEY) {
    return res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Unauthorized' },
      id: null,
    });
  }
  
  next();
}

app.post('/mcp', authenticate, async (req: Request, res: Response) => {
  // ... existing code
});
```

### 2. Add Upstream API Authentication

```typescript
async function makeAPIRequest<T>(url: string, method: string = 'GET', body?: any): Promise<T | null> {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.API_TOKEN}`,
  };
  // ... rest of function
}
```

### 3. Add Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Too many requests' },
    id: null,
  },
});

app.use('/mcp', limiter);
```

### 4. Sanitize Logs

```typescript
// Remove sensitive data from logs
function sanitizeLog(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  const sanitized = { ...obj as Record<string, unknown> };
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.apiKey;
  return sanitized;
}

console.log('Received request:', JSON.stringify(sanitizeLog(req.body), null, 2));
```

### 5. Add Request Validation

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

- [ ] Add API key authentication
- [ ] Add upstream API credentials
- [ ] Enable rate limiting
- [ ] Sanitize log output
- [ ] Validate all incoming requests
- [ ] Use HTTPS in production
- [ ] Set secure CORS headers
- [ ] Add request timeout handling
- [ ] Implement proper error handling
- [ ] Add monitoring and alerting
- [ ] Rotate API keys regularly
- [ ] Audit tool permissions
