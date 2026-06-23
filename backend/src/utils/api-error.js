/**
 * Operational error with an HTTP status code.
 *
 * Errors created via ApiError are "expected" (bad input, not found, auth
 * failures) and their messages are safe to return to clients. Any other thrown
 * value is treated as an unexpected fault and surfaced as a generic 500.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = "Bad request") {
    return new ApiError(400, message);
  }
  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }
  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }
  static notFound(message = "Not found") {
    return new ApiError(404, message);
  }
  static conflict(message = "Conflict") {
    return new ApiError(409, message);
  }
  static badGateway(message = "Upstream service unavailable") {
    return new ApiError(502, message);
  }
}

module.exports = { ApiError };
