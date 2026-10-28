import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Send,
  ShieldCheck,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Database,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { AssistantAnswer } from '../types';

export const AIAssistantPage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState<Array<{ role: 'user' | 'assistant'; content: string; meta?: AssistantAnswer }>>([
    {
      role: 'assistant',
      content: "Hello! I am **RetainIQ Analyst**. I can explain verified customer retention metrics, evaluate machine learning model outputs, and compare Decision Lab scenarios without hallucinating or inventing data. How can I help you investigate today?"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [expandedContextIndex, setExpandedContextIndex] = useState<number | null>(null);

  const sampleQuestions = [
    "Which customer segment has the highest observed churn rate?",
    "What factors are associated with churn in this dataset?",
    "Explain the latest model evaluation metrics.",
    "Compare our retention strategies in Decision Lab.",
    "Summarize this retention report for a non-technical manager."
  ];

  const handleSend = async (qText?: string) => {
    const textToSend = qText || question;
    if (!textToSend.trim() || loading) return;

    const userMessage = textToSend.trim();
    setChatLog(prev => [...prev, { role: 'user', content: userMessage }]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await api.askAssistant(userMessage);
      setChatLog(prev => [
        ...prev,
        { role: 'assistant', content: res.answer, meta: res }
      ]);
    } catch (err: any) {
      setChatLog(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Unable to process query: ${err.message || 'Check backend connection.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wide">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Evidence-Grounded Intelligence</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-1">
          RetainIQ Analyst
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Asks questions against real MySQL analytics &bull; Strictly grounded &bull; No code execution or fabricated metrics
        </p>
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex flex-wrap gap-2">
        {sampleQuestions.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sq)}
            disabled={loading}
            className="text-xs bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-medium px-3 py-1.5 rounded-full transition-colors shadow-2xs"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Thread */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col min-h-[460px] justify-between">
        <div className="space-y-5 overflow-y-auto max-h-[520px] pr-2">
          {chatLog.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'bg-slate-50 border border-slate-200 text-slate-800'
                }`}
              >
                {/* Assistant header tag */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                    <span className="font-bold text-[11px] text-slate-900 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>RetainIQ Analyst</span>
                    </span>
                    {msg.meta && (
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        {msg.meta.source_type === 'verified_backend_analytics' ? 'Verified Backend SQL' : 'Grounded LLM Response'}
                      </span>
                    )}
                  </div>
                )}

                <div className="prose prose-xs text-slate-800 max-w-none space-y-2 whitespace-pre-line">
                  {msg.content}
                </div>

                {/* Grounded Navigation Links */}
                {msg.meta && msg.meta.related_links && msg.meta.related_links.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap gap-2">
                    <span className="text-[10px] font-semibold text-slate-500 self-center">Explore Views:</span>
                    {msg.meta.related_links.map((link, lIdx) => (
                      <Link
                        key={lIdx}
                        to={link.url}
                        className="inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
                      >
                        <span>{link.label}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    ))}
                  </div>
                )}

                {/* Verified MySQL Evidence Drawer Toggle */}
                {msg.meta && msg.meta.verified_data && (
                  <div className="mt-3">
                    <button
                      onClick={() => setExpandedContextIndex(expandedContextIndex === idx ? null : idx)}
                      className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                    >
                      <Database className="w-3 h-3 text-blue-600" />
                      <span>{expandedContextIndex === idx ? 'Hide Verified MySQL Ground Truth' : 'Inspect Verified MySQL Ground Truth'}</span>
                      {expandedContextIndex === idx ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {expandedContextIndex === idx && (
                      <pre className="mt-2 p-3 bg-slate-900 text-slate-200 rounded font-mono text-[10px] overflow-x-auto max-h-48 border border-slate-800">
                        {JSON.stringify(msg.meta.verified_data, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 p-2">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
              <span>Querying verified MySQL database metrics...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about segments, churn drivers, model evaluation, or strategy trade-offs..."
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
