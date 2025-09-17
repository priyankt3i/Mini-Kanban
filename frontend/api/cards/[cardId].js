// ============================
// === api/cards/[cardId].js ===
import { connectDB, Card } from '../../_db.js';
import { authenticateToken } from '../../_db.js';
import { logActivityHelper } from '../utils/logActivity.js';

export default async function handler(req, res) {
  await connectDB();
  const { cardId } = req.query;

  if (req.method === 'PUT') {
    try {
      const payload = authenticateToken(req);
      const { title, description } = req.body;

      const card = await Card.findById(cardId);
      if (!card) return res.status(404).json({ error: 'Card not found' });

      // Update fields only if provided
      card.title = title || card.title;
      card.description = description || card.description;
      await card.save();

      await logActivityHelper(
        'updated card',
        payload.userId,
        card.boardId,
        card._id,
        { cardTitle: card.title } // use final title
      );

      return res.status(200).json(card);
    } catch (e) {
      console.error('PUT /cards error:', e);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const payload = authenticateToken(req);

      const card = await Card.findById(cardId);
      if (!card) return res.status(404).json({ error: 'Card not found' });

      await Card.deleteOne({ _id: cardId });

      await logActivityHelper(
        'deleted card',
        payload.userId,
        card.boardId,
        card._id,
        { cardTitle: card.title }
      );

      return res.status(200).json({ message: 'Card deleted' });
    } catch (e) {
      console.error('DELETE /cards error:', e);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
