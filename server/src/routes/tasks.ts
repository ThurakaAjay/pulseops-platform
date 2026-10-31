import { Router } from 'express';
import { db } from '../db/index.js';
import { socketManager } from '../services/socketManager.js';

const router = Router();

// GET all tasks
router.get('/', (req, res) => {
  const { sprint, status } = req.query;
  let sql = `
    SELECT 
      t.*,
      u.name as assignee_name,
      u.avatar as assignee_avatar,
      i.title as incident_title,
      i.severity as incident_severity
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN incidents i ON t.incident_id = i.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (sprint) {
    sql += ' AND t.sprint = ?';
    params.push(sprint);
  }
  if (status && status !== 'all') {
    sql += ' AND t.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY t.order_idx ASC, t.created_at DESC';

  const tasks = db.prepare(sql).all(...params);
  res.json(tasks);
});

// POST create task
router.post('/', (req, res) => {
  const { title, description, status = 'todo', priority = 'medium', assignee_id, incident_id, sprint = 'Sprint 42' } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const id = `tsk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;
  const now = new Date().toISOString();

  // Find max order_idx for status
  const maxOrder = db.prepare('SELECT MAX(order_idx) as max_idx FROM tasks WHERE status = ?').get(status) as any;
  const orderIdx = (maxOrder?.max_idx ?? -1) + 1;

  db.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, assignee_id, incident_id, sprint, order_idx, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description || '', status, priority, assignee_id || null, incident_id || null, sprint, orderIdx, now, now);

  const created = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar, i.title as incident_title, i.severity as incident_severity
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN incidents i ON t.incident_id = i.id
    WHERE t.id = ?
  `).get(id);

  socketManager.emitTaskChange(created);
  res.status(201).json(created);
});

// PATCH update task (move status, change priority, order, assignee)
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { status, priority, assignee_id, title, description, order_idx } = req.body;

  const current = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
  if (!current) return res.status(404).json({ error: 'Task not found' });

  const now = new Date().toISOString();
  const newStatus = status ?? current.status;
  const newPriority = priority ?? current.priority;
  const newAssigneeId = assignee_id !== undefined ? assignee_id : current.assignee_id;
  const newTitle = title ?? current.title;
  const newDesc = description ?? current.description;
  const newOrder = order_idx !== undefined ? order_idx : current.order_idx;

  db.prepare(`
    UPDATE tasks
    SET status = ?, priority = ?, assignee_id = ?, title = ?, description = ?, order_idx = ?, updated_at = ?
    WHERE id = ?
  `).run(newStatus, newPriority, newAssigneeId, newTitle, newDesc, newOrder, now, id);

  const updated = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar, i.title as incident_title, i.severity as incident_severity
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN incidents i ON t.incident_id = i.id
    WHERE t.id = ?
  `).get(id);

  socketManager.emitTaskChange(updated);
  res.json(updated);
});

// DELETE task
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.json({ success: true, id });
});

export default router;
