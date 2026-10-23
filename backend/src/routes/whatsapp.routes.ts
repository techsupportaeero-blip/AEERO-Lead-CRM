import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp.controller.js';
import { WhatsAppTemplateController } from '../controllers/whatsappTemplate.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createWhatsAppTemplateSchema, updateWhatsAppTemplateSchema } from '../validators/whatsappTemplate.validator.js';

export const whatsappRouter = Router();

// Active-only list, used by the Bulk WhatsApp send picker.
whatsappRouter.get('/whatsapp/templates', authMiddleware, WhatsAppController.listTemplates);
// bulk-send actually messages real leads on WhatsApp - must require login,
// not just be gated by the frontend UI.
whatsappRouter.post('/whatsapp/bulk-send', authMiddleware, WhatsAppController.bulkSend);

// Full CRUD (incl. inactive) for the WhatsApp Templates management page.
// Mutations require a real admin session - a wrong templateId/body here
// breaks live sends for the whole team, so this isn't opened up the way
// Email Triggers/Templates were.
whatsappRouter.get('/whatsapp-templates', authMiddleware, WhatsAppTemplateController.getTemplates);
whatsappRouter.post('/whatsapp-templates', authMiddleware, validateBody(createWhatsAppTemplateSchema), WhatsAppTemplateController.createTemplate);
whatsappRouter.put('/whatsapp-templates/:id', authMiddleware, validateBody(updateWhatsAppTemplateSchema), WhatsAppTemplateController.updateTemplate);
whatsappRouter.delete('/whatsapp-templates/:id', authMiddleware, WhatsAppTemplateController.deleteTemplate);
