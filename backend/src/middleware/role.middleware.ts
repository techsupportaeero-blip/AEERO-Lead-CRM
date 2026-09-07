import { Request, Response, NextFunction } from 'express';
import { Role } from '../types/index.js';
import { sendError } from '../utils/response.js';

/**
 * Enforces role-based access control (RBAC).
 * Returns 403 Forbidden if user's role is not within the allowed roles.
 */
export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        403,
        'FORBIDDEN',
        `Access denied. Role '${req.user.role}' is not authorized to perform this action.`
      );
      return;
    }

    next();
  };
}
