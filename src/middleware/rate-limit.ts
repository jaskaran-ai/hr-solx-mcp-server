import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10);
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10);

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  
  let entry = rateLimitStore.get(ip);
  
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    rateLimitStore.set(ip, entry);
  } else {
    entry.count++;
  }
  
  const remaining = Math.max(0, MAX_REQUESTS - entry.count);
  const resetTime = Math.ceil(entry.resetAt / 1000);
  
  res.set("X-RateLimit-Limit", String(MAX_REQUESTS));
  res.set("X-RateLimit-Remaining", String(remaining));
  res.set("X-RateLimit-Reset", String(resetTime));
  
  if (entry.count > MAX_REQUESTS) {
    res.status(429).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: `Too many requests. Limit: ${MAX_REQUESTS} per ${WINDOW_MS / 1000}s window.`,
      },
      id: null,
    });
    return;
  }
  
  next();
}

export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupRateLimitStore, WINDOW_MS);
