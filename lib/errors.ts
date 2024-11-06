export class HttpError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;

    // Set the prototype explicitly to ensure compatibility in some environments
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}