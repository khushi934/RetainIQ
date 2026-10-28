import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  DollarSign,
  Users,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  GitCompare,
  ArrowRight,
  Info,
  Scale
} from 'lucide-react';
import { api } from '../services/api';
import { ScenarioResult, RetentionScenario, ScenarioComparisonResponse } from '../types';
import { StatCard } from '../components/StatCard';

export const DecisionLabPage: React.FC = () => {
  // Scenario Inputs
  const [name, setName] = useState('Strategy A: Targeted Discount Campaign');
  const [strategyType, setStrategyType] = useState('discount_offer');
  const [targetSegment, setTargetSegment] = useState('High-Risk Fiber Optic Customers');
  const [eligibleCount, setEligibleCount] = useState(350);
  const [budget, setBudget] = useState(5000);
  const [contactCost, setContactCost] = useState(2.50);
  const [discountAmount, setDiscountAmount] = useState(20.0);
  const [responseRate, setResponseRate] = useState(45); // percentage input 0-100
  const [retentionUplift, setRetentionUplift] = useState(18); // percentage input 0-100
  const [revenuePerCustomer, setRevenuePerCustomer] = useState(300);
  const [capacity, setCapacity] = useState<number | undefined>(undefined);
  const [evaluationPeriod, setEvaluationPeriod] = useState(3);

  // Live Results & Persistence
  const [liveResult, setLiveResult] = useState<ScenarioResult | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<RetentionScenario[]>([]);
  const [comparison, setComparison] = useState<ScenarioComparisonResponse | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    runLiveCalculation();
  }, [
    eligibleCount, budget, contactCost, discountAmount,
    responseRate, retentionUplift, revenuePerCustomer, capacity, evaluationPeriod
  ]);

  useEffect(() => {
    loadSavedScenarios();
  }, []);

  const runLiveCalculation = async () => {
    try {
      const payload = {
        name,
        strategy_type: strategyType,
        target_segment: targetSegment,
        eligible_customer_count: eligibleCount,
        campaign_budget: budget,
        contact_cost_per_customer: contactCost,
        discount_amount_per_customer: discountAmount,
        assumed_response_rate: responseRate / 100,
        assumed_retention_uplift: retentionUplift / 100,
        revenue_per_retained_customer: revenuePerCustomer,
        campaign_capacity: capacity || undefined,
        evaluation_period_months: evaluationPeriod
      };
      const res = await api.calculateWhatIf(payload);
      setLiveResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSavedScenarios = async () => {
    try {
      const list = await api.getScenarios();
      setSavedScenarios(list);
      if (list.length >= 2) {
        setSelectedForCompare([list[0].id, list[1].id]);
        compareScenariosList([list[0].id, list[1].id]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveScenario = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        name,
        strategy_type: strategyType,
        target_segment: targetSegment,
        eligible_customer_count: eligibleCount,
        campaign_budget: budget,
        contact_cost_per_customer: contactCost,
        discount_amount_per_customer: discountAmount,
        assumed_response_rate: responseRate / 100,
        assumed_retention_uplift: retentionUplift / 100,
        revenue_per_retained_customer: revenuePerCustomer,
        campaign_capacity: capacity || undefined,
        evaluation_period_months: evaluationPeriod
      };
      await api.saveScenario(payload);
      setMessage(`Scenario "${name}" persisted successfully in MySQL.`);
      await loadSavedScenarios();
    } catch (err: any) {
      setMessage(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const compareScenariosList = async (ids: number[]) => {
    if (ids.length < 2) return;
    try {
      const res = await api.compareScenarios(ids);
      setComparison(res);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleScenarioSelect = (id: number) => {
    let next: number[];
    if (selectedForCompare.includes(id)) {
      next = selectedForCompare.filter((i) => i !== id);
    } else {
      next = [...selectedForCompare, id];
    }
    setSelectedForCompare(next);
    if (next.length >= 2) {
      compareScenariosList(next);
    } else {
      setComparison(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wide">
            <FlaskConical className="w-4 h-4" />
            <span>Signature Decision Intelligence Feature</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Retention Decision Lab
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulate and compare hypothetical retention interventions under transparent mathematical formulas
          </p>
        </div>

        <button
          onClick={handleSaveScenario}
          disabled={saving}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors self-start"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save Scenario to MySQL'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Main Simulator Layout: Inputs on Left, Real-Time Outcomes on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editable Assumptions Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Scenario Assumptions & Inputs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Change assumptions to immediately recalculate expected net financial returns
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Scenario Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Strategy Archetype
              </label>
              <select
                value={strategyType}
                onChange={(e) => setStrategyType(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-800 focus:outline-none"
              >
                <option value="discount_offer">Discount / Bill Incentive</option>
                <option value="proactive_outreach">Proactive Account Outreach</option>
                <option value="service_upgrade">Service Tier Upgrade</option>
                <option value="custom">Custom Retention Workflow</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Customer Segment
              </label>
              <input
                type="text"
                value={targetSegment}
                onChange={(e) => setTargetSegment(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Eligible Customers (N)
              </label>
              <input
                type="number"
                min={1}
                value={eligibleCount}
                onChange={(e) => setEligibleCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Allocated Budget ($)
              </label>
              <input
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Cost / User ($)
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                value={contactCost}
                onChange={(e) => setContactCost(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount / User ($)
              </label>
              <input
                type="number"
                step="1"
                min={0}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Assumed Response Rate
                </label>
                <span className="text-xs font-mono font-bold text-slate-900">{responseRate}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={responseRate}
                onChange={(e) => setResponseRate(parseInt(e.target.value, 10))}
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Assumed Retention Uplift
                </label>
                <span className="text-xs font-mono font-bold text-blue-600">+{retentionUplift}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={retentionUplift}
                onChange={(e) => setRetentionUplift(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Value per Retained ($)
              </label>
              <input
                type="number"
                min={1}
                value={revenuePerCustomer}
                onChange={(e) => setRevenuePerCustomer(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Evaluation Window
              </label>
              <select
                value={evaluationPeriod}
                onChange={(e) => setEvaluationPeriod(parseInt(e.target.value, 10))}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-800 focus:outline-none"
              >
                <option value={1}>1 Month</option>
                <option value={3}>3 Months (Quarterly)</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months (Annual)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Live Simulated Outcomes */}
        <div className="lg:col-span-7 space-y-6">
          {liveResult && (
            <div className="space-y-4">
              {/* Primary Financial Return Banner */}
              <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Simulated Financial Outcome</span>
                  <span className="font-mono text-[11px] text-blue-400">Engine {liveResult.calculation_version}</span>
                </div>

                <div className="mt-3 flex items-baseline space-x-3">
                  <span className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    ${liveResult.expected_net_benefit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${liveResult.expected_net_benefit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {liveResult.roi_pct > 0 ? `+${liveResult.roi_pct}% ROI` : `${liveResult.roi_pct}% ROI`}
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Expected Net Economic Benefit = Incremental Revenue (${liveResult.expected_incremental_revenue.toFixed(2)}) minus Total Campaign Cost (${liveResult.total_campaign_cost.toFixed(2)})
                </div>

                {/* Micro KPI strip */}
                <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Customers Targeted</span>
                    <span className="font-bold text-white text-base mt-0.5 block">{liveResult.targeted_customers}</span>
                    <span className="text-[10px] text-slate-400">of {eligibleCount} eligible</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Incremental Retained</span>
                    <span className="font-bold text-emerald-400 text-base mt-0.5 block">
                      +{liveResult.expected_incremental_retained}
                    </span>
                    <span className="text-[10px] text-slate-400">under +{retentionUplift}% uplift</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Break-Even Uplift</span>
                    <span className="font-bold text-amber-400 text-base mt-0.5 block">
                      {typeof liveResult.break_even_retention_uplift === 'number' ? `${(liveResult.break_even_retention_uplift * 100).toFixed(1)}%` : 'N/A'}
                    </span>
                    <span className="text-[10px] text-slate-400">Min. uplift for zero loss</span>
                  </div>
                </div>
              </div>

              {/* Sensitivity Analysis Table */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Sensitivity Analysis (Downside / Base / Upside)
                  </h3>
                  <span className="text-[11px] text-slate-500">±25% Assumed Uplift</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Evaluates the fragility of financial projections if retention uplift underperforms or exceeds expectations.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="data-table-header">Case</th>
                        <th className="data-table-header">Uplift</th>
                        <th className="data-table-header">Incremental Retained</th>
                        <th className="data-table-header">Incremental Revenue</th>
                        <th className="data-table-header text-right">Net Benefit</th>
                        <th className="data-table-header text-right">ROI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {liveResult.sensitivity_analysis.map((scen, idx) => (
                        <tr key={idx} className={idx === 1 ? 'bg-blue-50/50 font-medium' : 'hover:bg-slate-50'}>
                          <td className="data-table-cell font-semibold text-slate-900">
                            {scen.case_name}
                          </td>
                          <td className="data-table-cell font-mono">
                            +{(scen.uplift * 100).toFixed(1)}%
                          </td>
                          <td className="data-table-cell font-mono">
                            +{scen.incremental_retained}
                          </td>
                          <td className="data-table-cell font-mono">
                            ${scen.incremental_revenue.toFixed(2)}
                          </td>
                          <td className={`data-table-cell text-right font-mono font-bold ${scen.net_benefit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            ${scen.net_benefit.toFixed(2)}
                          </td>
                          <td className="data-table-cell text-right font-mono">
                            {scen.roi_pct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Scientific Caveat Alert */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-lg text-xs text-amber-900 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Scientific Caution:</strong> User-entered response rates ({responseRate}%) and retention uplifts (+{retentionUplift}%) are theoretical assumptions. Historical observational data alone does not prove that a discount caused a customer to stay. Always run randomized A/B holdout tests before full campaign rollouts.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Comparison Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <GitCompare className="w-4 h-4 text-slate-700" />
              <span>Multi-Scenario Strategy Comparison</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select 2 or more saved scenarios to compare expected financial outcomes, capacity constraints, and unit economics.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Saved Scenarios:</span>
            <div className="flex items-center space-x-1.5 flex-wrap">
              {savedScenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleScenarioSelect(s.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                    selectedForCompare.includes(s.id)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s.name.split(':')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {comparison && comparison.scenarios.length >= 2 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="data-table-header">Scenario Name</th>
                    <th className="data-table-header">Target Segment</th>
                    <th className="data-table-header">Budget</th>
                    <th className="data-table-header">Assumed Uplift</th>
                    <th className="data-table-header">Targeted Customers</th>
                    <th className="data-table-header">Campaign Cost</th>
                    <th className="data-table-header">Expected Retained</th>
                    <th className="data-table-header text-right">Net Benefit</th>
                    <th className="data-table-header text-right">Break-Even Uplift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparison.scenarios.map((item) => {
                    const isBest = item.scenario_id === comparison.best_net_benefit_scenario_id;
                    return (
                      <tr key={item.scenario_id} className={isBest ? 'bg-emerald-50/40 font-medium' : 'hover:bg-slate-50'}>
                        <td className="data-table-cell font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{item.name}</span>
                          {isBest && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                              Best Return
                            </span>
                          )}
                        </td>
                        <td className="data-table-cell text-slate-600">{item.target_segment}</td>
                        <td className="data-table-cell font-mono">${item.total_campaign_cost.toFixed(2)}</td>
                        <td className="data-table-cell font-mono font-semibold text-blue-600">+{(item.assumed_uplift * 100).toFixed(1)}%</td>
                        <td className="data-table-cell font-mono">{item.targeted_customers}</td>
                        <td className="data-table-cell font-mono">${item.total_campaign_cost.toFixed(2)}</td>
                        <td className="data-table-cell font-mono font-semibold text-emerald-700">+{item.expected_incremental_retained}</td>
                        <td className={`data-table-cell text-right font-mono font-extrabold ${item.expected_net_benefit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          ${item.expected_net_benefit.toFixed(2)}
                        </td>
                        <td className="data-table-cell text-right font-mono text-amber-700 font-semibold">
                          {typeof item.break_even_retention_uplift === 'number' ? `${(item.break_even_retention_uplift * 100).toFixed(1)}%` : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-500 space-y-1">
              <span className="font-semibold text-slate-700 block">Methodological Comparison Rules:</span>
              {comparison.methodology_notes.map((note, idx) => (
                <p key={idx}>&bull; {note}</p>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            Select at least 2 scenarios above to view side-by-side trade-off metrics.
          </div>
        )}
      </div>
    </div>
  );
};
