import React, { useState, useEffect } from 'react';
import { auditApi } from '../services/api';
import { AuditSummary } from '../types/audit';
import { SerpPreviewTab } from '../components/audit/SerpPreviewTab';
import { 
  Sparkles, Globe, Search, RefreshCw, ArrowRight, 
  Lightbulb, ShieldCheck, CheckCircle2 
} from 'lucide-react';

export const SerpStudioPage: React.FC = () => {
  const [recentAudits, setRecentAudits] = useState<AuditSummary[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string>('');
  const [primaryUrl, setPrimaryUrl] = useState<string>('https://example.com');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      const res = await auditApi.getAudits({ per_page: 15 });
      setRecentAudits(res.data);
      if (res.data.length > 0) {
        handleSelectAudit(String(res.data[0].id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectAudit = async (id: string) => {
    if (!id) return;
    setSelectedAuditId(id);
    setIsLoading(true);
    try {
      const detail = await auditApi.getAudit(id);
      setPrimaryUrl(detail.primary_url);
      setExtractedData(detail.primary_website?.extracted_data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const presets = [
    {
      title: 'Stripe — Financial Infrastructure for the Internet',
      description: 'Online payment processing for internet businesses. Stripe is a suite of payment APIs that powers commerce for online businesses of all sizes.',
      url: 'https://stripe.com',
      image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&h=630&fit=crop',
    },
    {
      title: 'Vercel — Build and Deploy the Web Ahead',
      description: 'Vercel provides developer tools and cloud infrastructure to build, deploy, and scale web applications with zero configuration and global edge delivery.',
      url: 'https://vercel.com',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop',
    },
    {
      title: 'Airbnb — Vacation Rentals, Cabins, Beach Houses & More',
      description: 'Find vacation rentals, cabins, beach houses, unique homes and experiences around the world - all made possible by hosts on Airbnb.',
      url: 'https://airbnb.com',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=630&fit=crop',
    },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setPrimaryUrl(p.url);
    setExtractedData({
      title: p.title,
      meta_description: p.description,
      canonical_url: p.url,
      open_graph: { 'og:image': p.image },
    });
  };

  return (
    <div className="space-y-6 pb-12 fade-in-up">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span>Interactive SERP & Social Meta Studio</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Search & Social Snippet Simulator
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Test and optimize how websites appear across Google desktop/mobile search results, Facebook/OpenGraph cards, and Twitter/X previews with real-time length scoring.
          </p>
        </div>

        {/* Audit Loader Dropdown */}
        {recentAudits.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-xs">
            <Globe className="w-4 h-4 text-slate-400 ml-1" />
            <span className="text-xs font-semibold text-slate-500">Load from Audit:</span>
            <select
              value={selectedAuditId}
              onChange={(e) => handleSelectAudit(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none"
            >
              {recentAudits.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.normalized_domain} (Score: {a.overall_score || '–'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quick Preset Buttons */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          Test Presets:
        </span>
        {presets.map((p, i) => (
          <button
            key={i}
            onClick={() => handleApplyPreset(p)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            {p.url.replace('https://', '')}
          </button>
        ))}
      </div>

      {/* SERP Preview Component */}
      <SerpPreviewTab
        key={selectedAuditId || primaryUrl}
        primaryUrl={primaryUrl}
        extractedData={extractedData}
      />
    </div>
  );
};
