export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sre' | 'engineer' | 'viewer';
  avatar?: string;
  title?: string;
  created_at?: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  url: string;
  status: 'operational' | 'degraded' | 'outage';
  latency_ms: number;
  uptime_pct: number;
  environment: 'production' | 'staging';
  last_checked: string;
}

export interface ServiceMetricPoint {
  latency_ms: number;
  status_code: number;
  timestamp: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'triggered' | 'investigating' | 'mitigated' | 'resolved';
  service_id: string;
  service_name?: string;
  service_category?: string;
  service_url?: string;
  lead_id?: string;
  lead_name?: string;
  lead_avatar?: string;
  lead_title?: string;
  sla_deadline?: string;
  mitigated_at?: string;
  resolved_at?: string;
  created_at: string;
  updates_count?: number;
}

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  user_id?: string;
  author_name: string;
  author_avatar?: string;
  author_role?: string;
  message: string;
  update_type: 'status_change' | 'comment' | 'action_item';
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  assignee_id?: string;
  assignee_name?: string;
  assignee_avatar?: string;
  incident_id?: string;
  incident_title?: string;
  incident_severity?: 'P1' | 'P2' | 'P3' | 'P4';
  sprint: string;
  order_idx: number;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  customer_name: string;
  customer_email: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved';
  priority: 'urgent' | 'normal';
  assigned_to?: string;
  assigned_name?: string;
  assigned_avatar?: string;
  message_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: 'customer' | 'agent';
  sender_name: string;
  message: string;
  created_at: string;
}

export interface AnalyticsOverview {
  healthScore: number;
  services: {
    total: number;
    operational: number;
    degraded: number;
    outage: number;
    avgUptime: number;
    avgLatency: number;
  };
  incidents: {
    total: number;
    active: number;
    p1Active: number;
    resolved: number;
    mttrMinutes: number;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    completionRate: number;
  };
}

export interface ChaosAlert {
  id?: string;
  title: string;
  message: string;
  severity: string;
  timestamp: string;
}
