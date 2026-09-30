import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { loginSchema } from '../validators/auth.validator.js';
import { createUserSchema, updateUserSchema, resetPasswordSchema } from '../validators/user.validator.js';

export const authRouter = Router();

authRouter.post('/auth/login', authRateLimiter, validateBody(loginSchema), AuthController.login);
authRouter.post('/auth/logout', AuthController.logout);
authRouter.get('/auth/me', authMiddleware, AuthController.getMe);

// GET stays optionally-authed (owner dropdowns/filters use it everywhere,
// logged in or not) - the mutating routes below require a real admin
// session, checked inside each controller method.
authRouter.get('/users', optionalAuthMiddleware, AuthController.getUsers);
authRouter.post('/users', authMiddleware, validateBody(createUserSchema), AuthController.createUser);
authRouter.put('/users/:id', authMiddleware, validateBody(updateUserSchema), AuthController.updateUser);
authRouter.put('/users/:id/password', authMiddleware, validateBody(resetPasswordSchema), AuthController.resetPassword);
authRouter.delete('/users/:id', authMiddleware, AuthController.deleteUser);
