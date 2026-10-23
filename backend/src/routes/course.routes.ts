import { Router } from 'express';
import { CourseController } from '../controllers/course.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createCourseSchema, updateCourseSchema } from '../validators/course.validator.js';

export const courseRouter = Router();

courseRouter.get('/courses', authMiddleware, CourseController.getCourses);
courseRouter.post('/courses', authMiddleware, validateBody(createCourseSchema), CourseController.createCourse);
courseRouter.put('/courses/:id', authMiddleware, validateBody(updateCourseSchema), CourseController.updateCourse);
courseRouter.delete('/courses/:id', authMiddleware, CourseController.deleteCourse);
