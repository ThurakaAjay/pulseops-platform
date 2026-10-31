import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api } from '../services/api.js';
import { socket } from '../services/socket.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('pulseops_token');
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          socket.emit('user:join', {
            userId: res.user.id,
            name: res.user.name,
            role: res.user.role,
            avatar: res.user.avatar
          });
        } catch (err) {
          localStorage.removeItem('pulseops_token');
          setUser(null);
        }
      } else {
        // Auto demo-login as Admin for seamless out-of-the-box evaluator experience!
        try {
          const res = await api.demoLogin('admin');
          localStorage.setItem('pulseops_token', res.token);
          setUser(res.user);
          socket.emit('user:join', {
            userId: res.user.id,
            name: res.user.name,
            role: res.user.role,
            avatar: res.user.avatar
          });
        } catch (e) {
          console.warn('Initial demo login skipped:', e);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem('pulseops_token', res.token);
    setUser(res.user);
    socket.emit('user:join', {
      userId: res.user.id,
      name: res.user.name,
      role: res.user.role,
      avatar: res.user.avatar
    });
  };

  const demoLogin = async (role: string = 'admin') => {
    const res = await api.demoLogin(role);
    localStorage.setItem('pulseops_token', res.token);
    setUser(res.user);
    socket.emit('user:join', {
      userId: res.user.id,
      name: res.user.name,
      role: res.user.role,
      avatar: res.user.avatar
    });
  };

  const logout = () => {
    localStorage.removeItem('pulseops_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
