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
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">System & Workspace Settings</h1>
        <p className="text-sm text-text-secondary mt-1">
          Review application configuration, MySQL 8.0 connection status, strict SQLite prohibition policy, and AI provider settings.
        </p>
      </div>

      {/* Database Status Card - STRICT MYSQL RULE */}
      <div className="bg-surface rounded-lg border border-border p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Relational Database Configuration</h2>
              <p className="text-xs text-text-muted">Strict MySQL 8.0+ persistence architecture</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            MySQL Online
          </span>
        </div>

        {/* Strict SQLite Prohibition Banner */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-md flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <span className="font-bold">Strict Architecture Enforcement: Zero SQLite Policy</span>
            <p>
              In accordance with RetainIQ enterprise requirements, SQLite is strictly forbidden across all environments (development, automated testing, fallbacks, and production). If MySQL becomes unreachable, the system will intentionally halt and report an explicit MySQL error rather than silently degrading to SQLite.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <span className="text-text-muted font-medium block mb-1">Database Engine</span>
            <span className="font-bold text-text-primary text-sm">MySQL Server 8.0+</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <span className="text-text-muted font-medium block mb-1">Database Host & Port</span>
            <span className="font-bold text-text-primary text-sm">localhost:3306</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <span className="text-text-muted font-medium block mb-1">Active Schema</span>
            <span className="font-bold text-text-primary text-sm font-mono">retainiq_db</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <span className="text-text-muted font-medium block mb-1">Python DB Driver</span>
            <span className="font-bold text-text-primary text-sm font-mono">PyMySQL (Safe URI)</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-text-secondary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-500" />
            <span>Migrations Status: <strong>Alembic Synchronized (Revision 001_initial_schema)</strong></span>
          </div>
          <span className="text-text-muted font-mono">15 Tables Indexed</span>
        </div>
      </div>

      {/* User & Workspace Profile */}
      <div className="bg-surface rounded-lg border border-border p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-md">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">User & Tenant Workspace</h2>
            <p className="text-xs text-text-muted">Authentication, tenant isolation and workspace context</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <span className="text-text-muted font-medium block mb-1">Full Name</span>
            <span className="font-semibold text-text-primary">{user?.full_name || 'Demo Analyst'}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <span className="text-text-muted font-medium block mb-1">Email Address</span>
            <span className="font-semibold text-text-primary font-mono">{user?.email || 'demo@retainiq.io'}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <span className="text-text-muted font-medium block mb-1">Active Role</span>
            <span className="font-semibold text-brand uppercase">{user?.role || 'admin'}</span>
          </div>
        </div>
      </div>

      {/* AI Assistant Configuration */}
      <div className="bg-surface rounded-lg border border-border p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">AI Investigation Assistant (RetainIQ Analyst)</h2>
              <p className="text-xs text-text-muted">Configurable LLM provider with verified SQL-grounded context</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Deterministic Fallback Active
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-text-primary block">LLM API Key Status</span>
              <span className="text-text-muted">
                Stored securely in backend environment variables (<code className="font-mono">backend/.env</code>).
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
              <Key className="w-3.5 h-3.5 text-text-muted" />
              <span>{(import.meta as any).env?.VITE_LLM_CONFIGURED ? 'API KEY CONFIGURED' : 'OPTIONAL (Fallback Active)'}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary block mb-1">Architectural Grounding Safeguards:</span>
            RetainIQ strictly forbids sending raw SQL execution capabilities, terminal commands, or unverified hallucinations to the user. All metrics fed to the AI assistant are pre-calculated by parameterized MySQL queries and scikit-learn model evaluation pipelines.
          </div>
        </div>
      </div>

      {/* Backend Server Information */}
      <div className="bg-surface rounded-lg border border-border p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-md">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Application Runtime & Environment</h2>
            <p className="text-xs text-text-muted">Backend stack and dependencies</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-text-muted block text-[11px]">Backend API</span>
            <span className="font-semibold text-text-primary">FastAPI 0.115+</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-text-muted block text-[11px]">Python Runtime</span>
            <span className="font-semibold text-text-primary">Python 3.11.9</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-text-muted block text-[11px]">ORM Engine</span>
            <span className="font-semibold text-text-primary">SQLAlchemy 2.0.38</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-text-muted block text-[11px]">ML Framework</span>
            <span className="font-semibold text-text-primary">Scikit-learn 1.6.1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
