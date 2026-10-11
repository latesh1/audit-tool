import React from 'react';

interface ScoreBadgeProps {
  score: number | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  sublabel?: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  size = 'md',
  label,
  sublabel,
}) => {
  if (score === null || score === undefined) {
    return (
      <div className="flex flex-col items-center justify-center">
        <span className="text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
          N/A
        </span>
        {label && <span className="text-xs text-slate-500 mt-1">{label}</span>}
      </div>
    );
  }

  const getScoreColor = (val: number) => {
    if (val >= 80) return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', circle: 'text-emerald-500', bar: 'bg-emerald-500' };
    if (val >= 60) return { bg: 'bg-blue-50 text-blue-700 border-blue-200', circle: 'text-blue-500', bar: 'bg-blue-500' };
    if (val >= 40) return { bg: 'bg-amber-50 text-amber-700 border-amber-200', circle: 'text-amber-500', bar: 'bg-amber-500' };
    return { bg: 'bg-rose-50 text-rose-700 border-rose-200', circle: 'text-rose-500', bar: 'bg-rose-500' };
  };

  const colors = getScoreColor(score);

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${colors.bg}`}>
        {score} / 100
      </span>
    );
  }

  if (size === 'xl') {
    return (
      <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className={`relative w-20 h-20 flex items-center justify-center rounded-2xl border-2 ${colors.bg}`}>
          <span className="text-3xl font-extrabold tracking-tight">{score}</span>
          <span className="text-[10px] uppercase font-bold absolute bottom-1 text-slate-400">/ 100</span>
        </div>
        <div>
          {label && <h4 className="text-sm font-bold text-slate-900">{label}</h4>}
          {sublabel && <p className="text-xs text-slate-500 mt-0.5 max-w-xs">{sublabel}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
      <div className={`w-12 h-12 flex items-center justify-center rounded-xl border font-bold text-lg ${colors.bg}`}>
        {score}
      </div>
      {label && <span className="text-xs font-semibold text-slate-700 mt-1.5">{label}</span>}
      {sublabel && <span className="text-[10px] text-slate-400">{sublabel}</span>}
    </div>
  );
};
