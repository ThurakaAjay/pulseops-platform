const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('pulseops_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
    return res.json();
  },

  demoLogin: async (role: string = 'admin') => {
    const res = await fetch(`${API_BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Demo login failed');
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Session expired');
    return res.json();
  },

  getUsers: async () => {
    const res = await fetch(`${API_BASE}/auth/users`, { headers: getHeaders() });
    return res.json();
  },

  // Services
  getServices: async () => {
    const res = await fetch(`${API_BASE}/services`, { headers: getHeaders() });
    return res.json();
  },

  getServiceDetail: async (id: string) => {
    const res = await fetch(`${API_BASE}/services/${id}`, { headers: getHeaders() });
    return res.json();
  },

  createService: async (data: { name: string; category: string; url: string; environment?: string }) => {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Incidents
  getIncidents: async (filter?: { status?: string; severity?: string }) => {
    const query = new URLSearchParams();
    if (filter?.status) query.set('status', filter.status);
    if (filter?.severity) query.set('severity', filter.severity);
    const res = await fetch(`${API_BASE}/incidents?${query.toString()}`, { headers: getHeaders() });
    return res.json();
  },

  getIncidentDetail: async (id: string) => {
    const res = await fetch(`${API_BASE}/incidents/${id}`, { headers: getHeaders() });
    return res.json();
  },

  createIncident: async (data: { title: string; description: string; severity: string; service_id: string; lead_id?: string }) => {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  postIncidentUpdate: async (incidentId: string, data: { user_id?: string; author_name: string; message: string; update_type?: string }) => {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/updates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateIncidentStatus: async (incidentId: string, status: string, user_id?: string, author_name?: string) => {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, user_id, author_name })
    });
    return res.json();
  },

  // Tasks (Linear-style Kanban)
  getTasks: async (sprint?: string) => {
    const query = sprint ? `?sprint=${encodeURIComponent(sprint)}` : '';
    const res = await fetch(`${API_BASE}/tasks${query}`, { headers: getHeaders() });
    return res.json();
  },

  createTask: async (data: any) => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateTask: async (id: string, updates: any) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  deleteTask: async (id: string) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // Support
  getSupportTickets: async () => {
    const res = await fetch(`${API_BASE}/support/tickets`, { headers: getHeaders() });
    return res.json();
  },

  getTicketDetail: async (id: string) => {
    const res = await fetch(`${API_BASE}/support/tickets/${id}`, { headers: getHeaders() });
    return res.json();
  },

  sendTicketMessage: async (ticketId: string, data: { sender_type: string; sender_name: string; message: string }) => {
    const res = await fetch(`${API_BASE}/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Analytics
  getAnalyticsOverview: async () => {
    const res = await fetch(`${API_BASE}/analytics/overview`, { headers: getHeaders() });
    return res.json();
  },

  // Chaos Simulation
  triggerChaos: async (serviceId: string = 'srv_payments', durationSeconds: number = 25) => {
    const res = await fetch(`${API_BASE}/simulate/chaos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ service_id: serviceId, duration_seconds: durationSeconds })
    });
    return res.json();
  },

  triggerTrafficSpike: async () => {
    const res = await fetch(`${API_BASE}/simulate/traffic-spike`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  }
};
