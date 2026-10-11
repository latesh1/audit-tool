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
    if (location.pathname.startsWith('/audits/')) return 'Audit Report';
    return pathMap[location.pathname] || 'Dashboard';
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
      // User cancelled
    }
  };

  return (
    <header 
      className="h-14 bg-white border-b border-[#E6E8EF] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 shrink-0"
    >
      {/* Left: Mobile trigger & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumbs" className="hidden sm:flex items-center gap-1.5 text-xs text-[#667085] min-w-0">
          <Link to="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline font-medium">Dashboard</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
          <span className="text-slate-900 font-semibold truncate">{currentPage}</span>
        </nav>
      </div>

      {/* Center: Command / Search Bar */}
      <div className="flex-1 max-w-sm mx-auto hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search domain or keyword (press Enter)..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#F7F8FC] border border-[#E6E8EF] rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all"
          />
        </div>
      </div>

      {/* Right: Quick actions and Profile */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleShare}
          className="btn-secondary !py-1.5 !px-2.5 text-xs font-medium"
          title="Share active report or page link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
        </button>

        <Link
          to="/settings"
          className="flex items-center gap-2 pl-2 border-l border-[#E6E8EF] hover:opacity-85 transition-opacity"
          title="Account settings"
        >
          <div className="w-7 h-7 rounded-full bg-accent-50 text-accent-600 border border-accent-200 flex items-center justify-center text-xs font-bold">
            K
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-900 leading-none">Kevine H.</p>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5">Admin</p>
          </div>
        </Link>
      </div>
    </header>
  );
};
