import express from 'express';
import http from 'node:http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { initDatabase } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import { socketManager } from './services/socketManager.js';
import { monitorEngine } from './services/monitorEngine.js';

import authRouter from './routes/auth.js';
import servicesRouter from './routes/services.js';
import incidentsRouter from './routes/incidents.js';
import tasksRouter from './routes/tasks.js';
import supportRouter from './routes/support.js';
import analyticsRouter from './routes/analytics.js';
import simulateRouter from './routes/simulate.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize Database & Seed
initDatabase();
seedDatabase();

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/services', servicesRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/support', supportRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/simulate', simulateRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Create HTTP and WebSocket server
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Initialize real-time managers
socketManager.init(io);
monitorEngine.start(4000); // 4-second telemetry tick

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 PulseOps Real-Time Server running on http://localhost:${PORT}`);
  console.log(`⚡ WebSocket Engine listening on port ${PORT}`);
  console.log(`📊 Native SQLite Database Connected`);
  console.log(`====================================================`);
});
