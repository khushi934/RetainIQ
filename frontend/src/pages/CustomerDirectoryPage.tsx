import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  User,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { Customer, CustomerListResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const CustomerDirectoryPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [contract, setContract] = useState('');
  const [churn, setChurn] = useState<string>('');
  const [risk, setRisk] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, [page, pageSize, contract, churn, risk, sortBy, sortOrder]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const churnBool = churn === 'yes' ? true : churn === 'no' ? false : undefined;
      const res = await api.getCustomers({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        contract: contract || undefined,
        churn: churnBool,
        risk: risk || undefined,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setCustomers(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCustomers();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const exportFilteredCSV = () => {
    if (customers.length === 0) return;
    const headers = ["Customer ID", "Gender", "Contract", "Tenure Months", "Monthly Charges", "Total Charges", "Internet", "Observed Churn", "Predicted Risk", "Probability"];
    const rows = customers.map(c => [
      c.customer_identifier,
      c.gender || 'Unknown',
      c.contract_type || 'Month-to-month',
      c.tenure_months,
      c.monthly_charges,
      c.total_charges,
      c.internet_service || 'No',
      c.observed_churn ? 'Yes' : 'No',
      c.latest_risk_tier || 'Unscored',
      c.latest_predicted_churn_probability || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `retainiq_customers_page_${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, and inspect individual customer attributes and ML churn probabilities
          </p>
        </div>

        <button
          onClick={exportFilteredCSV}
          disabled={customers.length === 0}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Filtered CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer ID (e.g. CUST-00042)..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-1 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-700">Filters:</span>
          </div>

          <select
            value={contract}
            onChange={(e) => { setContract(e.target.value); setPage(1); }}
            className="px-2.5 py-1 border border-slate-200 rounded text-xs bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Contracts</option>
            <option value="Month-to-month">Month-to-month</option>
            <option value="One year">One year</option>
            <option value="Two year">Two year</option>
          </select>

          <select
            value={churn}
            onChange={(e) => { setChurn(e.target.value); setPage(1); }}
            className="px-2.5 py-1 border border-slate-200 rounded text-xs bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Churn Statuses</option>
            <option value="no">Active (Retained)</option>
            <option value="yes">Observed Churned</option>
          </select>

          <select
            value={risk}
            onChange={(e) => { setRisk(e.target.value); setPage(1); }}
            className="px-2.5 py-1 border border-slate-200 rounded text-xs bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Predicted Risk Tiers</option>
            <option value="High">High Risk (Prob &ge; 60%)</option>
            <option value="Medium">Medium Risk (35-60%)</option>
            <option value="Low">Low Risk (&lt; 35%)</option>
          </select>

          {(contract || churn || risk || search) && (
            <button
              onClick={() => { setContract(''); setChurn(''); setRisk(''); setSearch(''); setPage(1); }}
              className="text-xs text-rose-600 hover:underline font-medium ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th
                  onClick={() => handleSort('customer_identifier')}
                  className="data-table-header cursor-pointer select-none hover:text-slate-900"
                >
                  <div className="flex items-center space-x-1">
                    <span>Customer ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('contract_type')}
                  className="data-table-header cursor-pointer select-none hover:text-slate-900"
                >
                  <div className="flex items-center space-x-1">
                    <span>Contract</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('tenure_months')}
                  className="data-table-header cursor-pointer select-none hover:text-slate-900"
                >
                  <div className="flex items-center space-x-1">
                    <span>Tenure</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('monthly_charges')}
                  className="data-table-header cursor-pointer select-none hover:text-slate-900"
                >
                  <div className="flex items-center space-x-1">
                    <span>Monthly</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="data-table-header">Internet</th>
                <th className="data-table-header">Observed Churn</th>
                <th className="data-table-header">Predicted Risk Tier</th>
                <th className="data-table-header text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="data-table-cell text-center py-12 text-slate-400">
                    Loading records from MySQL...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="data-table-cell text-center py-12 text-slate-400">
                    No customers match the active filters.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="data-table-cell font-mono font-medium text-slate-900">
                      {c.customer_identifier}
                    </td>
                    <td className="data-table-cell text-slate-600">
                      {c.contract_type || 'Month-to-month'}
                    </td>
                    <td className="data-table-cell text-slate-600">
                      {c.tenure_months} mos
                    </td>
                    <td className="data-table-cell font-medium text-slate-800">
                      ${c.monthly_charges.toFixed(2)}
                    </td>
                    <td className="data-table-cell text-slate-600">
                      {c.internet_service || 'No'}
                    </td>
                    <td className="data-table-cell">
                      {c.observed_churn ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Churned
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="data-table-cell">
                      <RiskBadge
                        tier={c.latest_risk_tier}
                        probability={c.latest_predicted_churn_probability}
                      />
                    </td>
                    <td className="data-table-cell text-right">
                      <Link
                        to={`/app/customers/${c.id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Profile &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{customers.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{total}</span> customers
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
