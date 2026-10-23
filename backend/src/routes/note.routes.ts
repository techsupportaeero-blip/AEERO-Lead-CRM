import { Router } from 'express';
import { NoteController } from '../controllers/note.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createNoteSchema, updateNoteSchema } from '../validators/note.validator.js';

export const noteRouter = Router();

noteRouter.get('/leads/:id/notes', authMiddleware, NoteController.getNotes);
noteRouter.post('/leads/:id/notes', authMiddleware, validateBody(createNoteSchema), NoteController.addNote);
noteRouter.put('/notes/:noteId', authMiddleware, validateBody(updateNoteSchema), NoteController.updateNote);
noteRouter.delete('/notes/:noteId', authMiddleware, NoteController.deleteNote);
