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
    { name: 'Decision Lab', path: '/app/decision-lab', icon: FlaskConical },
    { name: 'Campaigns', path: '/app/campaigns', icon: Target },
    { name: 'AI Analyst', path: '/app/assistant', icon: Sparkles },
    { name: 'Reports', path: '/app/reports', icon: FileText },
    { name: 'Settings', path: '/app/settings', icon: Settings },
    { name: 'Methodology', path: '/app/methodology', icon: BookOpen },
  ];

  const sidebarContent = (
    <div className="w-[260px] h-full bg-white border-r border-[#E6E8EC] flex flex-col justify-between shrink-0 select-none">
      <div className="flex flex-col h-full">
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[#E6E8EC] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#315E81] flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-sm">
              RQ
            </div>
            <span className="font-bold text-lg text-[#20242C] tracking-tight">
              RetainIQ
            </span>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-[#697386] hover:text-[#20242C] hover:bg-[#F7F8FA] rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 text-[15px] font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#315E81] text-white'
                      : 'text-[#697386] hover:text-[#20242C] hover:bg-[#F7F8FA]'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="p-4 border-t border-[#E6E8EC] shrink-0">
          <div className="flex items-center space-x-2 text-sm text-[#697386]">
            <span className="w-2 h-2 rounded-full bg-[#3E8B69] shrink-0"></span>
            <span>MySQL 8.0 Connected</span>
          </div>
          <div className="text-xs text-[#697386]/70 mt-1">
            RetainIQ v1.0 · Enterprise
          </div>
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

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative flex flex-col max-w-[280px] w-full z-50 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
