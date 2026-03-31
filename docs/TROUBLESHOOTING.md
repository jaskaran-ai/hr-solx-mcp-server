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

### TypeScript Issues

#### `@ts-ignore` Warnings

**Cause:** SDK type definitions don't match usage

**Current State:** All tool registrations use `@ts-ignore`

**Impact:** Code works but loses type safety

**Potential Fix:** Update SDK or adjust tool registration to match types

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
| 404 | Not Found | Verify endpoint is `/mcp` |
| 405 | Method Not Allowed | Use POST method |
| 500 | Internal Server Error | Check server logs |

## Testing Checklist

- [ ] Server starts without errors
- [ ] `curl http://localhost:4000/mcp` returns 405
- [ ] Test clients work (`echo_client.js`, `get_capabilities.ts`)
- [ ] Tools return expected data
- [ ] Error handling works for invalid requests
- [ ] Upstream API is accessible

## Getting Help

1. Check server console output for errors
2. Verify environment variables are set correctly
3. Test upstream API directly with curl
4. Review this troubleshooting guide
5. Check MCP SDK documentation
