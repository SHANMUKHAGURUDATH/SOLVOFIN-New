import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  X,
  Compass,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Database,
  ExternalLink,
  Layers,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  Car,
  Bus,
  Wrench,
  AlertOctagon,
  Eye,
  ChevronRight,
  Lock,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export interface NavigatorObservedItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  severityOrStatus?: string;
  location?: string;
  details?: string;
  rawData?: any;
}

export interface RetrievedEvidenceChunk {
  chunkId: string;
  documentTitle: string;
  organization: string;
  category: string;
  section: string;
  page?: string | number;
  source: string;
  url?: string;
  similarityScore: number;
  text: string;
}

export interface NavigatorRecommendedView {
  tabId: string;
  label: string;
  description: string;
  badge?: string;
}

export interface NavigatorResponseData {
  answer: string;
  toolUsed: string;
  role: string;
  observedData: NavigatorObservedItem[];
  retrievedEvidence: RetrievedEvidenceChunk[];
  aiInterpretation: string;
  recommendedNextView?: NavigatorRecommendedView;
  informationMissing?: string;
  safetyNotice?: string;
  limitationsNotice: string;
  executionTimestamp: string;
}

interface AINavigatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  onNavigateTab: (tabId: string) => void;
}

export const AINavigatorModal: React.FC<AINavigatorModalProps> = ({
  isOpen,
  onClose,
  userRole,
  onNavigateTab,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NavigatorResponseData | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch contextual suggestions on role change or open
  useEffect(() => {
    if (isOpen) {
      fetch(`/api/navigator/suggestions?role=${encodeURIComponent(userRole)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.suggestions) setSuggestions(data.suggestions);
        })
        .catch(() => {
          setSuggestions([
            'Show unresolved infrastructure issues',
            'Summarize recent incidents',
            'Explain this infrastructure AI recommendation',
            'What evidence supports this recommendation?',
            'Show driver-safety observations',
            'Which work orders relate to this defect?',
            'Summarize traffic bottlenecks',
            'Show the relevant SDG 11 context',
          ]);
        });

      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, userRole]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery || query).trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    if (overrideQuery) setQuery(overrideQuery);

    try {
      const res = await fetch('/api/navigator/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          role: userRole,
        }),
      });

      if (!res.ok) {
        throw new Error(`Navigator query failed with HTTP status ${res.status}`);
      }

      const data: NavigatorResponseData = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Unable to execute Navigator query. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectView = (tabId: string) => {
    onNavigateTab(tabId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="ai-navigator-overlay"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-10 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="ai-navigator-dialog"
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto transition-all animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Compass className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
                    Solvofin AI Navigator
                  </h2>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    READ-ONLY • EVIDENCE GROUNDED
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    ROLE: {userRole}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Global intelligent search across live municipal telemetry, road defects, incidents, and RAG standards.
                </p>
              </div>
            </div>

            <button
              id="close-ai-navigator-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Navigator (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Input Box */}
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              id="ai-navigator-input"
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder='Ask Solvofin... (e.g. "Show unresolved infrastructure issues", "Summarize recent incidents")'
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-11 pr-24 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 transition-all font-sans"
            />
            <button
              id="ai-navigator-submit-btn"
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="absolute right-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Searching</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] font-mono text-slate-500 shrink-0 uppercase tracking-wider">
              Suggestions:
            </span>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                id={`navigator-suggestion-${idx}`}
                onClick={() => handleSearch(s)}
                className="shrink-0 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-emerald-300 rounded-lg text-[11px] transition-colors flex items-center gap-1"
              >
                <span>{s}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body / Results */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[65vh] space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!result && !loading && (
            <div className="text-center py-10 px-4">
              <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-semibold text-slate-300">
                Ready to Navigate Solvofin Telemetry
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Enter a question or click a suggestion above to search active incidents, detected road defects, driver safety observations, BOQ work orders, and civil engineering standards.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-2xl mx-auto mt-6 text-left">
                <div
                  onClick={() => handleSearch('Show unresolved infrastructure issues')}
                  className="p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Infrastructure</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Search detected potholes, cracks, and road repairs.
                  </p>
                </div>
                <div
                  onClick={() => handleSearch('Summarize recent incidents')}
                  className="p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-1">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Incidents</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Retrieve active transit accidents and hazard alerts.
                  </p>
                </div>
                <div
                  onClick={() => handleSearch('Show the relevant SDG 11 context')}
                  className="p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Standards & RAG</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Inspect IRC:82, MoRTH, AIS-140, and SDG 11 guidelines.
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-slate-400">
                Querying allowlisted database functions & retrieving RAG evidence...
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Tool Execution Badge & Safety Flag */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">TOOL:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {result.toolUsed}
                  </span>
                  <span className="text-slate-500 ml-2">DATA ACCESS:</span>
                  <span className="text-slate-300">READ-ONLY APPROVED</span>
                </div>
                <div className="text-slate-500 text-[10px]">
                  {new Date(result.executionTimestamp).toLocaleTimeString()}
                </div>
              </div>

              {/* Safety Refusal Notice if applicable */}
              {result.safetyNotice && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
                  <Lock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <strong className="font-semibold block mb-0.5">Read-Only Safety Guard:</strong>
                    <span>{result.safetyNotice}</span>
                  </div>
                </div>
              )}

              {/* SECTION 1: SYNTHESIS ANSWER */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Answer</span>
                </div>
                <div className="text-sm text-slate-200 leading-relaxed space-y-2 prose prose-invert max-w-none">
                  <ReactMarkdown>{result.answer}</ReactMarkdown>
                </div>
              </div>

              {/* SECTION 2: OBSERVED SOLVOFIN DATA */}
              {result.observedData && result.observedData.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                      <Database className="w-4 h-4" />
                      <span>Observed Solvofin Data ({result.observedData.length} records)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      DIRECT SENSOR & DATABASE RECORDS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {result.observedData.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {item.type}
                            </span>
                            <h4 className="text-xs font-bold text-white mt-1.5">{item.title}</h4>
                          </div>
                          {item.severityOrStatus && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                item.severityOrStatus === 'CRITICAL' || item.severityOrStatus === 'HIGH'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  : item.severityOrStatus === 'COMPLETED' || item.severityOrStatus === 'RESOLVED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {item.severityOrStatus}
                            </span>
                          )}
                        </div>
                        {item.subtitle && (
                          <p className="text-[11px] text-slate-400 mt-1 font-sans">{item.subtitle}</p>
                        )}
                        {item.location && (
                          <p className="text-[10px] text-slate-500 font-mono mt-1">
                            📍 {item.location}
                          </p>
                        )}
                        {item.details && (
                          <p className="text-[11px] text-slate-300 mt-1.5 pt-1.5 border-t border-slate-800/80">
                            {item.details}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: RETRIEVED KNOWLEDGE-BASE EVIDENCE */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                    <BookOpen className="w-4 h-4" />
                    <span>
                      Retrieved Knowledge-Base Evidence (
                      {result.retrievedEvidence ? result.retrievedEvidence.length : 0})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    AUTHORITATIVE CIVIL & TRANSIT REPOSITORY
                  </span>
                </div>

                {result.retrievedEvidence && result.retrievedEvidence.length > 0 ? (
                  <div className="space-y-2">
                    {result.retrievedEvidence.map((chunk, cIdx) => (
                      <div
                        key={chunk.chunkId || cIdx}
                        className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                          <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                              {chunk.organization}
                            </span>
                            <span>{chunk.documentTitle}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {chunk.section} {chunk.page ? `• Page/Clause ${chunk.page}` : ''}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed italic bg-slate-900/60 p-2 rounded border border-slate-800">
                          "{chunk.text}"
                        </p>
                        {chunk.url && (
                          <div className="mt-1.5 text-[10px] text-slate-400">
                            Source Reference:{' '}
                            <span className="text-emerald-400 font-mono">{chunk.url}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 italic">
                    No relevant knowledge-base evidence was retrieved for this question.
                  </div>
                )}
              </div>

              {/* SECTION 4: AI INTERPRETATION */}
              {result.aiInterpretation && (
                <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-300 font-mono font-bold uppercase tracking-wider text-[11px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Interpretation & Context</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">{result.aiInterpretation}</p>
                </div>
              )}

              {/* SECTION 5: RECOMMENDED NEXT VIEW (RAPID NAVIGATION) */}
              {result.recommendedNextView && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 font-mono">
                      <Compass className="w-4 h-4" />
                      <span>Recommended View: {result.recommendedNextView.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans">
                      {result.recommendedNextView.description}
                    </p>
                  </div>
                  <button
                    id="navigator-jump-view-btn"
                    onClick={() => handleSelectView(result.recommendedNextView!.tabId)}
                    className="shrink-0 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>Jump to {result.recommendedNextView.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* SECTION 6: INFORMATION MISSING / SENSING BOUNDARIES */}
              {result.informationMissing && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                  <Eye className="w-3.5 h-3.5 shrink-0 text-slate-500 mt-0.5" />
                  <div>
                    <strong className="text-slate-300">Information Boundary: </strong>
                    <span>{result.informationMissing}</span>
                  </div>
                </div>
              )}

              {/* SECTION 7: MANDATORY LIMITATION NOTICE */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-500 text-center font-sans">
                {result.limitationsNotice}
              </div>
            </div>
          )}
        </div>

        {/* Footer info & shortcut hint */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 text-[10px]">
              Esc
            </kbd>
            <span>to close</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Audit Logging Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
