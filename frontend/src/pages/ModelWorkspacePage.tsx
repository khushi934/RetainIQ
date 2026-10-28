import React, { useEffect, useState } from 'react';
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  BarChart2,
  Info,
  ShieldCheck,
  ChevronRight
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
import { ModelVersion } from '../types';

export const ModelWorkspacePage: React.FC = () => {
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelVersion | null>(null);
  const [algorithm, setAlgorithm] = useState<'random_forest' | 'logistic_regression'>('random_forest');
  const [testSize, setTestSize] = useState(0.2);
  const [training, setTraining] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModels();
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

  const handleTrainModel = async () => {
    setTraining(true);
    setError(null);
    setMessage(null);
    try {
      const newModel = await api.trainModel(algorithm, testSize);
      setModels([newModel, ...models]);
      setSelectedModel(newModel);
      setMessage(`Trained and evaluated model ${newModel.version_code} successfully!`);
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
    } catch (err: any) {
      setError(err.message || 'Scoring batch failed.');
    } finally {
      setScoring(false);
    }
  };

  const featureChartData = selectedModel?.feature_importances
    ? Object.entries(selectedModel.feature_importances)
        .slice(0, 10)
        .map(([feature, importance]) => ({
          feature: feature.replace(/_/g, ' '),
          importance: Math.round(importance * 1000) / 10,
        }))
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Churn Predictive Modeling Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Genuine Scikit-learn pipelines &bull; Strict train/test separation &bull; Feature importances &bull; Joblib storage
          </p>
        </div>

        {selectedModel && (
          <button
            onClick={handleRunPredictions}
            disabled={scoring}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors self-start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{scoring ? 'Scoring Customers...' : 'Score All Customers in MySQL'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{message}</span>
        </div>
      )}

      {/* Model Training & Configuration Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center space-x-1.5">
          <Brain className="w-4 h-4 text-indigo-600" />
          <span>Train a Model Version</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Classifier Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e: any) => setAlgorithm(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white focus:outline-none"
            >
              <option value="random_forest">Random Forest Classifier (Balanced)</option>
              <option value="logistic_regression">Logistic Regression (L2 Regularized)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Holdout Evaluation Split
            </label>
            <select
              value={testSize}
              onChange={(e) => setTestSize(parseFloat(e.target.value))}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white focus:outline-none"
            >
              <option value={0.20}>80% Train / 20% Holdout Test</option>
              <option value={0.30}>70% Train / 30% Holdout Test</option>
            </select>
          </div>

          <button
            onClick={handleTrainModel}
            disabled={training}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{training ? 'Fitting Preprocessor & Trees...' : 'Fit & Evaluate Model'}</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mt-2">
          Note: Preprocessing (imputation and one-hot encoding) is fitted strictly on training data to prevent information leakage.
        </p>
      </div>

      {/* Model Version Inspector */}
      {selectedModel ? (
        <div className="space-y-6">
          {/* Version Header Pill */}
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-600">
            <span>Model Version:</span>
            <div className="flex items-center space-x-1.5">
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                    selectedModel.id === m.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {m.version_code} &bull; {m.algorithm_name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 border border-slate-200 rounded-lg shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                ROC-AUC Score
              </span>
              <span className="text-xl font-extrabold text-indigo-700 mt-1 block">
                {selectedModel.evaluation_metrics.roc_auc.toFixed(3)}
              </span>
              <span className="text-[10px] text-slate-400">Class separation power</span>
            </div>

            <div className="bg-white p-3.5 border border-slate-200 rounded-lg shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                F1 Score
              </span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {selectedModel.evaluation_metrics.f1_score.toFixed(3)}
              </span>
              <span className="text-[10px] text-slate-400">Harmonic precision/recall</span>
            </div>

            <div className="bg-white p-3.5 border border-slate-200 rounded-lg shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                Precision
              </span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {(selectedModel.evaluation_metrics.precision * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400">True churners / flagged</span>
            </div>

            <div className="bg-white p-3.5 border border-slate-200 rounded-lg shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                Recall
              </span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {(selectedModel.evaluation_metrics.recall * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400">Captured of all churners</span>
            </div>

            <div className="bg-white p-3.5 border border-slate-200 rounded-lg shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                Baseline Rate
              </span>
              <span className="text-xl font-bold text-slate-700 mt-1 block">
                {(selectedModel.evaluation_metrics.baseline_churn_rate * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400">Random dummy model</span>
            </div>
          </div>

          {/* Grid: Confusion Matrix & Feature Importances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Holdout Test Confusion Matrix
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedModel.test_sample_size} unseen test samples
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Evaluates how accurately the classifier distinguishes between churned and retained customers on holdout data.
              </p>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-lg">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                    True Negatives (TN)
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-900 mt-1 block">
                    {selectedModel.evaluation_metrics.confusion_matrix.true_negatives}
                  </span>
                  <span className="text-[11px] text-emerald-700 mt-0.5 block">
                    Correctly classified as Active
                  </span>
                </div>

                <div className="p-4 bg-amber-50/60 border border-amber-200/60 rounded-lg">
                  <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
                    False Positives (FP)
                  </span>
                  <span className="text-2xl font-extrabold text-amber-900 mt-1 block">
                    {selectedModel.evaluation_metrics.confusion_matrix.false_positives}
                  </span>
                  <span className="text-[11px] text-amber-700 mt-0.5 block">
                    Active falsely flagged as Churn
                  </span>
                </div>

                <div className="p-4 bg-rose-50/60 border border-rose-200/60 rounded-lg">
                  <span className="text-[10px] text-rose-800 font-bold uppercase tracking-wider block">
                    False Negatives (FN)
                  </span>
                  <span className="text-2xl font-extrabold text-rose-900 mt-1 block">
                    {selectedModel.evaluation_metrics.confusion_matrix.false_negatives}
                  </span>
                  <span className="text-[11px] text-rose-700 mt-0.5 block">
                    Missed real churners
                  </span>
                </div>

                <div className="p-4 bg-indigo-50/60 border border-indigo-200/60 rounded-lg">
                  <span className="text-[10px] text-indigo-800 font-bold uppercase tracking-wider block">
                    True Positives (TP)
                  </span>
                  <span className="text-2xl font-extrabold text-indigo-900 mt-1 block">
                    {selectedModel.evaluation_metrics.confusion_matrix.true_positives}
                  </span>
                  <span className="text-[11px] text-indigo-700 mt-0.5 block">
                    Correctly identified churners
                  </span>
                </div>
              </div>
            </div>

            {/* Feature Importances Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Feature Importance Ranking
                </h3>
                <span className="text-xs text-slate-400">Relative Weight (%)</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Attributes most strongly predictive of churn in the Random Forest model.
              </p>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={featureChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#64748b" fontSize={10} unit="%" />
                    <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={11} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#0f172a', color: '#fff', fontSize: '11px', borderRadius: '6px' }}
                      formatter={(val: any) => [`${val}%`, 'Relative Importance']}
                    />
                    <Bar dataKey="importance" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400 text-xs">
          No models trained yet in this workspace. Click "Fit & Evaluate Model" above to train your first classifier.
        </div>
      )}
    </div>
  );
};
