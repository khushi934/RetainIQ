import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  BadgeAlert,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Investigation, InvestigationFinding } from '../types';

export const ChurnInvestigatorPage: React.FC = () => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [selectedInv, setSelectedInv] = useState<Investigation | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetSegment, setTargetSegment] = useState('Month-to-month + Fiber Optic');
  const [loading, setLoading] = useState(true);

  // New finding state
  const [findingTitle, setFindingTitle] = useState('');
  const [findingSummary, setFindingSummary] = useState('');
  const [confidence, setConfidence] = useState('high');

  useEffect(() => {
    loadInvestigations();
  }, []);

  const loadInvestigations = async () => {
    try {
      const list = await api.getInvestigations();
      setInvestigations(list);
      if (list.length > 0) {
        setSelectedInv(list[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createInvestigation({
        title,
        description,
        target_segment: targetSegment,
        findings: [
          {
            finding_type: 'metric_anomaly',
            title: 'Elevated Initial Churn Observed',
            summary: 'Initial analysis of 1,000 customers reveals month-to-month contracts experience disproportionate departure rates.',
            confidence_level: 'high'
          }
        ]
      });
      setInvestigations([created, ...investigations]);
      setSelectedInv(created);
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv) return;
    try {
      await api.addFinding(selectedInv.id, {
        finding_type: 'behavioral_pattern',
        title: findingTitle,
        summary: findingSummary,
        confidence_level: confidence
      });
      // reload
      const updated = await api.getInvestigations();
      setInvestigations(updated);
      const reselected = updated.find(i => i.id === selectedInv.id) || updated[0];
      setSelectedInv(reselected);
      setFindingTitle('');
      setFindingSummary('');
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
            Churn Investigator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Empirical investigation logs, hypotheses testing, and data-backed findings
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Investigation</span>
        </button>
      </div>

      {/* Main Grid: Investigation List & Findings Drilldown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Investigation Index */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wide px-2 mb-2">
            Active Case Files ({investigations.length})
          </div>

          {investigations.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No investigations created yet.
            </div>
          ) : (
            investigations.map((inv) => (
              <button
                key={inv.id}
                onClick={() => setSelectedInv(inv)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedInv?.id === inv.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${selectedInv?.id === inv.id ? 'bg-slate-800 text-blue-300' : 'bg-slate-200 text-slate-600'}`}>
                    {inv.status}
                  </span>
                  <span className={`text-[10px] ${selectedInv?.id === inv.id ? 'text-slate-400' : 'text-slate-400'}`}>
                    {new Date(inv.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="font-bold text-xs mt-2 truncate">
                  {inv.title}
                </div>
                <div className={`text-[11px] mt-1 truncate ${selectedInv?.id === inv.id ? 'text-slate-300' : 'text-slate-500'}`}>
                  Segment: {inv.target_segment || 'General Base'}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right Column: Case File Evidence & Findings */}
        <div className="lg:col-span-8 space-y-5">
          {selectedInv ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span>Case #{selectedInv.id}</span>
                  <span>&bull;</span>
                  <span>Target: {selectedInv.target_segment}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedInv.title}
                </h2>
                {selectedInv.description && (
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {selectedInv.description}
                  </p>
                )}
              </div>

              {/* Verified Empirical Findings */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Documented Findings & Evidence ({selectedInv.findings.length})</span>
                </h3>

                <div className="space-y-3">
                  {selectedInv.findings.map((finding) => (
                    <div key={finding.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{finding.title}</span>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {finding.confidence_level} Confidence
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {finding.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Finding Form */}
              <form onSubmit={handleAddFinding} className="pt-4 border-t border-slate-100 space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Record Additional Verified Finding
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      required
                      value={findingTitle}
                      onChange={(e) => setFindingTitle(e.target.value)}
                      placeholder="Finding summary headline (e.g. Tech Support reduces churn by 40%)..."
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <select
                      value={confidence}
                      onChange={(e) => setConfidence(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-800 focus:outline-none"
                    >
                      <option value="high">High Confidence</option>
                      <option value="medium">Medium Confidence</option>
                      <option value="low">Hypothesis / Low</option>
                    </select>
                  </div>
                </div>

                <textarea
                  required
                  rows={2}
                  value={findingSummary}
                  onChange={(e) => setFindingSummary(e.target.value)}
                  placeholder="Detail the data evidence, SQL cohort calculation, or model finding supporting this observation..."
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                ></textarea>

                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-xs"
                >
                  Save Finding
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
              Select an investigation case file from the left to inspect evidence.
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Create Churn Investigation
            </h2>
            <form onSubmit={handleCreateInvestigation} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Investigation Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Month-to-Month Fiber Optic Churn Spike"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Segment</label>
                <input
                  type="text"
                  value={targetSegment}
                  onChange={(e) => setTargetSegment(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Context & Objective</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What pattern or metric trigger prompted this investigation?"
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 shadow-xs"
                >
                  Create Case File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
