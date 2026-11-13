import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Brain,
  FlaskConical,
  Database,
  ArrowRight,
  BarChart3,
  Sparkles
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#20242C] flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-[#E6E8EC] bg-white sticky top-0 z-30 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-md bg-[#315E81] flex items-center justify-center text-white font-semibold text-xs shadow-xs">
            RQ
          </div>
          <span className="font-semibold text-base text-[#20242C] tracking-tight">RetainIQ</span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/login"
            className="text-xs font-medium text-[#697386] hover:text-[#20242C] transition-colors px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="text-xs font-medium px-3.5 py-1.5 bg-[#315E81] hover:bg-[#274b68] text-white rounded-md transition-colors shadow-xs flex items-center space-x-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 lg:px-12 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-[#E6E8EC] text-[#315E81] text-xs font-medium mb-6 shadow-2xs">
          <Database className="w-3.5 h-3.5" />
          <span>Strict MySQL 8.0 Persistence &bull; Scikit-Learn Predictive Modeling</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-semibold text-[#20242C] tracking-tight max-w-3xl mx-auto leading-tight">
          Understand Customers. <br className="hidden sm:inline" />
          <span className="text-[#315E81]">Prevent Avoidable Churn.</span>
        </h1>

        <p className="text-base md:text-lg text-[#697386] max-w-2xl mx-auto mt-4 leading-relaxed">
          Enterprise customer retention intelligence. Distinguish observed historical data from predictive machine learning, simulate budget-constrained interventions, and compare strategies with verified financial math.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/register"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#315E81] hover:bg-[#274b68] text-white font-medium rounded-md shadow-xs transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-5 py-2.5 bg-white border border-[#E6E8EC] hover:bg-[#F7F8FA] text-[#20242C] font-medium rounded-md transition-colors text-sm shadow-2xs"
          >
            Sign In to Workspace
          </Link>
        </div>

        {/* Pillars strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-16 text-left">
          <div className="bg-white p-4.5 rounded-lg border border-[#E6E8EC] shadow-2xs">
            <BarChart3 className="w-5 h-5 text-[#315E81] mb-2.5" />
            <div className="font-semibold text-sm text-[#20242C]">Verified SQL Analytics</div>
            <div className="text-xs text-[#697386] mt-1 leading-relaxed">Real MySQL aggregations for cohorts, contracts, and revenue at risk.</div>
          </div>
          <div className="bg-white p-4.5 rounded-lg border border-[#E6E8EC] shadow-2xs">
            <Brain className="w-5 h-5 text-[#438A83] mb-2.5" />
            <div className="font-semibold text-sm text-[#20242C]">Genuine ML Classifier</div>
            <div className="text-xs text-[#697386] mt-1 leading-relaxed">Scikit-learn pipeline with strict leakage prevention and holdout validation.</div>
          </div>
          <div className="bg-white p-4.5 rounded-lg border border-[#E6E8EC] shadow-2xs">
            <FlaskConical className="w-5 h-5 text-[#3E8B69] mb-2.5" />
            <div className="font-semibold text-sm text-[#20242C]">Decision Lab Simulator</div>
            <div className="text-xs text-[#697386] mt-1 leading-relaxed">Compare hypothetical retention strategies with transparent uplift calculations.</div>
          </div>
          <div className="bg-white p-4.5 rounded-lg border border-[#E6E8EC] shadow-2xs">
            <Sparkles className="w-5 h-5 text-[#D69A37] mb-2.5" />
            <div className="font-semibold text-sm text-[#20242C]">Grounded AI Analyst</div>
            <div className="text-xs text-[#697386] mt-1 leading-relaxed">Strict context grounding from pre-calculated MySQL metrics without hallucination.</div>
          </div>
        </div>
      </section>

      {/* Signature Feature Highlight: Retention Decision Lab */}
      <section className="py-16 bg-white border-y border-[#E6E8EC]">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-semibold text-[#315E81] tracking-wider uppercase">Signature Capability</span>
            <h2 className="text-2xl font-semibold text-[#20242C] mt-1">Retention Decision Lab</h2>
            <p className="text-[#697386] text-sm mt-2 leading-relaxed">
              Most businesses know customers leave, but cannot quantify the trade-offs of intervention. Compare proactive outreach vs. promotional discounts under transparent, editable assumptions.
            </p>
          </div>

          <div className="bg-[#F7F8FA] border border-[#E6E8EC] rounded-lg p-6 shadow-2xs">
            <div className="grid md:grid-cols-3 gap-5">
              <div className="bg-white p-5 rounded-lg border border-[#E6E8EC] shadow-2xs">
                <div className="text-xs font-medium text-[#697386] uppercase tracking-wide">Strategy A</div>
                <div className="text-sm font-semibold text-[#20242C] mt-1">20% High-Risk Discount</div>
                <div className="mt-4 space-y-2 text-xs text-[#697386]">
                  <div className="flex justify-between"><span>Budget:</span><span className="font-medium text-[#20242C]">$5,000</span></div>
                  <div className="flex justify-between"><span>Target:</span><span className="font-medium text-[#20242C]">350 accounts</span></div>
                  <div className="flex justify-between"><span>Assumed Uplift:</span><span className="font-medium text-[#20242C]">18.0%</span></div>
                  <div className="flex justify-between border-t border-[#E6E8EC] pt-2 font-medium">
                    <span>Expected Net Benefit:</span><span className="text-[#3E8B69] font-semibold">+$2,087.50</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-[#E6E8EC] shadow-2xs">
                <div className="text-xs font-medium text-[#697386] uppercase tracking-wide">Strategy B</div>
                <div className="text-sm font-semibold text-[#20242C] mt-1">Proactive Tech Outreach</div>
                <div className="mt-4 space-y-2 text-xs text-[#697386]">
                  <div className="flex justify-between"><span>Budget:</span><span className="font-medium text-[#20242C]">$4,000</span></div>
                  <div className="flex justify-between"><span>Target:</span><span className="font-medium text-[#20242C]">200 accounts</span></div>
                  <div className="flex justify-between"><span>Assumed Uplift:</span><span className="font-medium text-[#20242C]">22.0%</span></div>
                  <div className="flex justify-between border-t border-[#E6E8EC] pt-2 font-medium">
                    <span>Expected Net Benefit:</span><span className="text-[#3E8B69] font-semibold">+$6,010.00</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#20242C] text-white p-5 rounded-lg flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Decision Intelligence</div>
                  <div className="text-sm font-medium mt-1 leading-snug">Strategy B yields +187% greater net financial return per dollar invested.</div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Break-even retention uplift is 8.8% for Strategy B vs 11.1% for Strategy A.
                  </p>
                </div>
                <Link
                  to="/app/decision-lab"
                  className="mt-4 inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#315E81] hover:bg-[#274b68] text-white rounded text-xs font-medium transition-colors"
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
      <footer className="mt-auto border-t border-[#E6E8EC] bg-white py-6 px-6 text-center text-xs text-[#697386]">
        <p>RetainIQ &bull; Customer Retention Intelligence Platform &bull; Built with FastAPI, MySQL 8.0, and Scikit-learn.</p>
        <p className="mt-1 text-[#697386]/80">Zero SQLite policy &bull; Transparent causal caveats &bull; No fabricated metrics.</p>
      </footer>
    </div>
  );
};
