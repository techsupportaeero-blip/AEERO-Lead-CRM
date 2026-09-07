import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { publicLeadRouter } from './publicLead.routes.js';
import { leadRouter } from './lead.routes.js';
import { activityRouter } from './activity.routes.js';
import { followupRouter } from './followup.routes.js';
import { taskRouter } from './task.routes.js';
import { paymentRouter } from './payment.routes.js';
import { noteRouter } from './note.routes.js';
import { courseRouter } from './course.routes.js';
import { leadSourceRouter } from './leadSource.routes.js';
import { customerRouter } from './customer.routes.js';
import { auditLogRouter } from './auditLog.routes.js';
import { notificationRouter } from './notification.routes.js';
import { dashboardRouter } from './dashboard.routes.js';
import { webhookRouter } from './webhook.routes.js';
import { googleSheetsRouter } from './googleSheets.routes.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(authRouter);
apiRouter.use(publicLeadRouter);
apiRouter.use(webhookRouter);
apiRouter.use(googleSheetsRouter);
apiRouter.use(leadRouter);
apiRouter.use(activityRouter);
apiRouter.use(followupRouter);
apiRouter.use(taskRouter);
apiRouter.use(paymentRouter);
apiRouter.use(noteRouter);
apiRouter.use(courseRouter);
apiRouter.use(leadSourceRouter);
apiRouter.use(customerRouter);
apiRouter.use(auditLogRouter);
apiRouter.use(notificationRouter);
apiRouter.use(dashboardRouter);

