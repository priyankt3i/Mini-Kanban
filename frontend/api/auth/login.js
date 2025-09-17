// === File: api/auth/login.js ===
import { connectDB } from '../_db.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


export default async function handler(req, res) {
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });


try {
await connectDB();
const { username, password } = req.body;


if (!username || !password) return res.status(400).json({ error: 'Username and password are required', code: 'MISSING_CREDENTIALS' });


const user = await User.findOne({ username: username.trim() });
if (!user) return res.status(400).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });


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


if (!isPasswordValid) return res.status(400).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });


const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });


return res.status(200).json({ token, user: { username: user.username } });
} catch (error) {
console.error('Login error:', error);
const status = error.status || 500;
const body = error.body || { error: 'Internal server error', code: 'SERVER_ERROR' };
return res.status(status).json(body);
}
}