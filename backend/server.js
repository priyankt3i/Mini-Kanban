const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// MongoDB Schemas and Models
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const BoardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const ListSchema = new mongoose.Schema({
  title: { type: String, required: true },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
  position: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const CardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  listId: { type: mongoose.Schema.Types.ObjectId, ref: 'List' },
  position: { type: Number, default: 0 },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dueDate: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  labels: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const ActivityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
  details: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Board = mongoose.model('Board', BoardSchema);
const List = mongoose.model('List', ListSchema);
const Card = mongoose.model('Card', CardSchema);
const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);


// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required', code: 'NO_TOKEN' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
    }
    req.user = user;
    next();
  });
};


// Discord Notification Function
async function sendDiscordNotification(message) {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.log('Discord webhook not configured');
    return;
  }

  try {
    await axios.post(process.env.DISCORD_WEBHOOK_URL, {
      content: message
    });
  } catch (error) {
    console.error('Error sending Discord notification:', error.message);
  }
}



// Log Activity Function
async function logActivity(action, userId, boardId, cardId = null, details = {}) {
  try {
    const activityLog = new ActivityLog({
      action,
      userId,
      boardId,
      cardId,
      details,
      createdAt: new Date()
    });
    
    await activityLog.save();
    
    const user = await User.findById(userId);
    const board = await Board.findById(boardId);
    
    let message = '';
    if (action.includes('card')) {
      const card = await Card.findById(cardId);
      message = `📋 ${user.username} ${action} "${card.title}" in board "${board.title}"`;
    } else if (action.includes('list')) {
      message = `📋 ${user.username} ${action} in board "${board.title}"`;
    } else if (action.includes('board')) {
      message = `📋 ${user.username} ${action} "${board.title}"`;
    }
    
    if (message) {
      await sendDiscordNotification(message);
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}


// Helper function to hash existing plain text passwords
async function hashExistingPlainTextPasswords() {
  try {
    const users = await User.find();
    
    for (let user of users) {
      if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        user.password = hashedPassword;
        await user.save();
      }
    }
  } catch (error) {
    console.error('Error hashing existing passwords:', error);
  }
}



async function cleanOrphanedCards() {
  try {
    const lists = await List.find().distinct('_id');
    const result = await Card.deleteMany({ listId: { $nin: lists } });
    console.log(`Deleted ${result.deletedCount} orphaned cards`);
  } catch (error) {
    console.error('Error cleaning orphaned cards:', error);
  }
}


// Run at server startup
cleanOrphanedCards();
hashExistingPlainTextPasswords();


// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required', code: 'MISSING_CREDENTIALS' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    let isPasswordValid = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      isPasswordValid = password === user.password;
      if (isPasswordValid) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();
      }
    }

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        username: user.username,
      },
    });
  } 
  catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});



// Board Routes
app.get('/api/boards', authenticateToken, async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [
        { createdBy: req.user.userId },
        { members: req.user.userId }
      ]
    }).populate('createdBy', 'username').sort({ createdAt: -1 });
    
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});



app.post('/api/boards', authenticateToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Board title is required', code: 'MISSING_TITLE' });
    }
    
    const board = new Board({
      title,
      description,
      createdBy: req.user.userId,
      members: [req.user.userId]
    });
    
    await board.save();
    await board.populate('createdBy', 'username');
    
    await logActivity('created board', req.user.userId, board._id);
    
    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});



app.get('/api/boards/:id', authenticateToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('members', 'username');
    
    if (!board) {
      return res.status(404).json({ error: 'Board not found', code: 'BOARD_NOT_FOUND' });
    }
    
    if (!board.members.some(member => member._id.toString() === req.user.userId) && 
        board.createdBy._id.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }
    
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});



app.put('/api/boards/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    const boardId = req.params.id;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found', code: 'BOARD_NOT_FOUND' });
    }

    if (board.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Only the board creator can edit this board', code: 'ACCESS_DENIED' });
    }

    board.title = title || board.title;
    board.description = description || board.description;

    await board.save();
    await board.populate('createdBy', 'username');

    await logActivity('updated board', req.user.userId, board._id, null, { boardTitle: title });

    res.json(board);
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});



app.delete('/api/boards/:id', authenticateToken, async (req, res) => {
  try {
    const boardId = req.params.id;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found', code: 'BOARD_NOT_FOUND' });
    }

    if (board.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Only the board creator can delete this board', code: 'ACCESS_DENIED' });
    }

    await List.deleteMany({ boardId });
    await Card.deleteMany({ listId: { $in: await List.find({ boardId }).distinct('_id') } });
    await ActivityLog.deleteMany({ boardId });

    await Board.deleteOne({ _id: boardId });

    await logActivity('deleted board', req.user.userId, board._id, null, { boardTitle: board.title });

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Error deleting board:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});



// List Routes
app.get('/api/boards/:boardId/lists', authenticateToken, async (req, res) => {
  try {
    const { boardId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({ error: 'Invalid board ID', code: 'INVALID_ID' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found', code: 'BOARD_NOT_FOUND' });
    }

    if (!board.members.includes(req.user.userId) && 
        board.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }

    const lists = await List.find({ boardId })
      .sort({ position: 1 })
      .lean();

    for (let list of lists) {
      try {
        list.cards = await Card.find({ listId: list._id })
          .sort({ position: 1 })
          .lean();
      } catch (error) {
        console.error(`Error populating cards for list ${list._id}:`, error);
        list.cards = [];
      }
    }

    res.json(lists);
  } catch (error) {
    console.error('Error fetching lists:', error.stack);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});



app.post('/api/boards/:boardId/lists', authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    const boardId = req.params.boardId;
    
    if (!title) {
      return res.status(400).json({ error: 'List title is required', code: 'MISSING_TITLE' });
    }

    const board = await Board.findById(boardId);
    
    if (!board) {
      return res.status(404).json({ error: 'Board not found', code: 'BOARD_NOT_FOUND' });
    }
    
    if (!board.members.includes(req.user.userId) && 
        board.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }
    
    const listCount = await List.countDocuments({ boardId });
    
    const list = new List({
      title,
      boardId,
      position: listCount
    });
    
    await list.save();
    
    await logActivity('created list', req.user.userId, boardId, null, { listTitle: title });
    
    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});



app.put('/api/lists/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'List title is required', code: 'MISSING_TITLE' });
    }

    const list = await List.findById(id);
    if (!list) {
      return res.status(404).json({ error: 'List not found', code: 'LIST_NOT_FOUND' });
    }

    const board = await Board.findById(list.boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found', code: 'BOARD_NOT_FOUND' });
    }

    if (board.createdBy.toString() !== req.user.userId && !board.members.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }

    list.title = title.trim();
    await list.save();

    await logActivity('updated list', req.user.userId, list.boardId, null, {
      listTitle: title
    });

    res.json(list);
  } catch (error) {
    console.error('Error updating list:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});



app.delete('/api/lists/:listId', authenticateToken, async (req, res) => {
  try {
    const listId = req.params.listId;

    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ error: 'List not found', code: 'LIST_NOT_FOUND' });
    }

    const board = await Board.findById(list.boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found', code: 'BOARD_NOT_FOUND' });
    }

    if (!board.members.includes(req.user.userId) && board.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }

    const deletedPosition = list.position;

    await Card.deleteMany({ listId });

    await List.deleteOne({ _id: listId });

    await List.updateMany(
      { boardId: list.boardId, position: { $gt: deletedPosition } },
      { $inc: { position: -1 } }
    );

    await logActivity('deleted list', req.user.userId, list.boardId, null, { listTitle: list.title });

    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});



app.put('/api/lists/:id/move', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { position, boardId } = req.body;

    if (!boardId || position === undefined) {
      return res.status(400).json({ error: 'Board ID and position are required', code: 'MISSING_FIELDS' });
    }

    const list = await List.findById(id);
    if (!list) {
      return res.status(404).json({ error: 'List not found', code: 'LIST_NOT_FOUND' });
    }

    if (list.boardId.toString() !== boardId) {
      return res.status(400).json({ error: 'List does not belong to the specified board', code: 'INVALID_BOARD' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found', code: 'BOARD_NOT_FOUND' });
    }
    if (board.createdBy.toString() !== req.user.userId && !board.members.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }

    list.position = position;
    await list.save();

    res.json({ message: 'List position updated successfully', list });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});



// Card Routes
app.get('/api/lists/:listId/cards', authenticateToken, async (req, res) => {
  try {
    const list = await List.findById(req.params.listId);
    
    if (!list) {
      return res.status(404).json({ error: 'List not found', code: 'LIST_NOT_FOUND' });
    }
    
    const board = await Board.findById(list.boardId);
    
    if (!board.members.includes(req.user.userId) && 
        board.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }
    
    const cards = await Card.find({ listId: req.params.listId })
      .populate('assignedTo', 'username')
      .sort({ position: 1 });
    
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});



app.post('/api/lists/:listId/cards', authenticateToken, async (req, res) => {
  try {
    const { title, description, priority, labels } = req.body;
    const listId = req.params.listId;
    
    if (!title) {
      return res.status(400).json({ error: 'Card title is required', code: 'MISSING_TITLE' });
    }
    
    const list = await List.findById(listId);
    
    if (!list) {
      return res.status(404).json({ error: 'List not found', code: 'LIST_NOT_FOUND' });
    }
    
    const board = await Board.findById(list.boardId);
    
    if (!board.members.includes(req.user.userId) && 
        board.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }
    
    const cardCount = await Card.countDocuments({ listId });
    
    const card = new Card({
      title,
      description,
      listId,
      position: cardCount,
      priority: priority || 'medium',
      labels: labels || []
    });
    
    await card.save();
    await card.populate('assignedTo', 'username');
    
    await logActivity('created card', req.user.userId, list.boardId, card._id, { cardTitle: title });
    
    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});



app.put('/api/cards/:cardId', authenticateToken, async (req, res) => {
  try {
    const { title, priority, description, labels } = req.body;
    const cardId = req.params.cardId;
    
    if (!title) {
      return res.status(400).json({ error: 'Card title is required', code: 'MISSING_TITLE' });
    }
    
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found', code: 'CARD_NOT_FOUND' });
    }
    
    const list = await List.findById(card.listId);
    const board = await Board.findById(list.boardId);
    
    if (!board.members.includes(req.user.userId) && board.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }
    
    card.title = title;
    card.priority = priority || card.priority;
    card.description = description || card.description;
    card.labels = labels || card.labels;
    
    await card.save();
    await card.populate('assignedTo', 'username');
    
    await logActivity('updated card', req.user.userId, board._id, card._id, { cardTitle: title });
    
    res.json(card);
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});




app.delete('/api/cards/:cardId', authenticateToken, async (req, res) => {
  try {
    const cardId = req.params.cardId;
    
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found', code: 'CARD_NOT_FOUND' });
    }
    
    const list = await List.findById(card.listId);
    const board = await Board.findById(list.boardId);
    
    if (!board.members.includes(req.user.userId) && board.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }
    
    const deletedPosition = card.position;
    
    await Card.deleteOne({ _id: cardId });
    
    await Card.updateMany(
      { listId: card.listId, position: { $gt: deletedPosition } },
      { $inc: { position: -1 } }
    );
    
    await logActivity('deleted card', req.user.userId, board._id, card._id, { cardTitle: card.title });
    
    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});



app.put('/api/cards/:cardId/move', authenticateToken, async (req, res) => {
  try {
    const { listId, position } = req.body;
    const cardId = req.params.cardId;
    
    if (!listId || position === undefined) {
      return res.status(400).json({ error: 'List ID and position are required', code: 'MISSING_FIELDS' });
    }
    
    const card = await Card.findById(cardId);
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found', code: 'CARD_NOT_FOUND' });
    }
    
    const originalList = await List.findById(card.listId);
    const board = await Board.findById(originalList.boardId);
    
    if (!board.members.includes(req.user.userId) && 
        board.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }
    
    const oldListId = card.listId;
    const oldPosition = card.position;
    
    if (listId !== card.listId.toString()) {
      await Card.updateMany(
        { listId: oldListId, position: { $gt: oldPosition } },
        { $inc: { position: -1 } }
      );
      
      await Card.updateMany(
        { listId, position: { $gte: position } },
        { $inc: { position: 1 } }
      );
      
      card.listId = listId;
      card.position = position;
    } else {
      if (position > card.position) {
        await Card.updateMany(
          { listId, position: { $gt: card.position, $lte: position } },
          { $inc: { position: -1 } }
        );
      } else {
        await Card.updateMany(
          { listId, position: { $lt: card.position, $gte: position } },
          { $inc: { position: 1 } }
        );
      }
      
      card.position = position;
    }
    
    await card.save();
    await card.populate('assignedTo', 'username');
    
    const targetList = await List.findById(listId);
    
    await logActivity('moved card', req.user.userId, board._id, card._id, { 
      cardTitle: card.title, 
      newPosition: position,
      listTitle: targetList.title
    });
    
    res.json(card);
  } catch (error) {
    console.error('Error moving card:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});


app.put('/api/cards/:cardId', authenticateToken, async (req, res) => {
  try {
    const { title, priority, description, labels } = req.body;
    const cardId = req.params.cardId;
    
    if (!title) {
      return res.status(400).json({ error: 'Card title is required', code: 'MISSING_TITLE' });
    }
    
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found', code: 'CARD_NOT_FOUND' });
    }
    
    const list = await List.findById(card.listId);
    const board = await Board.findById(list.boardId);
    
    if (!board.members.includes(req.user.userId) && board.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }
    
    card.title = title;
    card.priority = priority || card.priority;
    card.description = description || card.description;
    card.labels = labels || card.labels;
    
    await card.save();
    await card.populate('assignedTo', 'username');
    
    await logActivity('updated card', req.user.userId, board._id, card._id, { cardTitle: title });
    
    res.json(card);
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});


// Activity Log Routes
app.get('/api/boards/:boardId/activities', authenticateToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    
    if (!board) {
      return res.status(404).json({ error: 'Board not found', code: 'BOARD_NOT_FOUND' });
    }
    
    if (!board.members.includes(req.user.userId) && 
        board.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }
    
    const activities = await ActivityLog.find({ boardId: req.params.boardId })
      .populate('userId', 'username')
      .populate('cardId', 'title')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});



// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});