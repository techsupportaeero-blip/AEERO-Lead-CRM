import { Router } from 'express';
import { TaskController } from '../controllers/task.controller.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createTaskSchema, updateTaskSchema } from '../validators/task.validator.js';

export const taskRouter = Router();

taskRouter.get('/tasks', optionalAuthMiddleware, TaskController.getTasks);
taskRouter.post('/tasks', optionalAuthMiddleware, validateBody(createTaskSchema), TaskController.addTask);
taskRouter.put('/tasks/:taskId', optionalAuthMiddleware, validateBody(updateTaskSchema), TaskController.updateTask);
taskRouter.delete('/tasks/:taskId', optionalAuthMiddleware, TaskController.deleteTask);
