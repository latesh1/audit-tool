import React, { useEffect, useState } from 'react';
import { auditApi } from '../services/api';
import { AiStatusData, SystemInfoData } from '../types/audit';
import { 
  Settings, Sparkles, ShieldCheck, Server, Database, 
  Key, CheckCircle2, AlertTriangle, Info, Terminal, Cpu 
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [aiStatus, setAiStatus] = useState<AiStatusData | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [ai, sys] = await Promise.all([
        auditApi.getAiStatus(),
        auditApi.getSystemInfo(),
      ]);
      setAiStatus(ai);
      setSystemInfo(sys);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse p-6" />
        <div className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse p-6" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-xl font-bold text-[#151827] tracking-tight">System & AI Configuration</h1>
        <p className="text-xs text-[#667085] mt-1">
          Diagnostics, safe AI provider status, and security architecture telemetry.
        </p>
      </div>

      {/* AI Provider Status Card */}
      <div className="saas-card p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#E6E8EF] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-500" />
            <h2 className="text-sm font-bold text-[#151827]">AI Engine Integration Status</h2>
          </div>
          {aiStatus?.is_configured ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Provider Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              Deterministic Rule Engine Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 uppercase font-bold text-[10px] block">Configured Provider</span>
            <span className="text-sm font-bold text-slate-900 capitalize mt-1 block">
              {aiStatus?.configured_provider || 'none'}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 uppercase font-bold text-[10px] block">Model / Engine</span>
            <span className="text-sm font-mono font-bold text-indigo-600 mt-1 block truncate">
              {aiStatus?.model}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 uppercase font-bold text-[10px] block">Fallback Mode</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">
              {aiStatus?.fallback_active ? 'Enabled (Deterministic)' : 'Live LLM Provider'}
            </span>
          </div>
        </div>

        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-950 space-y-1">
          <strong className="block font-bold text-indigo-900">Provider Notice:</strong>
          <p className="leading-relaxed">{aiStatus?.safe_notice}</p>
        </div>
      </div>

      {/* How to configure AI Provider Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Key className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">How to Configure an AI Provider</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          SiteScope AI supports zero-configuration deterministic fallback out-of-the-box. To enable free-tier cloud LLM synthesis (e.g. Google Gemini or Groq), configure the server environment variables in your local <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">.env</code> file:
        </p>

        <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-2">
          <div className="text-slate-400"># Option 1: Google Gemini (Free Tier API)</div>
          <div>AI_PROVIDER=gemini</div>
          <div>AI_API_KEY=AIzaSy...your_gemini_api_key</div>
          <div>AI_MODEL=gemini-1.5-flash</div>
          <br />
          <div className="text-slate-400"># Option 2: Groq Cloud (Free Fast Inference)</div>
          <div>AI_PROVIDER=groq</div>
          <div>AI_API_KEY=gsk_...your_groq_api_key</div>
          <div>AI_MODEL=llama-3.3-70b-versatile</div>
        </div>

        <p className="text-[11px] text-slate-400">
          * Note: API keys are securely stored server-side only in .env and never sent to browser bundles or client responses.
        </p>
      </div>

      {/* System & Architecture Telemetry */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Server className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Backend System Diagnostics</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">PHP Version</span>
            <span className="font-bold text-slate-900 font-mono mt-1 block">{systemInfo?.php_version}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Laravel Core</span>
            <span className="font-bold text-slate-900 font-mono mt-1 block">{systemInfo?.laravel_version}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Database</span>
            <span className="font-bold text-slate-900 capitalize font-mono mt-1 block">{systemInfo?.database_driver}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">SSRF Firewall</span>
            <span className="font-bold text-emerald-600 font-mono mt-1 block">Active (Strict)</span>
          </div>
        </div>
      </div>

      {/* SSRF & Security Documentation */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>SSRF Outbound Security Protection</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          SiteScope implements comprehensive Server-Side Request Forgery defenses before any outbound socket connection is established:
        </p>
        <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
          <li><strong>DNS & CIDR Filtering:</strong> Rejection of RFC 1918 private subnets, loopback (<code className="text-slate-200">127.0.0.0/8</code>, <code className="text-slate-200">::1</code>), link-local (<code className="text-slate-200">169.254.0.0/16</code>), and AWS/GCP cloud metadata.</li>
          <li><strong>Multi-Hop Redirect Verification:</strong> Automatic redirects are disabled; each individual 3xx hop is manually resolved and verified for IP safety before sending the next GET request.</li>
          <li><strong>Payload & Timeout Bounds:</strong> 5-second connect timeout, 10-second total timeout, and 2MB maximum HTML payload limit.</li>
        </ul>
      </div>
    </div>
  );
};
