import React, { useState } from 'react';
import { Play, CheckCircle2, Terminal, ShieldAlert, GitCommit, Clock, ExternalLink } from 'lucide-react';

export const PipelineVisualizer: React.FC = () => {
  const [activeStage, setActiveStage] = useState(0);

  const stages = [
    {
      id: 0,
      name: '1. Quality & Tests',
      time: '24s',
      status: 'success',
      logs: [
        '[INFO] Checking out commit c27d62c (branch: main)',
        '[INFO] Setting up Node.js 22.10 environment',
        '[TEST] Running Jest suite on /services/api-gateway (14 tests passed)',
        '[TEST] Running Mocha suite on /services/order-service (22 tests passed)',
        '✔ 100% assertions passed. Code coverage: 94.2%'
      ]
    },
    {
      id: 1,
      name: '2. Trivy Security Scan',
      time: '18s',
      status: 'success',
      logs: [
        '[SECURITY] Executing Aqua Security Trivy container vulnerability scanner',
        '[SCAN] Analyzing base image: node:22-alpine',
        '[SCAN] Checking CVE database (NVD & GitHub Advisory Database)',
        '✔ 0 CRITICAL vulnerabilities detected',
        '✔ 0 HIGH vulnerabilities detected',
        '✔ Security Gate Passed: Build authorized for image packaging'
      ]
    },
    {
      id: 2,
      name: '3. Docker Buildx',
      time: '42s',
      status: 'success',
      logs: [
        '[DOCKER] Initializing Buildx builder: multi-arch-builder',
        '[DOCKER] Building target: linux/amd64, linux/arm64',
        '[DOCKER] Stripping development dependencies via multi-stage runner',
        '[DOCKER] Image size reduced: 890MB -> 68.4MB',
        '[DOCKER] Pushed tag: ghcr.io/thurakaajay/kubesphere-order-service:v2.0.0-canary (SHA256: 7f89d1)'
      ]
    },
    {
      id: 3,
      name: '4. Helm & Kubeconform',
      time: '12s',
      status: 'success',
      logs: [
        '[K8S] Validating templates against official Kubernetes v1.30 OpenAPI specs',
        '[HELM] Linting helm/kubesphere-chart...',
        '✔ 1 chart(s) linted, 0 chart(s) failed',
        '[VALIDATE] Checking PodDisruptionBudget & HorizontalPodAutoscaler constraints',
        '✔ All 8 manifests validated with ZERO drift detected'
      ]
    },
    {
      id: 4,
      name: '5. Canary Rollout',
      time: '8s',
      status: 'success',
      logs: [
        '[GITOPS] Applying VirtualService update to cluster namespace: kubesphere-production',
        '[ISTIO] Establishing traffic split: 90% Stable (v1) / 10% Canary (v2)',
        '[PROMETHEUS] Prometheus AlertManager watchdog armed (Error threshold: 5xx > 1%)',
        '🚀 Canary deployment active and monitored'
      ]
    }
  ];

  return (
    <div className="k8s-card rounded-2xl p-6 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">GitHub Actions Production CI/CD Pipeline</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated quality checks, Trivy container CVE scans, Helm linting, and Istio Canary releases.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <GitCommit className="w-4 h-4 text-blue-400" />
          <span>commit: <strong>c27d62c</strong></span>
          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
            PASSED (1m 44s)
          </span>
        </div>
      </div>

      {/* Pipeline Steps Tracker */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
        {stages.map(stage => {
          const isSelected = activeStage === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/15 shadow-md shadow-blue-950/40'
                  : 'border-slate-800 bg-dark-950/60 hover:bg-dark-850'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-mono text-slate-500">{stage.time}</span>
              </div>
              <div className="text-xs font-bold text-white line-clamp-1">{stage.name}</div>
            </button>
          );
        })}
      </div>

      {/* Terminal Output */}
      <div className="rounded-xl border border-slate-800 bg-dark-950 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            Stage Build Log: <span className="text-white font-mono">{stages[activeStage].name}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">runner: ubuntu-22.04</span>
        </div>

        <div className="h-36 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-300 bg-dark-900/60 p-3 rounded-lg border border-slate-800/80">
          {stages[activeStage].logs.map((log, i) => (
            <div
              key={i}
              className={
                log.includes('✔') || log.includes('PASSED') || log.includes('Passed')
                  ? 'text-emerald-400 font-semibold'
                  : log.includes('[SECURITY]') || log.includes('[ISTIO]')
                  ? 'text-blue-400'
                  : 'text-slate-300'
              }
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
