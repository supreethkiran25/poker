import React from 'react';
import type { TableAlert } from '../hooks/useSocket.js';
import { AlertTriangle, WifiOff, RefreshCw, Coins, Info } from 'lucide-react';

interface TableAlertBannerProps {
  alerts: TableAlert[];
}

export const TableAlertBanner: React.FC<TableAlertBannerProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="fixed top-12 inset-x-0 z-50 flex flex-col items-center pointer-events-none gap-2 px-4">
      {alerts.map((alert) => {
        const isLeave = alert.type === 'LEAVE';
        const isDisconnect = alert.type === 'DISCONNECT';
        const isRebuy = alert.type === 'REBUY';

        let icon = <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
        let bgClass = 'bg-zinc-950/95 border-amber-500/40 text-amber-200';

        if (isLeave || isDisconnect) {
          icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
          bgClass = 'bg-rose-950/90 border-rose-500/60 text-rose-200';
        } else if (isRebuy) {
          icon = <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
          bgClass = 'bg-amber-950/90 border-amber-500/60 text-amber-200';
        }

        return (
          <div
            key={alert.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border shadow-2xl backdrop-blur-md text-xs font-mono font-bold animate-slide-down pointer-events-auto transition-all ${bgClass}`}
          >
            {icon}
            <span>{alert.message}</span>
          </div>
        );
      })}
    </div>
  );
};
