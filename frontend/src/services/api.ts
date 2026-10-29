import {
  User, Customer, CustomerListResponse, OverviewMetrics,
  ChurnByContract, ChurnByInternet, ChurnByTenureCohort,
  ChurnTrendPoint, RiskTierDistribution, SegmentPerformance,
  ModelVersion, ScenarioResult, RetentionScenario,
  ScenarioComparisonResponse, DataQualityReport,
  Investigation, Campaign, Report, AssistantAnswer
} from '../types';

const RAW_API_URL = (import.meta.env.VITE_API_URL as string | undefined) || '';
const API_BASE = RAW_API_URL ? `${RAW_API_URL.replace(/\/$/, '')}/api` : '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('retainiq_token');
  const wsId = localStorage.getItem('retainiq_workspace_id');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (wsId) {
    headers['X-Workspace-Id'] = wsId;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMessage = `Request failed (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        errMessage = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errMessage);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Health
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<any>(res);
  },

  // Auth
  register: async (data: any) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ access_token: string; user: User }>(res);
  },

  login: async (data: any) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ access_token: string; user: User }>(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    return handleResponse<User>(res);
  },

  // Analytics
  getOverview: async () => {
    const res = await fetch(`${API_BASE}/analytics/overview`, { headers: getAuthHeader() });
    return handleResponse<OverviewMetrics>(res);
  },

  getContracts: async () => {
    const res = await fetch(`${API_BASE}/analytics/contracts`, { headers: getAuthHeader() });
    return handleResponse<ChurnByContract[]>(res);
  },

  getInternetService: async () => {
    const res = await fetch(`${API_BASE}/analytics/internet`, { headers: getAuthHeader() });
    return handleResponse<ChurnByInternet[]>(res);
  },

  getTenureCohorts: async () => {
    const res = await fetch(`${API_BASE}/analytics/tenure-cohorts`, { headers: getAuthHeader() });
    return handleResponse<ChurnByTenureCohort[]>(res);
  },

  getChurnTrends: async () => {
    const res = await fetch(`${API_BASE}/analytics/churn-trends`, { headers: getAuthHeader() });
    return handleResponse<ChurnTrendPoint[]>(res);
  },

  getRiskDistribution: async () => {
    const res = await fetch(`${API_BASE}/analytics/risk-distribution`, { headers: getAuthHeader() });
    return handleResponse<RiskTierDistribution[]>(res);
  },

  getSegments: async () => {
    const res = await fetch(`${API_BASE}/analytics/segments`, { headers: getAuthHeader() });
    return handleResponse<SegmentPerformance[]>(res);
  },

  // Customers
  getCustomers: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
    contract?: string;
    churn?: boolean;
    risk?: string;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.page_size) searchParams.set('page_size', params.page_size.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.contract) searchParams.set('contract', params.contract);
    if (params.churn !== undefined) searchParams.set('churn', params.churn.toString());
    if (params.risk) searchParams.set('risk', params.risk);
    if (params.sort_by) searchParams.set('sort_by', params.sort_by);
    if (params.sort_order) searchParams.set('sort_order', params.sort_order);

    const res = await fetch(`${API_BASE}/customers?${searchParams.toString()}`, { headers: getAuthHeader() });
    return handleResponse<CustomerListResponse>(res);
  },

  getCustomer: async (id: number) => {
    const res = await fetch(`${API_BASE}/customers/${id}`, { headers: getAuthHeader() });
    return handleResponse<Customer>(res);
  },

  updateCustomer: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'PATCH',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    return handleResponse<Customer>(res);
  },

  // Datasets
  previewCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('retainiq_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/datasets/preview`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse<any>(res);
  },

  importCSV: async (file: File, datasetName: string, mapping?: any) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataset_name', datasetName);
    if (mapping) {
      formData.append('mapping_json', JSON.stringify(mapping));
    }
    const token = localStorage.getItem('retainiq_token');
    const wsId = localStorage.getItem('retainiq_workspace_id');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (wsId) headers['X-Workspace-Id'] = wsId;

    const res = await fetch(`${API_BASE}/datasets/import`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse<DataQualityReport>(res);
  },

  loadSampleDataset: async () => {
    const res = await fetch(`${API_BASE}/datasets/load-sample`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return handleResponse<DataQualityReport>(res);
  },

  getDatasets: async () => {
    const res = await fetch(`${API_BASE}/datasets`, { headers: getAuthHeader() });
    return handleResponse<any[]>(res);
  },

  getDatasetQuality: async (datasetId: number) => {
    const res = await fetch(`${API_BASE}/datasets/${datasetId}/quality`, { headers: getAuthHeader() });
    return handleResponse<DataQualityReport>(res);
  },

  // Machine Learning Models
  trainModel: async (algorithm: string = 'random_forest', testSize: number = 0.2) => {
    const res = await fetch(`${API_BASE}/models/train`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ algorithm, test_size: testSize }),
    });
    return handleResponse<ModelVersion>(res);
  },

  getModels: async () => {
    const res = await fetch(`${API_BASE}/models`, { headers: getAuthHeader() });
    return handleResponse<ModelVersion[]>(res);
  },

  getModel: async (modelId: number) => {
    const res = await fetch(`${API_BASE}/models/${modelId}`, { headers: getAuthHeader() });
    return handleResponse<ModelVersion>(res);
  },

  runBatchPredictions: async (modelId: number) => {
    const res = await fetch(`${API_BASE}/models/${modelId}/predict`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return handleResponse<{ message: string; predicted_count: number }>(res);
  },

  // Decision Lab
  calculateWhatIf: async (scenarioData: any) => {
    const res = await fetch(`${API_BASE}/decision-lab/calculate`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(scenarioData),
    });
    return handleResponse<ScenarioResult>(res);
  },

  saveScenario: async (scenarioData: any) => {
    const res = await fetch(`${API_BASE}/decision-lab/scenarios`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(scenarioData),
    });
    return handleResponse<RetentionScenario>(res);
  },

  getScenarios: async () => {
    const res = await fetch(`${API_BASE}/decision-lab/scenarios`, { headers: getAuthHeader() });
    return handleResponse<RetentionScenario[]>(res);
  },

  getScenario: async (id: number) => {
    const res = await fetch(`${API_BASE}/decision-lab/scenarios/${id}`, { headers: getAuthHeader() });
    return handleResponse<RetentionScenario>(res);
  },

  compareScenarios: async (scenarioIds: number[]) => {
    const res = await fetch(`${API_BASE}/decision-lab/compare`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ scenario_ids: scenarioIds }),
    });
    return handleResponse<ScenarioComparisonResponse>(res);
  },

  // Investigations
  getInvestigations: async () => {
    const res = await fetch(`${API_BASE}/investigations`, { headers: getAuthHeader() });
    return handleResponse<Investigation[]>(res);
  },

  createInvestigation: async (data: any) => {
    const res = await fetch(`${API_BASE}/investigations`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    return handleResponse<Investigation>(res);
  },

  addFinding: async (investigationId: number, data: any) => {
    const res = await fetch(`${API_BASE}/investigations/${investigationId}/findings`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Campaigns
  getCampaigns: async () => {
    const res = await fetch(`${API_BASE}/campaigns`, { headers: getAuthHeader() });
    return handleResponse<Campaign[]>(res);
  },

  createCampaign: async (data: any) => {
    const res = await fetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    return handleResponse<Campaign>(res);
  },

  recordCampaignOutcome: async (campaignId: number, data: any) => {
    const res = await fetch(`${API_BASE}/campaigns/${campaignId}/outcomes`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Reports
  getReports: async () => {
    const res = await fetch(`${API_BASE}/reports`, { headers: getAuthHeader() });
    return handleResponse<Report[]>(res);
  },

  generateExecutiveReport: async () => {
    const res = await fetch(`${API_BASE}/reports/generate-executive`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return handleResponse<Report>(res);
  },

  getReportDownloadUrl: (reportId: number) => {
    return `${API_BASE}/reports/${reportId}/download`;
  },

  // AI Assistant
  askAssistant: async (question: string) => {
    const res = await fetch(`${API_BASE}/assistant/ask`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ question }),
    });
    return handleResponse<AssistantAnswer>(res);
  },
};
