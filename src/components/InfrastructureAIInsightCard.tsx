import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  UserCheck,
  Info,
  Clock,
  MapPin,
  Cpu,
  Bus,
  Check,
  X,
  Edit3,
  RefreshCw,
  History,
  Scale,
  Lock,
  Eye,
  AlertCircle,
} from 'lucide-react';
import {
  InfrastructureAIInsight,
  HumanReviewStatus,
  RiskInterpretationLevel,
  HumanReviewRecord,
} from '../../server/infrastructureAITypes';

interface InfrastructureAIInsightCardProps {
  insight: InfrastructureAIInsight | null;
  isLoading?: boolean;
  onRefreshInsight?: () => void;
  onReviewSubmit?: (
    status: HumanReviewStatus,
    comments: string,
    modifiedRecommendation?: string
  ) => Promise<void>;
  reviewerIdentity?: string;
  reviewerRole?: string;
}

export const InfrastructureAIInsightCard: React.FC<InfrastructureAIInsightCardProps> = ({
  insight,
  isLoading = false,
  onRefreshInsight,
  onReviewSubmit,
  reviewerIdentity = 'Authenticated Session Unavailable',
  reviewerRole = 'AUTHORITY',
}) => {
  const [isWhyExpanded, setIsWhyExpanded] = useState<boolean>(true);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);
  const [isLimitationsExpanded, setIsLimitationsExpanded] = useState<boolean>(false);
  const [isResponsibleAiExpanded, setIsResponsibleAiExpanded] = useState<boolean>(false);

  // Human Review Form State
  const [selectedDecision, setSelectedDecision] = useState<'ACCEPTED' | 'MODIFIED' | 'REJECTED'>(
    insight?.humanReview.status === 'MODIFIED'
      ? 'MODIFIED'
      : insight?.humanReview.status === 'REJECTED'
      ? 'REJECTED'
      : 'ACCEPTED'
  );
  const [reviewerComment, setReviewerComment] = useState<string>(
    insight?.humanReview.reviewerComments || ''
  );
  const [modifiedRec, setModifiedRec] = useState<string>(
    insight?.humanReview.modifiedRecommendation || ''
  );
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div id="ai-infrastructure-insight-loading" className="bg-[#0F172A] border border-cyan-500/30 rounded-lg p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              GENERATING INFRASTRUCTURE AI INSIGHT...
            </span>
          </div>
          <span className="text-xs font-mono text-cyan-400">RAG Semantic Retrieval & Grounding</span>
        </div>
        <div className="space-y-2 py-4">
          <div className="h-4 bg-slate-800/60 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-slate-800/40 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-slate-800/30 rounded animate-pulse w-5/6" />
        </div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div id="ai-infrastructure-insight-empty" className="bg-[#0F172A] border border-slate-800 rounded-lg p-6 text-center space-y-3">
        <Sparkles className="h-6 w-6 text-slate-500 mx-auto" />
        <p className="text-xs font-mono text-slate-400">
          Select a detected defect or run an infrastructure scan above to generate evidence-grounded AI intelligence.
        </p>
        {onRefreshInsight && (
          <button
            type="button"
            id="btn-trigger-ai-insight"
            onClick={onRefreshInsight}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Generate AI Insight on Current Detection
          </button>
        )}
      </div>
    );
  }

  const getRiskBadge = (level: RiskInterpretationLevel) => {
    switch (level) {
      case 'HIGH':
        return {
          label: 'HIGH RISK',
          classes: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          icon: ShieldAlert,
        };
      case 'MODERATE':
        return {
          label: 'MODERATE RISK',
          classes: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: AlertTriangle,
        };
      case 'LOW':
        return {
          label: 'LOW RISK',
          classes: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: ShieldCheck,
        };
      case 'UNABLE_TO_DETERMINE':
      default:
        return {
          label: 'UNABLE TO DETERMINE',
          classes: 'bg-slate-800 border-slate-700 text-slate-400',
          icon: HelpCircle,
        };
    }
  };

  const getReviewBadge = (status: HumanReviewStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return {
          label: 'ACCEPTED',
          classes: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: CheckCircle2,
        };
      case 'MODIFIED':
        return {
          label: 'MODIFIED',
          classes: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
          icon: Edit3,
        };
      case 'REJECTED':
        return {
          label: 'REJECTED',
          classes: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          icon: X,
        };
      case 'PENDING':
      default:
        return {
          label: 'PENDING',
          classes: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: Clock,
        };
    }
  };

  const riskBadge = getRiskBadge(insight.riskInterpretation.level);
  const RiskIcon = riskBadge.icon;
  const currentReviewBadge = getReviewBadge(insight.humanReview.status);
  const ReviewStatusIcon = currentReviewBadge.icon;

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onReviewSubmit) return;
    setIsSubmittingReview(true);
    try {
      await onReviewSubmit(
        selectedDecision,
        reviewerComment,
        selectedDecision === 'MODIFIED' ? modifiedRec : undefined
      );
      setReviewSuccessMsg(`Review recorded as ${selectedDecision} by ${reviewerIdentity}.`);
      setTimeout(() => setReviewSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Review submit error:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div
      id="ai-infrastructure-insight-card"
      className="bg-[#0F172A] border border-cyan-500/40 rounded-lg p-5 sm:p-6 space-y-6 shadow-2xl transition-all"
    >
      {/* 1. Header with Distinctive SDG 11 & Decision Support Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-tight font-mono">
                AI Infrastructure Insight
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                SDG 11.2 DECISION SUPPORT
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                HUMAN-IN-THE-LOOP (PART 4)
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Decision-support intelligence consuming computer vision detection — AI recommendations require human sign-off
            </p>
          </div>
        </div>

        {/* Quick Actions & Insight Timestamp */}
        <div className="flex items-center gap-2">
          {onRefreshInsight && (
            <button
              type="button"
              id="btn-refresh-insight-card"
              onClick={onRefreshInsight}
              title="Re-run Grounded AI Reasoning"
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3 text-cyan-400" />
            {new Date(insight.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* 2. Key Diagnostic Parameters: Existing CV vs Grounded Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        {/* Detected Issue (from existing CV) */}
        <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 block uppercase">Detected Issue (CV)</span>
          <span className="text-white font-bold text-xs line-clamp-1" title={insight.inputSummary.detectedIssue}>
            {insight.inputSummary.detectedIssue}
          </span>
          <span className="text-[10px] text-slate-400 block">Category: {insight.inputSummary.componentCategory}</span>
        </div>

        {/* Location (from existing CV / GPS) */}
        <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 block uppercase">Location</span>
          <span className="text-slate-200 font-semibold text-xs flex items-center gap-1">
            <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
            <span className="truncate">{insight.inputSummary.locationText}</span>
          </span>
          {insight.inputSummary.busNumber && (
            <span className="text-[10px] text-slate-400 block">Vehicle: {insight.inputSummary.busNumber}</span>
          )}
        </div>

        {/* Detection Confidence (Strict Non-Fabrication Rule) */}
        <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 block uppercase">Detection Confidence</span>
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span
              className={`font-bold text-xs ${
                insight.inputSummary.rawConfidence !== null ? 'text-white' : 'text-slate-400 italic'
              }`}
            >
              {insight.inputSummary.confidenceText}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            {insight.inputSummary.rawConfidence !== null ? 'Optical Model Confidence' : 'Confidence unavailable'}
          </span>
        </div>

        {/* Risk Interpretation (AI-Assisted Qualitative Evaluation) */}
        <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 block uppercase">Risk Interpretation</span>
          <div className="flex items-center gap-1.5">
            <RiskIcon className="h-3.5 w-3.5 shrink-0" />
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${riskBadge.classes}`}>
              {riskBadge.label}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block truncate" title={insight.riskInterpretation.rationale}>
            {insight.riskInterpretation.rationale}
          </span>
        </div>
      </div>

      {/* 3. Live Solvofin Context Enrichment Banner */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded p-3 text-xs font-mono space-y-1.5">
        <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase border-b border-slate-800 pb-1">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Bus className="h-3.5 w-3.5" /> Correlated Operational Telemetry (Live Solvofin Data)
          </span>
          <span>{insight.contextEnrichment.corridorInformation}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
          <div className="text-slate-300">
            <span className="text-slate-400">Work Orders: </span>
            <span>{insight.contextEnrichment.openWorkOrderDetails}</span>
          </div>
          <div className="text-slate-300">
            <span className="text-slate-400">Corridor Status: </span>
            <span>{insight.contextEnrichment.trafficBottleneck}</span>
          </div>
        </div>
      </div>

      {/* 4. "Why This Result?" Explainability Section (Strict 6-Part Structure) */}
      <div id="ai-why-this-result-section" className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50">
        <button
          type="button"
          id="btn-toggle-why-this-result"
          onClick={() => setIsWhyExpanded(!isWhyExpanded)}
          className="w-full flex items-center justify-between p-3.5 text-left bg-slate-900/80 hover:bg-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              "Why This Result?" Explainability
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>{isWhyExpanded ? 'Collapse' : 'Expand 6-Part Rationale'}</span>
            {isWhyExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {isWhyExpanded && (
          <div className="p-4 space-y-4 text-xs font-mono border-t border-slate-800 text-slate-300 leading-relaxed">
            <p className="text-slate-200">{insight.whyThisResult.summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* 1. WHAT THE CV SYSTEM DETECTED */}
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1">
                <span className="text-[10px] text-cyan-400 font-bold uppercase block">
                  1. WHAT THE CV SYSTEM DETECTED
                </span>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {insight.whyThisResult.observableCvCharacteristics}
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Confidence: <span className="text-white font-bold">{insight.inputSummary.confidenceText}</span>
                  {insight.inputSummary.bbox && (
                    <span className="block text-slate-500">BBox: [{insight.inputSummary.bbox.join(', ')}]</span>
                  )}
                </div>
              </div>

              {/* 2. WHAT DATA WAS AVAILABLE */}
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1">
                <span className="text-[10px] text-cyan-400 font-bold uppercase block">
                  2. WHAT DATA WAS AVAILABLE
                </span>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {insight.whyThisResult.contextualFactors}
                </p>
                <div className="text-[10px] text-slate-400 pt-1 space-y-0.5">
                  <div>GPS: {insight.contextEnrichment.dataAvailability.hasGps ? 'Available' : 'Unavailable'}</div>
                  <div>Fleet: {insight.contextEnrichment.dataAvailability.hasFleetTelemetry ? 'Linked' : 'Unavailable'}</div>
                </div>
              </div>

              {/* 3. WHAT KNOWLEDGE WAS RETRIEVED */}
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1">
                <span className="text-[10px] text-cyan-400 font-bold uppercase block">
                  3. WHAT KNOWLEDGE WAS RETRIEVED
                </span>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {insight.hasEvidence
                    ? `${insight.retrievedEvidence.length} document chunk(s) matched from regulatory and engineering knowledge base.`
                    : 'No relevant knowledge-base evidence was retrieved for this case.'}
                </p>
                <span className="text-[10px] text-slate-400 block pt-1">
                  {insight.whyThisResult.evidenceCorrelation}
                </span>
              </div>

              {/* 4. WHAT THE AI INTERPRETED */}
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1">
                <span className="text-[10px] text-cyan-400 font-bold uppercase block">
                  4. WHAT THE AI INTERPRETED
                </span>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${riskBadge.classes}`}>
                    {riskBadge.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug pt-1">
                  {insight.riskInterpretation.rationale}
                </p>
              </div>

              {/* 5. WHAT THE AI RECOMMENDED */}
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1">
                <span className="text-[10px] text-cyan-400 font-bold uppercase block">
                  5. WHAT THE AI RECOMMENDED
                </span>
                <strong className="text-white text-xs block">{insight.recommendedAction.title}</strong>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {insight.recommendedAction.actionText}
                </p>
                <span className="text-[10px] text-cyan-300 block pt-0.5">
                  Urgency: {insight.recommendedAction.urgencyText}
                </span>
              </div>

              {/* 6. WHAT A HUMAN REVIEWER DECIDED */}
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1">
                <span className="text-[10px] text-amber-400 font-bold uppercase block">
                  6. WHAT A HUMAN REVIEWER DECIDED
                </span>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <ReviewStatusIcon className="h-3 w-3 text-cyan-400" />
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${currentReviewBadge.classes}`}>
                    {currentReviewBadge.label}
                  </span>
                </div>
                {insight.humanReview.reviewedAt ? (
                  <div className="text-[11px] text-slate-300 pt-1 space-y-1">
                    <div>Reviewer: <strong className="text-white">{insight.humanReview.reviewedBy}</strong></div>
                    {insight.humanReview.reviewerComments && (
                      <div className="text-slate-300 italic">"{insight.humanReview.reviewerComments}"</div>
                    )}
                    {insight.humanReview.status === 'MODIFIED' && insight.humanReview.modifiedRecommendation && (
                      <div className="text-cyan-300 text-[10px]">
                        Human Directive: {insight.humanReview.modifiedRecommendation}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic pt-1">
                    Pending human review. Consequential maintenance or enforcement actions remain held until an authorized engineer evaluates this advisory.
                  </p>
                )}
              </div>
            </div>

            {/* Factors Evaluated by Reasoning Layer */}
            <div className="pt-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Evaluated Contributing Factors:
              </span>
              <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                {insight.riskInterpretation.factorsConsidered.map((factor, idx) => (
                  <li key={idx}>
                    <span className="text-slate-300">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 5. Relevant Retrieved Evidence (Evidence Provenance & Regulatory Safety) */}
      <div id="ai-rag-evidence-section" className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-xs font-mono text-slate-400 font-bold uppercase flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-cyan-400" /> Retrieved Evidence (Authoritative Knowledge Base)
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {insight.hasEvidence ? `${insight.retrievedEvidence.length} Document Chunk(s) Considered` : '0 Chunks Matched'}
          </span>
        </div>

        {/* Regulatory Language Safety Banner */}
        <div className="bg-slate-900/40 border border-slate-800 rounded p-2 text-[10px] font-mono text-slate-400 flex items-center gap-2">
          <Scale className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span>
            <strong>Regulatory Safety Notice:</strong> Retrieved regulatory or standards documents are knowledge sources for decision support. They are not automatic proof of compliance. Human verification required.
          </span>
        </div>

        {insight.hasEvidence ? (
          <div className="space-y-2">
            {insight.retrievedEvidence.map((chunk, idx) => (
              <div
                key={chunk.chunkId || idx}
                className="bg-slate-900/90 border border-slate-800 rounded p-3 space-y-2 font-mono text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-400">Source:</span>
                    <strong className="text-white text-xs">{chunk.documentTitle}</strong>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {chunk.organization}
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-bold">
                    Relevance: {(chunk.similarityScore * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>
                    <span>Section: </span>
                    <strong className="text-slate-300">{chunk.section}</strong>
                  </div>
                  {chunk.page && (
                    <div>
                      <span>Page / Clause: </span>
                      <strong className="text-slate-300">{chunk.page}</strong>
                    </div>
                  )}
                </div>

                {chunk.url && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>Official URL: </span>
                    <a
                      href={chunk.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-0.5 truncate"
                    >
                      {chunk.url} <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  </div>
                )}

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Retrieved Guidance:
                  </span>
                  <p className="text-[11px] text-slate-300 italic bg-slate-950/60 p-2.5 rounded border border-slate-800/80 leading-relaxed">
                    "{chunk.text}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded text-xs font-mono text-slate-400 flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-500 shrink-0" />
            <span>No relevant knowledge-base evidence was retrieved for this case.</span>
          </div>
        )}
      </div>

      {/* 6. AI-Assisted Recommendation Banner (Strictly Decision-Support, Never Autonomous) */}
      <div id="ai-recommendation-display" className="p-4 bg-cyan-950/25 border border-cyan-500/30 rounded-lg space-y-2 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase">
            <UserCheck className="h-4 w-4" /> AI Recommendation (Decision Support)
          </div>
          <span className="text-[10px] text-cyan-300 bg-cyan-900/40 px-2 py-0.5 rounded border border-cyan-700/40">
            {insight.recommendedAction.urgencyText}
          </span>
        </div>
        <strong className="text-white text-xs block">{insight.recommendedAction.title}</strong>
        <p className="text-xs text-slate-200 leading-relaxed">{insight.recommendedAction.actionText}</p>
        <div className="text-[10px] text-slate-400 pt-1 border-t border-cyan-800/30 flex items-center justify-between flex-wrap gap-2">
          <span>Non-Autonomous Advisory: The AI must never become the final authority. Human review required.</span>
          <span className="text-cyan-400 font-bold">SDG 11 Target 11.2 Safety Alignment</span>
        </div>
      </div>

      {/* 7. HUMAN REVIEW SECTION (Strict User Specification) */}
      <div
        id="human-review-section"
        className="bg-slate-900/90 border-2 border-cyan-500/50 rounded-lg p-5 space-y-4 font-mono shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest block">
              ------------------------------------
            </span>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                HUMAN REVIEW
              </h4>
            </div>
            <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest block">
              ------------------------------------
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Review Status:</span>
            <span
              className={`px-2.5 py-1 rounded text-xs font-bold border flex items-center gap-1.5 ${currentReviewBadge.classes}`}
            >
              <ReviewStatusIcon className="h-3 w-3" />
              {insight.humanReview.status}
            </span>
          </div>
        </div>

        {/* Existing / Original AI Recommendation Reference */}
        <div className="bg-slate-950/80 p-3 rounded border border-slate-800 space-y-1 text-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            AI Recommendation:
          </span>
          <div className="text-slate-200">
            <strong className="text-white">{insight.recommendedAction.title}: </strong>
            <span>{insight.recommendedAction.actionText}</span>
          </div>
          <span className="text-[10px] text-cyan-400 block pt-0.5">
            Window: {insight.recommendedAction.urgencyText}
          </span>
        </div>

        {/* If human already modified, show the modified directive clearly attributed to human */}
        {insight.humanReview.status === 'MODIFIED' && insight.humanReview.modifiedRecommendation && (
          <div className="bg-cyan-950/30 p-3 rounded border border-cyan-500/40 space-y-1 text-xs">
            <span className="text-[10px] text-cyan-400 uppercase font-bold block">
              Human Modified Recommendation (Active Directive):
            </span>
            <p className="text-white font-semibold">{insight.humanReview.modifiedRecommendation}</p>
            <div className="text-[10px] text-slate-400 pt-0.5 flex justify-between">
              <span>Attributed to: <strong className="text-cyan-300">{insight.humanReview.reviewedBy}</strong></span>
              <span>{insight.humanReview.reviewedAt ? new Date(insight.humanReview.reviewedAt).toLocaleString() : ''}</span>
            </div>
          </div>
        )}

        {/* Human Review Form */}
        <form onSubmit={handleSaveReview} className="space-y-4 pt-1">
          {/* Action Selector: ACCEPT / MODIFY / REJECT */}
          <div>
            <label className="text-xs text-slate-300 uppercase font-bold block mb-2">
              Actions:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                id="btn-action-accept"
                onClick={() => setSelectedDecision('ACCEPTED')}
                className={`py-2 px-3 rounded border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedDecision === 'ACCEPTED'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/50'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                [ ACCEPT ]
              </button>

              <button
                type="button"
                id="btn-action-modify"
                onClick={() => setSelectedDecision('MODIFIED')}
                className={`py-2 px-3 rounded border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedDecision === 'MODIFIED'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/50'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                [ MODIFY ]
              </button>

              <button
                type="button"
                id="btn-action-reject"
                onClick={() => setSelectedDecision('REJECTED')}
                className={`py-2 px-3 rounded border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedDecision === 'REJECTED'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300 ring-1 ring-rose-400/50'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <X className="h-3.5 w-3.5" />
                [ REJECT ]
              </button>
            </div>
          </div>

          {/* Conditional Human Modified Recommendation Input */}
          {selectedDecision === 'MODIFIED' && (
            <div className="space-y-1 bg-slate-950/70 p-3 rounded border border-cyan-500/30">
              <label className="text-xs text-cyan-300 uppercase font-bold block">
                Human Modified Recommendation:
              </label>
              <input
                type="text"
                id="input-modified-recommendation"
                value={modifiedRec}
                onChange={(e) => setModifiedRec(e.target.value)}
                placeholder="Enter revised maintenance directive (clearly attributed to human reviewer)..."
                required={selectedDecision === 'MODIFIED'}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-slate-400 block pt-0.5">
                Note: The original AI recommendation will be permanently preserved alongside this human modification in the audit trail.
              </span>
            </div>
          )}

          {/* Reviewer Comment Field */}
          <div>
            <label className="text-xs text-slate-300 uppercase font-bold block mb-1">
              Reviewer Comment:
            </label>
            <textarea
              id="input-reviewer-comment"
              value={reviewerComment}
              onChange={(e) => setReviewerComment(e.target.value)}
              placeholder="Enter depot engineering observations, diagnostic rationale, or inspection sign-off notes..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Reviewer Session Identity Footer & Submit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 space-y-0.5">
              <div>
                Authenticated Reviewer: <strong className="text-white">{reviewerIdentity}</strong> ({reviewerRole})
              </div>
              <div className="text-[10px] text-slate-500">
                Non-autonomous safeguard: Actions remain pending until review is saved.
              </div>
            </div>

            <button
              type="submit"
              id="btn-save-review"
              disabled={isSubmittingReview}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors disabled:opacity-50 shadow-lg cursor-pointer"
            >
              {isSubmittingReview ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              [ SAVE REVIEW ]
            </button>
          </div>
        </form>

        {reviewSuccessMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{reviewSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* 8. REVIEW HISTORY & AUDIT TRAIL (Expandable Section) */}
      <div id="ai-review-history-section" className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
        <button
          type="button"
          id="btn-toggle-review-history"
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          className="w-full flex items-center justify-between p-3.5 text-left bg-slate-900/80 hover:bg-slate-900 transition-colors font-mono"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Review History & Audit Trail
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {insight.reviewHistory && insight.reviewHistory.length > 0
                ? `${insight.reviewHistory.length} Event(s)`
                : '0 Events'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{isHistoryExpanded ? 'Collapse' : 'Expand History'}</span>
            {isHistoryExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {isHistoryExpanded && (
          <div className="p-4 space-y-4 font-mono text-xs border-t border-slate-800">
            {insight.reviewHistory && insight.reviewHistory.length > 0 ? (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {/* Event 0: Original AI Recommendation Generated */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-slate-950" />
                  <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="text-cyan-400 font-bold uppercase">AI Recommendation Generated</span>
                      <span>{new Date(insight.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-200">
                      <strong>{insight.recommendedAction.title}: </strong>
                      <span>{insight.recommendedAction.actionText}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Initial Status: <span className="text-amber-400 font-bold">PENDING</span> (Awaiting human inspection)
                    </div>
                  </div>
                </div>

                {/* Event N: Sequential Human Reviews */}
                {insight.reviewHistory.map((rev, idx) => {
                  const badge = getReviewBadge(rev.status);
                  return (
                    <div key={rev.reviewId || idx} className="relative">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-slate-950" />
                      <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-bold text-white uppercase">
                            Review Event #{idx + 1}
                          </span>
                          <span>{rev.reviewedAt ? new Date(rev.reviewedAt).toLocaleString() : 'Timestamp Unavailable'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Decision:</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.classes}`}>
                            {badge.label}
                          </span>
                        </div>

                        <div className="text-slate-300">
                          Reviewed by: <strong className="text-white">{rev.reviewedBy || 'Unavailable'}</strong>
                          {rev.reviewerRole && <span className="text-slate-400"> ({rev.reviewerRole})</span>}
                        </div>

                        {rev.status === 'MODIFIED' && rev.modifiedRecommendation && (
                          <div className="bg-slate-950 p-2 rounded text-cyan-300 text-[11px]">
                            Human Recommendation: {rev.modifiedRecommendation}
                          </div>
                        )}

                        {rev.reviewerComments && (
                          <div className="text-slate-400 italic">
                            Comment: "{rev.reviewerComments}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 italic">
                No human review has been recorded.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 9. Declared Missing Information & AI Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
        {/* Missing Information */}
        <div className="bg-slate-900/60 p-3.5 rounded border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" /> Declared Missing Information
          </span>
          <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
            {insight.missingInformation.map((info, idx) => (
              <li key={idx}>{info}</li>
            ))}
          </ul>
        </div>

        {/* AI Limitations */}
        <div className="bg-slate-900/60 p-3.5 rounded border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-cyan-400" /> AI LIMITATIONS
          </span>
          <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
            {insight.limitations.map((limit, idx) => (
              <li key={idx}>{limit}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 10. Responsible AI Principles Banner */}
      <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded-lg text-xs font-mono space-y-2">
        <button
          type="button"
          onClick={() => setIsResponsibleAiExpanded(!isResponsibleAiExpanded)}
          className="w-full flex items-center justify-between text-left text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span className="font-bold text-[10px] uppercase text-cyan-400 flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5" /> RESPONSIBLE AI SAFEGUARDS & PRINCIPLES
          </span>
          <span className="text-[10px] text-slate-500">
            {isResponsibleAiExpanded ? 'Hide Safeguards' : 'View Safeguards'}
          </span>
        </button>

        {isResponsibleAiExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 text-[10px] border-t border-slate-800 text-slate-400">
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
              <strong className="text-white block mb-0.5">TRANSPARENCY</strong>
              The user can see what information influenced the AI recommendation.
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
              <strong className="text-white block mb-0.5">HUMAN OVERSIGHT</strong>
              A certified human inspector reviews and approves all consequential actions.
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
              <strong className="text-white block mb-0.5">TRACEABILITY</strong>
              The original AI recommendation and human decision are preserved in the audit trail.
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
              <strong className="text-white block mb-0.5">PRIVACY</strong>
              Only necessary operational telemetry and inspection metadata are stored.
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
              <strong className="text-white block mb-0.5">SAFETY</strong>
              The system does not autonomously make consequential government, legal, or safety decisions.
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
              <strong className="text-white block mb-0.5">FAIRNESS</strong>
              No unsupported assumptions about people, communities, drivers, or locations.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
