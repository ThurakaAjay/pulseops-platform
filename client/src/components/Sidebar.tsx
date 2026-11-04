import React from 'react';
import { 
  LayoutDashboard, 
  Server, 
  Flame, 
  KanbanSquare, 
  Headphones, 
  BarChart3, 
  Radio,
  Layers
} from 'lucide-react';
import { useLive } from '../context/LiveContext.js';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  openIncidentsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, openIncidentsCount }) => {
  const { liveServices } = useLive();
  const degradedOrOutageCount = liveServices.filter(s => s.status !== 'operational').length;

  const appNavItems = [
    {
      id: 'dashboard',
      label: 'Executive Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'services',
      label: 'Telemetry & Probes',
      icon: Server,
      badge: degradedOrOutageCount > 0 ? `${degradedOrOutageCount} issue` : undefined,
      badgeColor: 'amber'
    },
    {
      id: 'incidents',
      label: 'Incident War Room',
      icon: Flame,
      badge: openIncidentsCount > 0 ? `${openIncidentsCount} active` : undefined,
      badgeColor: 'rose'
    },
    {
      id: 'tasks',
      label: 'Collaborative Sprint',
      icon: KanbanSquare,
    },
    {
      id: 'support',
      label: 'Support Desk',
      icon: Headphones,
    },
    {
      id: 'analytics',
      label: 'SLA & Telemetry Stats',
      icon: BarChart3,
    }
  ];

  const devopsNavItems = [
    {
      id: 'devops',
      label: 'Kubernetes & DevOps',
      icon: Layers,
      badge: 'GitOps',
      badgeColor: 'blue'
    }
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-dark-900/60 backdrop-blur-md flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Operations & Control
          </p>
          <nav className="space-y-1">
            {appNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badgeColor === 'rose'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* DevOps & Cloud Platform Section */}
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Cloud & Infrastructure
          </p>
          <nav className="space-y-1">
            {devopsNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Real-Time WebSocket Engine Footer Status */}
      <div className="p-3 rounded-xl border border-slate-800 bg-dark-850/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-300">WebSocket Stream</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            ONLINE
          </span>
        </div>
        <div className="mt-2 text-[10px] text-slate-500 font-mono flex justify-between">
          <span>Cluster: EKS v1.30</span>
          <span>Sync: Sub-50ms</span>
        </div>
      </div>
    </aside>
  );
};
