import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('retainiq_token', res.access_token);
      if (res.user.workspaces && res.user.workspaces.length > 0) {
        localStorage.setItem('retainiq_workspace_id', res.user.workspaces[0].id.toString());
      }
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 border border-[#E6E8EC] rounded-lg text-base text-[#20242C] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#315E81]/30 focus:border-[#315E81] transition-colors bg-white";

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#315E81] flex items-center justify-center text-white font-bold text-base shadow-sm">
              RQ
            </div>
            <span className="font-bold text-2xl text-[#20242C] tracking-tight">RetainIQ</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#20242C] tracking-tight">Sign in to your workspace</h1>
          <p className="text-base text-[#697386] mt-2">Enter your credentials to continue.</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="mb-5 p-4 bg-[#FBF2F2] border border-[#F2D5D4] rounded-lg flex items-start gap-3 text-[#C75B58] text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#20242C] mb-2">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@company.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#20242C] mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-5 bg-[#315E81] hover:bg-[#274b68] disabled:opacity-60 text-white rounded-lg text-base font-semibold transition-colors shadow-sm mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#697386]">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#315E81] hover:underline">
              Create a workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
