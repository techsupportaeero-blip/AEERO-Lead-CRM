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
      // includeInactive (the Users Management page, showing deactivated
      // accounts too) is admin-only - every other caller of this endpoint
      // (owner dropdowns, filters) silently keeps getting active users only.
      const wantsInactive = req.query.includeInactive === 'true' && req.user?.role === 'ADMIN';
      const users = await AuthService.getUsers(wantsInactive);
      res.json(users);
    } catch (err) {
      next(err);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Access Denied: Only administrators can create users.' });
        return;
      }
      const user = await AuthService.createUser(req.body);
      res.status(201).json(user);
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        res.status(409).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Access Denied: Only administrators can edit users.' });
        return;
      }
      const targetId = parseInt(req.params.id, 10);
      // Deactivating your own account would lock you out with no other
      // admin able to log back in and undo it - block it server-side too,
      // not just the disabled button in the UI.
      if (req.body.isActive === false && targetId === req.user.userId) {
        res.status(400).json({ success: false, error: "You can't deactivate your own account." });
        return;
      }
      const user = await AuthService.updateUser(targetId, req.body);
      res.json(user);
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        res.status(409).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Access Denied: Only administrators can reset passwords.' });
        return;
      }
      const user = await AuthService.resetPassword(parseInt(req.params.id, 10), req.body.password);
      res.json({ success: true, message: `Password reset for ${user.name}.` });
    } catch (err) {
      next(err);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Access Denied: Only administrators can delete users.' });
        return;
      }
      const targetId = parseInt(req.params.id, 10);
      // Same reasoning as the self-deactivate guard: deleting your own
      // account could leave nobody able to log in and undo it.
      if (targetId === req.user.userId) {
        res.status(400).json({ success: false, error: "You can't delete your own account." });
        return;
      }
      const user = await AuthService.deleteUser(targetId);
      res.json({ success: true, message: `"${user.name}" was permanently deleted.` });
    } catch (err) {
      next(err);
    }
  }
}
