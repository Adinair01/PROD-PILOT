/**
 * Wraps an async route handler so any rejected promise is forwarded to the
 * central error middleware instead of crashing the process or hanging the
 * request. Removes the need for a try/catch in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { asyncHandler };
