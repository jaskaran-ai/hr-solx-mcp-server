export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public originalError: unknown,
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ToolError extends Error {
  constructor(
    message: string,
    public toolName: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ToolError';
  }
}
