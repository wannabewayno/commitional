import type { AxiosError } from "axios";

/**
 * Base class for all AI-related errors
 */
export abstract class AIError extends Error {
  abstract readonly retryable: boolean;
  
  constructor(message: string, public override readonly cause?: Error) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * AI response validation errors
 */
export class ValidationError extends AIError {
  readonly retryable = true;
  
  constructor(message: string, public readonly validationDetails: string, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Network-related errors that should be retried
 */
export class NetworkError extends AIError {
  constructor(message: string, public readonly statusCode: number, public readonly retryable: boolean = true) {
    super(message);
  }
}

/**
 * AI response format/content errors
 */
export class ResponseError extends AIError {
  readonly retryable = true;
}
/**
 * Bad Request Error, for incorrect requests to an API. Not considered retryable
 */
export class BadRequestError extends NetworkError {
  constructor(message: string) {
    super(`Bad Request:\n${message}`, 400, false);
  }
}

/**
 * Authentication/authorization errors
 */
export class AuthError extends NetworkError {
  constructor(message: string) {
    super(`Authentication failed - ${message}`, 401, false);
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends NetworkError {
  constructor(message: string, public readonly retryAfter?: number) {
    super(message, 429);
  }
}

export class NotFoundError extends NetworkError {
  constructor(message?: string) {
    super(`Not found - ${message}`, 404, false);
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends NetworkError {
  constructor(message?: string) {
    super(`Request timeout - ${message}`, 408, true);
  }
}

export function handleNetworkError(error: AxiosError) {
  const message = error.message || 'No error message was provided';

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const status = error.response.status;
    
    if (status === 429) {
      // TODO: Find rate limit remaining from headers
      // const headers = error.response.headers;
      // const headerJSON = (headers as AxiosResponseHeaders).toJSON();
      return new RateLimitError('Rate limit exceeded');
    }
    if (status === 408) return new TimeoutError();
    if (status === 404) return new NotFoundError();
    if ([401, 402, 403, 405].includes(status)) return new AuthError(`Authentication failed with ${status} - ${message}`);
    if ([400].includes(status)) return new BadRequestError(`Bad Request:\n${JSON.stringify(error.response.data, null, 2)}`)
    return new NetworkError(`Server error: ${status} - ${message}`, status);
  }
  
  if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of http.ClientRequest
    return new BadRequestError(`Bad Request:\n${message}`)
  }
  
  // Something happened in setting up the request that triggered an Error
  return new BadRequestError(`Bad Request:\n${message}`)
}