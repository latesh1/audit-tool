import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditApi } from '../services/api';
import { 
  Globe, Users, Sparkles, ArrowRight, AlertCircle, 
  CheckCircle2, Plus, Trash2, Loader2, ShieldCheck, 
  Zap, HelpCircle, Code
} from 'lucide-react';

interface SampleSite {
  label: string;
  primary: string;
  competitors: string[];
  industry: string;
}

const sampleSites: SampleSite[] = [
  {
    label: 'Stripe vs Adyen',
    primary: 'https://stripe.com',
    competitors: ['https://adyen.com'],
    industry: 'Fintech & Payments',
  },
  {
    label: 'GitHub vs GitLab',
    primary: 'https://github.com',
    competitors: ['https://about.gitlab.com'],
    industry: 'Developer Tools',
  },
  {
    label: 'Vercel vs Netlify',
    primary: 'https://vercel.com',
    competitors: ['https://netlify.com'],
    industry: 'Cloud Infrastructure',
  },
];

export const NewAuditPage: React.FC = () => {
  const navigate = useNavigate();
  const [primaryUrl, setPrimaryUrl] = useState('');
  const [competitor1, setCompetitor1] = useState('');
  const [competitor2, setCompetitor2] = useState('');
  const [industry, setIndustry] = useState('');
  
  // Supported Audit Modules
  const [runSeo, setRunSeo] = useState(true);
  const [runUx, setRunUx] = useState(true);
  const [runAi, setRunAi] = useState(true);
  const [runVitals, setRunVitals] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!primaryUrl.trim()) {
      errs.primary_url = 'Primary website URL is required.';
    } else {
      try {
        const parsed = new URL(primaryUrl.startsWith('http') ? primaryUrl : `https://${primaryUrl}`);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          errs.primary_url = 'URL must begin with http:// or https://';
        }
      } catch {
        errs.primary_url = 'Please enter a valid website URL.';
      }
    }

    if (competitor1.trim()) {
      try {
        new URL(competitor1.startsWith('http') ? competitor1 : `https://${competitor1}`);
      } catch {
        errs.competitor1 = 'Invalid competitor URL.';
      }
    }

    if (competitor2.trim()) {
      try {
        new URL(competitor2.startsWith('http') ? competitor2 : `https://${competitor2}`);
      } catch {
        errs.competitor2 = 'Invalid competitor URL.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleApplySample = (sample: SampleSite) => {
    setPrimaryUrl(sample.primary);
    setCompetitor1(sample.competitors[0] || '');
    setCompetitor2(sample.competitors[1] || '');
    setIndustry(sample.industry);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    const competitors = [competitor1, competitor2]
      .map(c => c.trim())
      .filter(Boolean);

    try {
      setCurrentStep('Validating website domains & checking SSRF firewall rules...');
      await new Promise(r => setTimeout(r, 600));

      setCurrentStep('Fetching HTML & evaluating deterministic SEO & UX rule engines...');
      const response = await auditApi.createAudit({
        primary_url: primaryUrl.trim(),
        competitor_urls: competitors,
        industry: industry.trim() || undefined,
      });

      setCurrentStep('Synthesizing evidence-backed AI recommendations...');
      await new Promise(r => setTimeout(r, 400));

      // Successfully launched, route to report
      navigate(`/audits/${response.id}`);
    } catch (err: any) {
      setIsSubmitting(false);
      setCurrentStep('');
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const [k, v] of Object.entries(err.response.data.errors)) {
          apiErrors[k] = Array.isArray(v) ? (v[0] as string) : String(v);
        }
        setErrors(apiErrors);
      } else {
        setErrors({ general: err.response?.data?.message || 'An error occurred while launching the audit.' });
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-bold text-[#151827] tracking-tight">Run a Website Audit</h1>
        <p className="text-xs text-[#667085] mt-1 leading-relaxed">
          Analyze SEO, UX, content quality, and competitor performance in one place using deterministic DOM extraction and LLM insights.
        </p>
      </div>

      {/* ── Quick Example Sites Strip ── */}
      <div className="saas-card p-4 bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#151827]">
          <Sparkles className="w-4 h-4 text-accent-500" />
          <span>Quick Example Sites:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sampleSites.map((sample) => (
            <button
              key={sample.label}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleApplySample(sample)}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-[#F7F8FC] border border-[#E6E8EF] hover:border-accent-300 hover:text-accent-700 rounded-lg transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error Banner ── */}
      {errors.general && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Audit Request Error:</strong>
            <span>{errors.general}</span>
          </div>
        </div>
      )}

      {/* ── Main Form ── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Target Primary Website */}
        <div className="saas-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6E8EF] pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent-500" />
              <h2 className="text-sm font-bold text-[#151827]">Primary Website</h2>
            </div>
            <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
              Required
            </span>
          </div>

          <div>
            <label htmlFor="primary-url" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Website URL to Audit
            </label>
            <input
              id="primary-url"
              type="text"
              value={primaryUrl}
              onChange={(e) => setPrimaryUrl(e.target.value)}
              disabled={isSubmitting}
              placeholder="https://example.com"
              className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all ${
                errors.primary_url ? 'border-rose-300 bg-rose-50/20' : 'border-[#E6E8EF]'
              }`}
            />
            {errors.primary_url ? (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.primary_url}
              </p>
            ) : (
              <p className="text-[11px] text-[#667085] mt-1.5">
                Target homepage or specific landing page. The engine will inspect live DOM, headings, viewport, and metadata.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="industry-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Industry or Category <span className="text-slate-400 font-normal">(Optional context)</span>
            </label>
            <input
              id="industry-select"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g. SaaS, E-Commerce, Developer Tools"
              className="w-full px-3.5 py-2 bg-white border border-[#E6E8EF] rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
            />
          </div>
        </div>

        {/* Step 2: Competitor Benchmarks */}
        <div className="saas-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6E8EF] pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-[#151827]">Competitor Benchmarks</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Optional (1–2 Sites)
            </span>
          </div>

          <p className="text-xs text-[#667085] leading-relaxed">
            Add 1 or 2 competitor URLs to generate side-by-side matrices, keyword density gaps, and comparative speed scores.
          </p>

          <div className="space-y-3">
            <div>
              <label htmlFor="comp1" className="block text-xs font-semibold text-slate-700 mb-1">
                Competitor 1 URL
              </label>
              <input
                id="comp1"
                type="text"
                value={competitor1}
                onChange={(e) => setCompetitor1(e.target.value)}
                disabled={isSubmitting}
                placeholder="https://competitor-one.com"
                className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 ${
                  errors.competitor1 ? 'border-rose-300' : 'border-[#E6E8EF]'
                }`}
              />
              {errors.competitor1 && (
                <p className="text-xs text-rose-600 mt-1">{errors.competitor1}</p>
              )}
            </div>

            <div>
              <label htmlFor="comp2" className="block text-xs font-semibold text-slate-700 mb-1">
                Competitor 2 URL
              </label>
              <input
                id="comp2"
                type="text"
                value={competitor2}
                onChange={(e) => setCompetitor2(e.target.value)}
                disabled={isSubmitting}
                placeholder="https://competitor-two.com"
                className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 ${
                  errors.competitor2 ? 'border-rose-300' : 'border-[#E6E8EF]'
                }`}
              />
              {errors.competitor2 && (
                <p className="text-xs text-rose-600 mt-1">{errors.competitor2}</p>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Active Audit Modules */}
        <div className="saas-card p-6 space-y-4">
          <div className="border-b border-[#E6E8EF] pb-3">
            <h2 className="text-sm font-bold text-[#151827]">Audit Engine Modules</h2>
            <p className="text-xs text-[#667085] mt-0.5">Toggle rules and analysis packages executed during this audit</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-[#E6E8EF] hover:bg-[#F7F8FC] cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={runSeo}
                onChange={e => setRunSeo(e.target.checked)}
                className="mt-0.5 rounded text-accent-500 focus:ring-accent-500"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Deterministic SEO Rules</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Checks title, headings, canonicals, robots, meta tags.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-[#E6E8EF] hover:bg-[#F7F8FC] cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={runUx}
                onChange={e => setRunUx(e.target.checked)}
                className="mt-0.5 rounded text-accent-500 focus:ring-accent-500"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">HTML-Based UX Diagnostics</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Mobile viewport, CTA counts, landmarks, accessibility.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-[#E6E8EF] hover:bg-[#F7F8FC] cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={runVitals}
                onChange={e => setRunVitals(e.target.checked)}
                className="mt-0.5 rounded text-accent-500 focus:ring-accent-500"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Synthetic Web Vitals Lab</p>
                <p className="text-[11px] text-slate-500 mt-0.5">LCP, INP, CLS & server TTFB diagnostic estimation.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-[#E6E8EF] hover:bg-[#F7F8FC] cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={runAi}
                onChange={e => setRunAi(e.target.checked)}
                className="mt-0.5 rounded text-accent-500 focus:ring-accent-500"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">AI Recommendation Engine</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Evidence-backed fixes via LLM (Gemini/Groq or fallback).</p>
              </div>
            </label>
          </div>
        </div>

        {/* ── Submission State ── */}
        {isSubmitting ? (
          <div className="saas-card p-6 text-center space-y-3 border-accent-200 bg-accent-50/20">
            <Loader2 className="w-6 h-6 text-accent-500 animate-spin mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Audit in Progress</h3>
            <p className="text-xs text-accent-600 font-semibold">{currentStep}</p>
            <div className="w-full max-w-sm bg-slate-200 h-1.5 rounded-full mx-auto overflow-hidden">
              <div className="bg-accent-500 h-full rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="btn-primary text-sm !px-6 !py-3"
            >
              <span>Launch SiteScope Audit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
