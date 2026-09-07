import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/response.js';

export function validateBody(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        const primaryMessage = details[0]?.message || 'Validation failed';
        sendError(res, 400, 'VALIDATION_ERROR', primaryMessage, details);
        return;
      }
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request body format.');
    }
  };
}

export function validateQuery(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        sendError(res, 400, 'QUERY_VALIDATION_ERROR', details[0]?.message || 'Invalid query parameters', details);
        return;
      }
      sendError(res, 400, 'QUERY_VALIDATION_ERROR', 'Invalid query parameters.');
    }
  };
}
