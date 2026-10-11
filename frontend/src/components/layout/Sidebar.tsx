import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart2,
  ShieldCheck,
  PlusCircle,
  Settings,
  Globe
} from 'lucide-react';


interface SidebarProps {
  onCloseMobile?: () => void;
}

const NavItem: React.FC<{
  to: string;
  icon: React.FC<{ className?: string }>;
  label: string;
  badge?: number;
  onClose?: () => void;
}> = ({ to, icon: Icon, label, badge, onClose }) => (
  <NavLink
    to={to}
    end={to === '/'}
    onClick={onClose}
    className={({ isActive }) =>
      `group flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
        isActive
          ? 'nav-active-item'
          : 'text-purple-200/50 hover:text-purple-100 hover:bg-white/5'
      }`
    }
  >
    <span className="flex items-center gap-2.5">
      <Icon className="w-4 h-4 shrink-0 opacity-70 group-[.nav-active-item]:opacity-100" />
      {label}
    </span>
    {badge !== undefined && (
      <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
        {badge}
      </span>
    )}
  </NavLink>
);

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  return (
    <aside className="sidebar-gradient w-56 flex flex-col h-full select-none border-r border-white/5">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm tracking-tight">AISEO.ai</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Core Audit Section */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-300/40 px-3 mb-2">Audit & Analytics</p>
          <div className="space-y-1">
            <NavItem to="/" icon={LayoutDashboard} label="Overview" onClose={onCloseMobile} />
            <NavItem to="/analytics" icon={BarChart2} label="Analytics" onClose={onCloseMobile} />
            <NavItem to="/new-audit" icon={PlusCircle} label="New Audit" onClose={onCloseMobile} />
            <NavItem to="/history" icon={ShieldCheck} label="Audit History" onClose={onCloseMobile} />
          </div>
        </div>

        {/* Growth & Optimization Tools */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-300/40 px-3 mb-2">Studio & Tools</p>
          <div className="space-y-1">
            <NavItem to="/serp-studio" icon={Globe} label="SERP & Meta Studio" onClose={onCloseMobile} />
          </div>
        </div>

        {/* Configuration Section */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-300/40 px-3 mb-2">Configuration</p>
          <div className="space-y-1">
            <NavItem to="/settings" icon={Settings} label="Settings & AI" onClose={onCloseMobile} />
          </div>
        </div>
      </div>

      {/* Bottom user section */}
      <div className="px-3 py-4 border-t border-white/8">
        <Link
          to="/settings"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors group"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            K
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white/90 truncate">Kevine Harry</p>
            <p className="text-[10px] text-purple-300/50 truncate">Admin</p>
          </div>
          <Settings className="w-3.5 h-3.5 text-purple-300/40 ml-auto shrink-0 group-hover:text-purple-200 transition-colors" />
        </Link>
      </div>
    </aside>
  );
};
