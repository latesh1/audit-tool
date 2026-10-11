import React, { useEffect, useState, useRef, useCallback } from "react";
import { auditApi } from "../services/api";
import { DashboardData, AuditSummary } from "../types/audit";
import { Link, useNavigate } from "react-router-dom";
import { usePolling } from "../hooks/usePolling";
import { LiveIndicator } from "../components/common/LiveIndicator";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Activity, TrendingUp, Shield, Sparkles, ArrowRight,
  Layers, PlusCircle, Download, Calendar, Globe, AlertCircle,
  CheckCircle2, AlertTriangle, XCircle, Search, ExternalLink,
  ChevronDown, RefreshCw, Loader2
} from "lucide-react";
import { StatusBadge } from "../components/common/StatusBadge";
import { ScoreBadge } from "../components/common/ScoreBadge";
import { EmptyState } from "../components/common/EmptyState";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-white/10">
      <p className="font-semibold mb-1 text-gray-300">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color ?? p.stroke }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("Last 30 days");

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
    setTimeout(() => setIsSwitching(false), 400);
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-24 bg-white rounded-2xl border border-gray-100 shimmer" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 shimmer" />)}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-gray-100 shimmer" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800">
        <h3 className="font-bold text-base mb-1">Failed to Load</h3>
        <p className="text-sm text-rose-600 mb-4">{error}</p>
        <button onClick={loadAll} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700">
          Try Again
        </button>
      </div>
    );
  }

  if (!data || !data.has_data) {
    return (
      <EmptyState
        icon={Layers}
        title="No Website Audits Yet"
        description="Run your first website and competitor audit to generate deterministic technical findings, UX accessibility signals, and AI-powered recommendations."
        actionText="Run First Audit"
        actionHref="/new-audit"
      />
    );
  }

  // ── Helpers ──
  const handleRefresh = () => { triggerNow(); };

  const handleExport = () => {
    const exportPayload = {
      exported_at: new Date().toISOString(),
      active_domain: displayDomain,
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

  const trendData = data.recent_trends.map((t, i) => ({ name: t.domain?.split(".")[0] ?? `Audit ${i+1}`, score: t.overall }));

  // Filter audits for dropdown search
  const filteredAudits = allAudits.filter(a =>
    !searchTerm ||
    a.normalized_domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.primary_url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Derive per-site metrics from selectedAudit
  const siteScore   = selectedAudit?.overall_score ?? data.average_scores.overall ?? 82;
  const siteSeo     = selectedAudit?.seo_score ?? data.average_scores.seo ?? 75;
  const siteUx      = selectedAudit?.ux_score ?? data.average_scores.ux ?? 63;
  const siteHigh    = selectedAudit?.high_issues_count ?? data.issues_by_severity?.high ?? 0;
  const siteMedium  = (selectedAudit ? selectedAudit.issues_count - selectedAudit.high_issues_count : data.issues_by_severity?.medium) ?? 0;
  const displayDomain = selectedAudit?.normalized_domain ?? "All Websites";

  // SEO quality checklist derived from real scores
  const seoChecks = [
    {
      label: "Title & Meta Description Quality",
      status: siteSeo >= 70 ? "ok" : siteSeo >= 45 ? "partial" : "missing",
      color: siteSeo >= 70 ? "text-emerald-600" : siteSeo >= 45 ? "text-amber-500" : "text-rose-500",
    },
    {
      label: "Heading Hierarchy (H1–H3)",
      status: siteScore >= 75 ? "ok" : "partial",
      color: siteScore >= 75 ? "text-emerald-600" : "text-amber-500",
    },
    {
      label: "Image Alt Accessibility",
      status: siteHigh === 0 ? "ok" : siteHigh <= 2 ? "partial" : "missing",
      color: siteHigh === 0 ? "text-emerald-600" : siteHigh <= 2 ? "text-amber-500" : "text-rose-500",
    },
    {
      label: "UX Signals & CTA Structure",
      status: siteUx >= 60 ? "ok" : "partial",
      color: siteUx >= 60 ? "text-emerald-600" : "text-amber-500",
    },
  ];

  const uxLabel = siteUx >= 75 ? "GREAT" : siteUx >= 50 ? "AVERAGE" : "POOR";
  const uxColor = siteUx >= 75 ? "bg-emerald-100 text-emerald-700" : siteUx >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700";

  return (
    <div className={`space-y-5 pb-10 ${isSwitching ? "opacity-60 scale-[0.995]" : "opacity-100 scale-100"} transition-all duration-300`}>
      {/* ── Top Control Bar with Domain Switcher ── */}
      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-3 card-shadow flex flex-wrap items-center gap-3">
        {/* Domain Switcher */}
        <div className="flex items-center gap-2 flex-1 min-w-0" ref={dropdownRef}>
          <Globe className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-xs font-medium text-gray-500 shrink-0">Website</span>

          <div className="relative flex-1 max-w-xs">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 hover:border-violet-300 hover:bg-violet-50/30 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-800 transition-all group focus:outline-none focus:ring-2 focus:ring-violet-400/30"
            >
              {isSwitching ? (
                <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shrink-0" />
              )}
              <span className="truncate flex-1 text-left">
                {selectedAudit ? selectedAudit.normalized_domain : "Select a Website…"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Panel */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 z-30 w-72 bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/60 overflow-hidden">
                {/* Search inside dropdown */}
                <div className="p-2 border-b border-gray-100">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 border border-gray-200">
                    <Search className="w-3.5 h-3.5 text-gray-400" />
                    <input
                      autoFocus
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Search audited domains…"
                      className="flex-1 bg-transparent text-xs text-gray-700 focus:outline-none placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto">
                  {filteredAudits.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-gray-400">
                      No matching audits found.
                    </div>
                  ) : (
                    filteredAudits.map(audit => (
                      <button
                        key={audit.id}
                        onClick={() => handleSelectAudit(audit)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-violet-50 transition-colors group ${
                          selectedAudit?.id === audit.id ? "bg-violet-50/60" : ""
                        }`}
                      >
                        {/* Domain Avatar */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0 ${
                          selectedAudit?.id === audit.id
                            ? "bg-gradient-to-br from-violet-500 to-indigo-600"
                            : "bg-gradient-to-br from-slate-400 to-slate-500"
                        }`}>
                          {audit.normalized_domain.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-xs text-gray-900 block truncate">
                            {audit.normalized_domain}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Score: {audit.overall_score ?? "–"}/100 · {audit.competitor_count} competitor{audit.competitor_count !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {audit.overall_score != null && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            audit.overall_score >= 75 ? "bg-emerald-100 text-emerald-700" :
                            audit.overall_score >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                          }`}>
                            {audit.overall_score}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Footer actions */}
                <div className="p-2 border-t border-gray-100 flex gap-2">
                  <Link
                    to="/new-audit"
                    onClick={() => setDropdownOpen(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors"
                  >
                    <PlusCircle className="w-3 h-3" /> Audit New Website
                  </Link>
                  <button
                    onClick={() => { setDropdownOpen(false); loadAll(); }}
                    className="p-1.5 text-gray-400 hover:text-violet-600 rounded-xl hover:bg-violet-50 transition-colors"
                    title="Refresh audit list"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* View Report Quick Link */}
          {selectedAudit && (
            <Link
              to={`/audits/${selectedAudit.id}`}
              title="Open full audit report"
              className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-800 shrink-0 px-2 py-1 rounded-lg hover:bg-violet-50 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Full Report</span>
            </Link>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 ml-auto">
          <LiveIndicator
            lastUpdated={lastUpdated}
            isPolling={isPolling}
            onRefresh={handleRefresh}
            label="Live"
          />
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option>Last 30 days</option>
            <option>Last 3 months</option>
            <option>Last year</option>
          </select>
          <button 
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gray-400" /> Export
          </button>
          <Link to="/new-audit" className="btn-purple flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white rounded-xl">
            <PlusCircle className="w-3.5 h-3.5" /> Run Audit
          </Link>
        </div>
      </div>

      {/* Page Title with active domain */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2 flex-wrap">
          Content Audit
          <span className="text-sm font-semibold text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-lg">
            {displayDomain}
          </span>
          {selectedAudit && (
            <StatusBadge status={selectedAudit.status} />
          )}
        </h2>
        {selectedAudit && (
          <Link
            to={`/audits/${selectedAudit.id}`}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl transition-all"
          >
            View Detailed Report <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* ── 3 Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Content Score Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 card-shadow stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-violet-600 font-semibold text-xs">
              <Sparkles className="w-4 h-4" /> Content Score
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              siteScore >= 75 ? "bg-emerald-100 text-emerald-700" :
              siteScore >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
            }`}>
              {siteScore >= 75 ? "GREAT" : siteScore >= 50 ? "AVERAGE" : "POOR"}
            </span>
          </div>
          <p className="text-4xl font-black text-gray-900 mb-3">
            {siteScore}<span className="text-lg text-gray-400 font-semibold">/100</span>
          </p>
          {/* Progress bar */}
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className="score-bar-track h-full rounded-full" style={{ width: `${siteScore}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full border-2 border-violet-500 shadow"
              style={{ left: `calc(${siteScore}% - 7px)` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 font-medium mb-4">
            <span>Poor</span><span>Need Improvement</span><span>Great</span>
          </div>
          {/* Dynamic SEO Checklist */}
          <div className="space-y-2">
            {seoChecks.map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 flex items-center gap-2">
                  {item.status === "ok"
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    : item.status === "missing"
                    ? <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                  {item.label}
                </span>
                <span className={`text-[11px] font-semibold ${item.color}`}>
                  {item.status === "ok" ? "All right" : item.status === "missing" ? "Not present" : "Not satisfactory"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Stats Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 card-shadow stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">Audit Statistics</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-4xl font-black text-gray-900">{data.total_audits}</p>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-violet-100 text-violet-700 rounded-full">TOTAL AUDITS</span>
          </div>
          <p className="text-[11px] text-gray-400 mb-4">
            {data.successful_audits} completed successfully · {data.failed_audits} failed
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-medium">{siteHigh} high-priority issue{siteHigh !== 1 ? "s" : ""}</span>
            </div>
            {selectedAudit && (
              <Link to={`/audits/${selectedAudit.id}`}>
                <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-gray-900">{data.total_audits}</p>
              <p className="text-[10px] text-gray-400 font-medium">Total Audits</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-gray-900">{data.successful_audits}</p>
              <p className="text-[10px] text-gray-400 font-medium">Successful</p>
            </div>
          </div>
        </div>

        {/* Readability & Freshness */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 card-shadow stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">Readability & Freshness</span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <p className="text-4xl font-black text-gray-900">{siteUx}</p>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${uxColor}`}>{uxLabel}</span>
          </div>
          <div className="mt-2 space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500 font-medium">SEO Health</span>
                <span className="font-bold text-gray-800">{siteSeo}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${siteSeo}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500 font-medium">High Issues</span>
                <span className="font-bold text-rose-600">{siteHigh}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, siteHigh * 10)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500 font-medium">Medium Issues</span>
                <span className="font-bold text-amber-600">{siteMedium}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, siteMedium * 5)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Trend Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 text-violet-600 font-semibold text-xs mb-1">
              <TrendingUp className="w-4 h-4" /> Audit Score Trend
            </div>
            <p className="text-3xl font-black text-gray-900">
              {siteScore} <span className="text-sm text-gray-400 font-normal">Overall Health Score</span>
            </p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <span className="block font-medium text-gray-600">All audits over time</span>
            <span>{data.recent_trends.length} data points</span>
          </div>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trendData.length > 0 ? trendData : [
                {name:"Jan",score:30},{name:"Feb",score:45},{name:"Mar",score:38},
                {name:"Apr",score:55},{name:"May",score:70},{name:"Jun",score:65},{name:"Jul",score:85}
              ]}
              margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
            >
              <defs>
                <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="score" name="Health Score" stroke="#7c3aed" strokeWidth={2.5} fill="url(#trafficGrad)" dot={false} activeDot={{ r: 5, fill: "#7c3aed" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Audits Table */}
      <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Recent Website Audits</h3>
            <p className="text-xs text-gray-400">Click any row to filter the overview above</p>
          </div>
          <Link to="/history" className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-100">
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
            <tbody className="divide-y divide-gray-50 text-gray-700">
              {data.recent_audits.map(audit => (
                <tr
                  key={audit.id}
                  onClick={() => {
                    const found = allAudits.find(a => a.id === audit.id);
                    if (found) handleSelectAudit(found);
                  }}
                  className={`hover:bg-violet-50/40 transition-colors cursor-pointer ${
                    selectedAudit?.id === audit.id ? "bg-violet-50/60 ring-1 ring-inset ring-violet-200" : ""
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {selectedAudit?.id === audit.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-600 shrink-0" />
                      )}
                      <span className="font-mono text-[10px] text-gray-300">#{audit.id}</span>
                      <span className="font-semibold text-gray-900 truncate max-w-xs">{audit.normalized_domain}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 truncate block max-w-xs">{audit.primary_url}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {audit.competitor_count > 0
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold text-[10px]">{audit.competitor_count} comp.</span>
                      : <span className="text-gray-300 text-[10px]">None</span>}
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={audit.status} /></td>
                  <td className="px-5 py-3.5"><ScoreBadge score={audit.overall_score} size="sm" /></td>
                  <td className="px-5 py-3.5"><ScoreBadge score={audit.seo_score} size="sm" /></td>
                  <td className="px-5 py-3.5"><ScoreBadge score={audit.ux_score} size="sm" /></td>
                  <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                    <Link
                      to={`/audits/${audit.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-violet-600 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 font-semibold transition-colors"
                    >
                      Report <ArrowRight className="w-3 h-3" />
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
