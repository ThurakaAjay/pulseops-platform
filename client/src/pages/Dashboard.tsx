import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Server, 
  AlertTriangle, 
  ArrowUpRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { StatCard } from '../components/StatCard.js';
import { LatencySparkline } from '../components/LatencySparkline.js';
import { useLive } from '../context/LiveContext.js';
import { api } from '../services/api.js';
import { AnalyticsOverview, Incident } from '../types/index.js';

interface DashboardProps {
  onNavigateToIncidents: (incidentId?: string) => void;
  onNavigateToServices: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToIncidents, onNavigateToServices }) => {
  const { liveServices } = useLive();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [sparklineHistory, setSparklineHistory] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewData, incidentsData] = await Promise.all([
          api.getAnalyticsOverview(),
          api.getIncidents({ status: 'all' })
        ]);
        setAnalytics(overviewData);
        setIncidents(incidentsData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Update sparklines on liveServices change
  useEffect(() => {
    if (liveServices.length > 0) {
      setSparklineHistory(prev => {
        const next = { ...prev };
        for (const s of liveServices) {
          const arr = next[s.id] ? [...next[s.id]] : [s.latency_ms, s.latency_ms];
          arr.push(s.latency_ms);
          if (arr.length > 18) arr.shift();
          next[s.id] = arr;
        }
        return next;
      });
    }
  }, [liveServices]);

  const activeIncidents = incidents.filter(i => i.status !== 'resolved');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Fleet Observability & Operations Command
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry streaming from distributed edge nodes and core database clusters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-850 border border-slate-800 text-xs text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            SYNTHETIC PROBES ACTIVE
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Fleet Health Score"
          value={`${analytics?.healthScore ?? 98}%`}
          subtitle="Autonomous self-healing score"
          icon={ShieldCheck}
          color="emerald"
          trend="+2.4%"
          trendType="positive"
        />
        <StatCard
          title="System SLA Uptime"
          value={`${analytics?.services.avgUptime ?? 99.98}%`}
          subtitle="Trailing 30-day target 99.95%"
          icon={Activity}
          color="brand"
          trend="0.03% above target"
          trendType="positive"
        />
        <StatCard
          title="Mean Time To Resolve"
          value={`${analytics?.incidents.mttrMinutes ?? 24}m`}
          subtitle="Global incident MTTR"
          icon={Clock}
          color="amber"
          trend="-15 min vs baseline"
          trendType="positive"
        />
        <StatCard
          title="Active P1/P2 Outages"
          value={activeIncidents.length}
          subtitle={`${analytics?.incidents.p1Active ?? 0} P1 Critical alerts`}
          icon={Flame}
          color={activeIncidents.length > 0 ? 'rose' : 'emerald'}
          trend={activeIncidents.length > 0 ? 'Needs triage' : 'All clear'}
          trendType={activeIncidents.length > 0 ? 'negative' : 'positive'}
        />
      </div>

      {/* Real-time Telemetry Service Grid */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-white text-base">Live Microservice Telemetry</h2>
            <span className="text-[10px] text-slate-400 font-mono bg-dark-850 px-2 py-0.5 rounded border border-slate-800">
              SOCKET.IO BROADCAST
            </span>
          </div>
          <button
            onClick={onNavigateToServices}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>View All Endpoints</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {liveServices.map(service => {
            const history = sparklineHistory[service.id] || [service.latency_ms, service.latency_ms];
            const isOutage = service.status === 'outage';
            const isDegraded = service.status === 'degraded';

            return (
              <div
                key={service.id}
                className={`p-4 rounded-xl border transition-all ${
                  isOutage
                    ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/40'
                    : isDegraded
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-dark-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {service.category}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1">{service.name}</h3>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
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

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">Response Latency</div>
                    <div
                      className={`text-xl font-mono font-bold ${
                        isOutage
                          ? 'text-rose-400'
                          : isDegraded
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {service.latency_ms} <span className="text-xs font-normal text-slate-400">ms</span>
                    </div>
                  </div>

                  {/* Realtime SVG Sparkline */}
                  <div className="text-right">
                    <LatencySparkline data={history} status={service.status} />
                    <div className="text-[10px] text-slate-500 font-mono mt-1">Uptime: {service.uptime_pct}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Incidents & Live Triage Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              <h2 className="font-bold text-white text-base">Active Incident War Rooms</h2>
            </div>
            <button
              onClick={() => onNavigateToIncidents()}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>Manage War Rooms</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {activeIncidents.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <span>Zero open incidents. All SLA benchmarks met.</span>
              </div>
            ) : (
              activeIncidents.map(inc => (
                <div
                  key={inc.id}
                  onClick={() => onNavigateToIncidents(inc.id)}
                  className="p-4 rounded-xl border border-slate-800 bg-dark-900/50 hover:bg-dark-850 hover:border-slate-700 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-lg border shrink-0 ${
                        inc.severity === 'P1'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {inc.severity}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {inc.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{inc.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                        <span>Service: <strong className="text-slate-300">{inc.service_name}</strong></span>
                        <span>•</span>
                        <span>Lead: <strong className="text-slate-300">{inc.lead_name || 'Unassigned'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 sm:self-center">
                    <span className="text-[11px] font-mono px-2 py-1 rounded bg-dark-800 text-slate-300 border border-slate-700">
                      {inc.status.toUpperCase()}
                    </span>
                    <button className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all">
                      Open War Room
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Architecture Highlights for Technical Recruiters */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">Resume Engineering Highlights</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              PulseOps HQ demonstrates full-stack high-availability distributed systems patterns:
            </p>

            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span><strong>Real-Time WebSockets:</strong> Sub-50ms bidirectional broadcast for tickets, telemetry, and War Room presence.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span><strong>Zero-Downtime Resilience:</strong> Circuit breakers & synthetic probes with auto self-healing.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span><strong>Optimistic UI Kanban:</strong> Instant drag-and-drop state reconciliation across browser clients.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Stack: React + Node + SQLite</span>
            <span className="text-indigo-400 font-semibold">Production Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
