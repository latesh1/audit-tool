import React, { useState } from 'react';
import { Menu, Share2, Search, ChevronRight, Home, Check, ExternalLink } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onOpenMobile: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const getBreadcrumb = () => {
    const pathMap: Record<string, string> = {
      '/': 'Overview',
      '/analytics': 'Analytics',
      '/history': 'Audit History',
      '/new-audit': 'New Audit',
      '/serp-studio': 'SERP & Meta Studio',
      '/settings': 'Settings',
    };
    const label = pathMap[location.pathname] || 'Report';
    return label;
  };

  const currentPage = getBreadcrumb();

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/history?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'SiteScope AI Audit',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled or clipboard permission denied
    }
  };

  return (
    <header 
      className="h-14 bg-white border-b border-gray-100 px-5 flex items-center gap-4 sticky top-0 z-20"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={onOpenMobile}
        className="lg:hidden p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb */}
      <nav className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 min-w-0">
        <Link to="/" className="hover:text-gray-600 transition-colors">
          <Home className="w-3.5 h-3.5" />
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        <span className="text-gray-400">Dashboard</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        <span className="text-gray-700 font-medium truncate">{currentPage}</span>
      </nav>

      {/* Search Bar - functional input */}
      <div className="flex-1 max-w-xs mx-auto hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search domain & press Enter..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-300 transition-all"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Share Button with feedback */}
        <button
          type="button"
          onClick={handleShare}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors active:scale-95"
          title="Share or copy current link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Link Copied!' : 'Share'}</span>
        </button>

        {/* User profile linked to settings */}
        <Link
          to="/settings"
          className="flex items-center gap-2 pl-2 border-l border-gray-100 hover:opacity-80 transition-opacity"
          title="Go to settings"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            K
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-gray-800 leading-none">Kevine Harry</p>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">Admin</p>
          </div>
        </Link>
      </div>
    </header>
  );
};
