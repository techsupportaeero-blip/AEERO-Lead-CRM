import { Router } from 'express';
import { NoteController } from '../controllers/note.controller.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createNoteSchema, updateNoteSchema } from '../validators/note.validator.js';

export const noteRouter = Router();

noteRouter.get('/leads/:id/notes', optionalAuthMiddleware, NoteController.getNotes);
noteRouter.post('/leads/:id/notes', optionalAuthMiddleware, validateBody(createNoteSchema), NoteController.addNote);
noteRouter.put('/notes/:noteId', optionalAuthMiddleware, validateBody(updateNoteSchema), NoteController.updateNote);
noteRouter.delete('/notes/:noteId', optionalAuthMiddleware, NoteController.deleteNote);
