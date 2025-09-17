// === File: api/_db.js ===
import mongoose from 'mongoose';


let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };


export async function connectDB() {
if (cached.conn) return cached.conn;
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not set in environment');


if (!cached.promise) {
  const opts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    bufferCommands: false,
  };
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}