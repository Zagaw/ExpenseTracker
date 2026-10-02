import { AppError } from '../utils/AppError.js';
import { verifyAuthToken } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError('Authentication is required.', 401));
    return;
  }

  const token = header.slice('Bearer '.length).trim();

  if (!token) {
    next(new AppError('Authentication is required.', 401));
    return;
  }

  try {
    const decoded = verifyAuthToken(token);

    if (!decoded?.userId || !decoded?.email) {
      next(new AppError('Invalid token.', 401));
      return;
    }

    req.user = {
      userId: String(decoded.userId),
      email: decoded.email,
    };
    next();
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      next(new AppError('Your session has expired. Please log in again.', 401));
      return;
    }

    next(new AppError('Invalid token.', 401));
  }
}
