// ============================
// === api/lists/[listId].js ===
import mongoose from 'mongoose';
import { connectDB } from '../../_db.js';
import List from '../../models/List.js';
import Card from '../../models/Card.js';
import Board from '../../models/Board.js';
import { authenticateToken } from '../../middleware/auth.js';
import { logActivityHelper } from '../utils/logActivity.js';

export default async function handler(req, res) {
  const { listId } = req.query;
  let dbConnected = false;

  try {
    await connectDB();
    dbConnected = true;

    if (req.method === 'PUT') {
      try {
        const payload = authenticateToken(req);
        const { title } = req.body;

        const list = await List.findById(listId);
        if (!list) {
          return res.status(404).json({ error: 'List not found', code: 'LIST_NOT_FOUND' });
        }

        // Permission check — only board creator or member can update
        const board = await Board.findById(list.boardId).select('createdBy members');
        const isMember = board.members.some(m => m.toString() === payload.userId);
        if (!isMember && board.createdBy.toString() !== payload.userId) {
          return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
        }

        list.title = title || list.title;
        await list.save();

        await logActivityHelper('updated list', payload.userId, list.boardId, null, {
          listTitle: list.title,
        });

        return res.status(200).json(list);
      } catch (e) {
        console.error('PUT /api/lists error:', e);
        return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }

    if (req.method === 'DELETE') {
      try {
        const payload = authenticateToken(req);

        const list = await List.findById(listId);
        if (!list) {
          return res.status(404).json({ error: 'List not found', code: 'LIST_NOT_FOUND' });
        }

        // Permission check — only board creator can delete
        const board = await Board.findById(list.boardId).select('createdBy');
        if (board.createdBy.toString() !== payload.userId) {
          return res.status(403).json({
            error: 'Only the board creator can delete this list',
            code: 'ACCESS_DENIED',
          });
        }

        // Delete cards in this list
        await Card.deleteMany({ listId });
        await List.deleteOne({ _id: listId });

        await logActivityHelper('deleted list', payload.userId, list.boardId, null, {
          listTitle: list.title,
        });

        return res.status(200).json({ message: 'List deleted successfully' });
      } catch (e) {
        console.error('DELETE /api/lists error:', e);
        return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }

    // Method not allowed
    return res.status(405).json({ error: `Method ${req.method} not allowed`, code: 'METHOD_NOT_ALLOWED' });

  } catch (err) {
    console.error('Database connection error:', err);
    return res.status(500).json({ error: 'Failed to connect to database', code: 'DB_CONNECTION_ERROR' });
  } finally {
    if (dbConnected && typeof mongoose !== 'undefined' && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}
