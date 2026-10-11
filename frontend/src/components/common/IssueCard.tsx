import React, { useState } from 'react';
import { AuditIssue } from '../../types/audit';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Cpu, Lightbulb } from 'lucide-react';

interface IssueCardProps {
  issue: AuditIssue;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            High Severity
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Medium Severity
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3 h-3 text-blue-500" />
            Low / Advisory
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-all">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 flex items-start justify-between cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {getSeverityBadge(issue.severity)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900">{issue.title}</h4>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                {issue.rule_code}
              </span>
              <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                {issue.category}
              </span>
            </div>
            {issue.explanation && !isExpanded && (
              <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                {issue.explanation}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          aria-label={isExpanded ? "Collapse issue details" : "Expand issue details"}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-slate-100 space-y-3 bg-white text-xs text-slate-700">
          {issue.explanation && (
            <div>
              <span className="font-semibold text-slate-900 block mb-1">Impact & Context:</span>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {issue.explanation}
              </p>
            </div>
          )}

          {issue.recommendation && (
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-1">
                <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                <span>Actionable Recommendation:</span>
              </div>
              <p className="text-emerald-900 leading-relaxed">
                {issue.recommendation}
              </p>
            </div>
          )}

          {issue.evidence && Object.keys(issue.evidence).length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1">
                <Cpu className="w-3.5 h-3.5 text-slate-500" />
                <span>Extracted Technical Evidence:</span>
              </div>
              <pre className="p-2.5 bg-slate-900 text-slate-200 rounded-lg overflow-x-auto font-mono text-[11px] leading-tight">
                {JSON.stringify(issue.evidence, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>Detection Source: <strong className="text-slate-600 capitalize">{issue.source} engine</strong></span>
            <span>Category: <strong className="text-slate-600 capitalize">{issue.category}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
