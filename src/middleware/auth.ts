import type { Request, Response, NextFunction } from "express";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedKey = process.env.MCP_API_KEY;

  if (!expectedKey) {
    console.warn('MCP_API_KEY not set - authentication disabled');
    return next();
  }

  if (!apiKey || apiKey !== expectedKey) {
    res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Unauthorized: valid API key required in X-API-Key header' },
      id: null,
    });
    return;
  }

  next();
}
