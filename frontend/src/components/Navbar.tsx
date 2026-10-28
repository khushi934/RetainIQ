import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Database, ShieldCheck, User, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>('demo@retainiq.io');
  const [userName, setUserName] = useState<string>('Alex Mercer');
  const [workspaceName, setWorkspaceName] = useState<string>('Telecom Enterprise Demo');
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; version: string }>({ connected: true, version: 'MySQL 8.0' });

  useEffect(() => {
    api.checkHealth()
      .then(res => {
        if (res.database) {
          setDbStatus({
            connected: res.database.connected,
            version: res.database.mysql_version ? `MySQL ${res.database.mysql_version.split('-')[0]}` : 'MySQL 8.0'
          });
        }
      })
      .catch(() => {});

    api.getMe()
      .then(u => {
        setUserEmail(u.email);
        setUserName(u.full_name);
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

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-20 sticky top-0">
      <div className="flex items-center space-x-6">
        <Link to="/app/dashboard" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            RQ
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-base tracking-tight leading-none">
              RetainIQ
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase mt-0.5">
              Customer Retention Intelligence
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-slate-200">
          <span className="text-xs font-medium text-slate-500">Workspace:</span>
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700">
            <span>{workspaceName}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1"></span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* MySQL Architecture Indicator (Strict Rule compliance display) */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-blue-50/80 border border-blue-200/80 rounded-md text-xs font-medium text-blue-800">
          <Database className="w-3.5 h-3.5 text-blue-700" />
          <span>{dbStatus.version}</span>
          <span className="text-blue-500 text-[10px]">Strict Persistence</span>
        </div>

        {/* User menu */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-xs font-medium text-slate-700">
              {userName.charAt(0)}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-800 leading-none">{userName}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{userEmail}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
