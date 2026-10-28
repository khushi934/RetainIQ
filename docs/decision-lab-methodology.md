# Retention Decision Lab — Mathematical Methodology & Simulation Framework

The **Retention Decision Lab** is RetainIQ's signature business decision simulator. It enables retention leaders, product managers, and financial analysts to model and compare alternative customer retention interventions under explicit, transparent assumptions.

---

## 1. Mathematical Formulas & Engine Logic

### 1.1 Input Parameters

| Parameter | Notation | Description |
| :--- | :---: | :--- |
| **Eligible Customer Count** | $N_{\text{eligible}}$ | Total size of customer segment targeted |
| **Campaign Budget** | $B$ | Maximum capital allocated to campaign ($) |
| **Contact Cost per Customer** | $c_{\text{contact}}$ | Direct outreach cost (SMS, phone, email, agent time) |
| **Discount Amount per Customer** | $d$ | Value of discount or incentive offered ($) |
| **Assumed Response Rate** | $r \in [0, 1]$ | Proportion of contacted customers who engage/accept |
| **Assumed Retention Uplift** | $\Delta u \in [0, 1]$ | Incremental probability of staying caused by campaign |
| **Revenue per Retained Customer** | $R_{\text{customer}}$ | Lifetime or period value of preserving a customer ($) |
| **Campaign Operational Capacity** | $C_{\text{capacity}}$ | Hard limit on reachable customers (e.g. agent capacity) |

---

### 1.2 Core Calculations

#### 1. Targeted Customers ($N_{\text{targeted}}$)
Calculates outreach volume constrained by budget and operational capacity:
$$c_{\text{target}} = c_{\text{contact}} + (r \times d)$$
$$N_{\text{budget\_max}} = \begin{cases} \lfloor B / c_{\text{target}} \rfloor, & \text{if } B > 0 \text{ and } c_{\text{target}} > 0 \\ N_{\text{eligible}}, & \text{otherwise} \end{cases}$$
$$N_{\text{targeted}} = \min(N_{\text{eligible}}, N_{\text{budget\_max}}, C_{\text{capacity}})$$

#### 2. Total Campaign Cost
$$\text{Cost}_{\text{contact}} = N_{\text{targeted}} \times c_{\text{contact}}$$
$$\text{Cost}_{\text{discount}} = N_{\text{targeted}} \times r \times d$$
$$\text{Total Cost} = \text{Cost}_{\text{contact}} + \text{Cost}_{\text{discount}}$$

#### 3. Expected Incremental Retained Customers ($N_{\text{retained}}$)
$$\mathbb{E}[N_{\text{retained}}] = N_{\text{targeted}} \times r \times \Delta u$$

#### 4. Expected Incremental Revenue
$$\mathbb{E}[\text{Revenue}_{\text{incremental}}] = \mathbb{E}[N_{\text{retained}}] \times R_{\text{customer}}$$

#### 5. Expected Net Financial Benefit
$$\mathbb{E}[\text{Net Benefit}] = \mathbb{E}[\text{Revenue}_{\text{incremental}}] - \text{Total Cost}$$

#### 6. Cost Per Incremental Retained Customer (CPIR)
$$\text{CPIR} = \frac{\text{Total Cost}}{\mathbb{E}[N_{\text{retained}}]}$$

#### 7. Break-Even Retention Uplift ($\Delta u_{\text{breakeven}}$)
The minimum causal retention uplift necessary for the campaign not to lose money:
$$\text{Setting } \mathbb{E}[\text{Net Benefit}] = 0 \implies \Delta u_{\text{breakeven}} = \frac{\text{Total Cost}}{N_{\text{targeted}} \times r \times R_{\text{customer}}}$$

---

## 2. Sensitivity Analysis

Every scenario automatically evaluates three cases:
1. **Conservative / Downside**: Uplift reduced by 25% ($\Delta u \times 0.75$)
2. **Base Case**: Stated user assumption ($\Delta u$)
3. **Optimistic / Upside**: Uplift increased by 25% ($\Delta u \times 1.25$)

---

## 3. Scientific & Methodological Limitations

> [!WARNING]
> **Correlation Is Not Causation**:
> Observational churn models detect patterns associated with customer departure, but do **not** prove that offering a discount or making a phone call will cause a customer to remain.

> [!IMPORTANT]
> **Always Run Randomized A/B Holdouts**:
> User-entered response rates and retention uplifts are assumptions. Before rolling out retention incentives across an entire customer base, run a controlled A/B test with an untreated holdout group to measure true incremental uplift.
