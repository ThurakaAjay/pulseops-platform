import React, { useState } from 'react';
import { Activity, ShieldAlert, Zap, Users, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useLive } from '../context/LiveContext.js';

interface NavbarProps {
  onOpenChaos: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenChaos }) => {
  const { user, demoLogin } = useAuth();
  const { onlineUsers, liveServices } = useLive();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const hasOutage = liveServices.some(s => s.status === 'outage');
  const hasDegraded = liveServices.some(s => s.status === 'degraded');

  const demoRoles = [
    { role: 'admin', label: 'Alex Rivera', title: 'Principal SRE (Admin)' },
    { role: 'sre', label: 'Sarah Chen', title: 'Staff Incident Commander' },
    { role: 'engineer', label: 'Marcus Vance', title: 'Senior Backend Engineer' }
  ];

  return (
    <header className="h-16 border-b border-slate-800/80 bg-dark-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Brand & Status Pill */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-lg tracking-tight">Pulse<span className="text-indigo-400">Ops</span></span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">HQ</span>
            </div>
          </div>
        </div>

        {/* Global Live System Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border bg-dark-850">
          {hasOutage ? (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> P1 System Outage Active
              </span>
            </>
          ) : hasDegraded ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 font-semibold">Service Performance Degraded</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Systems 99.98% Nominal
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Actions, Presence, and Profile */}
      <div className="flex items-center gap-4">
        {/* Real-time Presence Avatars */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-850 border border-slate-800">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex -space-x-1.5 overflow-hidden">
            {onlineUsers.slice(0, 3).map((u, i) => (
              <img
                key={i}
                src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.userId}`}
                alt={u.name}
                title={`${u.name} (${u.role})`}
                className="inline-block h-5 w-5 rounded-full ring-2 ring-dark-900 object-cover"
              />
            ))}
          </div>
          <span className="text-xs text-slate-300 font-medium">
            {onlineUsers.length} <span className="text-slate-500">live</span>
          </span>
        </div>

        {/* Chaos Injection Simulator Button */}
        <button
          onClick={onOpenChaos}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600/90 to-amber-600/90 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/30 transition-all border border-rose-400/20 active:scale-95"
        >
          <Zap className="w-3.5 h-3.5 animate-bounce" />
          <span>Chaos Simulator</span>
        </button>

        {/* Demo Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-dark-800 border border-transparent hover:border-slate-800 transition-all text-left"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
            />
            <div className="hidden lg:block">
              <div className="text-xs font-bold text-white leading-none">{user?.name || 'Alex Rivera'}</div>
              <div className="text-[10px] text-indigo-400 font-medium mt-0.5 uppercase tracking-wider">{user?.role || 'admin'}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-dark-900 border border-slate-700/80 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Demo Persona
              </div>
              {demoRoles.map(r => (
                <button
                  key={r.role}
                  onClick={() => {
                    demoLogin(r.role);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-indigo-600/20 transition-colors ${
                    user?.role === r.role ? 'bg-indigo-600/10 text-indigo-300 font-semibold' : 'text-slate-300'
                  }`}
                >
                  <span className="font-bold text-white">{r.label}</span>
                  <span className="text-[10px] text-slate-400">{r.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
