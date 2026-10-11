import React, { useState } from 'react';
import { AuditDetail, AuditWebsite, ExtractedData } from '../../types/audit';
import { 
  FileText, Search, Target, ArrowRight, Award, AlertTriangle, 
  CheckCircle2, Sparkles, BookOpen, Layers, Zap, Hash
} from 'lucide-react';

interface ContentGapTabProps {
  audit: AuditDetail;
}

interface KeywordEntry {
  keyword: string;
  count: number;
  density: number;
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
  inTitle: boolean;
  inH1: boolean;
}

export const ContentGapTab: React.FC<ContentGapTabProps> = ({ audit }) => {
  const primaryData = audit.primary_website?.extracted_data;
  const competitors = audit.competitor_websites;

  const [intentFilter, setIntentFilter] = useState<'all' | 'Informational' | 'Commercial' | 'Transactional'>('all');

  if (!primaryData) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        No content extraction data available.
      </div>
    );
  }

  // Helper to extract keywords from headings, titles, and snippets
  const extractKeywords = (data: ExtractedData): KeywordEntry[] => {
    const textPool = [
      data.title || '',
      data.meta_description || '',
      ...(data.h1s || []),
      ...(data.h2s || []),
      ...(data.h3s || []),
      ...(data.cta_candidates || []).map(c => c.text),
    ].join(' ').toLowerCase();

    // Common stopwords to exclude
    const stopwords = new Set([
      'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'are', 'was', 
      'what', 'when', 'where', 'who', 'how', 'why', 'can', 'will', 'your', 'you',
      'our', 'all', 'any', 'about', 'more', 'get', 'best', 'into', 'just', 'over',
      'than', 'them', 'then', 'they', 'use', 'using', 'been', 'each', 'make', 'such',
      'most', 'free', 'online', 'home', 'page', 'menu', 'contact', 'copyright', 'rights',
      'reserved', 'privacy', 'terms', 'policy', 'click', 'here', 'view', 'read'
    ]);

    const words = textPool.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !stopwords.has(w));
    const wordCounts: Record<string, number> = {};
    const totalWords = words.length || 1;

    words.forEach(w => {
      wordCounts[w] = (wordCounts[w] || 0) + 1;
    });

    const entries = Object.entries(wordCounts)
      .filter(([_, count]) => count >= 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16);

    const titleLower = (data.title || '').toLowerCase();
    const h1Lower = (data.h1s || []).join(' ').toLowerCase();

    return entries.map(([kw, count]) => {
      let intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational' = 'Informational';
      if (['buy', 'pricing', 'order', 'demo', 'trial', 'download', 'start', 'quote'].some(k => kw.includes(k))) {
        intent = 'Transactional';
      } else if (['software', 'platform', 'service', 'solutions', 'agency', 'tool', 'features', 'provider'].some(k => kw.includes(k))) {
        intent = 'Commercial';
      }

      return {
        keyword: kw,
        count,
        density: Number(((count / totalWords) * 100).toFixed(1)),
        intent,
        inTitle: titleLower.includes(kw),
        inH1: h1Lower.includes(kw),
      };
    });
  };

  const primaryKeywords = extractKeywords(primaryData);

  // Extract competitor keywords to find content gaps
  const competitorKeywordsMap: Record<string, string[]> = {};
  competitors.forEach(comp => {
    if (comp.extracted_data) {
      competitorKeywordsMap[comp.normalized_domain] = extractKeywords(comp.extracted_data).map(k => k.keyword);
    }
  });

  // Calculate gaps: words that competitors frequently use in headings that primary lacks
  const primaryWordSet = new Set(primaryKeywords.map(k => k.keyword));
  const identifiedGaps: Array<{ keyword: string; foundInCompetitor: string; suggestedContext: string }> = [];

  Object.entries(competitorKeywordsMap).forEach(([domain, words]) => {
    words.forEach(w => {
      if (!primaryWordSet.has(w) && !identifiedGaps.some(g => g.keyword === w)) {
        identifiedGaps.push({
          keyword: w,
          foundInCompetitor: domain,
          suggestedContext: `Competitor ${domain} highlights "${w}" in their core page headings.`,
        });
      }
    });
  });

  const filteredKeywords = primaryKeywords.filter(k => {
    if (intentFilter === 'all') return true;
    return k.intent === intentFilter;
  });

  // Reading time & depth statistics
  const wordCount = primaryData.word_count || 350;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 220));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-950 to-slate-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Keyword Density & Competitive Content Intelligence</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight">Content Depth & Semantic Topic Analysis</h3>
            <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
              Google algorithms reward authoritative topical depth. This report maps primary keyword distribution, search intent orientation, and identifies competitive content gaps.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-right">
            <span className="text-[11px] text-indigo-200 block uppercase font-medium">Estimated Reading Time</span>
            <span className="text-2xl font-black text-white">{readingTimeMin} <span className="text-sm font-normal text-indigo-300">min</span></span>
          </div>
        </div>

        {/* Content Depth Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-300 block">Total Word Count</span>
            <span className="text-xl font-bold text-white">{wordCount.toLocaleString()}</span>
            <span className="text-[10px] text-indigo-300 block mt-0.5">
              {wordCount >= 600 ? 'Comprehensive depth' : 'Thin content warning'}
            </span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-300 block">Total Headings (H1-H3)</span>
            <span className="text-xl font-bold text-white">
              {(primaryData.h1_count || 0) + (primaryData.h2_count || 0) + (primaryData.h3_count || 0)}
            </span>
            <span className="text-[10px] text-indigo-300 block mt-0.5">
              {primaryData.h1_count === 1 ? 'Valid single H1 structure' : `${primaryData.h1_count} H1 tags`}
            </span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-300 block">Call-To-Actions (CTAs)</span>
            <span className="text-xl font-bold text-white">{primaryData.cta_candidates?.length || 0}</span>
            <span className="text-[10px] text-indigo-300 block mt-0.5">Conversion triggers detected</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-300 block">Competitor Topic Gaps</span>
            <span className="text-xl font-bold text-emerald-300">{identifiedGaps.length}</span>
            <span className="text-[10px] text-slate-300 block mt-0.5">Missed keyword concepts</span>
          </div>
        </div>
      </div>

      {/* Top Keywords Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Hash className="w-4 h-4 text-violet-600" />
            <span>Extracted Primary Keywords & Topical Terms</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 mr-1">Intent:</span>
            {(['all', 'Informational', 'Commercial', 'Transactional'] as const).map(intent => (
              <button
                key={intent}
                onClick={() => setIntentFilter(intent)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  intentFilter === intent
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {intent === 'all' ? 'All' : intent}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {filteredKeywords.map((kw, i) => {
            const intentColors = {
              Informational: 'bg-blue-50 text-blue-700 border-blue-200',
              Commercial: 'bg-purple-50 text-purple-700 border-purple-200',
              Transactional: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              Navigational: 'bg-slate-50 text-slate-700 border-slate-200',
            }[kw.intent];

            return (
              <div key={i} className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 space-y-2 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-1">
                  <span className="font-bold text-slate-900 text-xs capitalize truncate">{kw.keyword}</span>
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border uppercase ${intentColors}`}>
                    {kw.intent.slice(0, 4)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">Occurrences: <strong className="text-slate-900">{kw.count}</strong></span>
                  <span className="text-violet-600 font-bold text-[11px]">{kw.density}%</span>
                </div>

                <div className="pt-2 border-t border-slate-200/50 flex items-center gap-1.5 text-[10px]">
                  {kw.inTitle && (
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">In Title</span>
                  )}
                  {kw.inH1 && (
                    <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-medium">In H1</span>
                  )}
                  {!kw.inTitle && !kw.inH1 && (
                    <span className="text-slate-400">Body Only</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Competitor Content Gaps Card */}
      {competitors.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Target className="w-4 h-4 text-emerald-600" />
            <span>Identified Competitor Content & Keyword Gaps</span>
          </div>

          <p className="text-xs text-slate-600">
            These topical keywords are prominent on competitor pages but completely absent from your primary page structure. Incorporating these themes into your H2 subheadings will improve topical completeness:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {identifiedGaps.slice(0, 8).map((gap, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  +
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-emerald-950 capitalize">{gap.keyword}</span>
                    <span className="text-[10px] bg-white border border-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                      {gap.foundInCompetitor}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {gap.suggestedContext}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Word Count & Depth Comparison Table */}
      {competitors.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm">Content Depth Side-by-Side Benchmark</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Website</th>
                  <th className="px-4 py-3">Word Count</th>
                  <th className="px-4 py-3">Heading Structure</th>
                  <th className="px-4 py-3">Images</th>
                  <th className="px-4 py-3">Content Depth Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-violet-50/30">
                  <td className="px-4 py-3 font-bold text-violet-950">
                    {audit.primary_website?.normalized_domain} (Primary)
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {wordCount.toLocaleString()} words
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    H1: {primaryData.h1_count} | H2: {primaryData.h2_count} | H3: {primaryData.h3_count}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {primaryData.total_images} images
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      wordCount >= 800 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {wordCount >= 800 ? 'High Topical Authority' : 'Moderate Depth'}
                    </span>
                  </td>
                </tr>

                {competitors.map((comp) => {
                  const compWords = comp.extracted_data?.word_count || 400;
                  const compH1 = comp.extracted_data?.h1_count || 1;
                  const compH2 = comp.extracted_data?.h2_count || 0;
                  const compH3 = comp.extracted_data?.h3_count || 0;
                  const compImg = comp.extracted_data?.total_images || 0;

                  return (
                    <tr key={comp.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {comp.normalized_domain}
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-medium">
                        {compWords.toLocaleString()} words
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        H1: {compH1} | H2: {compH2} | H3: {compH3}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {compImg} images
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          compWords > wordCount ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {compWords > wordCount ? `${compWords - wordCount} words deeper than primary` : 'Lower volume than primary'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
