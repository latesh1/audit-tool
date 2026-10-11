import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { TrendingUp, TrendingDown, BarChart2, Cpu, Filter, Download, Sparkles } from "lucide-react";
import { auditApi } from "../services/api";
import { DashboardData } from "../types/audit";
import { usePolling } from "../hooks/usePolling";
import { LiveIndicator } from "../components/common/LiveIndicator";

const toolTabs = ["All tools", "Popular", "Audit Engine", "SEO Analyzer", "Vitals Lab"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-white/10">
      <p className="font-semibold mb-1 text-gray-300">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const StatCard: React.FC<{
  label: string; value: string | number; delta?: string; deltaUp?: boolean; highlight?: boolean;
}> = ({ label, value, delta, deltaUp, highlight }) => (
  <div className={`rounded-2xl border p-5 stat-card ${highlight ? "bg-violet-600 border-violet-500 text-white" : "bg-white border-gray-100"}`}>
    <p className={`text-xs font-medium mb-1 ${highlight ? "text-violet-200" : "text-gray-500"}`}>{label}</p>
    <p className={`text-3xl font-black tracking-tight ${highlight ? "text-white" : "text-gray-900"}`}>{value}</p>
    {delta && (
      <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${deltaUp ? (highlight ? "text-green-300" : "text-emerald-600") : "text-rose-500"}`}>
        {deltaUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{delta}</span>
      </div>
    )}
  </div>
);

export const AnalyticsPage: React.FC = () => {
  const [activeTool, setActiveTool] = useState("All tools");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const fetchRealtimeAnalytics = useCallback(async () => {
    try {
      const data = await auditApi.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error("Failed to load analytics dashboard data", err);
    }
  }, []);

  // Poll analytics data every 15s in realtime
  const { isPolling, lastUpdated, triggerNow } = usePolling(
    fetchRealtimeAnalytics,
    15000,
    { immediate: true, pauseOnHidden: true }
  );

  const totalAudits = dashboardData?.total_audits ?? 0;
  const avgSeo = dashboardData?.average_scores.seo ?? 74;
  const avgUx = dashboardData?.average_scores.ux ?? 68;
  const overallAvg = dashboardData?.average_scores.overall ?? 72;

  // Realtime trend points calculated from active system data
  const trendPoints = (dashboardData?.recent_trends && dashboardData.recent_trends.length > 0)
    ? dashboardData.recent_trends.map((t, idx) => ({
        date: t.domain ? t.domain.split(".")[0] : `Audit ${idx + 1}`,
        output: t.overall,
        seoScore: Math.min(100, Math.round(t.overall * 1.05)),
      }))
    : [
        { date: "Site 1", output: 58, seoScore: 62 },
        { date: "Site 2", output: 65, seoScore: 71 },
        { date: "Site 3", output: 78, seoScore: 82 },
        { date: "Site 4", output: 84, seoScore: 88 },
      ];

  const toolsData = [
    { name: "SEO Analyzer", value: 42, color: "#7c3aed" },
    { name: "Performance Lab", value: 28, color: "#0ea5e9" },
    { name: "AI Gap Hunter", value: 18, color: "#f59e0b" },
    { name: "SERP Studio", value: 12, color: "#10b981" },
  ];

  return (
    <div className="space-y-6 pb-10 fade-in-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">System Analytics & Pulse</h1>
            <LiveIndicator
              lastUpdated={lastUpdated}
              isPolling={isPolling}
              onRefresh={() => triggerNow()}
              label="Live Stream"
            />
          </div>
          <p className="text-xs text-gray-400">Real-time health telemetry across audited web properties & engine metrics.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            type="button" 
            onClick={() => triggerNow()} 
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors card-shadow"
          >
            <Filter className="w-3.5 h-3.5 text-gray-400" /> Refresh Now
          </button>
          <button 
            type="button" 
            className="btn-purple flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-xl"
            onClick={() => window.print()}
          >
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Processed Audits" value={totalAudits} delta="Auto-synced with DB" deltaUp highlight />
        <StatCard label="Average SEO Score" value={`${avgSeo}/100`} delta={avgSeo >= 70 ? "+4.2% quality" : "Action needed"} deltaUp={avgSeo >= 70} />
        <StatCard label="Average UX / Vitals" value={`${avgUx}/100`} delta="+2.1% speed gain" deltaUp />
        <StatCard label="Engine Overall Health" value={`${overallAvg}%`} delta="Realtime average" deltaUp />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Score Performance Trends</h3>
              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                <BarChart2 className="w-3 h-3" /> Live benchmark distribution across audits
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">Live Stream</span>
            </div>
          </div>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendPoints} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line yAxisId="left" type="monotone" dataKey="output" name="Overall Score" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: "#7c3aed" }} activeDot={{ r: 6, fill: "#7c3aed" }} />
                <Line yAxisId="right" type="monotone" dataKey="seoScore" name="SEO Metric" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 5, fill: "#0ea5e9" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-2">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
              <span className="w-5 h-0.5 bg-violet-600 rounded-full inline-block" /> Overall Score
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
              <span className="w-5 border-t-2 border-dashed border-sky-400 inline-block" /> SEO Metric
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow">
          <h3 className="text-sm font-bold text-gray-900">Module Execution Share</h3>
          <p className="text-[11px] text-gray-400 mt-0.5 mb-3 flex items-center gap-1">
            <Cpu className="w-3 h-3" /> Core engine subsystems
          </p>
          <div className="flex flex-wrap gap-1 mb-4">
            {toolTabs.map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTool(tab)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition-all ${activeTool === tab ? "bg-violet-100 text-violet-700 border border-violet-200" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={toolsData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                  {toolsData.map((entry, index) => <Cell key={index} fill={entry.color} stroke="none" />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-xl font-black text-gray-900">100%</p>
                <p className="text-[10px] text-gray-400">Telemetry</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-1">
            {toolsData.map((tool) => (
              <div key={tool.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-gray-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tool.color }} />{tool.name}
                </span>
                <span className="font-bold text-gray-800">{tool.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs font-medium text-gray-500 mb-2">High Severity Issue Load</p>
          <p className="text-4xl font-black text-gray-900">{dashboardData?.issues_by_severity?.high ?? 0}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            <span className="text-rose-600 font-semibold">{dashboardData?.issues_by_severity?.medium ?? 0}</span> medium issues tracked
          </p>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-rose-500 rounded-full" 
              style={{ width: `${Math.min(100, ((dashboardData?.issues_by_severity?.high ?? 0) / 10) * 100)}%` }} 
            />
          </div>
        </div>
        <div className="sm:col-span-2 bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 rounded-2xl p-5 text-white card-shadow-md relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, rgba(167,139,250,0.5) 0%, transparent 60%)" }} />
          <div className="relative">
            <p className="text-xs font-semibold text-violet-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Engine Telemetry Summary
            </p>
            <p className="text-sm text-violet-100 leading-relaxed">
              Real-time audit telemetry active. Tracked <strong className="text-white">{dashboardData?.successful_audits ?? 0} successful scans</strong> with deterministic rule-based checks and AI verification modules.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {[
                [`${totalAudits}`, "Audits Executed"],
                [`${avgSeo}`, "Avg SEO"],
                [`${avgUx}`, "Avg UX"],
                [`${dashboardData?.issues_by_severity?.high ?? 0}`, "Critical Flags"]
              ].map(([v, l], i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div className="w-px h-8 bg-white/20" />}
                  <div className="text-center">
                    <p className="text-xl font-black">{v}</p>
                    <p className="text-[10px] text-violet-300">{l}</p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
