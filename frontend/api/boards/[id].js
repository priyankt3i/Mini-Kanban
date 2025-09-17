// === File: api/boards/[id].js ===
import mongoose from 'mongoose';
import { connectDB } from '../../_db.js';
import Board from '../../models/Board.js';
import List from '../../models/List.js';
import Card from '../../models/Card.js';
import { authenticateToken } from '../../middleware/auth.js';
import { logActivityHelper } from '../utils/logActivity.js';

export default async function handler(req, res) {
  const { id } = req.query;
  let dbConnected = false;

  try {
    await connectDB();
    dbConnected = true;

    if (req.method === 'GET') {
      try {
        const payload = authenticateToken(req);
        const board = await Board.findById(id)
          .populate('createdBy', 'username')
          .populate('members', 'username');

        if (!board) {
          return res
            .status(404)
            .json({ error: 'Board not found', code: 'BOARD_NOT_FOUND' });
        }

        // Only members or creator can access board
        const isMember = board.members.some(
          (m) => m._id.toString() === payload.userId
        );
        if (!isMember && board.createdBy._id.toString() !== payload.userId) {
          return res
            .status(403)
            .json({ error: 'Access denied', code: 'ACCESS_DENIED' });
        }

        return res.status(200).json(board);
      } catch (err) {
        console.error('GET /api/boards/[id] error:', err);
        const status = err.status || 500;
        const body =
          err.body || { error: 'Internal server error', code: 'SERVER_ERROR' };
        return res.status(status).json(body);
      }
    }

    if (req.method === 'PUT') {
      try {
        const payload = authenticateToken(req);
        const { title, description } = req.body;

        const board = await Board.findById(id);
        if (!board) {
          return res
            .status(404)
            .json({ error: 'Board not found', code: 'BOARD_NOT_FOUND' });
        }

        if (board.createdBy.toString() !== payload.userId) {
          return res.status(403).json({
            error: 'Only the board creator can edit this board',
            code: 'ACCESS_DENIED',
          });
        }

        board.title = title || board.title;
        board.description = description || board.description;
        await board.save();
        await board.populate('createdBy', 'username');

        await logActivityHelper(
          'updated board',
          payload.userId,
          board._id,
          null,
          { boardTitle: board.title }
        );

        return res.status(200).json(board);
      } catch (err) {
        console.error('PUT /api/boards/[id] error:', err);
        const status = err.status || 500;
        const body =
          err.body || { error: 'Internal server error', code: 'SERVER_ERROR' };
        return res.status(status).json(body);
      }
    }

    if (req.method === 'DELETE') {
      try {
        const payload = authenticateToken(req);
        const board = await Board.findById(id);

        if (!board) {
          return res
            .status(404)
            .json({ error: 'Board not found', code: 'BOARD_NOT_FOUND' });
        }

        if (board.createdBy.toString() !== payload.userId) {
          return res.status(403).json({
            error: 'Only the board creator can delete this board',
            code: 'ACCESS_DENIED',
          });
        }

        // Delete lists, cards
        const listIds = await List.find({ boardId: id }).distinct('_id');
        await Card.deleteMany({ listId: { $in: listIds } });
        await List.deleteMany({ boardId: id });

        // Delete board
        await Board.deleteOne({ _id: id });

        await logActivityHelper(
          'deleted board',
          payload.userId,
          board._id,
          null,
          { boardTitle: board.title }
        );

        return res
          .status(200)
          .json({ message: 'Board deleted successfully' });
      } catch (err) {
        console.error('DELETE /api/boards/[id] error:', err);
        const status = err.status || 500;
        const body =
          err.body || { error: 'Internal server error', code: 'SERVER_ERROR' };
        return res.status(status).json(body);
      }
    }

    // Unsupported method
    return res.status(405).json({
      error: `Method ${req.method} not allowed`,
      code: 'METHOD_NOT_ALLOWED',
    });

  } catch (err) {
    console.error('Database connection error:', err);
    return res.status(500).json({
      error: 'Failed to connect to database',
      code: 'DB_CONNECTION_ERROR',
    });
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