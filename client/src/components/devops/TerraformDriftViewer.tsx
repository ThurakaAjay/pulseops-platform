import React from 'react';
import { Cloud, CheckCircle2, DollarSign, Database, ShieldCheck, RefreshCw } from 'lucide-react';

export const TerraformDriftViewer: React.FC = () => {
  const resources = [
    { name: 'module.eks.aws_eks_cluster.this', type: 'EKS Control Plane v1.30', status: 'In Sync', cost: '$73.00/mo' },
    { name: 'module.eks.aws_eks_node_group.spot', type: 'EC2 Spot Fleet (t3.large x2)', status: 'In Sync', cost: '$44.20/mo' },
    { name: 'module.eks.aws_eks_node_group.on_demand', type: 'EC2 On-Demand (t3.medium x3)', status: 'In Sync', cost: '$91.80/mo' },
    { name: 'module.vpc.aws_nat_gateway.this', type: 'NAT Gateway (us-east-1a)', status: 'In Sync', cost: '$32.40/mo' },
    { name: 'module.vpc.aws_vpc.this', type: 'Multi-AZ VPC (10.0.0.0/16)', status: 'In Sync', cost: '$0.00' }
  ];

  return (
    <div className="k8s-card rounded-2xl p-6 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Terraform Infrastructure as Code (IaC) & Cloud FinOps</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Declarative AWS EKS provisioning with remote S3 state backend and DynamoDB distributed locking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-500">Estimated AWS Spend</div>
            <div className="text-lg font-bold text-emerald-400 font-mono flex items-center justify-end">
              <span>$241.40</span>
              <span className="text-xs text-slate-400 font-normal">/mo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <th className="pb-3">Terraform Resource</th>
              <th className="pb-3">Resource Type</th>
              <th className="pb-3">State Drift</th>
              <th className="pb-3 text-right">Cost Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {resources.map((r, idx) => (
              <tr key={idx} className="hover:bg-dark-850/50 transition-colors">
                <td className="py-2.5 font-semibold text-white truncate max-w-xs">{r.name}</td>
                <td className="py-2.5 text-slate-400 text-[11px]">{r.type}</td>
                <td className="py-2.5">
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{r.status}</span>
                  </span>
                </td>
                <td className="py-2.5 text-right font-bold text-slate-200">{r.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
