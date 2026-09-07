import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/course.service.js';

export class CourseController {
  static async getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courses = await CourseService.getCourses();
      res.json(courses);
    } catch (err) {
      next(err);
    }
  }

  static async createCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const course = await CourseService.createCourse(req.body);
      res.status(201).json(course);
    } catch (err) {
      next(err);
    }
  }

  static async updateCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await CourseService.updateCourse(id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await CourseService.deleteCourse(id);
      res.json({ message: 'Course deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
