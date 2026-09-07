import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);

      // Set HTTP-only cookie
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        success: true,
        message: 'Login successful',
        user: result.user,
        token: result.token
      });
    } catch (err: any) {
      if (err.message.includes('Invalid username or password') || err.message.includes('deactivated')) {
        res.status(401).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
  }

  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const user = await AuthService.getMe(req.user.userId);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await AuthService.getUsers();
      res.json(users);
    } catch (err) {
      next(err);
    }
  }
}
