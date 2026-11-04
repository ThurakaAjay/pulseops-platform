import React from 'react';
import { GitBranch, CheckCircle2, AlertTriangle, ArrowRight, Code2, Zap } from 'lucide-react';

interface CanaryControllerProps {
  canaryWeight: number;
  setCanaryWeight: (weight: number) => void;
  onPromote: () => void;
  onRollback: () => void;
}

export const CanaryTrafficController: React.FC<CanaryControllerProps> = ({
  canaryWeight,
  setCanaryWeight,
  onPromote,
  onRollback
}) => {
  const stableWeight = 100 - canaryWeight;

  return (
    <div className="k8s-card rounded-2xl p-6 border border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Istio Canary Traffic Routing (VirtualService)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic weight-based traffic shifting between Stable (v1.0.0) and Canary (v2.0.0) with zero downtime.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRollback}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
          >
            Rollback (0%)
          </button>
          <button
            onClick={onPromote}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
          >
            Promote to 100%
          </button>
        </div>
      </div>

      {/* Traffic Distribution Splitter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Stable v1 Card */}
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-mono">
              Subset: v1 (Stable)
            </span>
            <span className="text-xs font-mono font-bold text-white bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
              {stableWeight}% TRAFFIC
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold text-white font-mono">{stableWeight}%</div>
              <div className="text-[11px] text-slate-400">ghcr.io/.../order-service:v1.0.0</div>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              <div>p99 Latency: <strong className="text-emerald-400 font-mono">22ms</strong></div>
              <div>5xx Errors: <strong className="text-emerald-400 font-mono">0.01%</strong></div>
            </div>
          </div>
        </div>

        {/* Canary v2 Card */}
        <div className={`p-4 rounded-xl border transition-all ${
          canaryWeight > 0
            ? 'border-indigo-500/40 bg-indigo-500/5 shadow-lg shadow-indigo-950/30'
            : 'border-slate-800 bg-dark-900/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
              Subset: v2 (Canary)
            </span>
            <span className="text-xs font-mono font-bold text-white bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
              {canaryWeight}% TRAFFIC
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold text-indigo-300 font-mono">{canaryWeight}%</div>
              <div className="text-[11px] text-slate-400">ghcr.io/.../order-service:v2.0.0-canary</div>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              <div>p99 Latency: <strong className="text-emerald-400 font-mono">24ms</strong></div>
              <div>5xx Errors: <strong className="text-emerald-400 font-mono">0.00%</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Shift Range Slider */}
      <div className="p-4 rounded-xl bg-dark-950/60 border border-slate-800 mb-6">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-blue-400 font-mono">v1: {stableWeight}%</span>
          <span className="text-slate-400 text-[11px]">Slide to shift live ingress traffic</span>
          <span className="text-indigo-400 font-mono">v2 (Canary): {canaryWeight}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={canaryWeight}
          onChange={e => setCanaryWeight(Number(e.target.value))}
          className="w-full h-2 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
          <span>0% (Off)</span>
          <span>10% (Baseline)</span>
          <span>25%</span>
          <span>50% (Split)</span>
          <span>100% (Full Release)</span>
        </div>
      </div>

      {/* Live Istio VirtualService YAML preview */}
      <div className="rounded-xl border border-slate-800 bg-dark-950 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Code2 className="w-4 h-4 text-blue-400" />
            <span>Generated Istio VirtualService (Live Sync)</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            APPLIED TO CLUSTER
          </span>
        </div>
        <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto p-3 rounded-lg bg-dark-900/80 border border-slate-800/80">
{`apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service-vs
spec:
  hosts:
    - order-service
  http:
    - route:
        - destination:
            host: order-service
            subset: v1
          weight: ${stableWeight}
        - destination:
            host: order-service
            subset: v2
          weight: ${canaryWeight}`}
        </pre>
      </div>
    </div>
  );
};
