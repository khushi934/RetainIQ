import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  CheckCircle2,
  Brain,
  PieChart,
  Search,
  FlaskConical,
  Target,
  Sparkles,
  FileText,
  Settings,
  BookOpen
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const navSections: Array<{ section: string; items: NavItem[] }> = [
    {
      section: 'ANALYTICS & DATA',
      items: [
        { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
        { name: 'Customer Directory', path: '/app/customers', icon: Users },
        { name: 'Data Import (CSV)', path: '/app/import', icon: UploadCloud },
        { name: 'Data Quality Health', path: '/app/quality', icon: CheckCircle2 },
        { name: 'Segmentation', path: '/app/segments', icon: PieChart },
      ],
    },
    {
      section: 'PREDICTION & STRATEGY',
      items: [
        { name: 'Predictive Models', path: '/app/models', icon: Brain },
        { name: 'Churn Investigator', path: '/app/investigator', icon: Search },
        { name: 'Retention Decision Lab', path: '/app/decision-lab', icon: FlaskConical, badge: 'Core' },
        { name: 'Campaign Tracking', path: '/app/campaigns', icon: Target },
        { name: 'RetainIQ Analyst', path: '/app/assistant', icon: Sparkles, badge: 'AI' },
      ],
    },
    {
      section: 'GOVERNANCE & SYSTEM',
      items: [
        { name: 'Audit Reports', path: '/app/reports', icon: FileText },
        { name: 'Settings & MySQL', path: '/app/settings', icon: Settings },
        { name: 'Methodology & Help', path: '/app/methodology', icon: BookOpen },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none">
      <div className="py-4 overflow-y-auto">
        {navSections.map((sec, idx) => (
          <div key={idx} className="mb-6">
            <div className="px-5 mb-2 text-[10px] font-bold text-slate-400 tracking-wider">
              {sec.section}
            </div>
            <nav className="space-y-0.5 px-3">
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="text-[11px] text-slate-500 font-medium">
          Portfolio Build 1.0.0
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          MySQL 8.0 &bull; Scikit-learn &bull; FastAPI
        </div>
      </div>
    </aside>
  );
};
