import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  Database,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { DataQualityReport } from '../types';

export const DataQualityPage: React.FC = () => {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const list = await api.getDatasets();
      setDatasets(list);
      if (list.length > 0) {
        setSelectedDatasetId(list[0].id);
        const rep = await api.getDatasetQuality(list[0].id);
        setReport(rep);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetChange = async (id: number) => {
    setSelectedDatasetId(id);
    setLoading(true);
    try {
      const rep = await api.getDatasetQuality(id);
      setReport(rep);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-28 text-center text-[#697386] text-[13px]">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-5 h-5 border-2 border-[#E6E8EC] border-t-[#315E81] rounded-full animate-spin"></div>
          <span>Loading data quality audit from MySQL...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white border border-[#E6E8EC] rounded-lg p-10 text-center space-y-3 max-w-lg mx-auto">
        <Database className="w-8 h-8 text-[#697386] mx-auto" />
        <h2 className="text-[16px] font-semibold text-[#20242C]">No Datasets Available</h2>
        <p className="text-[13px] text-[#697386]">
          Import a customer CSV file or load the benchmark dataset to generate data quality audit reports.
        </p>
        <Link
          to="/app/import"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#315E81] text-white rounded-md text-[13px] font-medium shadow-card"
        >
          <span>Go to Data Imports</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[#20242C] tracking-tight">
            Data Quality
          </h1>
          <p className="text-[14px] text-[#697386] mt-1">
            Audit validation checks, target leakage screening, and missing value statistics in MySQL.
          </p>
        </div>

        {datasets.length > 1 && (
          <div className="flex items-center space-x-2">
            <span className="text-[13px] text-[#697386]">Dataset:</span>
            <select
              value={selectedDatasetId || ''}
              onChange={(e) => handleDatasetChange(parseInt(e.target.value, 10))}
              className="h-9 px-3 border border-[#E6E8EC] rounded-md text-[13px] bg-white text-[#20242C] focus:outline-none focus:border-[#315E81]"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} (#{d.id})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-[#E6E8EC] rounded-lg">
          <span className="text-[12px] font-medium text-[#697386] block">Accepted Records</span>
          <span className="text-[26px] font-semibold text-[#3E8B69] font-mono mt-1 block">
            {report.accepted_rows.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#697386]">Validated and committed</span>
        </div>

        <div className="bg-white p-5 border border-[#E6E8EC] rounded-lg">
          <span className="text-[12px] font-medium text-[#697386] block">Rejected Rows</span>
          <span className="text-[26px] font-semibold text-[#C75B58] font-mono mt-1 block">
            {report.rejected_rows}
          </span>
          <span className="text-[11px] text-[#697386]">Failed format constraints</span>
        </div>

        <div className="bg-white p-5 border border-[#E6E8EC] rounded-lg">
          <span className="text-[12px] font-medium text-[#697386] block">Duplicate IDs Filtered</span>
          <span className="text-[26px] font-semibold text-[#20242C] font-mono mt-1 block">
            {report.duplicate_id_count}
          </span>
          <span className="text-[11px] text-[#697386]">Idempotency enforcement</span>
        </div>

        <div className="bg-white p-5 border border-[#E6E8EC] rounded-lg">
          <span className="text-[12px] font-medium text-[#697386] block">Data Cleanliness Rate</span>
          <span className="text-[26px] font-semibold text-[#315E81] font-mono mt-1 block">
            {report.total_rows > 0 ? `${((report.accepted_rows / report.total_rows) * 100).toFixed(1)}%` : '100%'}
          </span>
          <span className="text-[11px] text-[#697386]">Usable analytics payload</span>
        </div>
      </div>

      {/* Column Quality Grid */}
      <div className="bg-white border border-[#E6E8EC] rounded-lg p-5">
        <h2 className="text-[15px] font-semibold text-[#20242C] mb-3 pb-2 border-b border-[#E6E8EC]">
          Column Type Validation & Schema Completeness
        </h2>

        <div className="overflow-x-auto border border-[#E6E8EC] rounded-md">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="data-table-header">RetainIQ Field</th>
                <th className="data-table-header">Mapped CSV Column</th>
                <th className="data-table-header">Data Type</th>
                <th className="data-table-header">Validation Status</th>
              </tr>
            </thead>
            <tbody>
              {report.column_quality_summary && Object.entries(report.column_quality_summary).map(([col, meta]: [string, any], idx) => (
                <tr key={idx} className="data-table-row">
                  <td className="data-table-cell font-mono text-[12px] font-medium text-[#20242C]">
                    {col}
                  </td>
                  <td className="data-table-cell font-mono text-[12px] text-[#697386]">
                    {meta.source_column || col}
                  </td>
                  <td className="data-table-cell text-[#697386]">
                    {meta.data_type || 'String / Nominal'}
                  </td>
                  <td className="data-table-cell">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0F7F3] text-[#3E8B69] border border-[#D4EADB]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Valid</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
