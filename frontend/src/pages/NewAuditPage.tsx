import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditApi, CreateAuditPayload } from '../services/api';
import { 
  Globe, ShieldCheck, Sparkles, AlertCircle, ArrowRight, 
  Loader2, Info, CheckCircle2, Building, Target, ShoppingBag 
} from 'lucide-react';

export const NewAuditPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateAuditPayload>({
    primary_url: '',
    competitor_urls: ['', ''],
    industry: '',
    target_audience: '',
    main_service: '',
    audit_objective: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');

  const sampleSites = [
    { label: 'Savit Agency', primary: 'https://www.savit.in', comp1: 'https://www.rankontechnologies.com', industry: 'Digital Marketing & SEO Agency', service: 'Search Engine Optimization & Web Solutions' },
    { label: 'FinTech (Stripe)', primary: 'https://stripe.com', comp1: 'https://squareup.com', industry: 'Financial Technology', service: 'Online Payment Gateway & Merchant API' },
    { label: 'Cloud (Vercel)', primary: 'https://vercel.com', comp1: 'https://netlify.com', industry: 'Cloud & Developer Tooling', service: 'Frontend Deployment & Serverless Edge Infrastructure' },
    { label: 'E-Commerce (Shopify)', primary: 'https://shopify.com', comp1: 'https://woocommerce.com', industry: 'E-Commerce Platforms', service: 'Digital Storefront & Multi-Channel Commerce' },
    { label: 'React Dev', primary: 'https://react.dev', comp1: 'https://vuejs.org', industry: 'Software & Open Source', service: 'Frontend JavaScript UI Framework' },
  ];

  const handleApplySample = (sample: typeof sampleSites[0]) => {
    setFormData((prev) => ({
      ...prev,
      primary_url: sample.primary,
      competitor_urls: [sample.comp1, ''],
      industry: sample.industry,
      main_service: sample.service,
      target_audience: 'Business owners, engineering leaders, and marketing teams',
      audit_objective: 'Evaluate technical SEO architecture, heading progression, and competitive differentiators.',
    }));
    setErrors({});
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.primary_url.trim()) {
      errs.primary_url = 'Primary website URL is required.';
    } else {
      const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i;
      if (!urlPattern.test(formData.primary_url.trim())) {
        errs.primary_url = 'Please enter a valid website domain or URL (e.g. example.com or https://example.com).';
      }
    }

    const cleanPrimaryHost = formData.primary_url.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0].toLowerCase();
    const compUrls = formData.competitor_urls || [];
    const seenHosts: string[] = [];

    compUrls.forEach((comp, idx) => {
      if (comp && comp.trim()) {
        const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i;
        if (!urlPattern.test(comp.trim())) {
          errs[`competitor_${idx}`] = 'Invalid competitor URL format.';
        }

        const compHost = comp.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0].toLowerCase();
        if (compHost === cleanPrimaryHost && cleanPrimaryHost !== '') {
          errs[`competitor_${idx}`] = 'Competitor cannot point to the same domain as the primary website.';
        }

        if (seenHosts.includes(compHost)) {
          errs[`competitor_${idx}`] = 'Duplicate competitor domain entered.';
        }
        seenHosts.push(compHost);
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setCurrentStep('Executing SSRF security verification on destination URLs...');

    try {
      setTimeout(() => setCurrentStep('Fetching website HTML and validating redirect hops...'), 1200);
      setTimeout(() => setCurrentStep('Extracting metadata, headings, CTAs & Schema structures...'), 2400);
      setTimeout(() => setCurrentStep('Running 20+ deterministic SEO & UX rule engines...'), 3800);
      setTimeout(() => setCurrentStep('Synthesizing evidence-backed AI recommendations...'), 5200);

      const activeCompetitors = (formData.competitor_urls || []).filter((u) => u && u.trim() !== '');

      const payload: CreateAuditPayload = {
        primary_url: formData.primary_url.trim(),
        competitor_urls: activeCompetitors,
        industry: formData.industry?.trim() || undefined,
        target_audience: formData.target_audience?.trim() || undefined,
        main_service: formData.main_service?.trim() || undefined,
        audit_objective: formData.audit_objective?.trim() || undefined,
      };

      const result = await auditApi.createAudit(payload);
      navigate(`/audits/${result.id}`);
    } catch (err: any) {
      setIsSubmitting(false);
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const formatted: Record<string, string> = {};
        Object.keys(serverErrors).forEach((key) => {
          formatted[key] = serverErrors[key][0];
        });
        setErrors(formatted);
      } else {
        setErrors({ general: err.response?.data?.message || 'An error occurred while launching the audit.' });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Configure New Audit</h2>
        <p className="text-sm text-slate-500 mt-1">
          Perform deterministic SEO and HTML-based UX diagnostics, compare competitors, and generate evidence-backed insights.
        </p>
      </div>

      {/* Quick Example Fill Pills */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Quick Example Sites:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sampleSites.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => handleApplySample(sample)}
              className="px-3 py-1 bg-white hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 hover:border-indigo-600 shadow-2xs transition-all"
            >
              {sample.label} vs Competitor
            </button>
          ))}
        </div>
      </div>

      {/* General Form Error Banner */}
      {errors.general && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Audit Request Error:</strong>
            <span>{errors.general}</span>
          </div>
        </div>
      )}

      {/* Audit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Target Domains */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Target Website & Competitors</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter the primary domain to audit and up to two competitors to benchmark against.
            </p>
          </div>

          <div className="space-y-4">
            {/* Primary URL */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Primary Website URL <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={formData.primary_url}
                  onChange={(e) => setFormData({ ...formData, primary_url: e.target.value })}
                  disabled={isSubmitting}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                    errors.primary_url ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
                  }`}
                />
              </div>
              {errors.primary_url && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.primary_url}</p>
              )}
            </div>

            {/* Competitor URL 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Competitor URL 1 <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="https://competitor1.com"
                  value={formData.competitor_urls?.[0] || ''}
                  onChange={(e) => {
                    const comps = [...(formData.competitor_urls || ['', ''])];
                    comps[0] = e.target.value;
                    setFormData({ ...formData, competitor_urls: comps });
                  }}
                  disabled={isSubmitting}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                    errors.competitor_0 ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
                  }`}
                />
                {errors.competitor_0 && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.competitor_0}</p>
                )}
              </div>

              {/* Competitor URL 2 */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Competitor URL 2 <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="https://competitor2.com"
                  value={formData.competitor_urls?.[1] || ''}
                  onChange={(e) => {
                    const comps = [...(formData.competitor_urls || ['', ''])];
                    comps[1] = e.target.value;
                    setFormData({ ...formData, competitor_urls: comps });
                  }}
                  disabled={isSubmitting}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                    errors.competitor_1 ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
                  }`}
                />
                {errors.competitor_1 && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.competitor_1}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Business Context */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Business Context & Audit Focus</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Providing business context helps the AI synthesize highly tailored and industry-relevant action steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Industry / Vertical</label>
              <input
                type="text"
                placeholder="e.g. B2B SaaS, E-Commerce, Healthcare"
                value={formData.industry || ''}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Target Audience</label>
              <input
                type="text"
                placeholder="e.g. Enterprise CTOs, Small Business Owners"
                value={formData.target_audience || ''}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Main Product or Service</label>
              <input
                type="text"
                placeholder="e.g. AI Workflow Automation Software"
                value={formData.main_service || ''}
                onChange={(e) => setFormData({ ...formData, main_service: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Audit Objective</label>
              <input
                type="text"
                placeholder="e.g. Increase organic search leads and improve CTA clarity"
                value={formData.audit_objective || ''}
                onChange={(e) => setFormData({ ...formData, audit_objective: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* Security & Fetching Notice */}
        <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure Web Fetching Notice & Limitations</span>
          </div>
          <p className="leading-relaxed">
            • <strong>SSRF Security:</strong> Requests to private IPs, localhost, AWS/GCP cloud metadata (169.254.169.254), and loopback ranges are strictly blocked at the DNS and socket layer.
          </p>
          <p className="leading-relaxed">
            • <strong>Static HTML Inspection:</strong> Analysis extracts server-rendered HTML. Single Page Applications (SPAs) relying exclusively on client-side JavaScript rendering may have limited extractable visible text.
          </p>
        </div>

        {/* Live Processing Animation / Submit Button */}
        {isSubmitting ? (
          <div className="bg-white border border-indigo-200 rounded-2xl p-6 text-center space-y-4 shadow-sm animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Audit in Progress...</h3>
              <p className="text-xs text-indigo-600 font-semibold mt-1">{currentStep}</p>
            </div>
            <div className="w-full max-w-md bg-slate-100 h-1.5 rounded-full mx-auto overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all"
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
