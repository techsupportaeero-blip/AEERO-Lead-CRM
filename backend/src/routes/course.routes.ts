import { Router } from 'express';
import { CourseController } from '../controllers/course.controller.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createCourseSchema, updateCourseSchema } from '../validators/course.validator.js';

export const courseRouter = Router();

courseRouter.get('/courses', optionalAuthMiddleware, CourseController.getCourses);
courseRouter.post('/courses', optionalAuthMiddleware, validateBody(createCourseSchema), CourseController.createCourse);
courseRouter.put('/courses/:id', optionalAuthMiddleware, validateBody(updateCourseSchema), CourseController.updateCourse);
courseRouter.delete('/courses/:id', optionalAuthMiddleware, CourseController.deleteCourse);
