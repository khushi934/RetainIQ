import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { AssistantAnswer } from '../types';

export const AIAssistantPage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState<Array<{ role: 'user' | 'assistant'; content: string; meta?: AssistantAnswer }>>([
    {
      role: 'assistant',
      content: "Hello. I am the **RetainIQ Analyst**. I explain verified customer retention metrics, evaluate machine learning model outputs, and analyze Decision Lab scenarios strictly from database facts. How can I assist your investigation?"
    }
  ]);
  const [loading, setLoading] = useState(false);

  const sampleQuestions = [
    "Which customer segment has the highest observed churn rate?",
    "What factors are associated with churn in this dataset?",
    "Explain the latest model evaluation metrics.",
    "Compare our retention strategies in Decision Lab.",
    "Summarize this retention report for leadership."
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
        <h1 className="text-[26px] font-semibold text-[#20242C] tracking-tight">
          AI Analyst
        </h1>
        <p className="text-[14px] text-[#697386] mt-1">
          Evidence-grounded natural language query engine bounded by verified MySQL metrics.
        </p>
      </div>

      {/* Suggested Queries */}
      <div className="flex flex-wrap gap-2">
        {sampleQuestions.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sq)}
            disabled={loading}
            className="text-[12px] bg-white border border-[#E6E8EC] hover:border-[#697386] text-[#20242C] font-medium px-3 py-1.5 rounded-md transition-colors shadow-card"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Thread */}
      <div className="bg-white border border-[#E6E8EC] rounded-lg p-5 flex flex-col min-h-[480px] justify-between">
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
          {chatLog.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-4 text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#315E81] text-white'
                    : 'bg-[#F7F8FA] border border-[#E6E8EC] text-[#20242C]'
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>

                {msg.meta && msg.meta.limitations && (
                  <div className="mt-3 pt-3 border-t border-[#E6E8EC] text-[11px] text-[#697386] space-y-0.5">
                    <span className="font-medium text-[#20242C] block">Verification Footnotes:</span>
                    {msg.meta.limitations.map((lim, lIdx) => (
                      <p key={lIdx}>&bull; {lim}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-[12px] text-[#697386] p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-lg max-w-sm">
              <div className="w-3.5 h-3.5 border-2 border-[#E6E8EC] border-t-[#315E81] rounded-full animate-spin"></div>
              <span>Querying verified database context...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-4 pt-3 border-t border-[#E6E8EC] flex gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a retention intelligence question (e.g. Compare our retention strategies)..."
            className="flex-1 h-10 px-3 border border-[#E6E8EC] rounded-md text-[13px] text-[#20242C] focus:outline-none focus:border-[#315E81]"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="h-10 px-4 bg-[#315E81] hover:bg-[#274b68] disabled:opacity-40 text-white rounded-md text-[13px] font-medium transition-colors shadow-card flex items-center space-x-1.5"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
