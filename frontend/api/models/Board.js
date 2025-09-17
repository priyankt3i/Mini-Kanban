// === File: api/models/Board.js ===
import mongoose from 'mongoose';


const BoardSchema = new mongoose.Schema({
title: { type: String, required: true },
description: { type: String },
createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
createdAt: { type: Date, default: Date.now },
members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});


export default mongoose.models.Board || mongoose.model('Board', BoardSchema);