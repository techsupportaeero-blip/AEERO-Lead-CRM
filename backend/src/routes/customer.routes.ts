import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';

export const customerRouter = Router();

customerRouter.get('/customers', optionalAuthMiddleware, CustomerController.getCustomers);
customerRouter.post('/customers', optionalAuthMiddleware, CustomerController.createCustomer);
