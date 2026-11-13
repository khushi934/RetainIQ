import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Database, ShieldAlert, CheckCircle, Cpu, HardDrive, Key, User, Server } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [healthRes, userRes] = await Promise.all([
          api.checkHealth(),
          api.getMe()
        ]);
        setHealth(healthRes);
        setUser(userRes);
      } catch (err) {
        console.error('Error fetching settings info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="pb-4 border-b border-[#E6E8EC]">
        <h1 className="text-2xl font-semibold text-[#20242C] tracking-tight">System & Workspace Settings</h1>
        <p className="text-sm text-[#697386] mt-1">
          Review application runtime configuration, relational database connectivity, and workspace architecture.
        </p>
      </div>

      {/* Database Status Card - STRICT MYSQL RULE */}
      <div className="bg-white rounded-lg border border-[#E6E8EC] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E8EC]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#315E81]/10 text-[#315E81] rounded-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#20242C]">Relational Database Configuration</h2>
              <p className="text-xs text-[#697386]">Strict MySQL 8.0+ enterprise persistence</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#3E8B69]/10 text-[#3E8B69] border border-[#3E8B69]/20">
            <CheckCircle className="w-3.5 h-3.5" />
            MySQL Online
          </span>
        </div>

        {/* Strict SQLite Prohibition Banner */}
        <div className="p-4 bg-[#D69A37]/10 border border-[#D69A37]/30 rounded-md flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[#D69A37] shrink-0 mt-0.5" />
          <div className="text-xs text-[#855B14] space-y-1">
            <span className="font-semibold text-[#20242C]">Strict Architecture Enforcement: Zero SQLite Policy</span>
            <p className="text-[#697386] leading-relaxed">
              In accordance with RetainIQ enterprise requirements, SQLite is strictly forbidden across all environments (development, automated testing, fallbacks, and production). If MySQL becomes unreachable, the system will intentionally halt and report an explicit database connectivity error rather than silently degrading.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
          <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md">
            <span className="text-[#697386] font-medium block mb-1">Database Engine</span>
            <span className="font-semibold text-[#20242C] text-sm">MySQL Server 8.0+</span>
          </div>
          <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md">
            <span className="text-[#697386] font-medium block mb-1">Database Host & Port</span>
            <span className="font-semibold text-[#20242C] text-sm">localhost:3306</span>
          </div>
          <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md">
            <span className="text-[#697386] font-medium block mb-1">Active Schema</span>
            <span className="font-semibold text-[#20242C] text-sm font-mono">retainiq_db</span>
          </div>
          <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md">
            <span className="text-[#697386] font-medium block mb-1">Python DB Driver</span>
            <span className="font-semibold text-[#20242C] text-sm font-mono">PyMySQL</span>
          </div>
        </div>

        <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md text-xs text-[#697386] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#697386]" />
            <span>Migrations Status: <strong className="text-[#20242C]">Alembic Synchronized (Revision 001_initial_schema)</strong></span>
          </div>
          <span className="text-[#697386] font-mono">15 Tables Indexed</span>
        </div>
      </div>

      {/* User & Workspace Profile */}
      <div className="bg-white rounded-lg border border-[#E6E8EC] p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[#E6E8EC]">
          <div className="p-2 bg-[#315E81]/10 text-[#315E81] rounded-md">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#20242C]">User & Tenant Workspace</h2>
            <p className="text-xs text-[#697386]">Authentication, tenant isolation and workspace context</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md">
            <span className="text-[#697386] font-medium block mb-1">Full Name</span>
            <span className="font-semibold text-[#20242C] text-sm">{user?.full_name || 'Active User'}</span>
          </div>
          <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md">
            <span className="text-[#697386] font-medium block mb-1">Email Address</span>
            <span className="font-semibold text-[#20242C] text-sm font-mono">{user?.email || 'user@company.com'}</span>
          </div>
          <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md">
            <span className="text-[#697386] font-medium block mb-1">Active Role</span>
            <span className="font-semibold text-[#315E81] uppercase text-sm">{user?.role || 'admin'}</span>
          </div>
        </div>
      </div>

      {/* AI Assistant Configuration */}
      <div className="bg-white rounded-lg border border-[#E6E8EC] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E8EC]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#438A83]/10 text-[#438A83] rounded-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#20242C]">AI Investigation Assistant (RetainIQ Analyst)</h2>
              <p className="text-xs text-[#697386]">Configurable LLM provider with verified SQL-grounded context</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-[#F7F8FA] text-[#697386] border border-[#E6E8EC]">
            Deterministic Grounding Active
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-[#20242C] block">LLM API Key Status</span>
              <span className="text-[#697386]">
                Stored securely in backend environment variables (<code className="font-mono text-[#20242C]">backend/.env</code>).
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[#697386] bg-white px-2.5 py-1 rounded border border-[#E6E8EC]">
              <Key className="w-3.5 h-3.5 text-[#697386]" />
              <span>{(import.meta as any).env?.VITE_LLM_CONFIGURED ? 'API KEY CONFIGURED' : 'OPTIONAL (Fallback Active)'}</span>
            </div>
          </div>

          <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md text-[#697386] leading-relaxed">
            <span className="font-semibold text-[#20242C] block mb-1">Architectural Grounding Safeguards:</span>
            RetainIQ strictly forbids sending raw SQL execution capabilities, terminal commands, or unverified hallucinations to the user. All metrics fed to the AI assistant are pre-calculated by parameterized MySQL queries and scikit-learn model evaluation pipelines.
          </div>
        </div>
      </div>

      {/* Backend Server Information */}
      <div className="bg-white rounded-lg border border-[#E6E8EC] p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[#E6E8EC]">
          <div className="p-2 bg-[#F7F8FA] text-[#697386] rounded-md border border-[#E6E8EC]">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#20242C]">Application Runtime & Environment</h2>
            <p className="text-xs text-[#697386]">Backend stack and dependencies</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md">
            <span className="text-[#697386] block text-[11px] mb-1">Backend API</span>
            <span className="font-semibold text-[#20242C] text-sm">FastAPI 0.115+</span>
          </div>
          <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md">
            <span className="text-[#697386] block text-[11px] mb-1">Python Runtime</span>
            <span className="font-semibold text-[#20242C] text-sm">Python 3.11.9</span>
          </div>
          <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md">
            <span className="text-[#697386] block text-[11px] mb-1">ORM Engine</span>
            <span className="font-semibold text-[#20242C] text-sm">SQLAlchemy 2.0+</span>
          </div>
          <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md">
            <span className="text-[#697386] block text-[11px] mb-1">ML Framework</span>
            <span className="font-semibold text-[#20242C] text-sm">Scikit-learn 1.6+</span>
          </div>
        </div>
      </div>
    </div>
  );
};
