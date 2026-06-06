// Wraps an async route handler so rejected promises are forwarded to Express's
// error handler instead of becoming unhandled rejections (Express 4 doesn't do
// this automatically).
export const h = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
