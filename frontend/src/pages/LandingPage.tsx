import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Brain,
  FlaskConical,
  Sparkles,
  Search,
  Users,
  CheckCircle,
  TrendingDown,
  AlertTriangle,
  X,
  Menu,
  ChevronRight,
  Database,
  Activity
} from 'lucide-react';

/* ─── Google Font import ─── */
const fontLink = document.getElementById('gfont');
if (!fontLink) {
  const link = document.createElement('link');
  link.id = 'gfont';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);
}

/* ─────────────────────────────────────────────
   Mini dashboard preview — illustrative only
───────────────────────────────────────────── */
const MiniDashboard: React.FC = () => (
  <div className="relative bg-white rounded-2xl border border-[#E6E8EC] shadow-2xl overflow-hidden select-none">
    {/* window chrome */}
    <div className="bg-[#F7F8FA] border-b border-[#E6E8EC] px-4 py-3 flex items-center gap-2">
      <span className="w-3 h-3 rounded-full bg-[#C75B58]/60" />
      <span className="w-3 h-3 rounded-full bg-[#D69A37]/60" />
      <span className="w-3 h-3 rounded-full bg-[#3E8B69]/60" />
      <span className="ml-3 text-xs text-[#697386] font-medium">RetainIQ — Overview</span>
    </div>

    <div className="p-5 space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Customers', value: '4,000', note: '3,648 active' },
          { label: 'Historical Churn', value: '26.5%', note: 'Elevated segment', accent: '#C75B58' },
          { label: 'High-Risk (ML)', value: '812', note: '≥ 60% probability', accent: '#D69A37' },
          { label: 'Avg. Tenure', value: '32 mos', note: 'Median: 29 months' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#F7F8FA] rounded-lg p-3 border border-[#E6E8EC]">
            <div className="text-[11px] font-semibold text-[#697386] uppercase tracking-wide mb-1">{kpi.label}</div>
            <div className="text-xl font-bold text-[#20242C]" style={kpi.accent ? { color: kpi.accent } : {}}>{kpi.value}</div>
            <div className="text-[10px] text-[#697386] mt-0.5">{kpi.note}</div>
          </div>
        ))}
      </div>

      {/* Chart mockup */}
      <div className="bg-[#F7F8FA] rounded-lg p-3 border border-[#E6E8EC]">
        <div className="text-[11px] font-semibold text-[#697386] uppercase tracking-wide mb-2">Churn by Contract Type</div>
        <div className="flex items-end gap-2 h-16">
          {[
            { label: 'Monthly', pct: 85, color: '#C75B58' },
            { label: 'One-Year', pct: 25, color: '#D69A37' },
            { label: 'Two-Year', pct: 10, color: '#3E8B69' },
          ].map((bar) => (
            <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t"
                style={{ height: `${bar.pct * 0.6}px`, backgroundColor: bar.color, opacity: 0.8 }}
              />
              <span className="text-[9px] text-[#697386]">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Customer table snippet */}
      <div className="rounded-lg border border-[#E6E8EC] overflow-hidden">
        <div className="bg-[#FAFBFC] px-3 py-2 grid grid-cols-3 text-[10px] font-semibold text-[#697386] uppercase tracking-wide border-b border-[#E6E8EC]">
          <span>Customer</span><span className="text-right">Monthly</span><span className="text-right">Risk</span>
        </div>
        {[
          { id: 'CUS-7291', charge: '$89.90', risk: 'High', color: '#C75B58', bg: '#FBF2F2' },
          { id: 'CUS-4453', charge: '$74.50', risk: 'High', color: '#C75B58', bg: '#FBF2F2' },
          { id: 'CUS-2187', charge: '$55.20', risk: 'Medium', color: '#D69A37', bg: '#FDF7EE' },
        ].map((row) => (
          <div key={row.id} className="px-3 py-2 grid grid-cols-3 text-[11px] border-b border-[#F0F2F5] last:border-0">
            <span className="font-mono text-[#315E81] font-semibold">{row.id}</span>
            <span className="text-right font-mono text-[#20242C]">{row.charge}</span>
            <span className="text-right">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ color: row.color, backgroundColor: row.bg }}>{row.risk}</span>
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* illustrative disclaimer badge */}
    <div className="absolute bottom-2 right-2 bg-[#20242C]/80 text-white text-[9px] px-2 py-1 rounded font-medium">
      Illustrative demo data
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Decision Lab preview — illustrative only
───────────────────────────────────────────── */
const LabPreview: React.FC = () => (
  <div className="grid md:grid-cols-2 gap-5">
    {/* Strategy A */}
    <div className="bg-white rounded-xl border border-[#E6E8EC] p-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold text-[#697386] uppercase tracking-widest">Strategy A</span>
      </div>
      <div className="text-base font-bold text-[#20242C] mb-4">High-Risk Customer Discounts</div>
      <div className="space-y-3">
        {[
          ['Campaign Budget', '$5,000'],
          ['Eligible Customers', '350 accounts'],
          ['Assumed Uplift', '18%'],
          ['Est. Campaign Cost', '$4,900'],
          ['Expected Retained', '63 customers'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between items-center text-sm text-[#697386] border-b border-[#F0F2F5] pb-2.5 last:border-0">
            <span>{k}</span>
            <span className="font-semibold text-[#20242C]">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-[#F7F8FA] rounded-lg border border-[#E6E8EC]">
        <div className="text-xs text-[#697386] font-medium">Est. Net Benefit (illustrative)</div>
        <div className="text-xl font-bold text-[#3E8B69] mt-0.5">+$2,087</div>
        <div className="text-xs text-[#697386] mt-1">Based on assumed inputs — not verified outcomes</div>
      </div>
    </div>

    {/* Strategy B */}
    <div className="bg-white rounded-xl border-2 border-[#315E81] p-6 relative">
      <div className="absolute -top-3 left-6">
        <span className="bg-[#315E81] text-white text-xs font-bold px-3 py-1 rounded-full">Higher Projected Return</span>
      </div>
      <div className="flex items-center gap-2 mb-1 mt-1">
        <span className="text-xs font-bold text-[#697386] uppercase tracking-widest">Strategy B</span>
      </div>
      <div className="text-base font-bold text-[#20242C] mb-4">Proactive Customer Outreach</div>
      <div className="space-y-3">
        {[
          ['Campaign Budget', '$4,000'],
          ['Eligible Customers', '200 accounts'],
          ['Assumed Uplift', '22%'],
          ['Est. Campaign Cost', '$3,800'],
          ['Expected Retained', '44 customers'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between items-center text-sm text-[#697386] border-b border-[#F0F2F5] pb-2.5 last:border-0">
            <span>{k}</span>
            <span className="font-semibold text-[#20242C]">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-[#F0F5F9] rounded-lg border border-[#315E81]/20">
        <div className="text-xs text-[#315E81] font-medium">Est. Net Benefit (illustrative)</div>
        <div className="text-xl font-bold text-[#315E81] mt-0.5">+$6,010</div>
        <div className="text-xs text-[#697386] mt-1">Based on assumed inputs — not verified outcomes</div>
      </div>
    </div>

    {/* disclaimer */}
    <div className="md:col-span-2 flex items-start gap-3 p-4 bg-[#FDF7EE] border border-[#F7E4C4] rounded-xl">
      <AlertTriangle className="w-4 h-4 text-[#D69A37] shrink-0 mt-0.5" />
      <p className="text-sm text-[#697386] leading-relaxed">
        <strong className="text-[#20242C]">Important:</strong> All figures shown are illustrative examples based on user-defined assumptions. The Decision Lab does not predict guaranteed outcomes. Use it to compare and stress-test strategies under explicit, editable assumptions before making real business decisions.
      </p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Platform', href: '#platform' },
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Decision Lab', href: '#decision-lab' },
  ];

  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-[#20242C]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ══════════════════════════════════════
          HEADER
      ══════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E6E8EC]">
        <div className="max-w-[1200px] mx-auto px-6 h-[72px] flex items-center justify-between gap-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#315E81] flex items-center justify-center text-white font-black text-sm shadow-sm">
              RQ
            </div>
            <span className="font-bold text-xl text-[#20242C] tracking-tight">RetainIQ</span>
          </Link>

          {/* Center nav — desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="px-4 py-2 text-sm font-medium text-[#697386] hover:text-[#20242C] hover:bg-[#F7F8FA] rounded-lg transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right CTAs — desktop */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-[#20242C] hover:bg-[#F7F8FA] rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#315E81] hover:bg-[#274b68] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-[#697386] hover:text-[#20242C] rounded-lg hover:bg-[#F7F8FA]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E6E8EC] bg-white px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="block w-full text-left px-4 py-3 text-base font-medium text-[#20242C] hover:bg-[#F7F8FA] rounded-lg transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-3 border-t border-[#E6E8EC] mt-3 flex flex-col gap-2">
              <Link to="/login" className="block w-full text-center py-3 text-base font-semibold text-[#20242C] border border-[#E6E8EC] rounded-xl hover:bg-[#F7F8FA] transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="block w-full text-center py-3 text-base font-semibold text-white bg-[#315E81] hover:bg-[#274b68] rounded-xl transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section id="platform" className="bg-white pt-20 pb-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0F5F9] border border-[#315E81]/20 text-[#315E81] text-xs font-bold uppercase tracking-widest mb-6">
                Customer Retention Intelligence
              </div>

              <h1 className="text-5xl lg:text-[56px] font-black text-[#20242C] leading-[1.1] tracking-tight mb-6">
                Know Which Customers
                May Leave.{' '}
                <span className="text-[#315E81]">Decide How to Keep Them.</span>
              </h1>

              <p className="text-lg text-[#697386] leading-relaxed mb-8 max-w-lg">
                RetainIQ combines customer analytics, machine learning, and AI to identify churn risks, investigate customer behavior, and evaluate retention strategies before spending your budget.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link
                  to="/register"
                  className="flex items-center justify-center gap-2 px-7 py-4 bg-[#315E81] hover:bg-[#274b68] text-white text-base font-bold rounded-xl transition-colors shadow-md"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => scrollTo('#features')}
                  className="flex items-center justify-center gap-2 px-7 py-4 bg-white border-2 border-[#E6E8EC] hover:border-[#315E81] text-[#20242C] hover:text-[#315E81] text-base font-bold rounded-xl transition-colors"
                >
                  Explore the Platform
                </button>
              </div>

              {/* Trust points */}
              <div className="flex flex-wrap gap-5">
                {[
                  'Built on verified MySQL 8.0 analytics',
                  'Scikit-learn ML pipeline',
                  'Zero hallucination policy',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-[#697386]">
                    <CheckCircle className="w-4 h-4 text-[#3E8B69] shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — dashboard preview */}
            <div className="relative">
              <div className="absolute -inset-4 bg-[#315E81]/5 rounded-3xl -z-10" />
              <MiniDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          LOGOS / TECH STRIP
      ══════════════════════════════════════ */}
      <div className="bg-[#F7F8FA] border-y border-[#E6E8EC] py-5">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-semibold text-[#9CA3AF]">
            <span>Built with</span>
            {['Python 3.11', 'FastAPI', 'MySQL 8.0', 'Scikit-learn', 'React', 'OpenAI API'].map((tech) => (
              <span key={tech} className="text-[#697386] font-semibold">{tech}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-sm font-bold text-[#315E81] uppercase tracking-widest mb-3">Platform Capabilities</div>
            <h2 className="text-4xl font-black text-[#20242C] tracking-tight mb-4">
              Everything You Need to Understand Customer Retention
            </h2>
            <p className="text-lg text-[#697386] leading-relaxed">
              From raw customer data to informed, evidence-based retention decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: BarChart3,
                color: '#315E81',
                bg: '#F0F5F9',
                title: 'Verified SQL Analytics',
                desc: 'Analyze real customer data using parameterized MySQL queries. Explore churn rates by contract type, customer segments, service usage, tenure cohorts, and revenue indicators. All aggregations are deterministic and transparent.',
                bullets: ['Churn rate by contract & tenure', 'Revenue at risk analysis', 'Customer segment comparison'],
              },
              {
                icon: Brain,
                color: '#438A83',
                bg: '#F0F7F6',
                title: 'Machine Learning Predictions',
                desc: 'Identify customers with elevated churn risk using a trained Scikit-learn classification pipeline with strict data leakage prevention. The model is retrained on your imported data and evaluated on a held-out test set.',
                bullets: ['Random Forest & Logistic Regression', 'ROC-AUC, Precision, Recall metrics', 'Per-customer risk scoring'],
              },
              {
                icon: Search,
                color: '#D69A37',
                bg: '#FDF7EE',
                title: 'Churn Investigation',
                desc: 'Explore patterns and customer characteristics associated with historical churn. Document structured findings, link evidence to customer segments, and build an investigation timeline your team can reference.',
                bullets: ['Structured finding documentation', 'Segment-level pattern analysis', 'Evidence tracking timeline'],
              },
              {
                icon: Sparkles,
                color: '#3E8B69',
                bg: '#F0F7F3',
                title: 'AI-Powered Analyst',
                desc: 'Ask natural-language questions and receive explanations grounded strictly in pre-calculated MySQL metrics and model outputs. The AI Analyst cannot hallucinate because it only references verified data from your workspace.',
                bullets: ['SQL-grounded natural language answers', 'No unverified hallucinations', 'Cited data sources in every response'],
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="group bg-white border border-[#E6E8EC] rounded-2xl p-8 hover:border-[#315E81]/30 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: feat.bg }}>
                    <feat.icon className="w-6 h-6" style={{ color: feat.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#20242C] mb-3">{feat.title}</h3>
                    <p className="text-base text-[#697386] leading-relaxed mb-5">{feat.desc}</p>
                    <ul className="space-y-2">
                      {feat.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2.5 text-sm text-[#697386]">
                          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: feat.color }} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          DECISION LAB USP
      ══════════════════════════════════════ */}
      <section id="decision-lab" className="py-24 px-6 bg-[#F7F8FA] border-y border-[#E6E8EC]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-sm font-bold text-[#315E81] uppercase tracking-widest mb-3">Signature Capability</div>
            <h2 className="text-4xl font-black text-[#20242C] tracking-tight mb-4">
              Don't Just Predict Churn.{' '}
              <span className="text-[#315E81]">Make Better Retention Decisions.</span>
            </h2>
            <p className="text-lg text-[#697386] leading-relaxed">
              Compare retention strategies, evaluate campaign budgets, and estimate potential business outcomes before committing your resources.
            </p>
          </div>

          <LabPreview />

          <div className="mt-12 text-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#315E81] hover:bg-[#274b68] text-white text-base font-bold rounded-xl transition-colors shadow-md"
            >
              Explore Retention Decision Lab <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-[#697386] mt-4">
              All scenario inputs are user-defined. All outcomes are projections under those assumptions.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-sm font-bold text-[#315E81] uppercase tracking-widest mb-3">Process</div>
            <h2 className="text-4xl font-black text-[#20242C] tracking-tight mb-4">How RetainIQ Works</h2>
            <p className="text-lg text-[#697386] leading-relaxed">Four clear steps from raw data to actionable retention intelligence.</p>
          </div>

          {/* Steps grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                icon: Database,
                title: 'Connect Your Data',
                desc: 'Upload customer CSV files. RetainIQ validates column types, checks for missing values, and reports data quality before ingesting into MySQL.',
                color: '#315E81',
              },
              {
                step: '02',
                icon: BarChart3,
                title: 'Analyze Behavior',
                desc: 'Explore verified SQL aggregations: churn by contract, segment performance, tenure distributions, and revenue at risk — all computed directly from your data.',
                color: '#438A83',
              },
              {
                step: '03',
                icon: Brain,
                title: 'Predict Churn Risk',
                desc: 'Train a Scikit-learn classification model on your imported data. Score every customer with a predicted churn probability and risk tier.',
                color: '#D69A37',
              },
              {
                step: '04',
                icon: FlaskConical,
                title: 'Evaluate Strategies',
                desc: 'Open the Retention Decision Lab. Configure campaign budgets, contact costs, and assumed uplift. Compare strategies under transparent, editable assumptions.',
                color: '#3E8B69',
              },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {/* connector line (desktop) */}
                {i < 3 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(100%+12px)] w-6 h-0.5 bg-[#E6E8EC] z-10" />
                )}
                <div className="bg-[#F7F8FA] border border-[#E6E8EC] rounded-2xl p-6 h-full">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-3xl font-black" style={{ color: s.color, opacity: 0.2 }}>{s.step}</span>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + '15' }}>
                      <s.icon className="w-5 h-5" style={{ color: s.color }} />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-[#20242C] mb-3">{s.title}</h3>
                  <p className="text-sm text-[#697386] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          WHAT RETAINIQ DOES NOT DO (trust)
      ══════════════════════════════════════ */}
      <section className="py-20 px-6 bg-[#20242C]">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-sm font-bold text-[#697386] uppercase tracking-widest mb-4">Our Principles</div>
              <h2 className="text-3xl font-black text-white mb-5 leading-tight">
                Built for Decision-Making, Not for Looking Impressive
              </h2>
              <p className="text-base text-[#9CA3AF] leading-relaxed mb-6">
                RetainIQ enforces a strict separation between observed historical data, machine learning predictions, and user-defined hypothetical scenarios. No metric is ever presented as a guaranteed outcome.
              </p>
              <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-[#315E81] hover:bg-[#274b68] text-white text-sm font-bold rounded-xl transition-colors">
                Start for Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { icon: CheckCircle, color: '#3E8B69', text: 'All SQL analytics are computed by parameterized MySQL queries — no hardcoded summaries.' },
                { icon: CheckCircle, color: '#3E8B69', text: 'ML predictions are probabilities, not guaranteed churn events.' },
                { icon: CheckCircle, color: '#3E8B69', text: 'Decision Lab outcomes are projections under user-defined assumptions, clearly labeled.' },
                { icon: CheckCircle, color: '#3E8B69', text: 'AI Analyst responses are grounded in pre-calculated workspace data only.' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <item.icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: item.color }} />
                  <span className="text-sm text-[#9CA3AF] leading-relaxed">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════ */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0F5F9] border border-[#315E81]/20 text-[#315E81] text-xs font-bold uppercase tracking-widest mb-6">
            <Activity className="w-3.5 h-3.5" />
            Get Started Today
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#20242C] tracking-tight mb-6 leading-tight">
            Turn Customer Data Into Smarter Retention Decisions.
          </h2>
          <p className="text-lg text-[#697386] leading-relaxed mb-10 max-w-xl mx-auto">
            Start understanding customer churn, identifying risk, and evaluating retention opportunities with RetainIQ.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#315E81] hover:bg-[#274b68] text-white text-base font-bold rounded-xl transition-colors shadow-md"
            >
              Get Started — It's Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-[#E6E8EC] hover:border-[#315E81] text-[#20242C] hover:text-[#315E81] text-base font-bold rounded-xl transition-colors"
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="bg-[#F7F8FA] border-t border-[#E6E8EC] py-14 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#315E81] flex items-center justify-center text-white font-black text-sm">
                  RQ
                </div>
                <span className="font-bold text-lg text-[#20242C] tracking-tight">RetainIQ</span>
              </div>
              <p className="text-sm text-[#697386] leading-relaxed mb-4">
                Customer Retention Intelligence Platform. Predict churn, investigate risk, and evaluate retention strategies with verified analytics.
              </p>
              <div className="text-xs text-[#697386]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3E8B69]" />
                  MySQL 8.0 · FastAPI · Scikit-learn
                </span>
              </div>
            </div>

            {/* Product */}
            <div>
              <div className="text-xs font-bold text-[#20242C] uppercase tracking-widest mb-4">Product</div>
              <ul className="space-y-3">
                {[
                  { label: 'Overview Dashboard', href: '/app/dashboard' },
                  { label: 'Customer Analytics', href: '/app/customers' },
                  { label: 'Churn Prediction', href: '/app/models' },
                  { label: 'Retention Decision Lab', href: '/app/decision-lab' },
                  { label: 'AI Analyst', href: '/app/assistant' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link to={item.href} className="text-sm text-[#697386] hover:text-[#20242C] transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <div className="text-xs font-bold text-[#20242C] uppercase tracking-widest mb-4">Resources</div>
              <ul className="space-y-3">
                {[
                  { label: 'Methodology Guide', href: '/app/methodology' },
                  { label: 'Data Quality Guide', href: '/app/import' },
                  { label: 'Settings', href: '/app/settings' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link to={item.href} className="text-sm text-[#697386] hover:text-[#20242C] transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technology */}
            <div>
              <div className="text-xs font-bold text-[#20242C] uppercase tracking-widest mb-4">Technology</div>
              <ul className="space-y-3">
                {['Python 3.11', 'FastAPI 0.115+', 'MySQL 8.0', 'Scikit-learn 1.6+', 'SQLAlchemy 2.0', 'OpenAI API', 'React + Vite'].map((tech) => (
                  <li key={tech} className="text-sm text-[#697386]">{tech}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer bottom bar */}
          <div className="pt-8 border-t border-[#E6E8EC] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#697386]">
              © {new Date().getFullYear()} RetainIQ. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-xs text-[#697386]">Zero SQLite policy</span>
              <span className="text-xs text-[#697386]">Transparent causal caveats</span>
              <span className="text-xs text-[#697386]">No fabricated metrics</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
