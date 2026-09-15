import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp.controller.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';

export const whatsappRouter = Router();

whatsappRouter.get('/whatsapp/templates', optionalAuthMiddleware, WhatsAppController.listTemplates);
whatsappRouter.post('/whatsapp/bulk-send', optionalAuthMiddleware, WhatsAppController.bulkSend);
