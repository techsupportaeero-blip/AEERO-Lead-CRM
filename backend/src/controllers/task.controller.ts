import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service.js';

export class TaskController {
  static async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tasks = await TaskService.getTasks(req.query);
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  }

  static async addTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createdBy = req.user?.name || req.body.createdBy || 'Counselor';
      const task = await TaskService.addTask(req.body, createdBy);
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }

  static async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.taskId || req.params.id, 10);
      const updated = await TaskService.updateTask(id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.taskId || req.params.id, 10);
      await TaskService.deleteTask(id);
      res.json({ message: 'Task deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
