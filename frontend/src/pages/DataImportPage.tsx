import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database
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
      setError(err.message || 'Failed to load benchmark dataset.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[26px] font-semibold text-[#20242C] tracking-tight">
          Data Imports
        </h1>
        <p className="text-[14px] text-[#697386] mt-1">
          Ingest customer CSV files with transactional validation and schema mapping into MySQL.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-[#FBF2F2] border border-[#F2D5D4] rounded-lg text-[13px] text-[#C75B58] flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {qualityReport ? (
        /* Success Report View */
        <div className="bg-white border border-[#E6E8EC] rounded-lg p-6 space-y-6">
          <div className="flex items-center space-x-3 text-[#3E8B69]">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div>
              <h2 className="text-[18px] font-semibold text-[#20242C]">
                Import Transaction Completed
              </h2>
              <p className="text-[12px] text-[#697386]">
                Dataset #{qualityReport.dataset_id} &bull; {qualityReport.dataset_name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[13px]">
            <div className="p-4 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md">
              <span className="text-[12px] text-[#697386] block">Accepted Records</span>
              <span className="text-[24px] font-semibold text-[#3E8B69] font-mono mt-1 block">
                {qualityReport.accepted_rows.toLocaleString()}
              </span>
            </div>

            <div className="p-4 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md">
              <span className="text-[12px] text-[#697386] block">Rejected Rows</span>
              <span className="text-[24px] font-semibold text-[#C75B58] font-mono mt-1 block">
                {qualityReport.rejected_rows}
              </span>
            </div>

            <div className="p-4 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md">
              <span className="text-[12px] text-[#697386] block">Duplicate IDs Filtered</span>
              <span className="text-[24px] font-semibold text-[#20242C] font-mono mt-1 block">
                {qualityReport.duplicate_id_count}
              </span>
            </div>

            <div className="p-4 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md">
              <span className="text-[12px] text-[#697386] block">Total Processed</span>
              <span className="text-[24px] font-semibold text-[#20242C] font-mono mt-1 block">
                {qualityReport.total_rows.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={() => navigate('/app/dashboard')}
              className="px-4 py-2 bg-[#315E81] hover:bg-[#274b68] text-white rounded-md text-[13px] font-medium transition-colors shadow-card flex items-center space-x-1.5"
            >
              <span>View Retention Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setQualityReport(null);
                setFile(null);
                setPreview(null);
              }}
              className="px-3.5 py-2 border border-[#E6E8EC] text-[#20242C] hover:bg-[#F7F8FA] rounded-md text-[13px] font-medium transition-colors"
            >
              Import Another File
            </button>
          </div>
        </div>
      ) : (
        /* Upload & Preview Interface */
        <div className="space-y-6">
          {/* Canonical Benchmark Dataset Banner */}
          <div className="bg-white border border-[#E6E8EC] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="text-[13px] font-semibold text-[#20242C]">
                  Standard Benchmark Dataset
                </span>
                <span className="text-[11px] bg-[#F0F5F9] text-[#315E81] border border-[#E6E8EC] font-medium px-2 py-0.5 rounded">
                  1,000 Verified Records
                </span>
              </div>
              <p className="text-[13px] text-[#697386]">
                Instantly populate MySQL with the canonical customer retention dataset for SQL analytics and ML pipelines.
              </p>
            </div>
            <button
              onClick={handleLoadSample}
              disabled={importing}
              className="shrink-0 px-4 py-2 bg-white border border-[#E6E8EC] hover:bg-[#F7F8FA] text-[#20242C] font-medium rounded-md text-[13px] transition-colors shadow-card flex items-center justify-center space-x-1.5"
            >
              <Database className="w-3.5 h-3.5 text-[#315E81]" />
              <span>{importing ? 'Importing Dataset...' : 'Load Benchmark Dataset'}</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          <div className="bg-white border border-[#E6E8EC] rounded-lg p-6 space-y-4">
            <h2 className="text-[15px] font-semibold text-[#20242C]">
              Upload Custom CSV File
            </h2>

            <div className="border border-dashed border-[#E6E8EC] hover:border-[#697386] rounded-lg p-8 text-center transition-colors">
              <UploadCloud className="w-8 h-8 text-[#697386] mx-auto mb-2" />
              <label className="cursor-pointer">
                <span className="text-[13px] font-medium text-[#315E81] hover:underline">
                  Select a CSV file from your computer
                </span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-[12px] text-[#697386] mt-1">
                Supports standard UTF-8 encoded customer CSV exports (up to 50MB)
              </p>
              {file && (
                <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 bg-[#F7F8FA] border border-[#E6E8EC] rounded text-[12px] text-[#20242C]">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#315E81]" />
                  <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            {loadingPreview && (
              <div className="py-6 text-center text-[12px] text-[#697386]">
                Parsing and inspecting CSV column headers...
              </div>
            )}

            {preview && (
              <div className="pt-4 border-t border-[#E6E8EC] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold text-[#20242C]">
                    Preview & Schema Mapping ({preview.detected_columns?.length} columns detected)
                  </div>
                  <button
                    onClick={handleExecuteImport}
                    disabled={importing}
                    className="px-4 py-2 bg-[#315E81] hover:bg-[#274b68] text-white rounded-md text-[13px] font-medium transition-colors shadow-card flex items-center space-x-1.5"
                  >
                    <span>{importing ? 'Executing Transaction...' : 'Confirm & Ingest to MySQL'}</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-[#E6E8EC] rounded-md">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead>
                      <tr>
                        {preview.detected_columns?.slice(0, 8).map((col: string, idx: number) => (
                          <th key={idx} className="data-table-header">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sample_rows?.slice(0, 4).map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="data-table-row">
                          {preview.detected_columns?.slice(0, 8).map((col: string, cIdx: number) => (
                            <td key={cIdx} className="data-table-cell text-[#697386] font-mono">
                              {String(row[col] ?? '')}
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
        </div>
      )}
    </div>
  );
};
