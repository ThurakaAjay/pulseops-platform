import React from 'react';
import { AlertTriangle, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLive } from '../context/LiveContext.js';

interface AlertBannerProps {
  onGoToIncidents: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ onGoToIncidents }) => {
  const { activeAlert, dismissAlert } = useLive();

  if (!activeAlert) return null;

  const isCritical = activeAlert.severity === 'P1' || activeAlert.title.includes('CRITICAL');

  return (
    <div
      className={`px-6 py-2.5 flex items-center justify-between text-xs font-medium border-b animate-in slide-in-from-top duration-200 ${
        isCritical
          ? 'bg-rose-950/80 border-rose-800 text-rose-200'
          : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {isCritical ? (
          <div className="p-1 rounded-md bg-rose-500/20 text-rose-400 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
          </div>
        ) : (
          <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <span className="font-bold tracking-wide uppercase">{activeAlert.title}</span>
          <span className="text-slate-300 font-normal">{activeAlert.message}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {isCritical && (
          <button
            onClick={() => {
              onGoToIncidents();
              dismissAlert();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow transition-all"
          >
            <span>Enter War Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={dismissAlert}
          className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
