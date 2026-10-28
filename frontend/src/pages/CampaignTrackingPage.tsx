import React, { useEffect, useState } from 'react';
import {
  Target,
  Plus,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Calendar,
  ArrowRight,
  BookmarkCheck
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
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Retention Campaign Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track deployed interventions and record observed empirical outcomes vs Decision Lab simulations
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Campaign</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {campaigns.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
            No retention campaigns launched yet. Click "Launch Campaign" to track live customer outreach.
          </div>
        ) : (
          campaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    camp.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {camp.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(camp.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {camp.name}
                </h2>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Allocated Budget:</span>
                    <span className="font-mono font-bold text-slate-900">${camp.budget.toFixed(2)}</span>
                  </div>
                  {camp.outcomes && camp.outcomes.length > 0 ? (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Actual Contacts:</span>
                        <span className="font-mono text-slate-800">{camp.outcomes[0].actual_contacts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Actual Spend:</span>
                        <span className="font-mono text-slate-800">${camp.outcomes[0].actual_spend.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span className="text-emerald-700">Observed Retentions:</span>
                        <span className="font-mono text-emerald-800">+{camp.outcomes[0].observed_retentions}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 text-slate-400 text-[11px]">
                      Outcome pending observation period.
                    </div>
                  )}
                </div>
              </div>

              {camp.status !== 'completed' && (
                <button
                  onClick={() => setShowOutcomeModal(camp.id)}
                  className="mt-5 w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>Record Observed Outcomes</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Launch Live Retention Campaign
            </h2>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q4 Concierge Outreach"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link Decision Lab Scenario (Optional)</label>
                <select
                  value={scenarioId || ''}
                  onChange={(e) => setScenarioId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-slate-800 focus:outline-none"
                >
                  <option value="">None (Independent Campaign)</option>
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Allocated Budget ($)</label>
                <input
                  type="number"
                  min={0}
                  value={budget}
                  onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-800 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800 shadow-xs"
                >
                  Deploy Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outcome Recording Modal */}
      {showOutcomeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Record Observed Campaign Outcome
            </h2>
            <form onSubmit={handleRecordOutcome} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Actual Customers Contacted</label>
                <input
                  type="number"
                  min={0}
                  value={actualContacts}
                  onChange={(e) => setActualContacts(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-800 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Actual Total Spend ($)</label>
                <input
                  type="number"
                  min={0}
                  value={actualSpend}
                  onChange={(e) => setActualSpend(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-800 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observed Retained Customers</label>
                <input
                  type="number"
                  min={0}
                  value={observedRetentions}
                  onChange={(e) => setObservedRetentions(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-800 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observation Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-800 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOutcomeModal(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800 shadow-xs"
                >
                  Confirm & Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
