// === File: api/models/ActivityLog.js ===
import mongoose from 'mongoose';


const ActivityLogSchema = new mongoose.Schema({
action: { type: String, required: true },
userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
details: { type: Object },
createdAt: { type: Date, default: Date.now }
});


export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);