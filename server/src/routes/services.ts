import { Router } from 'express';
import { db } from '../db/index.js';
import { socketManager } from '../services/socketManager.js';

const router = Router();

// GET all services
router.get('/', (req, res) => {
  const services = db.prepare('SELECT * FROM services ORDER BY name ASC').all();
  res.json(services);
});

// GET single service + historical metrics for sparkline/graphs
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  if (!service) return res.status(404).json({ error: 'Service not found' });

  const metrics = db.prepare(`
    SELECT latency_ms, status_code, timestamp 
    FROM service_metrics 
    WHERE service_id = ? 
    ORDER BY timestamp ASC 
    LIMIT 40
  `).all(id);

  res.json({ service, metrics });
});

// POST register new service
router.post('/', (req, res) => {
  const { name, category, url, environment = 'production' } = req.body;
  if (!name || !category || !url) {
    return res.status(400).json({ error: 'Name, category, and url are required' });
  }

  const id = `srv_${Date.now()}`;
  db.prepare(`
    INSERT INTO services (id, name, category, url, status, latency_ms, uptime_pct, environment, last_checked)
    VALUES (?, ?, ?, ?, 'operational', 35, 99.99, ?, CURRENT_TIMESTAMP)
  `).run(id, name, category, url, environment);

  const created = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  socketManager.emitServiceStatusChange(created);
  res.status(201).json(created);
});

// PATCH service update
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { status, name, category, url } = req.body;

  const current = db.prepare('SELECT * FROM services WHERE id = ?').get(id) as any;
  if (!current) return res.status(404).json({ error: 'Service not found' });

  const newStatus = status ?? current.status;
  const newName = name ?? current.name;
  const newCategory = category ?? current.category;
  const newUrl = url ?? current.url;

  db.prepare(`
    UPDATE services 
    SET status = ?, name = ?, category = ?, url = ?, last_checked = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, newName, newCategory, newUrl, id);

  const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  socketManager.emitServiceStatusChange(updated);
  res.json(updated);
});

export default router;
