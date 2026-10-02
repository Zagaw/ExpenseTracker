export function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode = error.statusCode || error.status || 500;
  const message = statusCode >= 500 ? 'Something went wrong.' : error.message;

  if (statusCode >= 500) {
    console.error(error);
  }

  const body = {
    success: false,
    message,
  };

  if (error.errors && typeof error.errors === 'object') {
    body.errors = error.errors;
  }

  res.status(statusCode).json(body);
}
