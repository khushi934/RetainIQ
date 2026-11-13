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

  // Derive readable breadcrumb from route
  const getBreadcrumb = () => {
    const p = location.pathname;
    if (p.includes('/dashboard')) return 'Overview';
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
    <header className="h-14 bg-white border-b border-[#E6E8EC] px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 text-[#697386] hover:text-[#20242C] rounded-md hover:bg-[#F7F8FA]"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Breadcrumb / Page Title */}
        <div className="flex items-center space-x-2 text-[13px]">
          <span className="text-[#697386] hidden sm:inline">Workspace</span>
          <span className="text-[#E6E8EC] hidden sm:inline">/</span>
          <span className="font-semibold text-[#20242C]">{getBreadcrumb()}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Workspace Selector Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md text-[12px] font-medium text-[#20242C]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3E8B69]"></span>
          <span className="max-w-[140px] truncate">{workspaceName}</span>
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center space-x-2 p-1 pl-2 text-[13px] font-medium text-[#20242C] hover:bg-[#F7F8FA] rounded-md transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-[#E6E8EC] text-[#20242C] flex items-center justify-center text-[11px] font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline text-[#20242C] text-[13px]">{userName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#697386]" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1.5 w-56 bg-white border border-[#E6E8EC] rounded-lg shadow-dropdown p-1.5 z-40 text-xs">
                <div className="px-3 py-2 border-b border-[#E6E8EC] mb-1">
                  <div className="font-medium text-[#20242C]">{userName}</div>
                  <div className="text-[11px] text-[#697386] truncate mt-0.5">{userEmail || 'Active Analyst'}</div>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/app/settings');
                  }}
                  className="w-full text-left px-3 py-1.5 text-[#20242C] hover:bg-[#F7F8FA] rounded-md transition-colors flex items-center space-x-2"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#697386]" />
                  <span>Account & Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-1.5 text-[#C75B58] hover:bg-[#FBF2F2] rounded-md transition-colors flex items-center space-x-2 mt-0.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
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
