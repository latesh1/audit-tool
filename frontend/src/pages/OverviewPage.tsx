import React, { useEffect, useState, useRef, useCallback } from "react";
import { auditApi } from "../services/api";
import { DashboardData, AuditSummary } from "../types/audit";
import { Link } from "react-router-dom";
import { usePolling } from "../hooks/usePolling";
import { LiveIndicator } from "../components/common/LiveIndicator";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  TrendingUp, Sparkles, ArrowRight,
  PlusCircle, Download, Globe, AlertCircle,
  CheckCircle2, AlertTriangle, XCircle, Search, ExternalLink,
  ChevronDown, RefreshCw, Loader2, ShieldCheck, Zap, Layers, BarChart3
} from "lucide-react";
import { StatusBadge } from "../components/common/StatusBadge";
import { ScoreBadge } from "../components/common/ScoreBadge";
import { EmptyState } from "../components/common/EmptyState";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#151827] text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-white/10 tabular-nums">
      <p className="font-semibold text-slate-300 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color ?? p.stroke }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export const OverviewPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Domain switcher state
  const [allAudits, setAllAudits] = useState<AuditSummary[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AuditSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [dashRes, auditsRes] = await Promise.all([
        auditApi.getDashboard(),
        auditApi.getAudits({ per_page: 50 }),
      ]);
      setData(dashRes);
      setIsLoading(false);
      const completed = auditsRes.data.filter(a => a.status === "completed" || a.status === "partially_completed");
      setAllAudits(completed);
      // Keep selectedAudit in sync when data changes
      setSelectedAudit(prev => {
        if (!prev) return completed[0] ?? null;
        const updated = completed.find(a => a.id === prev.id);
        return updated ?? prev;
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch dashboard metrics.");
      setIsLoading(false);
    }
  }, []);

  // Poll every 30 s; pauses when tab is hidden, resumes with fresh fetch on focus
  const { isPolling, lastUpdated, triggerNow } = usePolling(loadAll, 30_000, {
    immediate: true,
    pauseOnHidden: true,
  });

  const handleSelectAudit = (audit: AuditSummary) => {
    setIsSwitching(true);
    setSelectedAudit(audit);
    setDropdownOpen(false);
    setSearchTerm("");
    setTimeout(() => setIsSwitching(false), 250);
  };

  const handleExport = () => {
    const exportPayload = {
      exported_at: new Date().toISOString(),
      active_domain: selectedAudit?.normalized_domain || "all",
      selected_audit: selectedAudit,
      dashboard_metrics: data,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sitescope-overview-${selectedAudit?.normalized_domain || "all"}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 shimmer-loader" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 shimmer-loader" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 shimmer-loader" />
          <div className="h-72 shimmer-loader" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="saas-card p-6 border-rose-200 bg-rose-50/50 text-rose-900">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-sm">Failed to Load Dashboard</h3>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
            <button
              onClick={() => { setIsLoading(true); loadAll(); }}
              className="mt-3 btn-secondary text-xs !py-1 !px-3"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.has_data) {
    return (
      <EmptyState
        icon={Layers}
        title="No Website Audits Found"
        description="Run your first website and competitor audit to generate deterministic technical findings, UX accessibility signals, and AI-powered recommendations."
        actionText="Run First Audit"
        actionHref="/new-audit"
      />
    );
  }

  // Filter audits for dropdown search
  const filteredAudits = allAudits.filter(a =>
    !searchTerm ||
    a.normalized_domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.primary_url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Metrics derived from selection
  const siteScore = selectedAudit?.overall_score ?? data.average_scores.overall ?? 82;
  const siteSeo = selectedAudit?.seo_score ?? data.average_scores.seo ?? 75;
  const siteUx = selectedAudit?.ux_score ?? data.average_scores.ux ?? 63;
  const siteHigh = selectedAudit?.high_issues_count ?? data.issues_by_severity?.high ?? 0;
  const siteTotalIssues = selectedAudit ? selectedAudit.issues_count : (data.issues_by_severity?.high + data.issues_by_severity?.medium + data.issues_by_severity?.low);
  const displayDomain = selectedAudit?.normalized_domain ?? "All Audited Websites";

  // Score trend line data
  const trendData = data.recent_trends.map((t, i) => ({
    name: t.domain?.split(".")[0] ?? `Audit ${i + 1}`,
    score: t.overall
  }));

  return (
    <div className={`space-y-6 pb-12 ${isSwitching ? "opacity-60" : "opacity-100"} transition-opacity duration-150`}>
      {/* ── Page Header & Command Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#151827] tracking-tight">Overview</h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Monitor website health, technical SEO quality, and competitor performance benchmarks.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <LiveIndicator
            lastUpdated={lastUpdated}
            isPolling={isPolling}
            onRefresh={() => triggerNow()}
            label="Live"
          />
          <button
            type="button"
            onClick={handleExport}
            className="btn-secondary text-xs !py-1.5"
            title="Export JSON snapshot"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>
          <Link
            to="/new-audit"
            className="btn-primary text-xs !py-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Run New Audit</span>
          </Link>
        </div>
      </div>

      {/* ── Domain Selector Strip ── */}
      <div className="saas-card p-3 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]" ref={dropdownRef}>
          <span className="text-xs font-semibold text-[#667085] shrink-0">Selected Website:</span>

          <div className="relative flex-1 max-w-sm">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between gap-2 bg-[#F7F8FC] border border-[#E6E8EF] hover:border-accent-300 rounded-lg px-3 py-1.5 text-xs font-medium text-[#151827] transition-all focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-3.5 h-3.5 text-accent-500 shrink-0" />
                <span className="font-semibold truncate">{displayDomain}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 z-30 w-80 bg-white rounded-xl border border-[#E6E8EF] shadow-dropdown overflow-hidden animate-in fade-in-50 duration-100">
                <div className="p-2 border-b border-[#E6E8EF] bg-[#F7F8FC]">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      autoFocus
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Filter audited domains..."
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-[#E6E8EF] rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-accent-500"
                    />
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-[#E6E8EF]">
                  {filteredAudits.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No matching audited domains found.
                    </div>
                  ) : (
                    filteredAudits.map(audit => (
                      <button
                        key={audit.id}
                        type="button"
                        onClick={() => handleSelectAudit(audit)}
                        className={`w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 transition-colors ${
                          selectedAudit?.id === audit.id ? "bg-accent-50/50" : ""
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {audit.normalized_domain}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(audit.created_at).toLocaleDateString()} · {audit.competitor_count} competitor{audit.competitor_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <ScoreBadge score={audit.overall_score} size="sm" />
                      </button>
                    ))
                  )}
                </div>

                <div className="p-2 bg-[#F7F8FC] border-t border-[#E6E8EF] flex items-center justify-between">
                  <Link
                    to="/new-audit"
                    onClick={() => setDropdownOpen(false)}
                    className="text-xs font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Audit New Site
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setDropdownOpen(false); loadAll(); }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    title="Refresh list"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedAudit && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Audited {new Date(selectedAudit.created_at).toLocaleDateString()}
            </span>
            <StatusBadge status={selectedAudit.status} />
            <Link
              to={`/audits/${selectedAudit.id}`}
              className="text-xs font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1"
            >
              Full Report <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* ── KPI Metric Cards Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Audit Score */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between text-xs text-[#667085] mb-2 font-medium">
            <span>Overall Score</span>
            <Sparkles className="w-4 h-4 text-accent-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#151827] tracking-tight tabular-nums">
              {siteScore}
            </span>
            <span className="text-xs text-slate-400 font-semibold">/ 100</span>
          </div>
          <div className="mt-3 w-full bg-[#E6E8EF] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                siteScore >= 80 ? "bg-emerald-500" : siteScore >= 60 ? "bg-accent-500" : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, siteScore))}%` }}
            />
          </div>
          <p className="text-[11px] text-[#667085] mt-2 font-medium">
            {siteScore >= 80 ? "Healthy performance" : siteScore >= 60 ? "Room for optimization" : "Requires attention"}
          </p>
        </div>

        {/* SEO Score */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between text-xs text-[#667085] mb-2 font-medium">
            <span>SEO Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#151827] tracking-tight tabular-nums">
              {siteSeo}
            </span>
            <span className="text-xs text-slate-400 font-semibold">/ 100</span>
          </div>
          <div className="mt-3 w-full bg-[#E6E8EF] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, siteSeo))}%` }}
            />
          </div>
          <p className="text-[11px] text-[#667085] mt-2 font-medium">
            Metadata, headings & canonical rules
          </p>
        </div>

        {/* UX & Accessibility */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between text-xs text-[#667085] mb-2 font-medium">
            <span>UX Signals</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#151827] tracking-tight tabular-nums">
              {siteUx}
            </span>
            <span className="text-xs text-slate-400 font-semibold">/ 100</span>
          </div>
          <div className="mt-3 w-full bg-[#E6E8EF] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, siteUx))}%` }}
            />
          </div>
          <p className="text-[11px] text-[#667085] mt-2 font-medium">
            Viewport, CTA density & landmarks
          </p>
        </div>

        {/* Issues Found */}
        <div className="saas-card p-5">
          <div className="flex items-center justify-between text-xs text-[#667085] mb-2 font-medium">
            <span>Tracked Issues</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#151827] tracking-tight tabular-nums">
              {siteTotalIssues}
            </span>
            <span className="text-xs text-rose-600 font-semibold">
              ({siteHigh} critical)
            </span>
          </div>
          <div className="mt-3 w-full bg-[#E6E8EF] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, siteHigh * 15)}%` }}
            />
          </div>
          <p className="text-[11px] text-[#667085] mt-2 font-medium">
            {siteHigh === 0 ? "Zero critical blockers" : `${siteHigh} high priority fix action needed`}
          </p>
        </div>
      </div>

      {/* ── Charts & Health Matrix ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Trend Chart */}
        <div className="lg:col-span-2 saas-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#151827]">Audit Health Trend</h2>
              <p className="text-xs text-[#667085] mt-0.5">Historical health scores across completed site audits</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-[#F1F3F9] px-2.5 py-1 rounded-md">
              {data.recent_trends.length} Records
            </span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6D4AFF" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#6D4AFF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#98A2B3" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#98A2B3" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Audit Score"
                  stroke="#6D4AFF"
                  strokeWidth={2}
                  fill="url(#scoreAreaGrad)"
                  dot={{ r: 3.5, fill: "#6D4AFF" }}
                  activeDot={{ r: 5, fill: "#6D4AFF" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Breakdown Card */}
        <div className="saas-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#151827]">Issue Severity Distribution</h2>
            <p className="text-xs text-[#667085] mt-0.5">Categorization across all audited targets</p>

            <div className="mt-5 space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-rose-700 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-500" /> High Severity
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">{data.issues_by_severity?.high ?? 0}</span>
                </div>
                <div className="h-1.5 bg-[#F1F3F9] rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (data.issues_by_severity?.high ?? 0) * 10)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-amber-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Medium Severity
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">{data.issues_by_severity?.medium ?? 0}</span>
                </div>
                <div className="h-1.5 bg-[#F1F3F9] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (data.issues_by_severity?.medium ?? 0) * 8)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-blue-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-blue-500" /> Low Severity
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">{data.issues_by_severity?.low ?? 0}</span>
                </div>
                <div className="h-1.5 bg-[#F1F3F9] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (data.issues_by_severity?.low ?? 0) * 5)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E6E8EF] flex items-center justify-between text-xs text-slate-500">
            <span>Total Audited Target Sites</span>
            <span className="font-bold text-slate-900 tabular-nums">{data.total_audits}</span>
          </div>
        </div>
      </div>

      {/* ── Recent Audits Repository Table ── */}
      <div className="saas-card overflow-hidden">
        <div className="p-5 border-b border-[#E6E8EF] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#151827]">Recent Website Audits</h2>
            <p className="text-xs text-[#667085] mt-0.5">Click any audit row to inspect metrics above</p>
          </div>
          <Link
            to="/history"
            className="text-xs font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1"
          >
            View Repository <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8FC] text-slate-500 uppercase text-[10px] tracking-wider border-b border-[#E6E8EF] font-bold">
              <tr>
                <th className="px-5 py-3">Website</th>
                <th className="px-5 py-3">Competitors</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Overall</th>
                <th className="px-5 py-3">SEO</th>
                <th className="px-5 py-3">UX</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E8EF] text-slate-700">
              {data.recent_audits.map(audit => (
                <tr
                  key={audit.id}
                  onClick={() => {
                    const match = allAudits.find(a => a.id === audit.id);
                    if (match) handleSelectAudit(match);
                  }}
                  className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                    selectedAudit?.id === audit.id ? "bg-accent-50/40" : ""
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">#{audit.id}</span>
                      <span className="font-semibold text-slate-900 truncate max-w-xs">{audit.normalized_domain}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 truncate block max-w-xs mt-0.5">{audit.primary_url}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {audit.competitor_count > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {audit.competitor_count} competitor{audit.competitor_count > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">None</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={audit.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <ScoreBadge score={audit.overall_score} size="sm" />
                  </td>
                  <td className="px-5 py-3.5">
                    <ScoreBadge score={audit.seo_score} size="sm" />
                  </td>
                  <td className="px-5 py-3.5">
                    <ScoreBadge score={audit.ux_score} size="sm" />
                  </td>
                  <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                    <Link
                      to={`/audits/${audit.id}`}
                      className="btn-secondary !py-1 !px-2.5 text-xs inline-flex items-center gap-1"
                    >
                      <span>Report</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
