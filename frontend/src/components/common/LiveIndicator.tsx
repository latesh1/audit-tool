import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LiveIndicatorProps {
  lastUpdated: Date | null;
  isPolling: boolean;
  onRefresh: () => void;
  label?: string;
}

/**
 * LiveIndicator — displays a pulsing live dot + last-updated time + manual refresh button.
 * Used in page headers to signal real-time data refresh status.
 */
export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
  lastUpdated,
  isPolling,
  onRefresh,
  label = 'Live',
}) => {
  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className="flex items-center gap-2">
      {/* Live pulse dot */}
      <span className="relative flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isPolling ? 'animate-ping bg-emerald-400' : 'bg-slate-300'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isPolling ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
        </span>
        <span className={`text-[11px] font-bold uppercase tracking-wider ${
          isPolling ? 'text-emerald-600' : 'text-slate-400'
        }`}>
          {isPolling ? label : 'Paused'}
        </span>
      </span>

      {/* Last updated time */}
      {timeStr && (
        <span className="text-[10px] text-slate-400 hidden sm:inline">
          Updated {timeStr}
        </span>
      )}

      {/* Manual refresh button */}
      <button
        type="button"
        onClick={onRefresh}
        title="Refresh now"
        className="p-1 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-violet-50 transition-all"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
      </button>
    </div>
  );
};
