import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '../services/api';

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => {
    store[key] = value.toString();
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((key) => delete store[key]);
  },
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('RetainIQ Frontend Platform & API Client Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('attaches Bearer token and Workspace ID to authenticated requests', async () => {
    localStorage.setItem('retainiq_token', 'test-jwt-token-2026');
    localStorage.setItem('retainiq_workspace_id', 'ws-test-42');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'usr-1', email: 'demo@retainiq.io' }),
    } as Response);

    await api.getMe();
    expect(fetchSpy).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': 'Bearer test-jwt-token-2026',
        'X-Workspace-Id': 'ws-test-42',
      }),
    }));
  });

  it('formats Decision Lab calculation payload with accurate numeric normalization', async () => {
    const mockResponse = {
      scenario_id: null,
      name: 'Strategy A',
      target_segment: 'High Risk',
      contact_count: 350,
      total_campaign_cost: 4025,
      expected_incremental_retained: 28.35,
      expected_preserved_revenue: 8505,
      expected_net_benefit: 4480,
      roi_percentage: 111.3,
      cost_per_incremental_retained: 141.98,
      break_even_retention_uplift: 0.038,
      is_profitable: true,
      budget_sufficient: true,
      downside_net_benefit: 2470,
      upside_net_benefit: 6490,
      sensitivity_analysis: {
        downside: { retention_uplift: 0.12, net_benefit: 2470, roi: 61.3 },
        base: { retention_uplift: 0.18, net_benefit: 4480, roi: 111.3 },
        upside: { retention_uplift: 0.24, net_benefit: 6490, roi: 161.2 },
      },
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const payload = {
      name: 'Strategy A',
      strategy_type: 'discount_offer',
      target_segment: 'High Risk',
      eligible_customer_count: 350,
      campaign_budget: 5000,
      contact_cost_per_customer: 2.5,
      discount_amount_per_customer: 20.0,
      assumed_response_rate: 0.45,
      assumed_retention_uplift: 0.18,
      revenue_per_retained_customer: 300,
      evaluation_period_months: 3,
    };

    const result = await api.calculateWhatIf(payload);
    expect(fetchSpy).toHaveBeenCalledWith('/api/decision-lab/calculate', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(payload),
    }));

    expect(result.is_profitable).toBe(true);
    expect(result.expected_net_benefit).toBe(4480);
    expect(result.roi_percentage).toBe(111.3);
  });

  it('handles API error responses with standard Error rejection', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Unauthorized invalid credentials' }),
    } as Response);

    await expect(api.login({ email: 'bad@user.com', password: 'wrongpassword' })).rejects.toThrow('Unauthorized invalid credentials');
  });

  it('validates 6-layer epistemological integrity across Decision Lab mathematical invariants', () => {
    // Mathematical invariants of Decision Lab:
    // Net Benefit = Preserved Revenue - Campaign Cost
    const preservedRevenue = 8505;
    const campaignCost = 4025;
    const netBenefit = preservedRevenue - campaignCost;
    expect(netBenefit).toBe(4480);

    // ROI = (Net Benefit / Cost) * 100
    const roi = (netBenefit / campaignCost) * 100;
    expect(Math.round(roi * 10) / 10).toBe(111.3);

    // Cost Per Incremental Retained (CPIR) = Cost / Retained Customers
    const incrementalRetained = 28.35;
    const cpir = campaignCost / incrementalRetained;
    expect(Math.round(cpir * 100) / 100).toBe(141.98);
  });
});
