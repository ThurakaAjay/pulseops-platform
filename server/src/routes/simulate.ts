import { Router } from 'express';
import { monitorEngine } from '../services/monitorEngine.js';
import { db } from '../db/index.js';
import { socketManager } from '../services/socketManager.js';

const router = Router();

// Trigger synthetic chaos / outage
router.post('/chaos', (req, res) => {
  const { service_id = 'srv_payments', duration_seconds = 25 } = req.body;
  monitorEngine.triggerOutageSimulation(service_id, Number(duration_seconds));
  res.json({
    status: 'chaos_injected',
    service_id,
    duration_seconds,
    message: `Synthetic outage simulated on ${service_id}. System will auto-heal in ${duration_seconds} seconds.`
  });
});

// Trigger synthetic customer spike
router.post('/traffic-spike', (req, res) => {
  const services = db.prepare('SELECT id, name FROM services').all() as any[];
  for (const s of services) {
    db.prepare('UPDATE services SET latency_ms = latency_ms + 120 WHERE id = ?').run(s.id);
  }
  socketManager.emitChaosAlert({
    title: '⚡ TRAFFIC BURST DETECTED (50,000 req/sec)',
    message: 'Global traffic spike across edge CDN regions. Ingress autoscaling triggered.',
    severity: 'P2',
    timestamp: new Date().toISOString()
  });
  res.json({ status: 'traffic_spike_injected' });
});

export default router;
