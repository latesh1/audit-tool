import React from 'react';
import { AuditDetail } from '../../types/audit';
import { 
  X, Printer, Download, Globe, ShieldCheck, CheckCircle2, 
  AlertTriangle, Sparkles, Building, Calendar, Award
} from 'lucide-react';

interface ExecutiveReportModalProps {
  audit: AuditDetail;
  onClose: () => void;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({ audit, onClose }) => {
  const primaryDomain = audit.primary_website?.normalized_domain || audit.primary_url;
  const overallScore = audit.overall_score || 0;
  const seoScore = audit.seo_score || 0;
  const uxScore = audit.ux_score || 0;

  const handlePrint = () => {
    window.print();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const highIssues = audit.issues.filter(i => i.severity === 'high');
  const mediumIssues = audit.issues.filter(i => i.severity === 'medium');
  const aiReport = audit.ai_report;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm">Executive Presentation & Printable Client Report</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT BODY */}
        <div className="p-8 sm:p-10 space-y-8 text-slate-900 print:p-6 print:space-y-6">
          {/* Executive Report Header */}
          <div className="border-b border-slate-200 pb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>SiteScope AI Technical & Competitor Audit</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Audit Report: {primaryDomain}
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(audit.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                {audit.industry && (
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" />
                    {audit.industry}
                  </span>
                )}
                <span>Status: <strong className="text-emerald-700 capitalize">{audit.status.replace('_', ' ')}</strong></span>
              </div>
            </div>

            {/* Scorecard Badge */}
            <div className="flex items-center gap-3">
              <div className={`p-4 rounded-2xl border text-center ${getScoreColor(overallScore)}`}>
                <span className="text-[10px] uppercase font-bold tracking-wider block">Overall Health</span>
                <span className="text-3xl font-black">{overallScore}</span>
                <span className="text-[10px] block font-medium">/ 100</span>
              </div>
              <div className={`p-4 rounded-2xl border text-center ${getScoreColor(seoScore)}`}>
                <span className="text-[10px] uppercase font-bold tracking-wider block">SEO Score</span>
                <span className="text-3xl font-black">{seoScore}</span>
                <span className="text-[10px] block font-medium">/ 100</span>
              </div>
              <div className={`p-4 rounded-2xl border text-center ${getScoreColor(uxScore)}`}>
                <span className="text-[10px] uppercase font-bold tracking-wider block">UX & A11y</span>
                <span className="text-3xl font-black">{uxScore}</span>
                <span className="text-[10px] block font-medium">/ 100</span>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          {aiReport?.client_summary && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Executive Summary</h3>
              <p className="text-sm text-slate-800 leading-relaxed font-normal">
                {aiReport.client_summary}
              </p>
            </div>
          )}

          {/* Competitor Benchmark Matrix */}
          {audit.competitor_websites.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                Competitor Side-by-Side Comparison
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="p-3">Domain</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Latency</th>
                      <th className="p-3">Word Count</th>
                      <th className="p-3">Headings (H1/H2)</th>
                      <th className="p-3">Images</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-indigo-50/40 font-bold">
                      <td className="p-3 text-indigo-950">{primaryDomain}</td>
                      <td className="p-3 text-indigo-700">Primary Target</td>
                      <td className="p-3">{audit.primary_website?.response_time_ms || 0} ms</td>
                      <td className="p-3">{audit.primary_website?.extracted_data?.word_count || 0}</td>
                      <td className="p-3">
                        H1: {audit.primary_website?.extracted_data?.h1_count} / H2: {audit.primary_website?.extracted_data?.h2_count}
                      </td>
                      <td className="p-3">{audit.primary_website?.extracted_data?.total_images || 0}</td>
                    </tr>
                    {audit.competitor_websites.map((comp) => (
                      <tr key={comp.id}>
                        <td className="p-3 font-semibold text-slate-800">{comp.normalized_domain}</td>
                        <td className="p-3 text-slate-500">Benchmark</td>
                        <td className="p-3">{comp.response_time_ms || 0} ms</td>
                        <td className="p-3">{comp.extracted_data?.word_count || 0}</td>
                        <td className="p-3">
                          H1: {comp.extracted_data?.h1_count} / H2: {comp.extracted_data?.h2_count}
                        </td>
                        <td className="p-3">{comp.extracted_data?.total_images || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Critical Issues & Action Plan */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
              High-Priority Action Plan & Rule Violations ({highIssues.length} Critical)
            </h3>
            <div className="space-y-2">
              {highIssues.map((iss, i) => (
                <div key={i} className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-rose-200 text-rose-800">
                      High Priority
                    </span>
                    <strong className="text-rose-950">{iss.title}</strong>
                  </div>
                  <p className="text-rose-900">{iss.recommendation || iss.explanation}</p>
                </div>
              ))}
              {mediumIssues.slice(0, 3).map((iss, i) => (
                <div key={i} className="p-3 bg-amber-50/40 border border-amber-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-amber-200 text-amber-800">
                      Medium
                    </span>
                    <strong className="text-amber-950">{iss.title}</strong>
                  </div>
                  <p className="text-amber-900">{iss.recommendation || iss.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Strategic Recommendations */}
          {aiReport?.report?.recommendations && aiReport.report.recommendations.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                Strategic Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiReport.report.recommendations.slice(0, 4).map((rec, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {i + 1}
                      </span>
                      <strong className="text-slate-900 font-bold">{rec.title}</strong>
                    </div>
                    <p className="text-slate-600 mt-1">{rec.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer & Signature Block */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <div>
              <span>Generated by SiteScope AI Platform • Powered by Savit Interactive Rule Engines</span>
            </div>
            <div className="text-right">
              <span className="block font-medium text-slate-600">Verified Technical Evidence Report</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
