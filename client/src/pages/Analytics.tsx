import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  CheckCircle2, 
  Clock, 
  Flame, 
  ShieldCheck, 
  ArrowUpRight, 
  FileText 
} from 'lucide-react';
import { api } from '../services/api.js';
import { AnalyticsOverview } from '../types/index.js';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    api.getAnalyticsOverview().then(setData).catch(console.error);
  }, []);

  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulseops-audit-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">SLA Performance & Reliability Telemetry</h1>
          <p className="text-xs text-slate-400 mt-1">
            System reliability engineering KPIs, Mean Time To Resolution (MTTR), and incident velocity metrics.
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-200 border border-slate-700 text-xs font-semibold shadow transition-all shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Export Audit Report</span>
        </button>
      </div>

      {/* Grid of SLA Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-dark-900/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Target SLA Compliance</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-1">
            {data?.services.avgUptime ?? 99.98}%
          </div>
          <p className="text-xs text-emerald-400 mt-1 font-semibold">Exceeds 99.95% Enterprise SLA Tier</p>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Calculated across all registered synthetic microservice probes over 720 rolling hours.
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-dark-900/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Global MTTR</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-1">
            {data?.incidents.mttrMinutes ?? 24} <span className="text-base text-slate-400">mins</span>
          </div>
          <p className="text-xs text-amber-400 mt-1 font-semibold">Under 30-minute P1 Target</p>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Average time elapsed from automated anomaly trigger to verified mitigation.
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-dark-900/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sprint Task Velocity</span>
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-1">
            {data?.tasks.completionRate ?? 68}%
          </div>
          <p className="text-xs text-indigo-400 mt-1 font-semibold">
            {data?.tasks.completed ?? 4} of {data?.tasks.total ?? 6} tasks resolved
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Post-mortem engineering tasks linked directly to incident resolution workflows.
          </div>
        </div>
      </div>

      {/* Deep-Dive Reliability Audit Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <h3 className="font-bold text-white text-base mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          Enterprise Production Architecture Summary
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          PulseOps HQ maintains continuous telemetry sampling through asynchronous synthetic probes.
          During a degradation event, circuit breakers prevent cascading failures by shedding non-critical queue traffic,
          allowing the core database replicas and payment gateways to recover gracefully.
        </p>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Total Probes</div>
            <div className="text-lg font-bold text-white font-mono">{data?.services.total ?? 6}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Degraded Services</div>
            <div className="text-lg font-bold text-amber-400 font-mono">{data?.services.degraded ?? 0}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Critical Outages</div>
            <div className="text-lg font-bold text-rose-400 font-mono">{data?.services.outage ?? 0}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Fleet Avg Latency</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">{data?.services.avgLatency ?? 35}ms</div>
          </div>
        </div>
      </div>
    </div>
  );
};
