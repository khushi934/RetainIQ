import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api';
import { Customer } from '../types';
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[#20242C] tracking-tight">
            Customers
          </h1>
          <p className="text-[14px] text-[#697386] mt-1">
            Search, filter, and inspect individual customer records and predictive churn scores.
          </p>
        </div>

        <button
          onClick={exportFilteredCSV}
          disabled={customers.length === 0}
          className="px-3.5 py-2 bg-white border border-[#E6E8EC] hover:bg-[#F7F8FA] text-[#20242C] rounded-md text-[13px] font-medium transition-colors flex items-center space-x-1.5 shadow-card self-start"
        >
          <Download className="w-4 h-4 text-[#697386]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar (Section 8 & 13) */}
      <div className="bg-white border border-[#E6E8EC] rounded-lg p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#697386]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer ID (e.g. CUST-00042)..."
              className="w-full h-10 pl-9 pr-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81]"
            />
          </div>
          <button
            type="submit"
            className="h-10 px-4 bg-[#20242C] hover:bg-slate-800 text-white rounded-md text-[13px] font-medium transition-colors shadow-card"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#E6E8EC] text-[13px]">
          <div className="flex items-center space-x-1.5 text-[#697386]">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium text-[#20242C]">Filters:</span>
          </div>

          <select
            value={contract}
            onChange={(e) => { setContract(e.target.value); setPage(1); }}
            className="h-8 px-2.5 border border-[#E6E8EC] rounded text-[12px] bg-white text-[#20242C] focus:outline-none focus:border-[#315E81]"
          >
            <option value="">All Contracts</option>
            <option value="Month-to-month">Month-to-month</option>
            <option value="One year">One year</option>
            <option value="Two year">Two year</option>
          </select>

          <select
            value={churn}
            onChange={(e) => { setChurn(e.target.value); setPage(1); }}
            className="h-8 px-2.5 border border-[#E6E8EC] rounded text-[12px] bg-white text-[#20242C] focus:outline-none focus:border-[#315E81]"
          >
            <option value="">All Statuses</option>
            <option value="no">Active Accounts</option>
            <option value="yes">Historical Churn</option>
          </select>

          <select
            value={risk}
            onChange={(e) => { setRisk(e.target.value); setPage(1); }}
            className="h-8 px-2.5 border border-[#E6E8EC] rounded text-[12px] bg-white text-[#20242C] focus:outline-none focus:border-[#315E81]"
          >
            <option value="">All Risk Tiers</option>
            <option value="High">High Risk (&ge; 60%)</option>
            <option value="Medium">Medium Risk (35-60%)</option>
            <option value="Low">Low Risk (&lt; 35%)</option>
          </select>

          {(contract || churn || risk || search) && (
            <button
              onClick={() => { setContract(''); setChurn(''); setRisk(''); setSearch(''); setPage(1); }}
              className="text-[12px] text-[#C75B58] hover:underline font-medium ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Customers Data Table (Section 8) */}
      <div className="bg-white border border-[#E6E8EC] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr>
                <th
                  onClick={() => handleSort('customer_identifier')}
                  className="data-table-header cursor-pointer select-none hover:text-[#20242C]"
                >
                  <div className="flex items-center space-x-1">
                    <span>Customer ID</span>
                    <ArrowUpDown className="w-3 h-3 text-[#697386]" />
                  </div>
                </th>
                <th className="data-table-header">Contract</th>
                <th
                  onClick={() => handleSort('tenure_months')}
                  className="data-table-header cursor-pointer select-none hover:text-[#20242C]"
                >
                  <div className="flex items-center space-x-1">
                    <span>Tenure</span>
                    <ArrowUpDown className="w-3 h-3 text-[#697386]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('monthly_charges')}
                  className="data-table-header text-right cursor-pointer select-none hover:text-[#20242C]"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Monthly Charges</span>
                    <ArrowUpDown className="w-3 h-3 text-[#697386]" />
                  </div>
                </th>
                <th className="data-table-header text-right">Total Charges</th>
                <th className="data-table-header">Internet Service</th>
                <th className="data-table-header">Observed Churn</th>
                <th className="data-table-header">ML Predicted Risk</th>
                <th className="data-table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-[13px] text-[#697386]">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-[#E6E8EC] border-t-[#315E81] rounded-full animate-spin"></div>
                      <span>Loading customer records from MySQL...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-[13px] text-[#697386]">
                    No customer records matched your query.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="data-table-row">
                    <td className="data-table-cell font-mono text-[12px] text-[#315E81] font-medium">
                      <Link to={`/app/customers/${c.id}`} className="hover:underline">
                        {c.customer_identifier}
                      </Link>
                    </td>
                    <td className="data-table-cell text-[#20242C]">{c.contract_type}</td>
                    <td className="data-table-cell text-[#697386]">{c.tenure_months} mos</td>
                    <td className="data-table-cell text-[#20242C] font-mono text-right font-medium">
                      ${c.monthly_charges.toFixed(2)}
                    </td>
                    <td className="data-table-cell text-[#697386] font-mono text-right">
                      ${c.total_charges.toFixed(2)}
                    </td>
                    <td className="data-table-cell text-[#697386]">{c.internet_service || 'No'}</td>
                    <td className="data-table-cell">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                        c.observed_churn
                          ? 'bg-[#FBF2F2] text-[#C75B58] border-[#F2D5D4]'
                          : 'bg-[#F0F7F3] text-[#3E8B69] border-[#D4EADB]'
                      }`}>
                        {c.observed_churn ? 'Historical Churn' : 'Active'}
                      </span>
                    </td>
                    <td className="data-table-cell">
                      <RiskBadge
                        tier={c.latest_risk_tier || (c.latest_prediction ? c.latest_prediction.risk_tier : null)}
                        probability={c.latest_predicted_churn_probability || (c.latest_prediction ? c.latest_prediction.predicted_churn_probability : null)}
                      />
                    </td>
                    <td className="data-table-cell text-right">
                      <Link
                        to={`/app/customers/${c.id}`}
                        className="text-[12px] font-medium text-[#315E81] hover:underline"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-5 py-3.5 border-t border-[#E6E8EC] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[13px] text-[#697386]">
          <div>
            Showing <span className="font-medium text-[#20242C]">{customers.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="font-medium text-[#20242C]">{Math.min(page * pageSize, total)}</span> of{' '}
            <span className="font-medium text-[#20242C]">{total.toLocaleString()}</span> customers
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 border border-[#E6E8EC] rounded text-[#20242C] hover:bg-[#F7F8FA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[12px] font-medium text-[#20242C]">
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 border border-[#E6E8EC] rounded text-[#20242C] hover:bg-[#F7F8FA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
