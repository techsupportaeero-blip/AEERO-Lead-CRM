import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      cookies?: Record<string, any>;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    // If no token provided in request
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication token required. Please login.');
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    sendError(res, 401, 'INVALID_TOKEN', 'Session expired or invalid token. Please log in again.');
    return;
  }

  req.user = payload;
  next();
}

/**
 * Optional auth middleware that sets req.user if a valid token exists,
 * but allows the request to continue even if no token is provided.
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}
