import React, { useState } from 'react';
import { AlertTriangle, Zap, CheckCircle2, X, RefreshCw, Activity, Terminal } from 'lucide-react';
import { useLive } from '../context/LiveContext.js';

interface ChaosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChaosModal: React.FC<ChaosModalProps> = ({ isOpen, onClose }) => {
  const { triggerChaosSimulation, triggerTrafficSpike } = useLive();
  const [logs, setLogs] = useState<string[]>([
    'Chaos Engine ready. Select a synthetic event to trigger real-time resilience pipeline.'
  ]);
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen) return null;

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 10)]);
  };

  const handleTriggerP1Outage = async () => {
    setIsExecuting(true);
    addLog('INJECTING FAULT: Downstream payment provider simulated 504 gateway timeout...');
    addLog('EXPECTED RESULT: Payment service latency spikes to ~4800ms, status turns OUTAGE.');
    addLog('WEBSOCKET EVENT: Broad-spectrum chaos:alert broadcasted to all active dashboards.');
    
    await triggerChaosSimulation('srv_payments');
    
    setTimeout(() => {
      addLog('CIRCUIT BREAKER: Self-healing watchdog countdown active (25s).');
      setIsExecuting(false);
    }, 1200);
  };

  const handleTriggerTrafficSpike = async () => {
    setIsExecuting(true);
    addLog('INJECTING TRAFFIC: Simulating 50,000 req/sec burst across edge ingress...');
    await triggerTrafficSpike();
    setTimeout(() => {
      addLog('AUTOSCALING: Ingress buffer auto-scaled +120ms baseline jitter absorbed.');
      setIsExecuting(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-dark-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-dark-850">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Chaos & Resilience Simulation Engine</h3>
              <p className="text-xs text-slate-400">Demonstrate real-time reactivity, alert propagation & self-healing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scenario 1 */}
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm mb-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  P1 Payment Outage
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Forces Payment Gateway into failure. Watch graphs spike red, banner fire, and auto-heal in 25s.
                </p>
              </div>
              <button
                disabled={isExecuting}
                onClick={handleTriggerP1Outage}
                className="mt-4 w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
              >
                <Activity className="w-4 h-4" />
                Inject P1 Outage (25s)
              </button>
            </div>

            {/* Scenario 2 */}
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-1.5">
                  <Zap className="w-4 h-4" />
                  Traffic Burst (50k req/s)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Injects artificial latency across all microservices to test edge autoscaling indicators.
                </p>
              </div>
              <button
                disabled={isExecuting}
                onClick={handleTriggerTrafficSpike}
                className="mt-4 w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Inject Traffic Surge
              </button>
            </div>
          </div>

          {/* Real-time Event Console Log */}
          <div className="rounded-xl border border-slate-800 bg-dark-950 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                Resilience Telemetry Stream
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
            </div>
            <div className="h-32 overflow-y-auto space-y-1.5 font-mono text-[11px] text-slate-300">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={
                    log.includes('INJECTING') || log.includes('504')
                      ? 'text-rose-400'
                      : log.includes('CIRCUIT') || log.includes('AUTOSCALING')
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-dark-850 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Tip: Open two browser tabs to see instantaneous WebSocket synchronization.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
