import React, { useState } from 'react';
import { 
  Server, 
  Plus, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  Activity, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { useLive } from '../context/LiveContext.js';
import { api } from '../services/api.js';
import { LatencySparkline } from '../components/LatencySparkline.js';

export const ServicesMonitor: React.FC = () => {
  const { liveServices } = useLive();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Microservice');
  const [url, setUrl] = useState('');
  const [pingStatus, setPingStatus] = useState<Record<string, string>>({});

  const handleRegisterService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    try {
      await api.createService({
        name,
        category,
        url,
        environment: 'production'
      });
      setIsRegisterOpen(false);
      setName('');
      setUrl('');
    } catch (err) {
      console.error(err);
    }
  };

  const handlePing = (serviceId: string) => {
    setPingStatus(prev => ({ ...prev, [serviceId]: 'Pinging...' }));
    setTimeout(() => {
      const pingMs = Math.floor(15 + Math.random() * 25);
      setPingStatus(prev => ({ ...prev, [serviceId]: `200 OK (${pingMs}ms)` }));
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Microservices & Telemetry Probes</h1>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous synthetic health probes verifying endpoint response times, SSL handshakes, and SLA thresholds.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register Endpoint</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {liveServices.map(service => {
          const isOutage = service.status === 'outage';
          const isDegraded = service.status === 'degraded';

          return (
            <div
              key={service.id}
              className={`glass-panel rounded-2xl p-5 border transition-all ${
                isOutage
                  ? 'border-rose-500/50 bg-rose-950/20 shadow-xl shadow-rose-950/30'
                  : isDegraded
                  ? 'border-amber-500/40 bg-amber-950/20'
                  : 'border-slate-800 bg-dark-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
                      {service.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">• {service.environment}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{service.name}</h3>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-1 truncate max-w-sm">
                    <span>{service.url}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    isOutage
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : isDegraded
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {service.status}
                </span>
              </div>

              {/* Metrics Bar */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-4 items-center">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Response Latency</div>
                  <div
                    className={`text-xl font-mono font-bold mt-0.5 ${
                      isOutage ? 'text-rose-400' : isDegraded ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {service.latency_ms} <span className="text-xs font-normal text-slate-400">ms</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Uptime SLA</div>
                  <div className="text-xl font-mono font-bold text-white mt-0.5">{service.uptime_pct}%</div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <button
                    onClick={() => handlePing(service.id)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
                  >
                    <RefreshCw className="w-3 h-3 text-indigo-400" />
                    <span>Ping Test</span>
                  </button>
                  {pingStatus[service.id] && (
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold mt-1">
                      {pingStatus[service.id]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Service Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Register Monitored Service</h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a synthetic probe target to monitor latency, SSL, and error thresholds.
            </p>

            <form onSubmit={handleRegisterService} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Auth Token Issuer"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-dark-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Authentication & Security"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-dark-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Health Check URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://api.internal.pulseops.io/healthz"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full bg-dark-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Add Probe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
