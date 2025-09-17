// === File: api/boards/index.js ===
import { connectDB } from '../../_db.js';
import Board from '../../models/Board.js';
import User from '../../models/User.js';
import { authenticateToken } from '../../middleware/auth.js';
import { logActivityHelper } from '../utils/logActivity.js';

export default async function handler(req, res) {
  let dbConnected = false;

  try {
    await connectDB();
    dbConnected = true;

    if (req.method === 'GET') {
      try {
        const payload = authenticateToken(req);
        const boards = await Board.find({
          $or: [{ createdBy: payload.userId }, { members: payload.userId }],
        })
          .populate('createdBy', 'username')
          .sort({ createdAt: -1 });

        return res.status(200).json(boards);
      } catch (err) {
        console.error('GET /api/boards error:', err);
        const status = err.status || 500;
        const body =
          err.body || { error: 'Internal server error', code: 'SERVER_ERROR' };
        return res.status(status).json(body);
      }
    }

    if (req.method === 'POST') {
      try {
        const payload = authenticateToken(req);
        const { title, description } = req.body;

        if (!title) {
          return res
            .status(400)
            .json({ error: 'Board title is required', code: 'MISSING_TITLE' });
        }

        const board = new Board({
          title,
          description,
          createdBy: payload.userId,
          members: [payload.userId],
        });

        await board.save();
        await board.populate('createdBy', 'username');

        // Log activity (helper)
        await logActivityHelper('created board', payload.userId, board._id);

        return res.status(201).json(board);
      } catch (err) {
        console.error('POST /api/boards error:', err);
        const status = err.status || 500;
        const body =
          err.body || { error: 'Internal server error', code: 'SERVER_ERROR' };
        return res.status(status).json(body);
      }
    }

    // Unsupported HTTP method
    return res
      .status(405)
      .json({ error: `Method ${req.method} not allowed`, code: 'METHOD_NOT_ALLOWED' });

  } catch (err) {
    console.error('Database connection error:', err);
    return res
      .status(500)
      .json({ error: 'Failed to connect to database', code: 'DB_CONNECTION_ERROR' });
  } finally {
    if (dbConnected && typeof mongoose !== 'undefined' && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}
