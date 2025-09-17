// === api/lists/move.js ===
import mongoose from 'mongoose';
import { connectDB } from '../../_db.js';
import List from '../../models/List.js';
import Board from '../../models/Board.js';
import { authenticateToken } from '../../middleware/auth.js';

export default async function handler(req, res) {
  let dbConnected = false;

  try {
    if (req.method !== 'PUT') {
      return res
        .status(405)
        .json({ error: `Method ${req.method} not allowed`, code: 'METHOD_NOT_ALLOWED' });
    }

    await connectDB();
    dbConnected = true;

    const payload = authenticateToken(req);
    const { listId, newPosition } = req.body;

    if (!listId || typeof newPosition !== 'number') {
      return res.status(400).json({
        error: 'listId and newPosition are required',
        code: 'MISSING_FIELDS',
      });
    }

    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ error: 'List not found', code: 'LIST_NOT_FOUND' });
    }

    // Permission check: must be board creator or member
    const board = await Board.findById(list.boardId).select('createdBy members');
    const isMember = board.members.some((m) => m.toString() === payload.userId);
    if (!isMember && board.createdBy.toString() !== payload.userId) {
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }

    list.position = newPosition;
    await list.save();

    return res.status(200).json(list);
  } catch (err) {
    console.error('PUT /api/lists/move error:', err);
    return res
      .status(500)
      .json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  } finally {
    if (
      dbConnected &&
      typeof mongoose !== 'undefined' &&
      mongoose.connection.readyState === 1
    ) {
      await mongoose.disconnect();
    }
  }
}
