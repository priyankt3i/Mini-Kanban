// === File: api/utils/logActivity.js ===
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import Board from '../models/Board.js';
import Card from '../models/Card.js';
import axios from 'axios';

async function sendDiscordNotification(message) {
  if (!process.env.DISCORD_WEBHOOK_URL) return;
  try {
    await axios.post(process.env.DISCORD_WEBHOOK_URL, { content: message });
  } catch (e) {
    console.error('Discord notify error:', e.message);
  }
}

export async function logActivityHelper(
  action,
  userId,
  boardId,
  cardId = null,
  details = {}
) {
  try {
    // Save to DB (non-blocking)
    const log = new ActivityLog({
      action,
      userId,
      boardId,
      cardId,
      details,
      createdAt: new Date(),
    });

    // Do not block API response on save
    log.save().catch((err) =>
      console.error('Failed to save activity log:', err.message)
    );

    // Fetch minimal data for notification (in parallel)
    const [user, board, card] = await Promise.all([
      User.findById(userId).select('username').lean(),
      Board.findById(boardId).select('title').lean(),
      cardId ? Card.findById(cardId).select('title').lean() : null,
    ]);

    const username = user?.username || 'Unknown User';
    const boardTitle = board?.title || 'Unknown Board';
    const cardTitle = card?.title || '';

    let message = '';
    if (action.includes('card') && cardId) {
      message = `📋 ${username} ${action} "${cardTitle}" in board "${boardTitle}"`;
    } else if (action.includes('list')) {
      message = `📋 ${username} ${action} in board "${boardTitle}"`;
    } else if (action.includes('board')) {
      message = `📋 ${username} ${action} "${boardTitle}"`;
    }

    // Send Discord notification asynchronously (do not block)
    if (message) {
      Promise.resolve(sendDiscordNotification(message)).catch((err) =>
        console.error('Discord notification failed:', err.message)
      );
    }
  } catch (error) {
    console.error('logActivityHelper error:', error.message);
  }
}
