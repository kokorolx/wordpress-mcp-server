export class MCPError extends Error {
  public code: string;
  public details?: any;
  constructor(code: string, message: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, MCPError.prototype);
  }
}

export const formatError = (err: unknown) => {
  if (err instanceof MCPError) {
    return {code: err.code, message: err.message, details: err.details};
  }
  if (err instanceof Error) {
    return {code: 'unknown_error', message: err.message};
  }
  return {code: 'unknown_error', message: 'An unknown error occurred'};
};
