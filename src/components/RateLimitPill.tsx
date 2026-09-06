import React from "react";
import { ShieldCheck, AlertTriangle, AlertCircle, RefreshCw } from "lucide-react";
import { SystemRateLimits } from "../types";

interface RateLimitPillProps {
  rateLimits: SystemRateLimits;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const RateLimitPill: React.FC<RateLimitPillProps> = ({
  rateLimits,
  onRefresh,
  isRefreshing,
}) => {
  const getStatusBadge = (provider: 'pexels' | 'pixabay', info: typeof rateLimits.pexels) => {
    const isPexels = provider === 'pexels';
    const name = isPexels ? 'Pexels' : 'Pixabay';
    const rem = info.remaining;
    const limit = info.limit;

    let icon = <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
    let textClass = "text-emerald-300";
    let bgClass = "bg-emerald-950/40 border-emerald-800/40";

    if (info.status === 'throttled' || (rem !== null && rem === 0)) {
      icon = <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
      textClass = "text-rose-300";
      bgClass = "bg-rose-950/40 border-rose-800/40";
    } else if (info.status === 'warning' || (rem !== null && rem < (isPexels ? 10 : 20))) {
      icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      textClass = "text-amber-300";
      bgClass = "bg-amber-950/40 border-amber-800/40";
    }

    return (
      <div
        id={`rate-limit-badge-${provider}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border ${bgClass}`}
        title={`${name} API Rate Limit: ${rem !== null ? `${rem} remaining` : 'Active'} ${limit ? `of ${limit}` : ''}`}
      >
        {icon}
        <span className="font-medium text-stone-300">{name}:</span>
        <span className={`${textClass} font-semibold`}>
          {rem !== null ? `${rem} left` : 'Ready'}
        </span>
      </div>
    );
  };

  return (
    <div id="rate-limits-container" className="flex items-center gap-2">
      {getStatusBadge('pexels', rateLimits.pexels)}
      {getStatusBadge('pixabay', rateLimits.pixabay)}
      <button
        id="refresh-rate-limits-btn"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="p-1.5 rounded-md text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
        title="Check current API rate limits"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
      </button>
    </div>
  );
};
