import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  Bookmark,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { ScenarioResult, RetentionScenario, ScenarioComparisonResponse } from '../types';

export const DecisionLabPage: React.FC = () => {
  // Scenario Configuration Inputs
  const [name, setName] = useState('Proactive Retention Outreach');
  const [strategyType, setStrategyType] = useState('discount_offer');
  const [targetSegment, setTargetSegment] = useState('High-Risk Customers');
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
    responseRate, retentionUplift, revenuePerCustomer, capacity, evaluationPeriod, strategyType
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
      setMessage(`Scenario "${name}" saved to MySQL.`);
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

  const remainingBudget = liveResult ? Math.max(0, budget - liveResult.total_campaign_cost) : budget;

  return (
    <div className="space-y-7">
      {/* Page Header (Section 10) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[#20242C] tracking-tight">
            Retention Decision Lab
          </h1>
          <p className="text-[14px] text-[#697386] mt-1">
            Compare retention strategies and estimate their potential business impact before committing your campaign budget.
          </p>
        </div>

        <button
          onClick={handleSaveScenario}
          disabled={saving}
          className="px-4 py-2 bg-[#315E81] hover:bg-[#274b68] text-white rounded-md text-[13px] font-medium transition-colors flex items-center space-x-1.5 shadow-card self-start"
        >
          <Bookmark className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Scenario'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 bg-[#F0F7F3] border border-[#D4EADB] rounded-lg text-[13px] text-[#3E8B69] flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Mandatory Scientific Disclaimer (Section 10) */}
      <div className="p-4 bg-white border border-[#E6E8EC] rounded-lg text-[13px] text-[#697386] flex items-start space-x-3">
        <Info className="w-4 h-4 text-[#315E81] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-[#20242C]">Important note: </span>
          These results are scenario estimates based on user-defined assumptions, not guaranteed campaign outcomes. Controlled A/B experiments are recommended prior to broad rollout.
        </div>
      </div>

      {/* Two-Column Layout (Section 10) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section: Scenario Configuration */}
        <div className="lg:col-span-5 bg-white border border-[#E6E8EC] rounded-lg p-6 space-y-4">
          <div className="border-b border-[#E6E8EC] pb-3">
            <h2 className="text-[15px] font-semibold text-[#20242C]">
              Scenario Configuration
            </h2>
            <p className="text-[12px] text-[#697386] mt-0.5">
              Specify campaign parameters and population assumptions.
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#20242C] mb-1.5">
              Scenario Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-[#20242C] mb-1.5">
                Strategy Selection
              </label>
              <select
                value={strategyType}
                onChange={(e) => setStrategyType(e.target.value)}
                className="w-full h-10 px-2.5 border border-[#E6E8EC] rounded-md text-[13px] bg-white text-[#20242C] focus:outline-none focus:border-[#315E81]"
              >
                <option value="discount_offer">Targeted Discount Offer</option>
                <option value="proactive_outreach">Proactive Account Outreach</option>
                <option value="service_upgrade">Service Tier Upgrade</option>
                <option value="custom">Custom Strategy</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#20242C] mb-1.5">
                Target Segment
              </label>
              <input
                type="text"
                value={targetSegment}
                onChange={(e) => setTargetSegment(e.target.value)}
                className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-[#20242C] mb-1.5">
                Eligible Customers
              </label>
              <input
                type="number"
                min={1}
                value={eligibleCount}
                onChange={(e) => setEligibleCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81] font-mono"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#20242C] mb-1.5">
                Campaign Budget ($)
              </label>
              <input
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-[#20242C] mb-1.5">
                Contact Cost ($)
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                value={contactCost}
                onChange={(e) => setContactCost(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81] font-mono"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#20242C] mb-1.5">
                Discount Amount ($)
              </label>
              <input
                type="number"
                step="1"
                min={0}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[13px] font-medium text-[#20242C]">
                  Assumed Response
                </label>
                <span className="text-[12px] font-mono font-semibold text-[#20242C]">{responseRate}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={responseRate}
                onChange={(e) => setResponseRate(parseInt(e.target.value, 10))}
                className="w-full accent-[#315E81] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[13px] font-medium text-[#20242C]">
                  Expected Uplift
                </label>
                <span className="text-[12px] font-mono font-semibold text-[#315E81]">+{retentionUplift}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={retentionUplift}
                onChange={(e) => setRetentionUplift(parseInt(e.target.value, 10))}
                className="w-full accent-[#315E81] cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-[#20242C] mb-1.5">
                Revenue / Retained ($)
              </label>
              <input
                type="number"
                min={1}
                value={revenuePerCustomer}
                onChange={(e) => setRevenuePerCustomer(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81] font-mono"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#20242C] mb-1.5">
                Contact Capacity (Max)
              </label>
              <input
                type="number"
                placeholder="Optional limit"
                value={capacity || ''}
                onChange={(e) => setCapacity(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Right Section: Scenario Results (Section 10) */}
        <div className="lg:col-span-7 space-y-5">
          {liveResult && (
            <>
              {/* Primary Net Benefit & Key Metrics */}
              <div className="bg-white border border-[#E6E8EC] rounded-lg p-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6E8EC]">
                  <span className="text-[13px] font-medium text-[#697386]">Estimated Net Financial Benefit</span>
                  <span className="text-[11px] font-mono text-[#697386]">Engine {liveResult.calculation_version}</span>
                </div>

                <div className="py-4 flex items-baseline space-x-3">
                  <div className="text-[34px] font-semibold text-[#20242C] tracking-tight">
                    ${liveResult.expected_net_benefit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className={`text-[12px] font-medium px-2 py-0.5 rounded border ${
                    liveResult.expected_net_benefit >= 0
                      ? 'bg-[#F0F7F3] text-[#3E8B69] border-[#D4EADB]'
                      : 'bg-[#FBF2F2] text-[#C75B58] border-[#F2D5D4]'
                  }`}>
                    {liveResult.roi_pct > 0 ? `+${liveResult.roi_pct}% ROI` : `${liveResult.roi_pct}% ROI`}
                  </span>
                </div>

                {/* 6 Required Outcome Metrics Grid (Section 10) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E6E8EC]">
                  <div>
                    <span className="text-[12px] text-[#697386] block">Estimated Campaign Cost</span>
                    <span className="text-[16px] font-semibold text-[#20242C] font-mono mt-0.5 block">
                      ${liveResult.total_campaign_cost.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[12px] text-[#697386] block">Expected Incremental Retained</span>
                    <span className="text-[16px] font-semibold text-[#3E8B69] font-mono mt-0.5 block">
                      +{liveResult.expected_incremental_retained}
                    </span>
                  </div>

                  <div>
                    <span className="text-[12px] text-[#697386] block">Incremental Revenue</span>
                    <span className="text-[16px] font-semibold text-[#20242C] font-mono mt-0.5 block">
                      ${liveResult.expected_incremental_revenue.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[12px] text-[#697386] block">Cost / Expected Retained</span>
                    <span className="text-[16px] font-semibold text-[#20242C] font-mono mt-0.5 block">
                      ${(liveResult.cost_per_incremental_retained ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[12px] text-[#697386] block">Remaining Budget</span>
                    <span className="text-[16px] font-semibold text-[#20242C] font-mono mt-0.5 block">
                      ${remainingBudget.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[12px] text-[#697386] block">Break-Even Uplift</span>
                    <span className="text-[16px] font-semibold text-[#D69A37] font-mono mt-0.5 block">
                      {typeof liveResult.break_even_retention_uplift === 'number'
                        ? `${(liveResult.break_even_retention_uplift * 100).toFixed(1)}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sensitivity Analysis Table */}
              <div className="bg-white border border-[#E6E8EC] rounded-lg p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[14px] font-semibold text-[#20242C]">
                    Sensitivity Analysis
                  </h3>
                  <span className="text-[12px] text-[#697386]">&plusmn;25% Uplift Variation</span>
                </div>
                <p className="text-[12px] text-[#697386] mb-3">
                  Evaluates financial impact if retention uplift varies from initial assumption.
                </p>

                <div className="overflow-x-auto border border-[#E6E8EC] rounded-md">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr>
                        <th className="data-table-header">Case</th>
                        <th className="data-table-header">Uplift</th>
                        <th className="data-table-header">Retained</th>
                        <th className="data-table-header">Incremental Revenue</th>
                        <th className="data-table-header text-right">Net Benefit</th>
                        <th className="data-table-header text-right">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveResult.sensitivity_analysis.map((scen, idx) => (
                        <tr key={idx} className={idx === 1 ? 'bg-[#F7F8FA] font-medium' : 'data-table-row'}>
                          <td className="data-table-cell font-medium text-[#20242C]">
                            {scen.case_name}
                          </td>
                          <td className="data-table-cell font-mono text-[#697386]">
                            +{(scen.uplift * 100).toFixed(1)}%
                          </td>
                          <td className="data-table-cell font-mono">
                            +{scen.incremental_retained}
                          </td>
                          <td className="data-table-cell font-mono">
                            ${scen.incremental_revenue.toFixed(2)}
                          </td>
                          <td className={`data-table-cell text-right font-mono font-semibold ${
                            scen.net_benefit >= 0 ? 'text-[#3E8B69]' : 'text-[#C75B58]'
                          }`}>
                            ${scen.net_benefit.toFixed(2)}
                          </td>
                          <td className="data-table-cell text-right font-mono text-[#697386]">
                            {scen.roi_pct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Multi-Strategy Comparison Section (Section 10) */}
      <div className="bg-white border border-[#E6E8EC] rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E6E8EC]">
          <div>
            <h2 className="text-[16px] font-semibold text-[#20242C] flex items-center space-x-2">
              <GitCompare className="w-4 h-4 text-[#315E81]" />
              <span>Multi-Strategy Comparison</span>
            </h2>
            <p className="text-[12px] text-[#697386] mt-0.5">
              Select 2 or more saved scenarios to compare expected financial returns and break-even thresholds.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[12px] text-[#697386]">Saved Scenarios:</span>
            <div className="flex items-center space-x-1.5 flex-wrap">
              {savedScenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleScenarioSelect(s.id)}
                  className={`px-2.5 py-1 rounded text-[12px] font-medium border transition-colors ${
                    selectedForCompare.includes(s.id)
                      ? 'bg-[#315E81] text-white border-[#315E81]'
                      : 'bg-white text-[#20242C] border-[#E6E8EC] hover:bg-[#F7F8FA]'
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
            <div className="overflow-x-auto border border-[#E6E8EC] rounded-md">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="data-table-header">Scenario Name</th>
                    <th className="data-table-header">Target Segment</th>
                    <th className="data-table-header">Assumed Uplift</th>
                    <th className="data-table-header">Targeted Customers</th>
                    <th className="data-table-header">Campaign Cost</th>
                    <th className="data-table-header">Retained Customers</th>
                    <th className="data-table-header text-right">Net Benefit</th>
                    <th className="data-table-header text-right">Break-Even Uplift</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.scenarios.map((item) => {
                    const isBest = item.scenario_id === comparison.best_net_benefit_scenario_id;
                    return (
                      <tr key={item.scenario_id} className={isBest ? 'bg-[#F0F7F3]/40' : 'data-table-row'}>
                        <td className="data-table-cell font-medium text-[#20242C] flex items-center space-x-1.5">
                          <span>{item.name}</span>
                          {isBest && (
                            <span className="text-[10px] bg-[#F0F7F3] text-[#3E8B69] border border-[#D4EADB] font-medium px-1.5 py-0.2 rounded">
                              Recommended
                            </span>
                          )}
                        </td>
                        <td className="data-table-cell text-[#697386]">{item.target_segment}</td>
                        <td className="data-table-cell font-mono text-[#315E81] font-medium">
                          +{(item.assumed_uplift * 100).toFixed(1)}%
                        </td>
                        <td className="data-table-cell font-mono">{item.targeted_customers}</td>
                        <td className="data-table-cell font-mono">${item.total_campaign_cost.toFixed(2)}</td>
                        <td className="data-table-cell font-mono text-[#3E8B69] font-medium">
                          +{item.expected_incremental_retained}
                        </td>
                        <td className={`data-table-cell text-right font-mono font-semibold ${
                          item.expected_net_benefit >= 0 ? 'text-[#3E8B69]' : 'text-[#C75B58]'
                        }`}>
                          ${item.expected_net_benefit.toFixed(2)}
                        </td>
                        <td className="data-table-cell text-right font-mono text-[#D69A37]">
                          {typeof item.break_even_retention_uplift === 'number'
                            ? `${(item.break_even_retention_uplift * 100).toFixed(1)}%`
                            : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md text-[12px] text-[#697386] space-y-1">
              <span className="font-medium text-[#20242C] block">Comparison Notes:</span>
              {comparison.methodology_notes.map((note, idx) => (
                <p key={idx}>&bull; {note}</p>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-[13px] text-[#697386]">
            Select at least 2 saved scenarios above to view comparative economics.
          </div>
        )}
      </div>
    </div>
  );
};
