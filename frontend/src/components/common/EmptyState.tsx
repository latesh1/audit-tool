import React from 'react';
import { LucideIcon, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
  showPresets?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref,
  onActionClick,
  showPresets = true,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-xs max-w-2xl mx-auto">
      <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 text-white mb-4 shadow-lg shadow-indigo-500/20">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">{description}</p>
      
      {(actionText && (actionHref || onActionClick)) && (
        <div className="mt-5">
          {actionHref ? (
            <Link
              to={actionHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
            >
              <span>{actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onActionClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
            >
              <span>{actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {showPresets && (
        <div className="mt-8 pt-6 border-t border-slate-100 w-full text-left">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            <span>Recommended Quick Benchmarks to Explore:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <Link
              to="/new-audit"
              className="p-3 rounded-xl border border-slate-100 hover:border-violet-300 hover:bg-violet-50/40 transition-all group"
            >
              <span className="font-bold text-slate-800 block group-hover:text-violet-700">
                Savit Agency Benchmark
              </span>
              <span className="text-[11px] text-slate-400">savit.in vs competitor agency</span>
            </Link>
            <Link
              to="/new-audit"
              className="p-3 rounded-xl border border-slate-100 hover:border-violet-300 hover:bg-violet-50/40 transition-all group"
            >
              <span className="font-bold text-slate-800 block group-hover:text-violet-700">
                FinTech Cloud Benchmark
              </span>
              <span className="text-[11px] text-slate-400">stripe.com vs squareup.com</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
