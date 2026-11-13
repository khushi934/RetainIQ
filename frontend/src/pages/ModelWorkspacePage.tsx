import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Info,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { ModelVersion, Customer } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const ModelWorkspacePage: React.FC = () => {
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelVersion | null>(null);
  const [algorithm, setAlgorithm] = useState<'random_forest' | 'logistic_regression'>('random_forest');
  const [testSize, setTestSize] = useState(0.2);
  const [training, setTraining] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [sampleCustomers, setSampleCustomers] = useState<Customer[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModels();
    loadScoredCustomers();
  }, []);

  const loadModels = async () => {
    try {
      const list = await api.getModels();
      setModels(list);
      if (list.length > 0) {
        setSelectedModel(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadScoredCustomers = async () => {
    try {
      const res = await api.getCustomers({ page: 1, page_size: 6, sort_by: 'monthly_charges', sort_order: 'desc' });
      setSampleCustomers(res.items);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrainModel = async () => {
    setTraining(true);
    setError(null);
    setMessage(null);
    try {
      const newModel = await api.trainModel(algorithm, testSize);
      setModels([newModel, ...models]);
      setSelectedModel(newModel);
      setMessage(`Model ${newModel.version_code} trained and evaluated successfully.`);
      await loadScoredCustomers();
    } catch (err: any) {
      setError(err.message || 'Model training failed.');
    } finally {
      setTraining(false);
    }
  };

  const handleRunPredictions = async () => {
    if (!selectedModel) return;
    setScoring(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.runBatchPredictions(selectedModel.id);
      setMessage(res.message);
      await loadScoredCustomers();
    } catch (err: any) {
      setError(err.message || 'Scoring batch failed.');
    } finally {
      setScoring(false);
    }
  };

  const featureChartData = selectedModel?.feature_importances
    ? Object.entries(selectedModel.feature_importances)
        .slice(0, 8)
        .map(([feature, importance]) => ({
          feature: feature.replace(/_/g, ' '),
          importance: Math.round(importance * 1000) / 10,
        }))
    : [];

  return (
    <div className="space-y-7">
      {/* Page Header (Section 11) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[#20242C] tracking-tight">
            Churn Prediction
          </h1>
          <p className="text-[14px] text-[#697386] mt-1">
            Supervised machine learning pipelines trained on verified customer records with strict holdout evaluation.
          </p>
        </div>

        {selectedModel && (
          <button
            onClick={handleRunPredictions}
            disabled={scoring}
            className="px-4 py-2 bg-[#315E81] hover:bg-[#274b68] text-white rounded-md text-[13px] font-medium transition-colors flex items-center space-x-1.5 shadow-card self-start"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{scoring ? 'Scoring Accounts...' : 'Score All Customers in MySQL'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3.5 bg-[#FBF2F2] border border-[#F2D5D4] rounded-lg text-[13px] text-[#C75B58] flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="p-3.5 bg-[#F0F7F3] border border-[#D4EADB] rounded-lg text-[13px] text-[#3E8B69] flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{message}</span>
        </div>
      )}

      {/* Training Configuration Form */}
      <div className="bg-white border border-[#E6E8EC] rounded-lg p-5">
        <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-[#E6E8EC]">
          <Brain className="w-4 h-4 text-[#315E81]" />
          <h2 className="text-[14px] font-semibold text-[#20242C]">
            Model Training Configuration
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-[13px] font-medium text-[#20242C] mb-1.5">
              Classification Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e: any) => setAlgorithm(e.target.value)}
              className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] bg-white focus:outline-none focus:border-[#315E81]"
            >
              <option value="random_forest">Random Forest Classifier (Balanced)</option>
              <option value="logistic_regression">Logistic Regression (L2)</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#20242C] mb-1.5">
              Holdout Evaluation Split
            </label>
            <select
              value={testSize}
              onChange={(e) => setTestSize(parseFloat(e.target.value))}
              className="w-full h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] bg-white focus:outline-none focus:border-[#315E81]"
            >
              <option value={0.20}>80% Train / 20% Holdout Test</option>
              <option value={0.30}>70% Train / 30% Holdout Test</option>
            </select>
          </div>

          <button
            onClick={handleTrainModel}
            disabled={training}
            className="w-full h-10 px-4 bg-[#20242C] hover:bg-slate-800 text-white rounded-md text-[13px] font-medium flex items-center justify-center space-x-1.5 transition-colors shadow-card"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{training ? 'Training Model...' : 'Train Model Version'}</span>
          </button>
        </div>

        <p className="text-[12px] text-[#697386] mt-3">
          Leakage guard: Preprocessing pipelines are fitted solely on training splits. Post-event identifiers and future dates are strictly excluded.
        </p>
      </div>

      {/* Model Version Inspector */}
      {selectedModel ? (
        <div className="space-y-6">
          {/* Active Model Bar & Version Selector */}
          <div className="bg-white border border-[#E6E8EC] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="text-[13px] font-medium text-[#697386]">Model Version:</span>
              <div className="flex items-center space-x-1.5 flex-wrap">
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m)}
                    className={`px-2.5 py-1 rounded text-[12px] font-medium border transition-colors ${
                      selectedModel.id === m.id
                        ? 'bg-[#315E81] text-white border-[#315E81]'
                        : 'bg-white text-[#20242C] border-[#E6E8EC] hover:bg-[#F7F8FA]'
                    }`}
                  >
                    {m.version_code} &bull; {m.algorithm_name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[12px] text-[#697386]">
              Algorithm: <span className="font-medium text-[#20242C]">{selectedModel.algorithm_name}</span> &bull; Sample: {selectedModel.training_sample_size + selectedModel.test_sample_size} records
            </div>
          </div>

          {/* Metric Cards (Section 11) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white p-4 border border-[#E6E8EC] rounded-lg">
              <span className="text-[12px] font-medium text-[#697386] block">
                ROC-AUC
              </span>
              <span className="text-[26px] font-semibold text-[#315E81] tracking-tight mt-1 block font-mono">
                {selectedModel.evaluation_metrics.roc_auc.toFixed(3)}
              </span>
              <span className="text-[11px] text-[#697386]">Separation metric</span>
            </div>

            <div className="bg-white p-4 border border-[#E6E8EC] rounded-lg">
              <span className="text-[12px] font-medium text-[#697386] block">
                F1 Score
              </span>
              <span className="text-[26px] font-semibold text-[#20242C] tracking-tight mt-1 block font-mono">
                {selectedModel.evaluation_metrics.f1_score.toFixed(3)}
              </span>
              <span className="text-[11px] text-[#697386]">Harmonic mean</span>
            </div>

            <div className="bg-white p-4 border border-[#E6E8EC] rounded-lg">
              <span className="text-[12px] font-medium text-[#697386] block">
                Precision
              </span>
              <span className="text-[26px] font-semibold text-[#20242C] tracking-tight mt-1 block font-mono">
                {(selectedModel.evaluation_metrics.precision * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-[#697386]">True churn / flagged</span>
            </div>

            <div className="bg-white p-4 border border-[#E6E8EC] rounded-lg">
              <span className="text-[12px] font-medium text-[#697386] block">
                Recall
              </span>
              <span className="text-[26px] font-semibold text-[#20242C] tracking-tight mt-1 block font-mono">
                {(selectedModel.evaluation_metrics.recall * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-[#697386]">Captured churners</span>
            </div>

            <div className="bg-white p-4 border border-[#E6E8EC] rounded-lg">
              <span className="text-[12px] font-medium text-[#697386] block">
                Baseline Churn
              </span>
              <span className="text-[26px] font-semibold text-[#697386] tracking-tight mt-1 block font-mono">
                {(selectedModel.evaluation_metrics.baseline_churn_rate * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-[#697386]">Class prevalence</span>
            </div>
          </div>

          {/* Confusion Matrix & Feature Importances (Section 11) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix */}
            <div className="bg-white border border-[#E6E8EC] rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[15px] font-semibold text-[#20242C]">
                  Holdout Test Confusion Matrix
                </h3>
                <span className="text-[12px] text-[#697386] font-mono">
                  {selectedModel.test_sample_size} unseen test samples
                </span>
              </div>
              <p className="text-[12px] text-[#697386] mb-4">
                Classification outcomes on the independent 20% holdout test partition.
              </p>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-4 bg-[#F0F7F3] border border-[#D4EADB] rounded-md">
                  <span className="text-[11px] text-[#3E8B69] font-medium block">
                    True Negatives (TN)
                  </span>
                  <span className="text-[26px] font-semibold text-[#20242C] font-mono mt-0.5 block">
                    {selectedModel.evaluation_metrics.confusion_matrix.true_negatives}
                  </span>
                  <span className="text-[11px] text-[#697386] mt-0.5 block">
                    Correctly classified Active
                  </span>
                </div>

                <div className="p-4 bg-[#FDF7EE] border border-[#F7E4C4] rounded-md">
                  <span className="text-[11px] text-[#D69A37] font-medium block">
                    False Positives (FP)
                  </span>
                  <span className="text-[26px] font-semibold text-[#20242C] font-mono mt-0.5 block">
                    {selectedModel.evaluation_metrics.confusion_matrix.false_positives}
                  </span>
                  <span className="text-[11px] text-[#697386] mt-0.5 block">
                    Active flagged as Churn
                  </span>
                </div>

                <div className="p-4 bg-[#FBF2F2] border border-[#F2D5D4] rounded-md">
                  <span className="text-[11px] text-[#C75B58] font-medium block">
                    False Negatives (FN)
                  </span>
                  <span className="text-[26px] font-semibold text-[#20242C] font-mono mt-0.5 block">
                    {selectedModel.evaluation_metrics.confusion_matrix.false_negatives}
                  </span>
                  <span className="text-[11px] text-[#697386] mt-0.5 block">
                    Missed actual churners
                  </span>
                </div>

                <div className="p-4 bg-[#F0F5F9] border border-[#E6E8EC] rounded-md">
                  <span className="text-[11px] text-[#315E81] font-medium block">
                    True Positives (TP)
                  </span>
                  <span className="text-[26px] font-semibold text-[#20242C] font-mono mt-0.5 block">
                    {selectedModel.evaluation_metrics.confusion_matrix.true_positives}
                  </span>
                  <span className="text-[11px] text-[#697386] mt-0.5 block">
                    Correctly identified Churn
                  </span>
                </div>
              </div>
            </div>

            {/* Feature Importances Chart */}
            <div className="bg-white border border-[#E6E8EC] rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[15px] font-semibold text-[#20242C]">
                  Feature Importance Ranking
                </h3>
                <span className="text-[12px] text-[#697386]">Relative Weight (%)</span>
              </div>
              <p className="text-[12px] text-[#697386] mb-4">
                Relative statistical association of attributes with churn risk.
              </p>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={featureChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 70, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E6E8EC" />
                    <XAxis type="number" stroke="#697386" fontSize={11} unit="%" />
                    <YAxis dataKey="feature" type="category" stroke="#697386" fontSize={11} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#20242C', borderColor: '#20242C', color: '#FFFFFF', fontSize: '12px', borderRadius: '6px' }}
                      formatter={(val: any) => [`${val}%`, 'Relative Importance']}
                    />
                    <Bar dataKey="importance" fill="#315E81" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Customer Prediction Table (Section 11) */}
          <div className="bg-white border border-[#E6E8EC] rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[15px] font-semibold text-[#20242C]">
                  Customer Inference Samples
                </h3>
                <p className="text-[12px] text-[#697386] mt-0.5">
                  Distinguishes between model-predicted probability and historical observed churn status.
                </p>
              </div>
              <Link
                to="/app/customers"
                className="text-[13px] font-medium text-[#315E81] hover:underline flex items-center space-x-1"
              >
                <span>Full Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto border border-[#E6E8EC] rounded-md">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="data-table-header">Customer ID</th>
                    <th className="data-table-header">Contract</th>
                    <th className="data-table-header">Tenure</th>
                    <th className="data-table-header text-right">Monthly Charges</th>
                    <th className="data-table-header">Predicted Risk Tier</th>
                    <th className="data-table-header text-right">Predicted Churn Prob.</th>
                    <th className="data-table-header">Historical Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleCustomers.map((c) => (
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
                      <td className="data-table-cell">
                        <RiskBadge
                          tier={c.latest_prediction?.risk_tier}
                          probability={c.latest_prediction?.predicted_churn_probability}
                        />
                      </td>
                      <td className="data-table-cell text-right font-mono font-medium text-[#20242C]">
                        {c.latest_prediction?.predicted_churn_probability !== undefined
                          ? `${(c.latest_prediction.predicted_churn_probability * 100).toFixed(1)}%`
                          : 'Unscored'}
                      </td>
                      <td className="data-table-cell">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                          c.observed_churn
                            ? 'bg-[#FBF2F2] text-[#C75B58] border-[#F2D5D4]'
                            : 'bg-[#F0F7F3] text-[#3E8B69] border-[#D4EADB]'
                        }`}>
                          {c.observed_churn ? 'Historical Churn' : 'Active Account'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-14 text-center text-[#697386] text-[13px] bg-white border border-[#E6E8EC] rounded-lg">
          No trained model versions found. Click "Train Model Version" above to fit a classifier.
        </div>
      )}
    </div>
  );
};
