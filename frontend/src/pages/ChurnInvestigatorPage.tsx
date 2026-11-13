import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  CheckCircle2,
  FileText,
  Clock,
  ChevronRight,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { Investigation } from '../types';

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
            title: 'Elevated Contract Churn Vulnerability',
            summary: 'Analysis of customer records reveals month-to-month contracts experience significantly higher churn rates.',
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
          <h1 className="text-[26px] font-semibold text-[#20242C] tracking-tight">
            Churn Investigator
          </h1>
          <p className="text-[14px] text-[#697386] mt-1">
            Segment-level analytical investigations connecting customer attributes to observed churn behavior.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 bg-[#315E81] hover:bg-[#274b68] text-white rounded-md text-[13px] font-medium transition-colors flex items-center space-x-1.5 shadow-card self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Investigation</span>
        </button>
      </div>

      {/* Main 2-Column Analytical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Investigation List */}
        <div className="lg:col-span-4 bg-white border border-[#E6E8EC] rounded-lg p-4 space-y-2">
          <div className="text-[13px] font-medium text-[#20242C] px-2 pb-2 border-b border-[#E6E8EC]">
            Active Investigations ({investigations.length})
          </div>

          <div className="space-y-1">
            {investigations.map((inv) => (
              <button
                key={inv.id}
                onClick={() => setSelectedInv(inv)}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  selectedInv?.id === inv.id
                    ? 'bg-[#F7F8FA] border border-[#E6E8EC]'
                    : 'hover:bg-[#F7F8FA] border border-transparent'
                }`}
              >
                <div className="text-[13px] font-semibold text-[#20242C] truncate">
                  {inv.title}
                </div>
                <div className="text-[11px] text-[#697386] mt-0.5">
                  Segment: {inv.target_segment} &bull; {inv.findings.length} findings
                </div>
              </button>
            ))}
            {investigations.length === 0 && !loading && (
              <div className="p-6 text-center text-[12px] text-[#697386]">
                No investigations yet. Click "New Investigation" above to begin.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Findings & Empirical Details */}
        <div className="lg:col-span-8 bg-white border border-[#E6E8EC] rounded-lg p-6 space-y-6">
          {selectedInv ? (
            <>
              <div className="border-b border-[#E6E8EC] pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-semibold text-[#20242C]">
                    {selectedInv.title}
                  </h2>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded border bg-[#F0F7F3] text-[#3E8B69] border-[#D4EADB]">
                    {selectedInv.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-[13px] text-[#697386] mt-1.5 leading-relaxed">
                  {selectedInv.description || 'Investigation into cohort behavioral characteristics and retention factors.'}
                </p>
                <div className="mt-3 text-[12px] text-[#697386]">
                  Target Population: <span className="font-medium text-[#20242C]">{selectedInv.target_segment}</span>
                </div>
              </div>

              {/* Verified Empirical Findings */}
              <div className="space-y-3">
                <h3 className="text-[14px] font-semibold text-[#20242C]">
                  Documented Evidence Findings ({selectedInv.findings.length})
                </h3>

                <div className="space-y-3">
                  {selectedInv.findings.map((f, idx) => (
                    <div
                      key={f.id || idx}
                      className="p-4 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-[#20242C]">
                          {f.title}
                        </span>
                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded border bg-white border-[#E6E8EC] text-[#697386]">
                          {f.confidence_level} confidence
                        </span>
                      </div>
                      <p className="text-[12px] text-[#697386] leading-relaxed">
                        {f.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Finding Form */}
              <form onSubmit={handleAddFinding} className="pt-4 border-t border-[#E6E8EC] space-y-3">
                <h4 className="text-[13px] font-semibold text-[#20242C]">
                  Attach Analytical Finding
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      value={findingTitle}
                      onChange={(e) => setFindingTitle(e.target.value)}
                      placeholder="Finding summary headline (e.g. Fiber customers lack tech support)..."
                      className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81]"
                    />
                  </div>

                  <div>
                    <select
                      value={confidence}
                      onChange={(e) => setConfidence(e.target.value)}
                      className="w-full h-10 px-2.5 border border-[#E6E8EC] rounded-md text-[13px] bg-white text-[#20242C] focus:outline-none focus:border-[#315E81]"
                    >
                      <option value="high">High Confidence</option>
                      <option value="medium">Medium Confidence</option>
                      <option value="exploratory">Exploratory</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={2}
                  required
                  value={findingSummary}
                  onChange={(e) => setFindingSummary(e.target.value)}
                  placeholder="Detailed quantitative context and supporting SQL evidence..."
                  className="w-full p-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81]"
                />

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#20242C] hover:bg-slate-800 text-white rounded-md text-[13px] font-medium transition-colors shadow-card"
                >
                  Record Finding
                </button>
              </form>
            </>
          ) : (
            <div className="py-20 text-center text-[13px] text-[#697386]">
              Select an investigation from the left panel to inspect empirical evidence.
            </div>
          )}
        </div>
      </div>

      {/* Modal for Creating Investigation */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="bg-white border border-[#E6E8EC] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[17px] font-semibold text-[#20242C]">
              New Retention Investigation
            </h2>

            <form onSubmit={handleCreateInvestigation} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#20242C] mb-1">
                  Investigation Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Electronic Check Cohort Attrition"
                  className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#20242C] mb-1">
                  Target Customer Segment
                </label>
                <input
                  type="text"
                  required
                  value={targetSegment}
                  onChange={(e) => setTargetSegment(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#20242C] mb-1">
                  Description & Context
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the churn pattern or hypothesis being investigated..."
                  className="w-full p-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 border border-[#E6E8EC] text-[#20242C] hover:bg-[#F7F8FA] rounded-md text-[13px] font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#315E81] hover:bg-[#274b68] text-white rounded-md text-[13px] font-medium transition-colors shadow-card"
                >
                  Create Investigation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
