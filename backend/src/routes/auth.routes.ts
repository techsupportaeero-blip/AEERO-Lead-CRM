import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { loginSchema } from '../validators/auth.validator.js';

export const authRouter = Router();

authRouter.post('/auth/login', authRateLimiter, validateBody(loginSchema), AuthController.login);
authRouter.post('/auth/logout', AuthController.logout);
authRouter.get('/auth/me', authMiddleware, AuthController.getMe);
authRouter.get('/users', optionalAuthMiddleware, AuthController.getUsers);
