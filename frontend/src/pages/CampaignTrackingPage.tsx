import React, { useEffect, useState } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { Campaign, RetentionScenario } from '../types';

export const CampaignTrackingPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [scenarios, setScenarios] = useState<RetentionScenario[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [scenarioId, setScenarioId] = useState<number | undefined>(undefined);
  const [budget, setBudget] = useState(3000);
  const [loading, setLoading] = useState(true);

  // Outcome inputs
  const [actualContacts, setActualContacts] = useState(250);
  const [actualSpend, setActualSpend] = useState(2800);
  const [observedRetentions, setObservedRetentions] = useState(45);
  const [notes, setNotes] = useState('Observed through 60-day post-campaign billing cycle.');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cList, sList] = await Promise.all([
        api.getCampaigns(),
        api.getScenarios()
      ]);
      setCampaigns(cList);
      setScenarios(sList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCamp = await api.createCampaign({
        name,
        scenario_id: scenarioId,
        budget
      });
      setCampaigns([newCamp, ...campaigns]);
      setShowModal(false);
      setName('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showOutcomeModal) return;
    try {
      await api.recordCampaignOutcome(showOutcomeModal, {
        actual_contacts: actualContacts,
        actual_spend: actualSpend,
        observed_retentions: observedRetentions,
        notes
      });
      setShowOutcomeModal(null);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[#20242C] tracking-tight">
            Campaigns
          </h1>
          <p className="text-[14px] text-[#697386] mt-1">
            Track deployed retention interventions and compare observed empirical outcomes against Decision Lab projections.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-[#315E81] hover:bg-[#274b68] text-white rounded-md text-[13px] font-medium transition-colors flex items-center space-x-1.5 shadow-card self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white border border-[#E6E8EC] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="data-table-header">Campaign Name</th>
                <th className="data-table-header">Status</th>
                <th className="data-table-header text-right">Budget</th>
                <th className="data-table-header">Start Date</th>
                <th className="data-table-header text-right">Actual Contacts</th>
                <th className="data-table-header text-right">Observed Retentions</th>
                <th className="data-table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#697386]">
                    Loading campaign records...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#697386]">
                    No campaigns created yet. Click "New Campaign" to initialize tracking.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const outcome = c.outcomes && c.outcomes.length > 0 ? c.outcomes[0] : null;
                  return (
                    <tr key={c.id} className="data-table-row">
                      <td className="data-table-cell font-medium text-[#20242C]">
                        {c.name}
                      </td>
                      <td className="data-table-cell">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                          c.status === 'completed'
                            ? 'bg-[#F0F7F3] text-[#3E8B69] border-[#D4EADB]'
                            : 'bg-[#F0F5F9] text-[#315E81] border-[#E6E8EC]'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="data-table-cell text-right font-mono text-[#20242C]">
                        ${c.budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="data-table-cell text-[#697386]">
                        {c.start_date ? new Date(c.start_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="data-table-cell text-right font-mono text-[#697386]">
                        {outcome ? outcome.actual_contacts : '—'}
                      </td>
                      <td className="data-table-cell text-right font-mono text-[#3E8B69] font-medium">
                        {outcome ? `+${outcome.observed_retentions}` : '—'}
                      </td>
                      <td className="data-table-cell text-right">
                        {outcome ? (
                          <span className="text-[12px] text-[#697386]">Recorded</span>
                        ) : (
                          <button
                            onClick={() => setShowOutcomeModal(c.id)}
                            className="text-[12px] font-medium text-[#315E81] hover:underline"
                          >
                            Record Outcome
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Campaign */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="bg-white border border-[#E6E8EC] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[17px] font-semibold text-[#20242C]">
              Launch Retention Campaign
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#20242C] mb-1">
                  Campaign Title
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q4 Fiber Attrition Outreach"
                  className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#20242C] mb-1">
                  Linked Decision Lab Scenario (Optional)
                </label>
                <select
                  value={scenarioId || ''}
                  onChange={(e) => setScenarioId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  className="w-full h-10 px-2.5 border border-[#E6E8EC] rounded-md text-[13px] bg-white text-[#20242C] focus:outline-none focus:border-[#315E81]"
                >
                  <option value="">No linked scenario</option>
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#20242C] mb-1">
                  Allocated Budget ($)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={budget}
                  onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81] font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 border border-[#E6E8EC] text-[#20242C] hover:bg-[#F7F8FA] rounded-md text-[13px] font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#315E81] hover:bg-[#274b68] text-white rounded-md text-[13px] font-medium transition-colors shadow-card"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Outcome */}
      {showOutcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="bg-white border border-[#E6E8EC] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[17px] font-semibold text-[#20242C]">
              Record Observed Campaign Outcome
            </h2>

            <form onSubmit={handleRecordOutcome} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#20242C] mb-1">
                    Actual Contacts Reached
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={actualContacts}
                    onChange={(e) => setActualContacts(parseInt(e.target.value, 10) || 0)}
                    className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#20242C] mb-1">
                    Actual Total Spend ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={actualSpend}
                    onChange={(e) => setActualSpend(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#20242C] mb-1">
                  Observed Retained Customers
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={observedRetentions}
                  onChange={(e) => setObservedRetentions(parseInt(e.target.value, 10) || 0)}
                  className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81] font-mono"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#20242C] mb-1">
                  Evaluation Observations & Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOutcomeModal(null)}
                  className="px-3.5 py-2 border border-[#E6E8EC] text-[#20242C] hover:bg-[#F7F8FA] rounded-md text-[13px] font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#315E81] hover:bg-[#274b68] text-white rounded-md text-[13px] font-medium transition-colors shadow-card"
                >
                  Commit Outcome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
