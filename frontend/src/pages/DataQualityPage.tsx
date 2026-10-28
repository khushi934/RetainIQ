import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  Database,
  ShieldAlert,
  ShieldCheck,
  Clock,
  FileText,
  BarChart2,
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
      <div className="py-24 text-center text-slate-500 text-xs">
        Loading data quality metrics...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center space-y-3">
        <Database className="w-8 h-8 text-slate-400 mx-auto" />
        <h2 className="text-sm font-bold text-slate-800">No Datasets Available</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Import a customer CSV file or load the benchmark dataset to generate comprehensive data quality audit reports.
        </p>
        <Link
          to="/app/import"
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-900 text-white rounded text-xs font-semibold"
        >
          <span>Go to Data Import</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Data Quality & Integrity Audit
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Empirical quality checks, target leakage detection, and missing value distributions
          </p>
        </div>

        {datasets.length > 1 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">Select Dataset:</span>
            <select
              value={selectedDatasetId || ''}
              onChange={(e) => handleDatasetChange(parseInt(e.target.value, 10))}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.row_count} rows)</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Health Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Dataset Audit: {report.dataset_name}
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              Data Quality Health Index
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              {report.beginner_explanation}
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 p-3 rounded-lg">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Health Score</span>
              <span className="text-2xl font-extrabold text-emerald-700">{report.quality_score}</span>
              <span className="text-xs text-slate-400 font-medium"> / 100</span>
            </div>
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-full">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 4 Health Pillars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-md">
            <span className="text-[11px] text-slate-500 block mb-1">Total Inspected Rows</span>
            <span className="text-lg font-bold text-slate-900">{report.total_rows}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{report.accepted_rows} accepted &bull; {report.rejected_rows} rejected</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-md">
            <span className="text-[11px] text-slate-500 block mb-1">Observed Churn Label</span>
            <span className="text-lg font-bold text-slate-900">{report.observed_churn_rate_pct}%</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Historical ground truth</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-md">
            <span className="text-[11px] text-slate-500 block mb-1">Target Leakage Risk</span>
            <span className="text-lg font-bold text-slate-900">
              {report.potential_target_leakage_warnings.length === 0 ? 'None Detected' : 'Warning'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Features tested for post-facto bias</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-md">
            <span className="text-[11px] text-slate-500 block mb-1">Data Freshness</span>
            <span className="text-xs font-semibold text-slate-800 block mt-1 leading-snug">
              {report.data_freshness_status}
            </span>
          </div>
        </div>

        {/* Target Leakage Warnings Section */}
        {report.potential_target_leakage_warnings.length > 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1 text-amber-900">
            <div className="font-bold flex items-center space-x-1.5 text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Potential Target Leakage Identified</span>
            </div>
            {report.potential_target_leakage_warnings.map((warn, i) => (
              <p key={i}>&bull; {warn}</p>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-lg text-xs text-emerald-900 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Target Leakage Check Passed: No column exhibits 100% predictive separation of the churn label.</span>
          </div>
        )}

        {/* Missing Values Breakdown */}
        <div className="border-t border-slate-100 pt-5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
            Missing Values Audit by Feature
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Object.entries(report.missing_values_by_column).map(([col, missingCount]) => (
              <div key={col} className="p-3 bg-slate-50 border border-slate-100 rounded-md">
                <span className="text-[11px] font-mono text-slate-600 block truncate">{col}</span>
                <span className={`text-base font-bold block mt-1 ${missingCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                  {missingCount} missing
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
