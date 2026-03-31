# Troubleshooting

## Common Issues

### Server Won't Start

#### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solution:**
```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or use a different port
MCP_SERVER_PORT=4001 npm run dev
```

#### Missing Dependencies
```
Error: Cannot find module '@modelcontextprotocol/sdk'
```

**Solution:**
```bash
npm install
```

#### TypeScript Errors
```
Error: Cannot find module 'express' or its corresponding type declarations.
```

**Solution:**
```bash
npm install
```

### Tool Calls Fail

#### "Failed to retrieve..." Messages

**Causes:**
1. Upstream API is down
2. Network connectivity issues
3. Incorrect API URL
4. Missing API token (if upstream requires auth)

**Debug Steps:**
```bash
# Test upstream API directly
curl https://api.hr-solx-mobile.com/health

# Check API URL configuration
echo $MCP_API_URL

# Test with explicit URL
MCP_API_URL=https://api.hr-solx-mobile.com npm run dev
```

#### Tools Return Empty Results

**Cause:** API returns empty array or null

**Solution:** Check API response directly and verify data exists

### Authentication Issues

#### 401 Unauthorized Responses

**Cause:** `MCP_API_KEY` is set but client isn't sending `X-API-Key` header

**Solution:**
```bash
# Include API key in requests
curl -X POST http://localhost:4000/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

#### Upstream API 401 Errors

**Cause:** `API_TOKEN` not set or invalid

**Solution:** Set valid token in `.env`:
```bash
API_TOKEN=your-valid-bearer-token
```

### Connection Issues

#### Client Gets No Response

**Causes:**
1. Server not running
2. Wrong endpoint
3. CORS issues (if calling from browser)

**Debug Steps:**
```bash
# Check if server is running
curl http://localhost:4000/mcp

# Should return 405 Method Not Allowed (GET not supported)
# If connection refused, server is not running
```

#### SSE Parsing Errors

**Symptom:** Client can't parse response

**Cause:** SSE format varies, clients may expect different parsing

**Solution:** Use the test clients provided:
```bash
node src/echo_client.js
npx ts-node src/get_capabilities.ts
```

### Rate Limiting Issues

#### 429 Too Many Requests

**Cause:** Exceeded `RATE_LIMIT_MAX_REQUESTS` within `RATE_LIMIT_WINDOW_MS`

**Solution:**
- Wait for the window to reset (check `X-RateLimit-Reset` header)
- Increase limits via environment variables:
  ```bash
  RATE_LIMIT_MAX_REQUESTS=200
  RATE_LIMIT_WINDOW_MS=1800000
  ```

### Debug Logging

#### Enable Verbose Logging

Already enabled in code:
```typescript
process.env.DEBUG = "mcp:*";
```

#### View Debug Output

```bash
# Run with debug output visible
DEBUG=mcp:* npm run dev
```

#### Disable Debug Logging

```bash
# Comment out or remove this line in index.ts
// process.env.DEBUG = "mcp:*";
```

## Docker Issues

### Container Won't Start

**Causes:**
1. Missing `.env` file
2. Port 4000 already in use on host
3. Invalid environment variables

**Solution:**
```bash
# Ensure .env exists
cp .env.example .env

# Check port availability
lsof -i :4000

# View container logs
docker compose logs mcp-server
```

### Health Check Failing

**Causes:**
1. Upstream API unreachable from container
2. Server crashed on startup
3. Wrong `MCP_API_URL`

**Solution:**
```bash
# Check container health
docker compose ps

# View detailed health status
docker inspect hr-solx-mcp-server | grep -A 10 Health

# Test from inside container
docker compose exec mcp-server wget -qO- http://localhost:4000/mcp

# Verify upstream API from container
docker compose exec mcp-server wget -qO- https://api.hr-solx-mobile.com/health
```

### Hot-Reload Not Working (Dev)

**Causes:**
1. Volume mount not working
2. Nodemon not detecting changes
3. File permissions issue

**Solution:**
```bash
# Verify volume mount
docker compose -f docker-compose.dev.yml exec mcp-server ls -la /app/src

# Check nodemon is running
docker compose -f docker-compose.dev.yml logs | grep nodemon

# Restart dev container
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up --build
```

### Rebuild After Dependency Changes

```bash
# Rebuild image after package.json changes
docker compose up -d --build

# Or force rebuild without cache
docker compose build --no-cache
docker compose up -d
```

## Error Messages

### JSON-RPC Errors

| Error | Code | Meaning | Solution |
|-------|------|---------|----------|
| Parse error | -32700 | Invalid JSON | Check request body format |
| Invalid Request | -32600 | Missing fields | Include jsonrpc, method, id |
| Method not found | -32601 | Unknown method | Use valid MCP method name |
| Invalid params | -32602 | Wrong parameters | Check tool parameter schema |
| Internal error | -32603 | Server error | Check server logs |
| Method not allowed | -32000 | Wrong HTTP method | Use POST, not GET |

### HTTP Errors

| Status | Meaning | Solution |
|--------|---------|----------|
| 400 | Bad Request | Check JSON-RPC format |
| 401 | Unauthorized | Include X-API-Key header |
| 404 | Not Found | Verify endpoint is `/mcp` |
| 405 | Method Not Allowed | Use POST method |
| 429 | Too Many Requests | Wait or increase rate limit |
| 500 | Internal Server Error | Check server logs |

## Testing Checklist

- [ ] Server starts without errors
- [ ] `curl http://localhost:4000/mcp` returns 405
- [ ] Test clients work (`echo_client.js`, `get_capabilities.ts`)
- [ ] Tools return expected data
- [ ] Error handling works for invalid requests
- [ ] Upstream API is accessible
- [ ] Authentication works (if MCP_API_KEY set)
- [ ] Rate limiting headers present in responses

## Getting Help

1. Check server console output for errors
2. Verify environment variables are set correctly
3. Test upstream API directly with curl
4. Review this troubleshooting guide
5. Check MCP SDK documentation
