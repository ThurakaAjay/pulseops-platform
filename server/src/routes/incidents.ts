import { Router } from 'express';
import { db } from '../db/index.js';
import { socketManager } from '../services/socketManager.js';

const router = Router();

// GET all incidents
router.get('/', (req, res) => {
  const { status, severity } = req.query;
  let sql = `
    SELECT 
      i.*,
      s.name as service_name,
      s.category as service_category,
      u.name as lead_name,
      u.avatar as lead_avatar,
      (SELECT COUNT(*) FROM incident_updates WHERE incident_id = i.id) as updates_count
    FROM incidents i
    LEFT JOIN services s ON i.service_id = s.id
    LEFT JOIN users u ON i.lead_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'all') {
    sql += ' AND i.status = ?';
    params.push(status);
  }
  if (severity && severity !== 'all') {
    sql += ' AND i.severity = ?';
    params.push(severity);
  }

  sql += ' ORDER BY CASE i.severity WHEN "P1" THEN 1 WHEN "P2" THEN 2 WHEN "P3" THEN 3 ELSE 4 END, i.created_at DESC';

  const incidents = db.prepare(sql).all(...params);
  res.json(incidents);
});

// GET single incident detail + war room history
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const incident = db.prepare(`
    SELECT 
      i.*,
      s.name as service_name,
      s.category as service_category,
      s.url as service_url,
      s.status as service_status,
      u.name as lead_name,
      u.avatar as lead_avatar,
      u.title as lead_title
    FROM incidents i
    LEFT JOIN services s ON i.service_id = s.id
    LEFT JOIN users u ON i.lead_id = u.id
    WHERE i.id = ?
  `).get(id);

  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const updates = db.prepare(`
    SELECT 
      iu.*,
      u.avatar as author_avatar,
      u.role as author_role
    FROM incident_updates iu
    LEFT JOIN users u ON iu.user_id = u.id
    WHERE iu.incident_id = ?
    ORDER BY iu.created_at ASC
  `).all(id);

  const linkedTasks = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.incident_id = ?
  `).all(id);

  res.json({ incident, updates, linkedTasks });
});

// POST create incident
router.post('/', (req, res) => {
  const { title, description, severity = 'P2', service_id, lead_id } = req.body;
  if (!title || !service_id) {
    return res.status(400).json({ error: 'Title and service_id are required' });
  }

  const id = `inc_${Date.now().toString(36)}`;
  
  // Calculate SLA deadline based on severity
  let slaMinutes = 60;
  if (severity === 'P1') slaMinutes = 30;
  else if (severity === 'P2') slaMinutes = 120;
  else if (severity === 'P3') slaMinutes = 480;
  else slaMinutes = 1440;

  const slaDeadline = new Date(Date.now() + slaMinutes * 60 * 1000).toISOString();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO incidents (id, title, description, severity, status, service_id, lead_id, sla_deadline, created_at)
    VALUES (?, ?, ?, ?, 'investigating', ?, ?, ?, ?)
  `).run(id, title, description || '', severity, service_id, lead_id || null, slaDeadline, createdAt);

  // Mark service as degraded/outage if P1/P2
  if (severity === 'P1') {
    db.prepare(`UPDATE services SET status = 'outage' WHERE id = ?`).run(service_id);
  } else if (severity === 'P2') {
    db.prepare(`UPDATE services SET status = 'degraded' WHERE id = ?`).run(service_id);
  }

  // Create initial log in updates
  const updateId = `upd_${Date.now()}`;
  db.prepare(`
    INSERT INTO incident_updates (id, incident_id, user_id, author_name, message, update_type, created_at)
    VALUES (?, ?, ?, 'System Orchestrator', 'Incident triggered. SLA countdown initiated.', 'status_change', ?)
  `).run(updateId, id, lead_id || null, createdAt);

  const createdIncident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
  socketManager.emitIncidentCreated(createdIncident);

  res.status(201).json(createdIncident);
});

// POST update / comment into War Room
router.post('/:id/updates', (req, res) => {
  const { id } = req.params;
  const { user_id, author_name, message, update_type = 'comment' } = req.body;

  if (!message || !author_name) {
    return res.status(400).json({ error: 'Author name and message are required' });
  }

  const updateId = `upd_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO incident_updates (id, incident_id, user_id, author_name, message, update_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(updateId, id, user_id || null, author_name, message, update_type, createdAt);

  const fullUpdate = db.prepare(`
    SELECT iu.*, u.avatar as author_avatar, u.role as author_role
    FROM incident_updates iu
    LEFT JOIN users u ON iu.user_id = u.id
    WHERE iu.id = ?
  `).get(updateId);

  socketManager.emitIncidentUpdate(id, fullUpdate);

  res.status(201).json(fullUpdate);
});

// PATCH change incident status
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, author_name = 'System', user_id } = req.body;

  const validStatuses = ['triggered', 'investigating', 'mitigated', 'resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const current = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id) as any;
  if (!current) return res.status(404).json({ error: 'Incident not found' });

  const now = new Date().toISOString();
  let mitigatedAt = current.mitigated_at;
  let resolvedAt = current.resolved_at;

  if (status === 'mitigated' && !mitigatedAt) mitigatedAt = now;
  if (status === 'resolved') {
    resolvedAt = now;
    // Restore service status to operational if no other open incidents
    db.prepare(`UPDATE services SET status = 'operational' WHERE id = ?`).run(current.service_id);
  }

  db.prepare(`
    UPDATE incidents 
    SET status = ?, mitigated_at = ?, resolved_at = ?
    WHERE id = ?
  `).run(status, mitigatedAt, resolvedAt, id);

  // Add system timeline entry
  const updateId = `upd_${Date.now()}`;
  db.prepare(`
    INSERT INTO incident_updates (id, incident_id, user_id, author_name, message, update_type, created_at)
    VALUES (?, ?, ?, ?, ?, 'status_change', ?)
  `).run(updateId, id, user_id || null, author_name, `Incident status changed to ${status.toUpperCase()}`, now);

  const updatedIncident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
  const fullUpdate = db.prepare('SELECT * FROM incident_updates WHERE id = ?').get(updateId);

  socketManager.emitIncidentUpdate(id, fullUpdate);

  res.json(updatedIncident);
});

export default router;
