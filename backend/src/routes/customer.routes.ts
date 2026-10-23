import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.validator.js';

export const customerRouter = Router();

customerRouter.get('/customers', authMiddleware, CustomerController.getCustomers);
customerRouter.post('/customers', authMiddleware, validateBody(createCustomerSchema), CustomerController.createCustomer);
customerRouter.put('/customers/:id', authMiddleware, validateBody(updateCustomerSchema), CustomerController.updateCustomer);
