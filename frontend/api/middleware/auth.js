// === File: api/middleware/auth.js ===
import jwt from 'jsonwebtoken';


export function authenticateToken(req) {
const authHeader = req.headers.authorization || req.headers.Authorization || '';
const token = authHeader && authHeader.split(' ')[1];
if (!token) throw { status: 401, body: { error: 'Access token required', code: 'NO_TOKEN' } };


try {
const payload = jwt.verify(token, process.env.JWT_SECRET);
return payload; // { userId, username }
} catch (err) {
throw { status: 403, body: { error: 'Invalid or expired token', code: 'INVALID_TOKEN' } };
}
}