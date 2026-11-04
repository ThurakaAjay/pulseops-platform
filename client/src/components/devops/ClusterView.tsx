import React, { useState } from 'react';
import { Server, Cpu, HardDrive, ShieldCheck, Skull, RefreshCw, CheckCircle2 } from 'lucide-react';

interface Pod {
  id: string;
  name: string;
  node: string;
  status: 'Running' | 'Terminating' | 'Pending';
  version: string;
  restarts: number;
  cpu: string;
  memory: string;
}

export const ClusterView: React.FC = () => {
  const [pods, setPods] = useState<Pod[]>([
    { id: 'p1', name: 'api-gateway-7f89d4-abc1', node: 'ip-10-0-10-12 (us-east-1a)', status: 'Running', version: 'v1.0.0', restarts: 0, cpu: '45m', memory: '84Mi' },
    { id: 'p2', name: 'auth-service-59bc67-x89f', node: 'ip-10-0-20-44 (us-east-1b)', status: 'Running', version: 'v1.0.0', restarts: 0, cpu: '32m', memory: '62Mi' },
    { id: 'p3', name: 'order-service-v1-88fc21-12cd', node: 'ip-10-0-10-12 (us-east-1a)', status: 'Running', version: 'v1.0.0', restarts: 0, cpu: '88m', memory: '112Mi' },
    { id: 'p4', name: 'order-service-v1-88fc21-44eb', node: 'ip-10-0-30-89 (us-east-1c)', status: 'Running', version: 'v1.0.0', restarts: 1, cpu: '76m', memory: '108Mi' },
    { id: 'p5', name: 'order-service-v2-canary-5f78-98de', node: 'ip-10-0-20-44 (us-east-1b)', status: 'Running', version: 'v2.0.0', restarts: 0, cpu: '42m', memory: '95Mi' },
    { id: 'p6', name: 'istio-ingressgateway-69db-zz71', node: 'ip-10-0-10-12 (us-east-1a)', status: 'Running', version: '1.22.0', restarts: 0, cpu: '110m', memory: '140Mi' }
  ]);

  const [chaosLog, setChaosLog] = useState<string | null>(null);

  const handleKillPod = (podId: string) => {
    const target = pods.find(p => p.id === podId);
    if (!target) return;

    setChaosLog(`[CHAOS] Sent SIGKILL to ${target.name}. Kubernetes ReplicaSet engaged.`);
    
    // Mark as Terminating
    setPods(prev => prev.map(p => p.id === podId ? { ...p, status: 'Terminating' } : p));

    // After 1.2s, replace with new pod in Pending
    setTimeout(() => {
      const newPodId = `p_${Date.now()}`;
      const newName = `${target.name.split('-')[0]}-${Math.random().toString(36).substring(2, 6)}`;
      
      setPods(prev => [
        ...prev.filter(p => p.id !== podId),
        {
          id: newPodId,
          name: newName,
          node: target.node,
          status: 'Pending',
          version: target.version,
          restarts: 0,
          cpu: '15m',
          memory: '40Mi'
        }
      ]);
      setChaosLog(`[RECOVERY] Kubernetes scheduler assigned new pod ${newName}. Initializing containers...`);

      // After 2.5s, turn Running
      setTimeout(() => {
        setPods(prev => prev.map(p => p.id === newPodId ? { ...p, status: 'Running' } : p));
        setChaosLog(`[HEALTHY] Pod ${newName} readiness probe returned 200 OK. Traffic route established.`);
      }, 2500);
    }, 1200);
  };

  return (
    <div className="k8s-card rounded-2xl p-6 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Kubernetes Pod Matrix & Self-Healing Scheduler</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time replica supervision across AWS EKS Spot and On-Demand worker nodes.
          </p>
        </div>

        {chaosLog && (
          <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{chaosLog}</span>
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <th className="pb-3">Pod Identifier</th>
              <th className="pb-3">Placement Node</th>
              <th className="pb-3">Version</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">CPU / Memory</th>
              <th className="pb-3 text-right">Self-Healing Demo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {pods.map(pod => (
              <tr key={pod.id} className="hover:bg-dark-850/50 transition-colors">
                <td className="py-3 font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{pod.name}</span>
                  </div>
                </td>
                <td className="py-3 text-slate-400 text-[11px]">{pod.node}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    pod.version === 'v2.0.0'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                  }`}>
                    {pod.version}
                  </span>
                </td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    pod.status === 'Running'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : pod.status === 'Pending'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                  }`}>
                    {pod.status}
                  </span>
                </td>
                <td className="py-3 text-slate-400 text-[11px]">
                  {pod.cpu} / {pod.memory}
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => handleKillPod(pod.id)}
                    disabled={pod.status !== 'Running'}
                    className="px-2.5 py-1 bg-dark-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 rounded border border-slate-700 hover:border-rose-500/40 text-[10px] font-semibold transition-all inline-flex items-center gap-1 disabled:opacity-40"
                    title="Simulate container crash to trigger Kubernetes auto-restart"
                  >
                    <Skull className="w-3 h-3 text-rose-400" />
                    <span>Kill Pod</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
