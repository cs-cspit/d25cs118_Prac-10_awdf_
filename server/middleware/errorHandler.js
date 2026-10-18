// Error Handler Middleware
// Registered last so it can catch errors from every earlier middleware and route.
// The 4th parameter (next) is required: Express identifies error-handling
// middleware by its arity, so it must be declared even though it is unused.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Full stack is logged on the server only - never sent to the client.
  console.error(err.stack);

  const status = err.status || 500;

  // Client errors (4xx) carry a useful message; server faults (5xx) stay generic
  // so internal details are not exposed to the client.
  const message = status >= 500 ? 'Something went wrong' : err.message;

  res.status(status).json({
    error: message,
    status: status
  });
};

export default errorHandler;
