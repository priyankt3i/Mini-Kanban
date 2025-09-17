// === File: api/models/Card.js ===
import mongoose from 'mongoose';


const CardSchema = new mongoose.Schema({
title: { type: String, required: true },
description: { type: String },
listId: { type: mongoose.Schema.Types.ObjectId, ref: 'List' },
position: { type: Number, default: 0 },
assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
dueDate: { type: Date },
priority: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
labels: [{ type: String }],
createdAt: { type: Date, default: Date.now }
});


export default mongoose.models.Card || mongoose.model('Card', CardSchema);