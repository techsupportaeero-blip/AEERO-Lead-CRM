import { Router } from 'express';
import { TaskController } from '../controllers/task.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createTaskSchema, updateTaskSchema } from '../validators/task.validator.js';

export const taskRouter = Router();

taskRouter.get('/tasks', authMiddleware, TaskController.getTasks);
taskRouter.post('/tasks', authMiddleware, validateBody(createTaskSchema), TaskController.addTask);
taskRouter.put('/tasks/:taskId', authMiddleware, validateBody(updateTaskSchema), TaskController.updateTask);
taskRouter.delete('/tasks/:taskId', authMiddleware, TaskController.deleteTask);
