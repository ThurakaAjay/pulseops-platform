import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pulseops_super_secret_jwt_key_2026';

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

  const { password: _, ...userWithoutPass } = user;
  res.json({ token, user: userWithoutPass });
});

// Demo 1-Click Instant Login for Recruiters and Hiring Managers
router.post('/demo-login', (req, res) => {
  const { role = 'admin' } = req.body;
  
  let user = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get(role) as any;
  if (!user) {
    user = db.prepare('SELECT * FROM users LIMIT 1').get() as any;
  }

  if (!user) {
    return res.status(404).json({ error: 'No demo users found. Please run seed script.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...userWithoutPass } = user;
  res.json({ token, user: userWithoutPass });
});

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT id, name, email, role, avatar, title, created_at FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Token invalid or expired' });
  }
});

router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, avatar, title FROM users').all();
  res.json(users);
});

export default router;
