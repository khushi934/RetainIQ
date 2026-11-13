import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  PieChart,
  Brain,
  Search,
  FlaskConical,
  Target,
  Sparkles,
  FileText,
  Settings,
  BookOpen,
  X
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const navItems = [
    { name: 'Overview', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/app/customers', icon: Users },
    { name: 'Data Imports', path: '/app/import', icon: UploadCloud },
    { name: 'Segments', path: '/app/segments', icon: PieChart },
    { name: 'Churn Prediction', path: '/app/models', icon: Brain },
    { name: 'Churn Investigator', path: '/app/investigator', icon: Search },
    { name: 'Retention Decision Lab', path: '/app/decision-lab', icon: FlaskConical },
    { name: 'Campaigns', path: '/app/campaigns', icon: Target },
    { name: 'AI Analyst', path: '/app/assistant', icon: Sparkles },
    { name: 'Reports', path: '/app/reports', icon: FileText },
    { name: 'Settings', path: '/app/settings', icon: Settings },
    { name: 'Methodology & Help', path: '/app/methodology', icon: BookOpen },
  ];

  const sidebarContent = (
    <div className="w-[240px] h-full bg-white border-r border-[#E6E8EC] flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-14 px-5 border-b border-[#E6E8EC] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-[#315E81] flex items-center justify-center text-white font-semibold text-xs tracking-tight">
              RQ
            </div>
            <span className="font-semibold text-[15px] text-[#20242C] tracking-tight">
              RetainIQ
            </span>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 text-[#697386] hover:text-[#20242C]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3 py-2 text-[13px] font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-[#F7F8FA] text-[#315E81] font-semibold'
                      : 'text-[#697386] hover:text-[#20242C] hover:bg-[#F7F8FA]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Area */}
      <div className="p-4 border-t border-[#E6E8EC] bg-[#FAFBFC]">
        <div className="flex items-center space-x-2 text-[11px] text-[#697386]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3E8B69]"></span>
          <span>MySQL Server 8.0 Connected</span>
        </div>
        <div className="text-[11px] text-[#697386]/70 mt-0.5">
          Version 1.0 &bull; Enterprise SaaS
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-full shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-[240px] w-full bg-white z-50 shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
