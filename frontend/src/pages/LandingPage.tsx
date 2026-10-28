import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  TrendingUp,
  Brain,
  FlaskConical,
  Database,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Search,
  Sparkles
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-30 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            RQ
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">RetainIQ</span>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/login"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link
            to="/app/dashboard"
            className="text-xs font-semibold px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors shadow-xs flex items-center space-x-1.5"
          >
            <span>Launch Live App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 lg:px-12 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-800 text-xs font-medium mb-6">
          <Database className="w-3.5 h-3.5" />
          <span>Strict MySQL 8.0 Architecture &bull; Scikit-Learn Pipeline</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Understand Customers. <br className="hidden sm:inline" />
          <span className="text-blue-600">Prevent Avoidable Churn.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mt-6 leading-relaxed">
          An enterprise customer retention intelligence platform. Distinguish historical facts from machine learning predictions, simulate retention campaigns, and make evidence-grounded decisions.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/app/dashboard"
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 text-sm"
          >
            <span>Open Demo Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/app/methodology"
            className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors text-sm"
          >
            Review Methodology & Limitations
          </Link>
        </div>

        {/* Pillars strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 text-left">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <BarChart3 className="w-5 h-5 text-blue-600 mb-2" />
            <div className="font-semibold text-sm text-slate-900">Verified SQL Analytics</div>
            <div className="text-xs text-slate-500 mt-1">Real MySQL aggregations for cohorts, contracts, and revenue at risk.</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <Brain className="w-5 h-5 text-indigo-600 mb-2" />
            <div className="font-semibold text-sm text-slate-900">Genuine ML Classifier</div>
            <div className="text-xs text-slate-500 mt-1">Scikit-learn pipeline with leakage checks and train/test evaluation.</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <FlaskConical className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="font-semibold text-sm text-slate-900">Decision Lab Simulator</div>
            <div className="text-xs text-slate-500 mt-1">Compare hypothetical retention strategies with transparent uplift models.</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-600 mb-2" />
            <div className="font-semibold text-sm text-slate-900">Grounded AI Analyst</div>
            <div className="text-xs text-slate-500 mt-1">Strict context grounding from verified MySQL metrics without hallucination.</div>
          </div>
        </div>
      </section>

      {/* Signature Feature Highlight: Retention Decision Lab */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">Signature Capability</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">Retention Decision Lab</h2>
            <p className="text-slate-600 text-sm mt-3">
              Most businesses know customers leave, but cannot quantify the trade-offs of intervention. Compare proactive outreach vs. promotional discounts under transparent, editable assumptions.
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-6 lg:p-8 shadow-xs">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Strategy A</div>
                <div className="text-base font-bold text-slate-900 mt-1">20% High-Risk Discount</div>
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between"><span>Budget:</span><span className="font-medium text-slate-900">$5,000</span></div>
                  <div className="flex justify-between"><span>Target:</span><span className="font-medium text-slate-900">350 accounts</span></div>
                  <div className="flex justify-between"><span>Assumed Uplift:</span><span className="font-medium text-slate-900">18.0%</span></div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold">
                    <span>Expected Net Benefit:</span><span className="text-emerald-700">+$2,087.50</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Strategy B</div>
                <div className="text-base font-bold text-slate-900 mt-1">Proactive Tech Outreach</div>
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between"><span>Budget:</span><span className="font-medium text-slate-900">$4,000</span></div>
                  <div className="flex justify-between"><span>Target:</span><span className="font-medium text-slate-900">200 accounts</span></div>
                  <div className="flex justify-between"><span>Assumed Uplift:</span><span className="font-medium text-slate-900">22.0%</span></div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold">
                    <span>Expected Net Benefit:</span><span className="text-emerald-700">+$6,010.00</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-5 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Decision Intelligence</div>
                  <div className="text-sm font-semibold mt-1">Strategy B yields +187% greater net financial return per dollar invested.</div>
                  <p className="text-xs text-slate-300 mt-2">
                    Break-even retention uplift is 8.8% for Strategy B vs 11.1% for Strategy A.
                  </p>
                </div>
                <Link
                  to="/app/decision-lab"
                  className="mt-4 inline-flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
                >
                  <span>Open Interactive Simulator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 px-6 text-center text-xs text-slate-500">
        <p>RetainIQ &bull; AI-Powered Customer Retention Intelligence Platform &bull; Built with FastAPI, MySQL 8.0, and Scikit-learn.</p>
        <p className="mt-1 text-slate-400">Strictly prohibits SQLite &bull; Transparent scientific limitations &bull; No fabricated accuracy claims.</p>
      </footer>
    </div>
  );
};
