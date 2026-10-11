import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart2,
  ShieldCheck,
  PlusCircle,
  Settings,
  Globe,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const NavItem: React.FC<{
  to: string;
  icon: React.FC<{ className?: string }>;
  label: string;
  badge?: string | number;
  onClose?: () => void;
  collapsed?: boolean;
}> = ({ to, icon: Icon, label, badge, onClose, collapsed }) => (
  <NavLink
    to={to}
    end={to === '/'}
    onClick={onClose}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      `group relative flex items-center ${
        collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
      } rounded-lg text-[13px] font-medium transition-all duration-150 ${
        isActive
          ? 'sidebar-nav-active text-white font-semibold'
          : 'sidebar-nav-item'
      }`
    }
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
      {!collapsed && <span className="truncate">{label}</span>}
    </div>
    {!collapsed && badge !== undefined && (
      <span className="px-1.5 py-0.5 rounded-full bg-accent-500/20 text-accent-300 text-[10px] font-bold tabular-nums shrink-0">
        {badge}
      </span>
    )}
  </NavLink>
);

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile, collapsed = false, onToggleCollapse }) => {
  return (
    <aside
      className={`sidebar-container ${
        collapsed ? 'w-16' : 'w-60'
      } flex flex-col h-full select-none transition-all duration-200 z-30 shrink-0`}
    >
      {/* Brand Header */}
      <div className={`h-14 flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} border-b border-[#1E2433]`}>
        <Link to="/" onClick={onCloseMobile} className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-accent-500 flex items-center justify-center shadow-sm shrink-0">
            <Globe className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-white text-sm tracking-tight">AISEO.ai</span>
              <span className="text-[10px] font-semibold text-accent-400 bg-accent-500/10 px-1.5 py-0.2 rounded border border-accent-500/20 uppercase tracking-wider">
                Pro
              </span>
            </div>
          )}
        </Link>
        {onToggleCollapse && !collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            className="hidden lg:flex p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
        {/* Audit & Analytics */}
        <div>
          {!collapsed && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Audit & Analytics
            </p>
          )}
          <div className="space-y-0.5">
            <NavItem to="/" icon={LayoutDashboard} label="Overview" onClose={onCloseMobile} collapsed={collapsed} />
            <NavItem to="/analytics" icon={BarChart2} label="Analytics" onClose={onCloseMobile} collapsed={collapsed} />
            <NavItem to="/new-audit" icon={PlusCircle} label="New Audit" badge="Start" onClose={onCloseMobile} collapsed={collapsed} />
            <NavItem to="/history" icon={ShieldCheck} label="Audit History" onClose={onCloseMobile} collapsed={collapsed} />
          </div>
        </div>

        {/* Growth & Optimization Tools */}
        <div>
          {!collapsed && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Optimization Tools
            </p>
          )}
          <div className="space-y-0.5">
            <NavItem to="/serp-studio" icon={Globe} label="SERP & Meta Studio" onClose={onCloseMobile} collapsed={collapsed} />
          </div>
        </div>

        {/* Configuration */}
        <div>
          {!collapsed && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Configuration
            </p>
          )}
          <div className="space-y-0.5">
            <NavItem to="/settings" icon={Settings} label="Settings & AI" onClose={onCloseMobile} collapsed={collapsed} />
          </div>
        </div>
      </div>

      {/* Collapse Toggle for collapsed state */}
      {onToggleCollapse && collapsed && (
        <div className="p-2 flex justify-center border-t border-[#1E2433]">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* User Footer Profile */}
      <div className="p-3 border-t border-[#1E2433]">
        <Link
          to="/settings"
          onClick={onCloseMobile}
          className={`flex items-center ${collapsed ? 'justify-center p-1' : 'gap-2.5 p-1.5'} rounded-lg hover:bg-white/5 transition-colors group`}
        >
          <div className="w-7 h-7 rounded-full bg-accent-500/20 border border-accent-400/30 flex items-center justify-center text-accent-300 text-xs font-bold shrink-0">
            K
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white/90 truncate leading-tight">Kevine Harry</p>
              <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">Admin · Savit Team</p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
};
