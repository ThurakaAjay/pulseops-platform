import { Router } from 'express';
import { db } from '../db/index.js';
import { socketManager } from '../services/socketManager.js';

const router = Router();

// GET all support tickets
router.get('/tickets', (req, res) => {
  const tickets = db.prepare(`
    SELECT st.*, u.name as assigned_name, u.avatar as assigned_avatar,
           (SELECT COUNT(*) FROM support_messages WHERE ticket_id = st.id) as message_count
    FROM support_tickets st
    LEFT JOIN users u ON st.assigned_to = u.id
    ORDER BY CASE st.priority WHEN 'urgent' THEN 1 ELSE 2 END, st.created_at DESC
  `).all();
  res.json(tickets);
});

// GET single ticket + message history
router.get('/tickets/:id', (req, res) => {
  const { id } = req.params;
  const ticket = db.prepare(`
    SELECT st.*, u.name as assigned_name, u.avatar as assigned_avatar
    FROM support_tickets st
    LEFT JOIN users u ON st.assigned_to = u.id
    WHERE st.id = ?
  `).get(id);

  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const messages = db.prepare(`
    SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC
  `).all(id);

  res.json({ ticket, messages });
});

// POST send message in ticket
router.post('/tickets/:id/messages', (req, res) => {
  const { id } = req.params;
  const { sender_type, sender_name, message } = req.body;

  if (!message || !sender_name) {
    return res.status(400).json({ error: 'Message and sender_name required' });
  }

  const msgId = `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO support_messages (id, ticket_id, sender_type, sender_name, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(msgId, id, sender_type || 'agent', sender_name, message, now);

  db.prepare(`UPDATE support_tickets SET updated_at = ? WHERE id = ?`).run(now, id);

  const newMsg = db.prepare('SELECT * FROM support_messages WHERE id = ?').get(msgId);
  socketManager.emitSupportMessage(id, newMsg);

  res.status(201).json(newMsg);
});

// POST create support ticket
router.post('/tickets', (req, res) => {
  const { customer_name, customer_email, subject, message, priority = 'normal', assigned_to } = req.body;
  if (!customer_name || !subject || !message) {
    return res.status(400).json({ error: 'Customer name, subject, and message required' });
  }

  const id = `tkt_${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO support_tickets (id, customer_name, customer_email, subject, status, priority, assigned_to, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?)
  `).run(id, customer_name, customer_email || 'guest@client.com', subject, priority, assigned_to || null, now, now);

  const msgId = `msg_${Date.now()}`;
  db.prepare(`
    INSERT INTO support_messages (id, ticket_id, sender_type, sender_name, message, created_at)
    VALUES (?, ?, 'customer', ?, ?, ?)
  `).run(msgId, id, customer_name, message, now);

  const created = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(id);
  res.status(201).json(created);
});

export default router;
