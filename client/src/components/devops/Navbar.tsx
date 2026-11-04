import React from 'react';
import { Layers, ShieldCheck, Activity, Terminal, RotateCcw } from 'lucide-react';

interface NavbarProps {
  onRollback: () => void;
  canaryWeight: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onRollback, canaryWeight }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-dark-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-600/25">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-lg tracking-tight">Kube<span className="text-blue-400">Sphere</span></span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">OPS</span>
            </div>
          </div>
        </div>

        {/* Cluster Context Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-dark-850 border border-slate-800 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>ctx: <strong>eks-us-east-1-prod (k8s v1.30)</strong></span>
        </div>

        {/* Istio mTLS Status */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-semibold text-[11px]">Istio mTLS STRICT</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {canaryWeight > 0 && (
          <button
            onClick={onRollback}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 transition-all border border-rose-500/30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Emergency Rollback (0% Canary)</span>
          </button>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-850 border border-slate-800 text-xs text-slate-300 font-mono">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>HPA: 4/10 Pods</span>
        </div>
      </div>
    </header>
  );
};
