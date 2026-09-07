import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service.js';

export class CustomerController {
  static async getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customers = await CustomerService.getCustomers();
      res.json(customers);
    } catch (err) {
      next(err);
    }
  }

  static async createCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await CustomerService.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (err) {
      next(err);
    }
  }
}
