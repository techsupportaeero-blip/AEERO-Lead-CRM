import { Request, Response, NextFunction } from 'express';
import { NoteService } from '../services/note.service.js';

export class NoteController {
  static async getNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notes = await NoteService.getNotes(req.params.id);
      res.json(notes);
    } catch (err) {
      next(err);
    }
  }

  static async addNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createdBy = req.user?.name || req.body.createdBy || 'Counselor';
      const note = await NoteService.addNote(req.params.id, req.body, createdBy);
      res.status(201).json(note);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ error: err.message });
        return;
      }
      next(err);
    }
  }

  static async updateNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.noteId || req.params.id, 10);
      const updated = await NoteService.updateNote(id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.noteId || req.params.id, 10);
      await NoteService.deleteNote(id);
      res.json({ message: 'Note deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
