import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  logger.error('Unhandled API error:', err);

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const details = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    sendError(res, 400, 'VALIDATION_ERROR', details[0]?.message || 'Validation failed', details);
    return;
  }

  // 2. Prisma Known Request Error
  if (err && typeof err === 'object' && 'code' in err) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
      sendError(res, 409, 'DUPLICATE_RECORD', `A record with this unique ${target} already exists.`, { target });
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 404, 'NOT_FOUND', 'The requested database record was not found.');
      return;
    }
    if (err.code === 'P2003') {
      sendError(res, 400, 'FOREIGN_KEY_VIOLATION', 'Referenced related record does not exist.');
      return;
    }
  }

  // 3. Syntax / JSON Parse Error
  if (err instanceof SyntaxError && 'body' in err) {
    sendError(res, 400, 'INVALID_JSON', 'Malformed JSON in request payload.');
    return;
  }

  // 4. Generic error
  const errorMessage = err instanceof Error ? err.message : typeof err === 'string' ? err : 'An unexpected server error occurred.';
  const isDev = env.NODE_ENV === 'development';

  sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    isDev ? errorMessage : 'Internal Server Error. Please contact CRM administrator.',
    isDev && err instanceof Error ? { stack: err.stack } : undefined
  );
}
