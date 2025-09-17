// ============================
// === api/activities/[boardId].js ===
import { connectDB, ActivityLog } from '../../_db.js';
import { authenticateToken } from '../../_db.js';

export default async function handler(req, res) {
  await connectDB();
  const { boardId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    authenticateToken(req);

    if (!boardId) {
      return res.status(400).json({ error: 'Board ID is required' });
    }

    const logs = await ActivityLog.find({ boardId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json(logs);
  } catch (e) {
    console.error('GET /activities/[boardId] error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
