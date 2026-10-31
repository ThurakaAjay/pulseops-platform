import { db } from '../db/index.js';
import { socketManager } from './socketManager.js';

class MonitorEngine {
  private intervalTimer: NodeJS.Timeout | null = null;
  private isSimulatingOutage: boolean = false;
  private outageTargetServiceId: string | null = null;

  public start(intervalMs: number = 4000) {
    if (this.intervalTimer) return;

    console.log(`[MonitorEngine] Background synthetic health probes started (${intervalMs}ms interval).`);

    this.intervalTimer = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  public stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  public triggerOutageSimulation(serviceId: string, durationSeconds: number = 30) {
    this.isSimulatingOutage = true;
    this.outageTargetServiceId = serviceId;

    console.log(`[MonitorEngine] CHAOS INJECTED: Service ${serviceId} forced into OUTAGE state for ${durationSeconds}s.`);

    // Set service to outage in DB
    db.prepare(`UPDATE services SET status = 'outage', latency_ms = 4850, last_checked = CURRENT_TIMESTAMP WHERE id = ?`).run(serviceId);

    const s = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId) as any;
    socketManager.emitServiceStatusChange(s);
    socketManager.emitChaosAlert({
      title: '🚨 CRITICAL SYSTEM ANOMALY DETECTED',
      message: `${s?.name || serviceId} latency breached 4000ms threshold! Health checks failing with 504 Gateway Timeout.`,
      severity: 'P1',
      timestamp: new Date().toISOString()
    });

    // Auto recover after duration
    setTimeout(() => {
      this.isSimulatingOutage = false;
      this.outageTargetServiceId = null;
      db.prepare(`UPDATE services SET status = 'operational', latency_ms = 42, last_checked = CURRENT_TIMESTAMP WHERE id = ?`).run(serviceId);
      const recovered = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId) as any;
      socketManager.emitServiceStatusChange(recovered);
      socketManager.emitChaosAlert({
        title: '✅ SERVICE AUTOMATICALLY RECOVERED',
        message: `${recovered?.name || serviceId} self-healing circuit breaker engaged. Health checks returning 200 OK.`,
        severity: 'INFO',
        timestamp: new Date().toISOString()
      });
      console.log(`[MonitorEngine] CHAOS RECOVERED: Service ${serviceId} restored to operational.`);
    }, durationSeconds * 1000);
  }

  private tick() {
    try {
      const services = db.prepare('SELECT * FROM services').all() as any[];
      const now = new Date().toISOString();
      const tickData: any[] = [];

      for (const s of services) {
        let latency = s.latency_ms;
        let status = s.status;

        if (this.isSimulatingOutage && this.outageTargetServiceId === s.id) {
          latency = Math.floor(3800 + Math.random() * 1200);
          status = 'outage';
        } else if (s.status === 'degraded') {
          // slight fluctuation around 300-380ms
          latency = Math.max(120, Math.floor(320 + (Math.random() * 60 - 30)));
        } else {
          // Normal fluctuation
          const jitter = Math.floor(Math.random() * 10 - 5);
          latency = Math.max(8, latency + jitter);
          // Keep within reasonable bounds
          if (s.id === 'srv_db') latency = Math.min(25, Math.max(8, latency));
          else if (s.id === 'srv_ws') latency = Math.min(35, Math.max(12, latency));
          else if (s.id === 'srv_auth') latency = Math.min(45, Math.max(18, latency));
          else latency = Math.min(95, Math.max(30, latency));
        }

        db.prepare('UPDATE services SET latency_ms = ?, status = ?, last_checked = ? WHERE id = ?')
          .run(latency, status, now, s.id);

        // Record metric
        const metricId = `met_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        db.prepare('INSERT INTO service_metrics (id, service_id, latency_ms, status_code, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run(metricId, s.id, latency, status === 'outage' ? 504 : 200, now);

        tickData.push({
          id: s.id,
          name: s.name,
          category: s.category,
          status,
          latency_ms: latency,
          uptime_pct: s.uptime_pct,
          environment: s.environment,
          last_checked: now
        });
      }

      // Prune old metrics older than 1 hour to prevent DB bloat
      db.prepare(`DELETE FROM service_metrics WHERE timestamp < datetime('now', '-1 hour')`).run();

      // Broadcast live tick to all WebSocket clients
      socketManager.emitTelemetry(tickData);
    } catch (err) {
      console.error('[MonitorEngine] Tick error:', err);
    }
  }
}

export const monitorEngine = new MonitorEngine();
