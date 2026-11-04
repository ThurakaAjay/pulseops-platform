import React, { useState } from 'react';
import { CanaryTrafficController } from '../components/devops/CanaryTrafficController.js';
import { ClusterView } from '../components/devops/ClusterView.js';
import { PipelineVisualizer } from '../components/devops/PipelineVisualizer.js';
import { TerraformDriftViewer } from '../components/devops/TerraformDriftViewer.js';
import { Layers, GitBranch, Server, Play, Cloud, ShieldCheck } from 'lucide-react';

export const DevOpsPlatform: React.FC = () => {
  const [canaryWeight, setCanaryWeight] = useState(10);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'canary' | 'cluster' | 'cicd' | 'terraform'>('all');

  const handlePromote = () => setCanaryWeight(100);
  const handleRollback = () => setCanaryWeight(0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Kubernetes GitOps & Service Mesh Control Plane
            </h1>
            <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md">
              K8S v1.30
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise infrastructure orchestration: Istio Canary progressive delivery, AWS EKS self-healing pods, GitHub Actions CI/CD, and Terraform IaC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-850 border border-slate-800 text-xs text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ISTIO mTLS STRICT
          </span>
        </div>
      </div>

      {/* Quick Sub-Navigation Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Complete DevOps Suite', icon: Layers },
          { id: 'canary', label: 'Istio Canary Shifter', icon: GitBranch },
          { id: 'cluster', label: 'Kubernetes Pod Matrix', icon: Server },
          { id: 'cicd', label: 'CI/CD Pipeline', icon: Play },
          { id: 'terraform', label: 'Terraform Cloud FinOps', icon: Cloud }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-dark-850 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cluster Availability</p>
          <h3 className="text-2xl font-bold text-white font-mono mt-1">99.99%</h3>
          <p className="text-[11px] text-emerald-400 mt-1">AWS EKS multi-AZ redundant</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Canary Traffic Weight</p>
          <h3 className="text-2xl font-bold text-indigo-400 font-mono mt-1">{canaryWeight}%</h3>
          <p className="text-[11px] text-slate-400 mt-1">{100 - canaryWeight}% Stable v1</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supervised Pod Replicas</p>
          <h3 className="text-2xl font-bold text-blue-400 font-mono mt-1">6 / 6</h3>
          <p className="text-[11px] text-emerald-400 mt-1">HPA autoscaler active</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimated AWS Spend</p>
          <h3 className="text-2xl font-bold text-white font-mono mt-1">$241.40</h3>
          <p className="text-[11px] text-emerald-400 mt-1">Spot node pools optimized</p>
        </div>
      </div>

      {/* Content Sections */}
      {(activeSubTab === 'all' || activeSubTab === 'canary') && (
        <CanaryTrafficController
          canaryWeight={canaryWeight}
          setCanaryWeight={setCanaryWeight}
          onPromote={handlePromote}
          onRollback={handleRollback}
        />
      )}

      {(activeSubTab === 'all' || activeSubTab === 'cluster') && (
        <ClusterView />
      )}

      {(activeSubTab === 'all' || activeSubTab === 'cicd') && (
        <PipelineVisualizer />
      )}

      {(activeSubTab === 'all' || activeSubTab === 'terraform') && (
        <TerraformDriftViewer />
      )}
    </div>
  );
};
