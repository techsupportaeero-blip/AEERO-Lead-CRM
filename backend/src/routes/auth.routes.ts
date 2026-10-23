import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { loginSchema } from '../validators/auth.validator.js';
import { createUserSchema, updateUserSchema, resetPasswordSchema } from '../validators/user.validator.js';

export const authRouter = Router();

authRouter.post('/auth/login', authRateLimiter, validateBody(loginSchema), AuthController.login);
authRouter.post('/auth/logout', AuthController.logout);
authRouter.get('/auth/me', authMiddleware, AuthController.getMe);

// Full name/username/email/phone/role roster - must require login, not be
// readable by anyone on the internet just because the logged-in app's owner
// dropdowns happen to use it too.
authRouter.get('/users', authMiddleware, AuthController.getUsers);
authRouter.post('/users', authMiddleware, validateBody(createUserSchema), AuthController.createUser);
authRouter.put('/users/:id', authMiddleware, validateBody(updateUserSchema), AuthController.updateUser);
authRouter.put('/users/:id/password', authMiddleware, validateBody(resetPasswordSchema), AuthController.resetPassword);
authRouter.delete('/users/:id', authMiddleware, AuthController.deleteUser);
