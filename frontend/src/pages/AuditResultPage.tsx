import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auditApi } from '../services/api';
import { AuditDetail } from '../types/audit';
import { 
  ArrowLeft, Download, ExternalLink, ShieldCheck, Sparkles, 
  Layers, CheckCircle2, AlertTriangle, XCircle, Clock, Cpu, 
  Eye, BarChart3, HelpCircle, FileText, Globe, Code, Lightbulb, Users,
  Zap, Hash, CheckSquare, Printer
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { ScoreBadge } from '../components/common/ScoreBadge';
import { IssueCard } from '../components/common/IssueCard';
import { PerformanceVitalsTab } from '../components/audit/PerformanceVitalsTab';
import { FixChecklistTab } from '../components/audit/FixChecklistTab';
import { ContentGapTab } from '../components/audit/ContentGapTab';
import { SerpPreviewTab } from '../components/audit/SerpPreviewTab';
import { ExecutiveReportModal } from '../components/audit/ExecutiveReportModal';

import { usePolling } from '../hooks/usePolling';
import { LiveIndicator } from '../components/common/LiveIndicator';

export const AuditResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'seo' | 'ux' | 'competitors' | 'vitals' | 'keywords' | 'checklist' | 'serp' | 'ai' | 'raw'>('overview');
  const [issueFilter, setIssueFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showExecutiveModal, setShowExecutiveModal] = useState(false);

  const loadAudit = useCallback(async (auditId: string, showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    setError(null);
    try {
      const data = await auditApi.getAudit(auditId);
      setAudit(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit report.');
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) loadAudit(id, true);
  }, [id, loadAudit]);

  // If audit is currently processing or queued, poll rapidly every 3.5s until complete
  const isRunning = audit?.status === 'queued';
  const { isPolling, lastUpdated, triggerNow } = usePolling(
    () => { if (id) loadAudit(id, false); },
    isRunning ? 3500 : 15000,
    { immediate: false, pauseOnHidden: true }
  );

  const handleExportJson = () => {
    if (!audit) return;
    const blob = new Blob([JSON.stringify(audit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sitescope-audit-${audit.id}-${audit.primary_website?.normalized_domain || 'report'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-white rounded-2xl border border-slate-200 animate-pulse p-6" />
        <div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-rose-900">Unable to Load Audit Report</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">{error || 'Record not found.'}</p>
        <Link
          to="/history"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to History</span>
        </Link>
      </div>
    );
  }

  const primaryData = audit.primary_website?.extracted_data;
  const filteredIssues = audit.issues.filter((iss) => {
    if (issueFilter === 'all') return true;
    return iss.severity.toLowerCase() === issueFilter;
  });

  const seoIssues = audit.issues.filter((i) => i.category === 'seo');
  const uxIssues = audit.issues.filter((i) => i.category === 'ux' || i.category === 'accessibility');
  const aiReport = audit.ai_report;

  return (
    <div className="space-y-6 pb-16">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Audit History</span>
        </Link>

        <div className="flex items-center gap-3">
          <LiveIndicator
            lastUpdated={lastUpdated}
            isPolling={isPolling}
            onRefresh={() => triggerNow()}
            label={isRunning ? "Processing" : "Live"}
          />
          <button
            type="button"
            onClick={() => setShowExecutiveModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Executive Report / PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Audit Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                AUDIT #{audit.id}
              </span>
              <StatusBadge status={audit.status} />
              {audit.industry && (
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {audit.industry}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {audit.primary_website?.normalized_domain || audit.primary_url}
              </h2>
              <a
                href={audit.primary_url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-slate-400 hover:text-indigo-600"
                title="Open website in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {new Date(audit.created_at).toLocaleString()}
              </span>
              {audit.primary_website?.response_time_ms && (
                <span className="font-mono">
                  Response: {audit.primary_website.response_time_ms} ms
                </span>
              )}
              {audit.competitor_websites.length > 0 && (
                <span className="font-semibold text-indigo-600">
                  {audit.competitor_websites.length} Competitor{audit.competitor_websites.length > 1 ? 's' : ''} Analyzed
                </span>
              )}
            </div>

            {audit.safe_error_message && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <strong>Audit Notice:</strong> {audit.safe_error_message}
              </div>
            )}
          </div>

          {/* Score Badges Row */}
          <div className="flex items-center gap-3 self-stretch lg:self-auto justify-around sm:justify-start">
            <ScoreBadge
              score={audit.overall_score}
              label="Overall Health"
              sublabel="60% SEO + 40% UX"
            />
            <ScoreBadge
              score={audit.seo_score}
              label="SEO Score"
              sublabel="Meta & Hierarchy"
            />
            <ScoreBadge
              score={audit.ux_score}
              label="UX / A11y"
              sublabel="Signals & CTAs"
            />
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#E6E8EF] overflow-x-auto pb-px">
        {[
          { key: 'overview', label: 'Overview & Summary', icon: BarChart3 },
          { key: 'seo', label: `SEO Audit (${seoIssues.length})`, icon: ShieldCheck },
          { key: 'ux', label: `Website & UX (${uxIssues.length})`, icon: Eye },
          { key: 'competitors', label: `Competitors (${audit.competitor_websites.length})`, icon: Users },
          { key: 'vitals', label: 'Core Vitals & Speed', icon: Zap },
          { key: 'keywords', label: 'Keywords & Content', icon: Hash },
          { key: 'checklist', label: `Fix Action Plan (${audit.issues.length})`, icon: CheckSquare },
          { key: 'serp', label: 'SERP & Social Preview', icon: Globe },
          { key: 'ai', label: 'AI Recommendations', icon: Sparkles },
          { key: 'raw', label: 'Extracted Facts', icon: Code },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-accent-500 text-accent-600 bg-accent-50/50 rounded-t-lg font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.key ? 'text-accent-500' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          {aiReport?.client_summary && (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Executive Synthesis & Analysis</span>
              </div>
              <p className="text-sm text-slate-100 leading-relaxed font-normal">
                {aiReport.client_summary}
              </p>
              {aiReport.report.engine_note && (
                <span className="inline-block mt-3 text-[11px] text-indigo-300 bg-white/10 px-2.5 py-1 rounded-md">
                  {aiReport.report.engine_note}
                </span>
              )}
            </div>
          )}

          {/* Strengths and Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Core Strengths */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm border-b border-slate-100 pb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Observed Architectural Strengths</span>
              </div>
              <div className="space-y-3">
                {aiReport?.report?.strengths && aiReport.report.strengths.length > 0 ? (
                  aiReport.report.strengths.map((st, i) => (
                    <div key={i} className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-xs">
                      <strong className="font-bold text-emerald-950 block">{st.title}</strong>
                      <p className="text-emerald-900 mt-1">{st.explanation}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No dominant strengths recorded for this domain.</p>
                )}
              </div>
            </div>

            {/* Core Optimization Opportunities */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm border-b border-slate-100 pb-3">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Primary Optimization Priorities</span>
              </div>
              <div className="space-y-3">
                {aiReport?.report?.important_issues && aiReport.report.important_issues.length > 0 ? (
                  aiReport.report.important_issues.slice(0, 4).map((iss, i) => (
                    <div key={i} className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <strong className="font-bold text-rose-950">{iss.title}</strong>
                        <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                          {iss.severity}
                        </span>
                      </div>
                      <p className="text-rose-900">{iss.recommendation}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No critical priority issues detected.</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Summary */}
          {primaryData && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Key Fact Baseline</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Title Length</span>
                  <span className="text-base font-bold text-slate-900">{primaryData.title_length} chars</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">H1 Count</span>
                  <span className="text-base font-bold text-slate-900">{primaryData.h1_count}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Word Count</span>
                  <span className="text-base font-bold text-slate-900">{primaryData.word_count} words</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Internal Links</span>
                  <span className="text-base font-bold text-slate-900">{primaryData.internal_link_count}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Missing Alt</span>
                  <span className="text-base font-bold text-slate-900">{primaryData.images_missing_alt} / {primaryData.total_images}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Schema Types</span>
                  <span className="text-base font-bold text-slate-900">{primaryData.schema_types.length} types</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SEO Audit */}
      {activeTab === 'seo' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Deterministic SEO Rules</h3>
              <p className="text-xs text-slate-500">Evaluated directly from parsed HTML metadata, tags, and structure</p>
            </div>
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {(['all', 'high', 'medium', 'low'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setIssueFilter(lvl)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                    issueFilter === lvl ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {lvl} ({lvl === 'all' ? seoIssues.length : seoIssues.filter(i => i.severity.toLowerCase() === lvl).length})
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredIssues.filter(i => i.category === 'seo').length > 0 ? (
              filteredIssues.filter(i => i.category === 'seo').map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                No SEO issues found matching the selected filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Website & UX */}
      {activeTab === 'ux' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">HTML-Derived UX & Accessibility Diagnostics</h3>
            <p className="text-xs text-slate-500">Measurable signals for navigation, conversion clarity, and semantic structure</p>
          </div>

          {/* Measurable UX Breakdown Cards */}
          {primaryData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CTA Candidate card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-900 block mb-1">Detected CTAs</span>
                <div className="text-xl font-black text-indigo-600 mb-1">{primaryData.cta_candidates.length} triggers</div>
                <div className="space-y-1">
                  {primaryData.cta_candidates.slice(0, 3).map((c, i) => (
                    <span key={i} className="block text-[11px] text-slate-600 truncate bg-slate-50 px-2 py-0.5 rounded">
                      "{c.text}"
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-900 block mb-1">Contact Channels</span>
                <div className="text-xl font-black text-slate-900 mb-1">
                  {primaryData.contact_info.emails.length + primaryData.contact_info.phones.length + primaryData.contact_info.contact_links.length} channels
                </div>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div>Emails: <strong>{primaryData.contact_info.emails.length}</strong></div>
                  <div>Phones: <strong>{primaryData.contact_info.phones.length}</strong></div>
                  <div>Contact links: <strong>{primaryData.contact_info.contact_links.length}</strong></div>
                </div>
              </div>

              {/* Landmarks */}
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-900 block mb-1">HTML5 Landmarks</span>
                <div className="text-xl font-black text-slate-900 mb-1">
                  {Object.keys(primaryData.html_landmarks).length} tags
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(primaryData.html_landmarks).map(([tag, cnt]) => (
                    <span key={tag} className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                      &lt;{tag}&gt; ({cnt})
                    </span>
                  ))}
                </div>
              </div>

              {/* Viewport & Lang */}
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-900 block mb-1">Document Meta</span>
                <div className="space-y-1.5 text-xs text-slate-700 mt-2">
                  <div>Lang: <strong className="font-mono text-indigo-600">{primaryData.html_lang || 'Missing'}</strong></div>
                  <div>Viewport: <strong className="text-emerald-600">{primaryData.viewport_meta ? 'Responsive' : 'Missing'}</strong></div>
                  <div>Duplicate IDs: <strong className="text-rose-600">{primaryData.duplicate_ids.length}</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* UX Issues List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Evaluated UX Issues</h4>
            {uxIssues.length > 0 ? (
              uxIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                No UX or accessibility anomalies recorded.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Competitor Comparison */}
      {activeTab === 'competitors' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Evidence-Based Competitor Benchmark</h3>
            <p className="text-xs text-slate-500">Direct side-by-side comparison of measured facts without fabricated inferences</p>
          </div>

          {audit.competitor_websites.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Competitors Were Specified</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                To benchmark against competitors, supply competitor URLs when creating a new audit.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Comparison Matrix Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                        <th className="px-5 py-3.5">Metric / Diagnostic</th>
                        <th className="px-5 py-3.5 bg-indigo-900/60 border-l border-r border-indigo-800">
                          Primary: {audit.primary_website?.normalized_domain}
                        </th>
                        {audit.competitor_websites.map((comp, idx) => (
                          <th key={comp.id} className="px-5 py-3.5">
                            Competitor {idx + 1}: {comp.normalized_domain}
                            {comp.fetch_status !== 'success' && (
                              <span className="block text-rose-300 text-[10px] normal-case">(Fetch {comp.fetch_status})</span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {aiReport?.report?.comparison_matrix && aiReport.report.comparison_matrix.length > 0 ? (
                        aiReport.report.comparison_matrix.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3 font-semibold text-slate-900">
                              <div>{row.metric}</div>
                              <span className="text-[10px] text-slate-400 font-normal">{row.category}</span>
                            </td>
                            <td className="px-5 py-3 font-mono font-medium bg-indigo-50/30 border-l border-r border-indigo-100/60 text-indigo-950">
                              {row.primary_value}
                            </td>
                            {row.competitors.map((compVal, cIdx) => (
                              <td key={cIdx} className="px-5 py-3 font-mono text-slate-800">
                                {compVal.value}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-6 text-center text-slate-400 text-xs">
                            Comparison metrics could not be rendered due to competitor fetch status.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Identified Gaps Card */}
              {aiReport?.report?.identified_gaps && aiReport.report.identified_gaps.length > 0 && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Identified Competitive Gaps</span>
                  </div>
                  <ul className="space-y-2 text-xs text-amber-950 list-disc list-inside">
                    {aiReport.report.identified_gaps.map((gap, i) => (
                      <li key={i} className="leading-relaxed">{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: AI Recommendations */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Evidence-Backed Action Plan</span>
              </h3>
              <p className="text-xs text-slate-500">Prioritized technical recommendations linked directly to observable audit evidence</p>
            </div>
            <div className="flex items-center gap-2 text-xs bg-indigo-50 text-indigo-800 px-3 py-1.5 rounded-xl border border-indigo-100 font-semibold">
              <span>Provider:</span>
              <strong className="capitalize">{aiReport?.provider || 'Deterministic Fallback'}</strong>
            </div>
          </div>

          <div className="space-y-4">
            {aiReport?.report?.recommendations && aiReport.report.recommendations.length > 0 ? (
              aiReport.report.recommendations.map((rec, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-indigo-300 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span>{rec.title}</span>
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      rec.priority.toLowerCase() === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      rec.priority.toLowerCase() === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {rec.priority} Priority
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700">
                    <strong className="text-slate-900 block mb-1">Recommended Action:</strong>
                    <p className="leading-relaxed">{rec.action}</p>
                  </div>

                  {rec.rationale && (
                    <div className="text-xs text-slate-500">
                      <strong>Impact Rationale:</strong> {rec.rationale}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                No specific recommendations generated for this audit.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Extracted Raw Facts Explorer */}
      {activeTab === 'raw' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Extracted Technical Fact Explorer</h3>
            <p className="text-xs text-slate-500">Inspect the exact raw metadata, heading sequences, and parsed structures</p>
          </div>

          {primaryData ? (
            <div className="space-y-6">
              {/* Metadata inspector */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Page Metadata & Protocol</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Page Title ({primaryData.title_length} chars):</span>
                    <div className="font-semibold text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                      {primaryData.title || '<Missing Title Tag>'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Meta Description ({primaryData.meta_description_length} chars):</span>
                    <div className="font-semibold text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                      {primaryData.meta_description || '<Missing Meta Description>'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Canonical URL:</span>
                    <div className="font-mono text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 truncate">
                      {primaryData.canonical_url || '<None>'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Robots Meta Directive:</span>
                    <div className="font-mono text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                      {primaryData.robots_meta || '<Standard Index/Follow>'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Headings Sequence */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Extracted Heading Structure ({primaryData.heading_sequence.length} elements)
                </h4>
                <div className="max-h-64 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100 font-mono text-xs">
                  {primaryData.heading_sequence.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 p-1 hover:bg-white rounded">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        h.tag === 'h1' ? 'bg-indigo-600 text-white' :
                        h.tag === 'h2' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {h.tag.toUpperCase()}
                      </span>
                      <span className="text-slate-800 truncate">{h.text || '<Empty heading text>'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* JSON-LD / Microdata Types */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Schema.org Structured Data Types
                </h4>
                <div className="flex flex-wrap gap-2">
                  {primaryData.schema_types.length > 0 ? (
                    primaryData.schema_types.map((type, i) => (
                      <span key={i} className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg">
                        {type}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No structured data schemas identified in HTML.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              No raw extraction data available.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Core Web Vitals & Speed */}
      {activeTab === 'vitals' && (
        <PerformanceVitalsTab
          primaryWebsite={audit.primary_website}
          competitors={audit.competitor_websites}
        />
      )}

      {/* TAB CONTENT: Keywords & Content Depth */}
      {activeTab === 'keywords' && (
        <ContentGapTab audit={audit} />
      )}

      {/* TAB CONTENT: Interactive Fix Action Plan */}
      {activeTab === 'checklist' && (
        <FixChecklistTab audit={audit} />
      )}

      {/* TAB CONTENT: Live SERP & Social Preview */}
      {activeTab === 'serp' && (
        <SerpPreviewTab
          primaryUrl={audit.primary_url}
          extractedData={audit.primary_website?.extracted_data}
        />
      )}

      {/* Printable Executive Presentation Modal */}
      {showExecutiveModal && (
        <ExecutiveReportModal
          audit={audit}
          onClose={() => setShowExecutiveModal(false)}
        />
      )}
    </div>
  );
};
