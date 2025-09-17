// ============================
// === api/cards/move.js ===
import { connectDB, Card } from '../../_db.js';
import { authenticateToken } from '../../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connectDB();

  try {
    authenticateToken(req);

    const { cardId, newListId, newPosition } = req.body;
    if (!cardId) {
      return res.status(400).json({ error: 'Card ID is required' });
    }

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Update card position and list if provided
    if (newListId) card.listId = newListId;
    if (typeof newPosition === 'number') card.position = newPosition;

    await card.save();

    return res.status(200).json(card);
  } catch (e) {
    console.error('PUT /cards/move error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
