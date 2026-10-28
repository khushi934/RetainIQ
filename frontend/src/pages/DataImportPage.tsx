import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { DataQualityReport } from '../types';

export const DataImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState('Customer Upload');
  const [preview, setPreview] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setDatasetName(selected.name.replace('.csv', ''));
      setError(null);
      setLoadingPreview(true);
      try {
        const prev = await api.previewCSV(selected);
        setPreview(prev);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV preview.');
      } finally {
        setLoadingPreview(false);
      }
    }
  };

  const handleExecuteImport = async () => {
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const report = await api.importCSV(file, datasetName, preview?.suggested_mapping);
      setQualityReport(report);
    } catch (err: any) {
      setError(err.message || 'Import transaction failed.');
    } finally {
      setImporting(false);
    }
  };

  const handleLoadSample = async () => {
    setImporting(true);
    setError(null);
    try {
      const report = await api.loadSampleDataset();
      setQualityReport(report);
    } catch (err: any) {
      setError(err.message || 'Failed to load sample benchmark.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Customer Data Import
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload custom customer CSVs or load the benchmark IBM Telco dataset with transactional validation
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {qualityReport ? (
        /* Success Report View */
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center space-x-3 text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Data Imported Successfully into MySQL
              </h2>
              <p className="text-xs text-slate-500">
                Dataset #{qualityReport.dataset_id} &bull; {qualityReport.dataset_name}
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
            {qualityReport.beginner_explanation}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-white border border-slate-200 rounded-md">
              <span className="text-[11px] text-slate-400 block">Accepted Records</span>
              <span className="text-xl font-bold text-slate-900">{qualityReport.accepted_rows}</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-md">
              <span className="text-[11px] text-slate-400 block">Rejected Rows</span>
              <span className="text-xl font-bold text-slate-900">{qualityReport.rejected_rows}</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-md">
              <span className="text-[11px] text-slate-400 block">Observed Churn Rate</span>
              <span className="text-xl font-bold text-slate-900">{qualityReport.observed_churn_rate_pct}%</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-md">
              <span className="text-[11px] text-slate-400 block">Quality Health Score</span>
              <span className="text-xl font-bold text-emerald-700">{qualityReport.quality_score} / 100</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => navigate('/app/dashboard')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs flex items-center space-x-1.5"
            >
              <span>Go to Overview Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/app/quality')}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold"
            >
              View Data Quality Report
            </button>
            <button
              onClick={() => { setQualityReport(null); setFile(null); setPreview(null); }}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium ml-auto"
            >
              Import Another File
            </button>
          </div>
        </div>
      ) : (
        /* Upload & Preview Interface */
        <div className="space-y-6">
          {/* Quick One-Click Benchmark Button */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                  1-Click Portfolio Demo
                </span>
                <span className="text-[10px] bg-blue-200 text-blue-800 font-semibold px-2 py-0.5 rounded">
                  1,000 Verified Records
                </span>
              </div>
              <p className="text-xs text-blue-800">
                Load the canonical IBM Telco Customer Churn dataset into MySQL instantly to run SQL analytics and ML pipelines.
              </p>
            </div>
            <button
              onClick={handleLoadSample}
              disabled={importing}
              className="shrink-0 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-md text-xs transition-colors shadow-xs flex items-center justify-center space-x-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{importing ? 'Importing Dataset...' : 'Load Benchmark Dataset'}</span>
            </button>
          </div>

          {/* Drag and Drop File Upload Area */}
          <div className="bg-white border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-8 text-center transition-colors">
            <input
              type="file"
              accept=".csv"
              id="csv-file-input"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-slate-900">
                Click to select a customer CSV file
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Supports standard comma or semicolon delimited CSV files (up to 50MB)
              </span>
              {file && (
                <div className="mt-4 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </label>
          </div>

          {/* Preview and Mapping Confirmation */}
          {preview && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    CSV Schema Preview & Auto-Mapping
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {preview.detected_columns.length} columns detected &bull; Showing first {preview.total_preview_count} rows
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    placeholder="Dataset Name"
                    className="px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    onClick={handleExecuteImport}
                    disabled={importing}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <span>{importing ? 'Validating & Persisting...' : 'Confirm & Import to MySQL'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto max-h-72 border border-slate-100 rounded-md">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr>
                      {preview.detected_columns.map((col: string, idx: number) => (
                        <th key={idx} className="data-table-header whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {preview.preview_rows.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        {preview.detected_columns.map((col: string, cIdx: number) => (
                          <td key={cIdx} className="data-table-cell whitespace-nowrap">
                            {row[col] !== undefined ? String(row[col]) : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
