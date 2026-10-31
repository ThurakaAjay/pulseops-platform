import { db, initDatabase } from './index.js';
import bcrypt from 'bcryptjs';

export function seedDatabase() {
  initDatabase();

  // Check if already seeded
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    console.log('Database already seeded. Skipping initial seed.');
    return;
  }

  console.log('Seeding PulseOps with enterprise sample data...');

  const passwordHash = bcrypt.hashSync('pulseops123', 10);

  // 1. Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password, role, avatar, title)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    {
      id: 'usr_alex',
      name: 'Alex Rivera',
      email: 'alex@pulseops.io',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Principal SRE & DevOps Architect'
    },
    {
      id: 'usr_sarah',
      name: 'Sarah Chen',
      email: 'sarah@pulseops.io',
      role: 'sre',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      title: 'Staff Incident Commander'
    },
    {
      id: 'usr_marcus',
      name: 'Marcus Vance',
      email: 'marcus@pulseops.io',
      role: 'engineer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Senior Backend Engineer'
    },
    {
      id: 'usr_emily',
      name: 'Emily Watson',
      email: 'emily@pulseops.io',
      role: 'engineer',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      title: 'Frontend Platform Lead'
    }
  ];

  for (const u of users) {
    insertUser.run(u.id, u.name, u.email, passwordHash, u.role, u.avatar, u.title);
  }

  // 2. Services
  const insertService = db.prepare(`
    INSERT INTO services (id, name, category, url, status, latency_ms, uptime_pct, environment, last_checked)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const services = [
    {
      id: 'srv_payments',
      name: 'Payment Processing Gateway',
      category: 'Fintech Core',
      url: 'https://api.internal.pulseops.io/v1/payments/health',
      status: 'degraded',
      latency_ms: 340,
      uptime_pct: 99.42,
      environment: 'production'
    },
    {
      id: 'srv_auth',
      name: 'Identity & SSO Provider (Auth0)',
      category: 'Security',
      url: 'https://auth.internal.pulseops.io/healthz',
      status: 'operational',
      latency_ms: 28,
      uptime_pct: 99.99,
      environment: 'production'
    },
    {
      id: 'srv_db',
      name: 'Primary PostgreSQL Primary + Replica 01',
      category: 'Database Infrastructure',
      url: 'tcp://db-prod-cluster.internal:5432',
      status: 'operational',
      latency_ms: 12,
      uptime_pct: 99.95,
      environment: 'production'
    },
    {
      id: 'srv_ws',
      name: 'Real-Time WebSocket Ingress Router',
      category: 'Networking',
      url: 'wss://stream.internal.pulseops.io/v1/live',
      status: 'operational',
      latency_ms: 19,
      uptime_pct: 99.98,
      environment: 'production'
    },
    {
      id: 'srv_search',
      name: 'Search & Telemetry Ingestion Cluster',
      category: 'Analytics',
      url: 'https://elastic-search.internal.pulseops.io/status',
      status: 'operational',
      latency_ms: 55,
      uptime_pct: 99.87,
      environment: 'production'
    },
    {
      id: 'srv_fulfillment',
      name: 'Order Fulfillment & Notification Dispatch',
      category: 'Business Operations',
      url: 'https://fulfillment.internal.pulseops.io/health',
      status: 'operational',
      latency_ms: 64,
      uptime_pct: 99.91,
      environment: 'production'
    }
  ];

  for (const s of services) {
    insertService.run(s.id, s.name, s.category, s.url, s.status, s.latency_ms, s.uptime_pct, s.environment, new Date().toISOString());
  }

  // 3. Service Historical Telemetry Metrics (for charts)
  const insertMetric = db.prepare(`
    INSERT INTO service_metrics (id, service_id, latency_ms, status_code, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  for (const s of services) {
    for (let i = 24; i >= 0; i--) {
      const time = new Date(now - i * 5 * 60 * 1000).toISOString();
      const baseLatency = s.id === 'srv_payments' && i < 6 ? 320 + Math.floor(Math.random() * 80) : s.latency_ms + (Math.floor(Math.random() * 14) - 7);
      insertMetric.run(`met_${s.id}_${i}`, s.id, Math.max(8, baseLatency), 200, time);
    }
  }

  // 4. Incidents
  const insertIncident = db.prepare(`
    INSERT INTO incidents (id, title, description, severity, status, service_id, lead_id, sla_deadline, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const slaIn30Min = new Date(Date.now() + 35 * 60 * 1000).toISOString();
  const created25MinAgo = new Date(Date.now() - 25 * 60 * 1000).toISOString();

  insertIncident.run(
    'inc_001',
    'Payment Gateway 504 Timeouts & Elevated Latency Spikes',
    'Downstream payment provider API response times exceeded 2500ms, triggering circuit breakers and failing checkout requests.',
    'P1',
    'investigating',
    'srv_payments',
    'usr_sarah',
    slaIn30Min,
    created25MinAgo
  );

  insertIncident.run(
    'inc_002',
    'Telemetry Ingestion Queue Memory Threshold Exceeded 85%',
    'ElasticSearch ingest node 03 reported heap usage spike following unthrottled batch sync from EU region.',
    'P3',
    'mitigated',
    'srv_search',
    'usr_marcus',
    new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  );

  // 5. Incident War Room Updates / Timeline
  const insertUpdate = db.prepare(`
    INSERT INTO incident_updates (id, incident_id, user_id, author_name, message, update_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUpdate.run(
    'upd_01',
    'inc_001',
    'usr_sarah',
    'Sarah Chen',
    'Declared P1 incident. Assembled War Room response team. Downstream endpoint latency is fluctuating between 2.2s and 3.8s.',
    'status_change',
    new Date(Date.now() - 24 * 60 * 1000).toISOString()
  );

  insertUpdate.run(
    'upd_02',
    'inc_001',
    'usr_marcus',
    'Marcus Vance',
    'Inspecting connection pool logs. Outbound TLS handshakes appear throttled on third-party endpoint.',
    'comment',
    new Date(Date.now() - 18 * 60 * 1000).toISOString()
  );

  insertUpdate.run(
    'upd_03',
    'inc_001',
    'usr_alex',
    'Alex Rivera',
    'Enabled dynamic retry backoff with jitter on checkout gateway to relieve upstream congestion.',
    'action_item',
    new Date(Date.now() - 10 * 60 * 1000).toISOString()
  );

  // 6. Sprint Tasks (Linear-style Kanban)
  const insertTask = db.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, assignee_id, incident_id, sprint, order_idx, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tasks = [
    {
      id: 'tsk_101',
      title: 'Implement exponential backoff on Payment webhook retry handler',
      description: 'Prevent cascading gateway timeouts when Stripe webhook endpoints throttle ingress bursts.',
      status: 'in_progress',
      priority: 'urgent',
      assignee_id: 'usr_marcus',
      incident_id: 'inc_001',
      sprint: 'Sprint 42',
      order_idx: 0
    },
    {
      id: 'tsk_102',
      title: 'Upgrade Redis cache cluster to Valkey 8.0 with cluster auto-sharding',
      description: 'Migrate stateful sessions to failover replicas with zero downtime.',
      status: 'todo',
      priority: 'high',
      assignee_id: 'usr_alex',
      incident_id: null,
      sprint: 'Sprint 42',
      order_idx: 0
    },
    {
      id: 'tsk_103',
      title: 'Deploy WebSocket heartbeat ping-pong monitor with automated auto-reconnect',
      description: 'Ensure client sockets cleanly reconnect within 500ms after edge pod rotation.',
      status: 'in_review',
      priority: 'high',
      assignee_id: 'usr_emily',
      incident_id: null,
      sprint: 'Sprint 42',
      order_idx: 0
    },
    {
      id: 'tsk_104',
      title: 'Configure Prometheus alerting rule for 99th percentile HTTP latency > 300ms',
      description: 'Set up automated PagerDuty escalation trigger when p99 breaches SLA.',
      status: 'done',
      priority: 'medium',
      assignee_id: 'usr_sarah',
      incident_id: null,
      sprint: 'Sprint 42',
      order_idx: 0
    },
    {
      id: 'tsk_105',
      title: 'Database connection pooling tune with PgBouncer max client idle timeout',
      description: 'Address ephemeral connection leaks during morning traffic spikes.',
      status: 'backlog',
      priority: 'low',
      assignee_id: 'usr_marcus',
      incident_id: null,
      sprint: 'Sprint 42',
      order_idx: 0
    }
  ];

  for (const t of tasks) {
    insertTask.run(t.id, t.title, t.description, t.status, t.priority, t.assignee_id, t.incident_id, t.sprint, t.order_idx, new Date().toISOString());
  }

  // 7. Support Tickets (OmniDesk Customer/Incident Support)
  const insertSupport = db.prepare(`
    INSERT INTO support_tickets (id, customer_name, customer_email, subject, status, priority, assigned_to, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSupport.run(
    'tkt_501',
    'Claire Underwood (Global Enterprise)',
    'c.underwood@enterprise.com',
    'Checkout failing with error code 504 on EU storefront',
    'open',
    'urgent',
    'usr_sarah',
    new Date(Date.now() - 20 * 60 * 1000).toISOString()
  );

  insertSupport.run(
    'tkt_502',
    'Devon Parker (SaaS Partner)',
    'dparker@partner.io',
    'Webhook verification signatures mismatching on v2 events',
    'pending',
    'normal',
    'usr_emily',
    new Date(Date.now() - 90 * 60 * 1000).toISOString()
  );

  const insertMsg = db.prepare(`
    INSERT INTO support_messages (id, ticket_id, sender_type, sender_name, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertMsg.run(
    'msg_1',
    'tkt_501',
    'customer',
    'Claire Underwood',
    'Our European customer payments are timing out when submitting invoice #8892. Is there an active incident?',
    new Date(Date.now() - 19 * 60 * 1000).toISOString()
  );

  insertMsg.run(
    'msg_2',
    'tkt_501',
    'agent',
    'Sarah Chen (SRE)',
    'Hello Claire, our SRE War Room is currently mitigating a gateway latency event with our upstream payment provider. Expected resolution within 20 minutes.',
    new Date(Date.now() - 12 * 60 * 1000).toISOString()
  );

  // 8. Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_name, action, entity, entity_id, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run('aud_1', 'usr_sarah', 'Sarah Chen', 'INCIDENT_TRIGGER', 'incident', 'inc_001', 'P1 Incident triggered for Payment Processing Gateway', created25MinAgo);
  insertAudit.run('aud_2', 'usr_alex', 'Alex Rivera', 'CONFIG_CHANGE', 'service', 'srv_payments', 'Updated circuit-breaker timeout threshold to 3500ms', new Date(Date.now() - 8 * 60 * 1000).toISOString());

  console.log('✔ Sample enterprise data seeded successfully!');
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
