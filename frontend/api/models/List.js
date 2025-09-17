// === File: api/models/List.js ===
import mongoose from 'mongoose';


const ListSchema = new mongoose.Schema({
title: { type: String, required: true },
boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
position: { type: Number, default: 0 },
createdAt: { type: Date, default: Date.now }
});


export default mongoose.models.List || mongoose.model('List', ListSchema);