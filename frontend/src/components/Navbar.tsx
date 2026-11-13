import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('Analyst');
  const [userEmail, setUserEmail] = useState<string>('');
  const [workspaceName, setWorkspaceName] = useState<string>('Primary Workspace');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api.getMe()
      .then((u) => {
        if (u.full_name) setUserName(u.full_name);
        if (u.email) setUserEmail(u.email);
        if (u.workspaces && u.workspaces.length > 0) {
          setWorkspaceName(u.workspaces[0].name);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('retainiq_token');
    localStorage.removeItem('retainiq_workspace_id');
    navigate('/login');
  };

  const getBreadcrumb = () => {
    const p = location.pathname;
    if (p.includes('/dashboard')) return 'Overview';
    if (p.includes('/customers/')) return 'Customer Profile';
    if (p.includes('/customers')) return 'Customers';
    if (p.includes('/import')) return 'Data Imports';
    if (p.includes('/quality')) return 'Data Quality';
    if (p.includes('/segments')) return 'Customer Segments';
    if (p.includes('/models')) return 'Churn Prediction';
    if (p.includes('/investigator')) return 'Churn Investigator';
    if (p.includes('/decision-lab')) return 'Retention Decision Lab';
    if (p.includes('/campaigns')) return 'Campaigns';
    if (p.includes('/assistant')) return 'AI Analyst';
    if (p.includes('/reports')) return 'Reports';
    if (p.includes('/settings')) return 'Settings';
    if (p.includes('/methodology')) return 'Methodology';
    return 'Dashboard';
  };

  return (
    <header className="h-16 bg-white border-b border-[#E6E8EC] px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
      <div className="flex items-center space-x-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-[#697386] hover:text-[#20242C] rounded-lg hover:bg-[#F7F8FA]"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Page title / breadcrumb */}
        <div className="flex items-center space-x-2 text-[15px]">
          <span className="text-[#697386] hidden sm:inline font-medium">Workspace</span>
          <span className="text-[#D1D5DB] hidden sm:inline">/</span>
          <span className="font-semibold text-[#20242C] text-[16px]">{getBreadcrumb()}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Workspace Selector Badge */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-lg text-sm font-medium text-[#20242C]">
          <span className="w-2 h-2 rounded-full bg-[#3E8B69] shrink-0"></span>
          <span className="max-w-[160px] truncate">{workspaceName}</span>
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center space-x-2 p-1.5 pl-2.5 text-sm font-medium text-[#20242C] hover:bg-[#F7F8FA] rounded-lg transition-colors border border-transparent hover:border-[#E6E8EC]"
          >
            <div className="w-7 h-7 rounded-full bg-[#315E81] text-white flex items-center justify-center text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline text-[#20242C] text-sm">{userName}</span>
            <ChevronDown className="w-4 h-4 text-[#697386]" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-60 bg-white border border-[#E6E8EC] rounded-xl shadow-xl p-2 z-40">
                <div className="px-3 py-2.5 border-b border-[#E6E8EC] mb-1.5">
                  <div className="font-semibold text-sm text-[#20242C]">{userName}</div>
                  <div className="text-xs text-[#697386] truncate mt-0.5">{userEmail || 'Active Analyst'}</div>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); navigate('/app/settings'); }}
                  className="w-full text-left px-3 py-2 text-sm text-[#20242C] hover:bg-[#F7F8FA] rounded-lg transition-colors flex items-center space-x-2.5"
                >
                  <UserIcon className="w-4 h-4 text-[#697386]" />
                  <span>Account & Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-[#C75B58] hover:bg-[#FBF2F2] rounded-lg transition-colors flex items-center space-x-2.5 mt-0.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
