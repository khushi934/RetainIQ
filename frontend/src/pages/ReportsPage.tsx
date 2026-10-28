import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Report } from '../types';
import { FileText, Download, Plus, CheckCircle, AlertCircle, RefreshCw, Calendar, Eye, ShieldCheck } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Preview Modal
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
      setSuccessMsg(`Executive Audit Report "${res.title}" generated successfully!`);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Reports & Executive Exports</h1>
          <p className="text-sm text-text-secondary mt-1">
            Generate verifiable customer churn audits, model evaluations, and Decision Lab scenario reports backed by MySQL.
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface border border-border rounded-md hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh List
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-800">{successMsg}</p>
        </div>
      )}

      {/* Grid: Generator Form & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Form */}
        <div className="lg:col-span-1 bg-surface p-5 rounded-lg border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Plus className="w-5 h-5 text-brand" />
            <h2 className="text-base font-semibold text-text-primary">Generate Audit Report</h2>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Report Type
              </label>
              <select
                disabled
                className="w-full px-3 py-2 border border-border rounded-md text-sm text-text-primary bg-slate-50 cursor-not-allowed"
              >
                <option>Executive Retention & Churn Audit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Export Format
              </label>
              <select
                disabled
                className="w-full px-3 py-2 border border-border rounded-md text-sm text-text-primary bg-slate-50 cursor-not-allowed"
              >
                <option>CSV (Structured Spreadsheet Export)</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-text-muted space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-text-secondary">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Audit Integrity Verification</span>
              </div>
              <p>
                Compiles live MySQL aggregations, cohort tenure distributions, active contract breakdowns, and ML model evaluation metrics into an immutable audit snapshot.
              </p>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 px-4 bg-brand text-white font-medium text-sm rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Compiling Live Report...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Audit Report
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Reports List */}
        <div className="lg:col-span-2 bg-surface p-5 rounded-lg border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-base font-semibold text-text-primary">Generated Reports & Download Center</h2>
            <span className="text-xs text-text-muted font-mono">{reports.length} reports logged</span>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-text-muted">
              <RefreshCw className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">Loading reports repository from MySQL...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-text-muted">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-text-primary">No reports generated yet</p>
              <p className="text-xs mt-1">Use the generator on the left to create your first executive retention audit report.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50 text-text-muted font-semibold uppercase">
                    <th className="py-2.5 px-3">Title & Type</th>
                    <th className="py-2.5 px-3">Format</th>
                    <th className="py-2.5 px-3">Date Generated</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-medium text-text-primary">{r.title}</div>
                        <div className="text-[11px] text-text-muted capitalize mt-0.5">
                          {r.report_type.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded font-mono uppercase text-[10px] bg-slate-100 border border-slate-200 text-text-secondary">
                          CSV
                        </span>
                      </td>
                      <td className="py-3 px-3 text-text-secondary">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-text-muted" />
                          <span>{new Date(r.created_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        {r.content_json && (
                          <button
                            onClick={() => setPreviewReport(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-text-secondary bg-surface border border-border rounded hover:bg-slate-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Preview
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(r.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-brand rounded hover:bg-slate-800 transition-colors shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download CSV
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-lg border border-border shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-text-primary">{previewReport.title}</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Type: {previewReport.report_type.replace('_', ' ')} • Generated {new Date(previewReport.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setPreviewReport(null)}
                className="text-text-muted hover:text-text-primary p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-md">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(previewReport.content_json, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                onClick={() => setPreviewReport(null)}
                className="px-4 py-2 border border-border text-xs font-medium rounded-md hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(previewReport.id)}
                className="px-4 py-2 bg-brand text-white text-xs font-medium rounded-md hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
