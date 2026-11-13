import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Report } from '../types';
import { Download, Plus, CheckCircle2, AlertTriangle, RefreshCw, Eye, X } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getReports();
      setReports(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch generated reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      setError(null);
      setSuccessMsg(null);
      const res = await api.generateExecutiveReport();
      setSuccessMsg(`Executive Audit Report "${res.title}" generated successfully.`);
      await fetchReports();
    } catch (err: any) {
      setError(err.message || 'Failed to generate executive report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (reportId: number) => {
    const downloadUrl = api.getReportDownloadUrl(reportId);
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[#20242C] tracking-tight">Reports</h1>
          <p className="text-[14px] text-[#697386] mt-1">
            Generate customer churn audits, model evaluations, and Decision Lab scenario exports backed by MySQL.
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-[#20242C] bg-white border border-[#E6E8EC] rounded-md hover:bg-[#F7F8FA] transition-colors shadow-card self-start"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#697386]" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-[#FBF2F2] border border-[#F2D5D4] rounded-lg text-[13px] text-[#C75B58] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-[#F0F7F3] border border-[#D4EADB] rounded-lg text-[13px] text-[#3E8B69] flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Form */}
        <div className="lg:col-span-1 bg-white p-5 rounded-lg border border-[#E6E8EC] space-y-4">
          <div className="pb-3 border-b border-[#E6E8EC]">
            <h2 className="text-[15px] font-semibold text-[#20242C]">Generate Report</h2>
            <p className="text-[12px] text-[#697386] mt-0.5">Automated executive intelligence synthesis</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[#20242C] mb-1.5">
                Report Type
              </label>
              <select className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] bg-white text-[#20242C] focus:outline-none focus:border-[#315E81]">
                <option value="executive_summary">Executive Retention & Churn Audit</option>
                <option value="model_governance">Machine Learning Model Evaluation</option>
                <option value="decision_lab">Decision Lab Scenario Analysis</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#20242C] mb-1.5">
                Output Format
              </label>
              <div className="flex gap-2">
                <span className="px-3 py-1.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded text-[12px] font-medium text-[#20242C]">
                  JSON / Markdown Document
                </span>
                <span className="px-3 py-1.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded text-[12px] font-medium text-[#20242C]">
                  Printable
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full h-10 px-4 bg-[#315E81] hover:bg-[#274b68] disabled:opacity-40 text-white rounded-md text-[13px] font-medium transition-colors shadow-card flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{generating ? 'Compiling Report...' : 'Generate Executive Report'}</span>
            </button>
          </form>
        </div>

        {/* Recent Reports Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-[#E6E8EC] space-y-4">
          <div className="pb-3 border-b border-[#E6E8EC] flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[#20242C]">Generated Reports</h2>
            <span className="text-[12px] text-[#697386]">{reports.length} available</span>
          </div>

          <div className="overflow-x-auto border border-[#E6E8EC] rounded-md">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="data-table-header">Title</th>
                  <th className="data-table-header">Type</th>
                  <th className="data-table-header">Generated Date</th>
                  <th className="data-table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#697386]">
                      Loading report history...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#697386]">
                      No reports generated yet. Click "Generate Executive Report" to compile one.
                    </td>
                  </tr>
                ) : (
                  reports.map((rep) => (
                    <tr key={rep.id} className="data-table-row">
                      <td className="data-table-cell font-medium text-[#20242C]">{rep.title}</td>
                      <td className="data-table-cell text-[#697386]">{rep.report_type}</td>
                      <td className="data-table-cell text-[#697386]">
                        {new Date(rep.created_at).toLocaleDateString()}
                      </td>
                      <td className="data-table-cell text-right space-x-2">
                        <button
                          onClick={() => setPreviewReport(rep)}
                          className="text-[12px] font-medium text-[#315E81] hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(rep.id)}
                          className="text-[12px] font-medium text-[#697386] hover:text-[#20242C]"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="bg-white border border-[#E6E8EC] rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E8EC]">
              <div>
                <h3 className="text-[16px] font-semibold text-[#20242C]">{previewReport.title}</h3>
                <span className="text-[12px] text-[#697386]">Generated: {new Date(previewReport.created_at).toLocaleString()}</span>
              </div>
              <button
                onClick={() => setPreviewReport(null)}
                className="p-1 text-[#697386] hover:text-[#20242C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 text-[13px] text-[#20242C] space-y-3 leading-relaxed whitespace-pre-line">
              {typeof previewReport.content === 'string'
                ? previewReport.content
                : JSON.stringify(previewReport.content, null, 2)}
            </div>

            <div className="pt-3 border-t border-[#E6E8EC] flex justify-end space-x-2">
              <button
                onClick={() => setPreviewReport(null)}
                className="px-4 py-2 border border-[#E6E8EC] rounded-md text-[13px] font-medium text-[#20242C] hover:bg-[#F7F8FA]"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(previewReport.id)}
                className="px-4 py-2 bg-[#315E81] hover:bg-[#274b68] text-white rounded-md text-[13px] font-medium shadow-card flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
