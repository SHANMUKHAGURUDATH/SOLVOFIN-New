import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Layers,
  Wrench,
  Bus,
  AlertTriangle,
  Flame,
  CornerDownLeft,
  Compass,
  MapPin,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RetrievedEvidenceItem {
  chunkId: string;
  documentTitle: string;
  organization: string;
  category: string;
  section: string;
  page?: string | number;
  similarityScore: number;
  text: string;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  time: string;
  retrievedEvidence?: RetrievedEvidenceItem[];
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "👋 Welcome to **SOLVOFIN AI Copilot**. I am connected to live telemetry from the Greater Visakhapatnam Municipal Corporation (GVMC) database, Google Maps Platform data, and ANITS Campus Transit Fleet. Ask me anything regarding active potholes, BOQ material estimates, bus routes, or Google Maps directions and places.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || input.trim();
    if (!q || loading) return;

    const userMsg: Message = {
      role: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Check if it's a maps/route/place query or standard copilot
      const isMapsQuery = /route|direction|hospital|depot|plant|where|how to go|distance|traffic/i.test(q);
      const endpoint = isMapsQuery ? '/api/maps/query' : '/api/copilot/query';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.answer,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            retrievedEvidence: data.retrieved_evidence || undefined,
          },
        ]);
      } else {
        throw new Error('Failed to query Copilot');
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Error processing query: ${err.message || 'Unable to connect to AI engine.'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'What are the critical potholes requiring immediate repair?',
    'What are the IRC:82 standards for pothole depth & repair SLA?',
    'What are the CIRT PERCLOS thresholds for bus driver fatigue?',
    'Route from ANITS Campus to Visakhapatnam Railway Station',
    'Calculate total asphalt & budget required for work orders',
    'What are the UNECE safety standards for bus handrails?',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-slideLeft">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-1.5 flex-wrap">
              SOLVOFIN AI Copilot
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-normal">
                GEMINI 3.8
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                RAG ACTIVE (SDG 11)
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">Grounded Municipal Reasoning Engine</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>

            <div
              className={`max-w-[88%] rounded-xl p-3.5 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 shadow-sm'
              }`}
            >
              <div className="markdown-body prose-invert prose-xs text-slate-200 leading-relaxed space-y-1.5">
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>

              {/* Retrieved Document Evidence Section */}
              {m.retrievedEvidence && m.retrievedEvidence.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-400 mb-1.5">
                    <BookOpen className="h-3 w-3 text-blue-400" />
                    <span>Authoritative Knowledge Evidence (SDG 11):</span>
                  </div>
                  <div className="space-y-1.5">
                    {m.retrievedEvidence.map((ev, eIdx) => (
                      <div
                        key={eIdx}
                        className="bg-slate-900/90 rounded-lg p-2 border border-slate-800 text-[10.5px] leading-snug"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-300 font-medium mb-1">
                          <span className="text-emerald-400 font-semibold truncate max-w-[220px]">
                            {ev.documentTitle}
                          </span>
                          <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                            {Math.round(ev.similarityScore * 100)}% match
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 font-mono mb-1">
                          {ev.organization} • {ev.section}{ev.page ? ` (p. ${ev.page})` : ''}
                        </p>
                        <p className="text-slate-300 italic text-[10px] line-clamp-2">
                          "{ev.text}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <span className="block text-[9px] font-mono text-slate-400/80 mt-2 text-right">
                {m.time}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 text-xs">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex items-center gap-2">
              <div className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
              <span>Querying Gemini 3.7 & cross-referencing live telemetry...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <p className="text-[10px] font-mono text-slate-400 mb-1.5 uppercase">Quick Telemetry Queries</p>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-2 py-1 text-[11px] text-slate-300 transition-colors text-left truncate max-w-full"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about potholes, work orders, bus routes..."
            className="flex-1 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold p-2 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
