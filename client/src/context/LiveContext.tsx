import React, { createContext, useContext, useState, useEffect } from 'react';
import { socket } from '../services/socket.js';
import { Service, ChaosAlert } from '../types/index.js';

interface PresenceUser {
  socketId: string;
  userId: string;
  name: string;
  role: string;
  avatar?: string;
  activeRoom?: string;
}

interface LiveContextType {
  onlineUsers: PresenceUser[];
  liveServices: Service[];
  activeAlert: ChaosAlert | null;
  dismissAlert: () => void;
  triggerChaosSimulation: (serviceId?: string) => Promise<void>;
  triggerTrafficSpike: () => Promise<void>;
}

const LiveContext = createContext<LiveContextType | undefined>(undefined);

export const LiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [liveServices, setLiveServices] = useState<Service[]>([]);
  const [activeAlert, setActiveAlert] = useState<ChaosAlert | null>(null);

  useEffect(() => {
    // 1. Presence
    socket.on('presence:update', (users: PresenceUser[]) => {
      setOnlineUsers(users);
    });

    // 2. Real-time telemetry tick (every 4 seconds from backend)
    socket.on('telemetry:tick', (services: Service[]) => {
      setLiveServices(services);
    });

    // 3. Chaos alert broadcast
    socket.on('chaos:alert', (alert: ChaosAlert) => {
      setActiveAlert(alert);
    });

    // 4. Service status change
    socket.on('service:status_changed', (updatedService: Service) => {
      setLiveServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
    });

    return () => {
      socket.off('presence:update');
      socket.off('telemetry:tick');
      socket.off('chaos:alert');
      socket.off('service:status_changed');
    };
  }, []);

  const dismissAlert = () => setActiveAlert(null);

  const triggerChaosSimulation = async (serviceId: string = 'srv_payments') => {
    try {
      await fetch('/api/simulate/chaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: serviceId, duration_seconds: 25 })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const triggerTrafficSpike = async () => {
    try {
      await fetch('/api/simulate/traffic-spike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <LiveContext.Provider
      value={{
        onlineUsers,
        liveServices,
        activeAlert,
        dismissAlert,
        triggerChaosSimulation,
        triggerTrafficSpike
      }}
    >
      {children}
    </LiveContext.Provider>
  );
};

export const useLive = () => {
  const context = useContext(LiveContext);
  if (!context) throw new Error('useLive must be used within LiveProvider');
  return context;
};
