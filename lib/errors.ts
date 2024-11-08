export interface RateLimit {
  short: {
    usage: number,
    limit: number,
    readUsage: number,
    readLimit: number,
  },
  long: {
    usage: number,
    limit: number,
    readUsage: number,
    readLimit: number,
  }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public rateLimit?: RateLimit
  ) {
    super(message);
    this.name = 'HttpError';
  }
}