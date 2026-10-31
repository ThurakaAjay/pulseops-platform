import { Server as SocketIOServer, Socket } from 'socket.io';
import { db } from '../db/index.js';

interface ConnectedUser {
  socketId: string;
  userId: string;
  name: string;
  role: string;
  avatar?: string;
  activeRoom?: string;
}

export class SocketManager {
  private static instance: SocketManager;
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, ConnectedUser> = new Map();

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public init(io: SocketIOServer) {
    this.io = io;

    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);

      // Handle user presence registration
      socket.on('user:join', (userData: { userId: string; name: string; role: string; avatar?: string }) => {
        this.connectedUsers.set(socket.id, {
          socketId: socket.id,
          userId: userData.userId,
          name: userData.name,
          role: userData.role,
          avatar: userData.avatar
        });
        this.broadcastPresence();
      });

      // Handle joining specific war room or board
      socket.on('room:join', (room: string) => {
        socket.join(room);
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          user.activeRoom = room;
        }
        console.log(`[Socket] ${socket.id} joined room ${room}`);
        this.broadcastRoomPresence(room);
      });

      socket.on('room:leave', (room: string) => {
        socket.leave(room);
        const user = this.connectedUsers.get(socket.id);
        if (user && user.activeRoom === room) {
          user.activeRoom = undefined;
        }
        this.broadcastRoomPresence(room);
      });

      // Collaborative Task Drag & Drop event
      socket.on('task:move', (payload: { taskId: string; newStatus: string; orderIdx: number }) => {
        try {
          db.prepare('UPDATE tasks SET status = ?, order_idx = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(payload.newStatus, payload.orderIdx, payload.taskId);

          const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(payload.taskId);

          // Broadcast to everyone else
          socket.broadcast.emit('task:updated', updatedTask);
        } catch (err) {
          console.error('[Socket] Failed to update task:', err);
        }
      });

      // Live typing indicator in war room
      socket.on('typing:start', (data: { room: string; userName: string }) => {
        socket.to(data.room).emit('typing:status', { userName: data.userName, isTyping: true });
      });

      socket.on('typing:stop', (data: { room: string; userName: string }) => {
        socket.to(data.room).emit('typing:status', { userName: data.userName, isTyping: false });
      });

      // Disconnect
      socket.on('disconnect', () => {
        const user = this.connectedUsers.get(socket.id);
        const prevRoom = user?.activeRoom;
        this.connectedUsers.delete(socket.id);
        if (prevRoom) {
          this.broadcastRoomPresence(prevRoom);
        }
        this.broadcastPresence();
        console.log(`[Socket] Client disconnected: ${socket.id}`);
      });
    });
  }

  private broadcastPresence() {
    if (!this.io) return;
    const usersList = Array.from(this.connectedUsers.values());
    this.io.emit('presence:update', usersList);
  }

  private broadcastRoomPresence(room: string) {
    if (!this.io) return;
    const roomUsers = Array.from(this.connectedUsers.values()).filter(u => u.activeRoom === room);
    this.io.to(room).emit('room:presence', { room, users: roomUsers });
  }

  // Public broadcast methods used by API routes & background workers
  public emitTelemetry(metric: any) {
    this.io?.emit('telemetry:tick', metric);
  }

  public emitIncidentCreated(incident: any) {
    this.io?.emit('incident:created', incident);
  }

  public emitIncidentUpdate(incidentId: string, update: any) {
    this.io?.to(`incident_${incidentId}`).emit('incident:message', update);
    this.io?.emit('incident:general_update', { incidentId, update });
  }

  public emitServiceStatusChange(service: any) {
    this.io?.emit('service:status_changed', service);
  }

  public emitTaskChange(task: any) {
    this.io?.emit('task:updated', task);
  }

  public emitSupportMessage(ticketId: string, message: any) {
    this.io?.to(`ticket_${ticketId}`).emit('support:new_message', message);
    this.io?.emit('support:ticket_updated', { ticketId });
  }

  public emitChaosAlert(alert: { title: string; message: string; severity: string; timestamp: string }) {
    this.io?.emit('chaos:alert', alert);
  }
}

export const socketManager = SocketManager.getInstance();
