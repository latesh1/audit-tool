import React, { useState } from 'react';
import { ExtractedData } from '../../types/audit';
import { 
  Globe, Smartphone, Monitor, Share2, Copy, Check, Sparkles, 
  AlertCircle, CheckCircle2, RefreshCw, Code, Eye, ExternalLink
} from 'lucide-react';

interface SerpPreviewTabProps {
  primaryUrl: string;
  extractedData?: ExtractedData | null;
}

export const SerpPreviewTab: React.FC<SerpPreviewTabProps> = ({ primaryUrl, extractedData }) => {
  const initialTitle = extractedData?.title || 'Home — Company Official Website';
  const initialDesc = extractedData?.meta_description || 'Explore our enterprise software solutions and discover industry-leading performance, unmatched reliability, and modern tooling designed for high-growth teams.';
  const initialOgImage = extractedData?.open_graph?.['og:image'] || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop';

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDesc);
  const [url, setUrl] = useState(extractedData?.canonical_url || primaryUrl);
  const [ogImage, setOgImage] = useState(initialOgImage);
  const [targetKeyword, setTargetKeyword] = useState('');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activePlatform, setActivePlatform] = useState<'google' | 'facebook' | 'twitter'>('google');
  const [copiedCode, setCopiedCode] = useState(false);

  // Character calculations
  const titleLen = title.length;
  const descLen = description.length;
  
  // Approximate Google pixel width (average 9.6px per char for Arial 20px)
  const estTitlePixels = Math.round(titleLen * 9.5);
  const maxTitlePixels = 580;

  const isTitleOptimal = titleLen >= 35 && titleLen <= 60;
  const isDescOptimal = descLen >= 120 && descLen <= 160;

  // Keyword presence checks
  const kwLower = targetKeyword.trim().toLowerCase();
  const kwInTitle = kwLower ? title.toLowerCase().includes(kwLower) : null;
  const kwInDesc = kwLower ? description.toLowerCase().includes(kwLower) : null;
  const kwInUrl = kwLower ? url.toLowerCase().includes(kwLower) : null;

  // Domain display formatting
  let displayDomain = 'example.com';
  let pathSegments: string[] = [];
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    displayDomain = parsed.hostname;
    pathSegments = parsed.pathname.split('/').filter(Boolean);
  } catch (e) {
    displayDomain = primaryUrl.replace(/https?:\/\//, '').split('/')[0];
  }

  const generatedHtmlTags = `<!-- Standard SEO Meta Tags -->
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${url}">

<!-- OpenGraph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${ogImage}">

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${ogImage}">`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedHtmlTags);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const applyAIOptimization = () => {
    // Generate high-converting CTR optimized title & snippet
    const domainClean = displayDomain.replace('www.', '').split('.')[0];
    const brandCapitalized = domainClean.charAt(0).toUpperCase() + domainClean.slice(1);
    
    setTitle(`${brandCapitalized} — High-Performance Solutions & Official Platform (2026)`);
    setDescription(`Discover ${brandCapitalized}'s award-winning solutions. Streamline workflows, scale operations, and boost efficiency with enterprise-grade reliability. Try today!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Interactive SERP & Social Sharing Studio</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight">Live Search Snippet & Social Card Simulator</h3>
            <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
              Preview exactly how your page appears in Google search results and social media feeds. Test title/description variations in real-time to maximize Organic Click-Through Rate (CTR).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={applyAIOptimization}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Optimize Snippet</span>
            </button>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl backdrop-blur-md transition-all"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied Tags!' : 'Copy HTML Tags'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Live Simulator Previews */}
        <div className="lg:col-span-7 space-y-4">
          {/* Platform & Device Toggle Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            {/* Platform Select */}
            <div className="flex items-center gap-1">
              {[
                { id: 'google', label: 'Google Search', icon: Globe },
                { id: 'facebook', label: 'Facebook / OG', icon: Share2 },
                { id: 'twitter', label: 'Twitter / X', icon: Share2 },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePlatform(p.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activePlatform === p.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <p.icon className="w-3.5 h-3.5" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            {/* Google Device Mode */}
            {activePlatform === 'google' && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl">
                <button
                  onClick={() => setDeviceMode('desktop')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    deviceMode === 'desktop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  Desktop
                </button>
                <button
                  onClick={() => setDeviceMode('mobile')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    deviceMode === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  Mobile
                </button>
              </div>
            )}
          </div>

          {/* PREVIEW CONTAINER */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            {/* GOOGLE PREVIEW */}
            {activePlatform === 'google' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-100 pb-2">
                  <span>Google Search Engine Result Page Preview</span>
                  <span>{deviceMode === 'desktop' ? 'Desktop SERP (600px)' : 'Mobile SERP (375px)'}</span>
                </div>

                <div className={`p-4 bg-white rounded-xl ${deviceMode === 'mobile' ? 'max-w-sm border border-slate-200 shadow-sm mx-auto' : ''}`}>
                  {/* Favicon & Breadcrumb */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold shrink-0">
                      {displayDomain.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] text-slate-800 font-medium leading-none truncate">
                        {displayDomain}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-none truncate mt-0.5">
                        https://{displayDomain} {pathSegments.length > 0 ? `› ${pathSegments.join(' › ')}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Title Link */}
                  <h3 className="text-[19px] leading-tight text-[#1a0dab] hover:underline cursor-pointer font-normal font-sans mb-1 line-clamp-1">
                    {title || 'Missing Page Title'}
                  </h3>

                  {/* Description Snippet */}
                  <p className="text-[13px] leading-snug text-[#4d5156] font-sans line-clamp-2">
                    {description || 'No meta description provided. Google will dynamically extract snippet text from the page content.'}
                  </p>
                </div>
              </div>
            )}

            {/* FACEBOOK / OPENGRAPH PREVIEW */}
            {activePlatform === 'facebook' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-100 pb-2">
                  <span>Facebook / OpenGraph Card Preview (1.91:1)</span>
                  <span>Desktop Feed</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 max-w-lg mx-auto shadow-xs">
                  <div className="aspect-[1.91/1] w-full bg-slate-200 relative overflow-hidden">
                    <img 
                      src={ogImage} 
                      alt="OpenGraph Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop';
                      }}
                    />
                  </div>
                  <div className="p-3 bg-slate-100/80 border-t border-slate-200">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                      {displayDomain}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                      {title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TWITTER / X CARD PREVIEW */}
            {activePlatform === 'twitter' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-100 pb-2">
                  <span>Twitter / X Large Summary Card Preview</span>
                  <span>Timeline</span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white max-w-lg mx-auto shadow-xs">
                  <div className="aspect-[2/1] w-full bg-slate-200 relative overflow-hidden">
                    <img 
                      src={ogImage} 
                      alt="Twitter Card Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop';
                      }}
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                      {displayDomain}
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generated Code Snippet */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                <Code className="w-4 h-4" />
                <span>Ready-to-Paste HTML Meta Tags</span>
              </div>
              <button
                onClick={copyToClipboard}
                className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied' : 'Copy Code'}
              </button>
            </div>
            <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto text-slate-300">
              {generatedHtmlTags}
            </pre>
          </div>
        </div>

        {/* Right Side: Interactive Editor & Length Meters */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              Live Snippet Editor & Length Metrics
            </h4>

            {/* Title Tag Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700">Page Title (&lt;title&gt;)</label>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[11px] font-bold ${
                    isTitleOptimal ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {titleLen} / 60 chars
                  </span>
                  <span className="text-[10px] text-slate-400">({estTitlePixels}px / 580px)</span>
                </div>
              </div>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter compelling SEO title..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />

              {/* Title Length Bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    titleLen > 60 ? 'bg-rose-500' : isTitleOptimal ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, (titleLen / 60) * 100)}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500">
                {titleLen > 60 ? (
                  <span className="text-rose-600">⚠ Title will be truncated in Google search results with "..."</span>
                ) : isTitleOptimal ? (
                  <span className="text-emerald-600 font-medium">✓ Optimal title length for Google CTR</span>
                ) : (
                  <span>Short title. Aim for 45–60 characters to optimize keyword relevance.</span>
                )}
              </p>
            </div>

            {/* Meta Description Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700">Meta Description</label>
                <span className={`font-mono text-[11px] font-bold ${
                  isDescOptimal ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {descLen} / 160 chars
                </span>
              </div>

              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter engaging meta description..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />

              {/* Description Length Bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    descLen > 160 ? 'bg-rose-500' : isDescOptimal ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, (descLen / 160) * 100)}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500">
                {descLen > 160 ? (
                  <span className="text-rose-600">⚠ Description exceeds 160 characters and will be truncated.</span>
                ) : isDescOptimal ? (
                  <span className="text-emerald-600 font-medium">✓ Optimal description length for organic search snippet</span>
                ) : (
                  <span>Optimal range is 120–160 characters.</span>
                )}
              </p>
            </div>

            {/* Canonical URL Input */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 text-xs block">Canonical Destination URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/page"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            {/* OpenGraph Image URL Input */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 text-xs block">Social Banner Image (og:image)</label>
              <input
                type="text"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder="https://example.com/social-card.jpg"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            {/* Target Keyword Checker */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="font-semibold text-slate-700 text-xs block">
                Target Focus Keyword Validator
              </label>
              <input
                type="text"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                placeholder="e.g. website audit, enterprise seo..."
                className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
              />

              {targetKeyword.trim() && (
                <div className="space-y-1 pt-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Present in Title Tag:</span>
                    <span className={kwInTitle ? 'text-emerald-600 font-bold' : 'text-rose-500 font-medium'}>
                      {kwInTitle ? '✓ Match Found' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Present in Meta Description:</span>
                    <span className={kwInDesc ? 'text-emerald-600 font-bold' : 'text-rose-500 font-medium'}>
                      {kwInDesc ? '✓ Match Found' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Present in URL Slug:</span>
                    <span className={kwInUrl ? 'text-emerald-600 font-bold' : 'text-slate-400 font-medium'}>
                      {kwInUrl ? '✓ Match Found' : '– Optional'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
