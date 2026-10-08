/**
 * Global Error Handler Middleware
 * Resilient against client disconnects, malformed payloads, and database connection timeouts
 */
const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to standard Express handler to prevent ERR_HTTP_HEADERS_SENT crash
  if (res.headersSent) {
    return next(err);
  }

  // 1. JSON Syntax Error (malformed payload from client)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Malformed JSON payload in request body.',
    });
  }

  // 2. Payload size exceeded
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      error: 'Request payload exceeds allowable size limit.',
    });
  }

  // 3. Client connection aborted mid-request (e.g. user closed tab or refreshed)
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
    console.warn(`[Client Abort] Connection terminated prematurely by client for ${req.method} ${req.originalUrl}`);
    return;
  }

  // 4. CORS origin error
  if (err.message && err.message.includes('CORS origin')) {
    return res.status(403).json({
      error: err.message,
    });
  }

  // Log unexpected errors
  console.error(`[Error Handler] ${req.method} ${req.originalUrl}:`, err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
