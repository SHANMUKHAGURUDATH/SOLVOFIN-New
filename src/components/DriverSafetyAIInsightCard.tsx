// SOLVOFIN Driver Safety AI Intelligence & RAG Grounded Insight Card (Part 6)
// Additive evidence-grounded decision support layer on top of existing Driver Safety CV.
// Strictly enforces non-diagnosis, non-fabrication, human review, audit trail, and SDG 11 alignment.

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
  Activity,
  HeartHandshake,
} from 'lucide-react';
import {
  DriverSafetyAIInsight,
  DriverSafetyOperationalUrgency,
} from '../../server/driverSafetyAITypes';
import { HumanReviewStatus } from '../../server/infrastructureAITypes';

interface DriverSafetyAIInsightCardProps {
  insight: DriverSafetyAIInsight | null;
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

export const DriverSafetyAIInsightCard: React.FC<DriverSafetyAIInsightCardProps> = ({
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
      <div
        id="ai-driver-safety-insight-loading"
        className="bg-[#0F172A] border border-amber-500/30 rounded-lg p-6 space-y-4 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              GENERATING DRIVER SAFETY AI INSIGHT...
            </span>
          </div>
          <span className="text-xs font-mono text-amber-400">RAG Standard Retrieval & Context Grounding</span>
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
      <div
        id="ai-driver-safety-insight-empty"
        className="bg-[#0F172A] border border-slate-800 rounded-lg p-6 text-center space-y-3"
      >
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h4 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">
            AI Driver Safety Intelligence (Part 6)
          </h4>
        </div>
        <p className="text-xs font-mono text-slate-400 max-w-xl mx-auto">
          No Driver Safety AI insight generated yet. Start live facial CV monitoring, trigger a simulation, or select an event from the audit table below to synthesize real Solvofin fleet telemetry with authoritative CIRT / MoRTH / NHTSA safety standards.
        </p>
        {onRefreshInsight && (
          <button
            type="button"
            id="btn-trigger-driver-safety-ai"
            onClick={onRefreshInsight}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Generate AI Insight on Current Driver Stream
          </button>
        )}
      </div>
    );
  }

  const getUrgencyBadge = (urgency: DriverSafetyOperationalUrgency) => {
    switch (urgency) {
      case 'IMMEDIATE_HUMAN_VERIFICATION':
        return {
          label: 'IMMEDIATE HUMAN VERIFICATION',
          classes: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          icon: ShieldAlert,
        };
      case 'CAUTIONARY_MONITOR':
        return {
          label: 'CAUTIONARY MONITORING',
          classes: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: AlertTriangle,
        };
      case 'ROUTINE_OBSERVATION':
        return {
          label: 'ROUTINE OBSERVATION',
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
          label: 'PENDING REVIEW',
          classes: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: Clock,
        };
    }
  };

  const urgencyBadge = getUrgencyBadge(insight.interpretation.urgency);
  const UrgencyIcon = urgencyBadge.icon;
  const reviewBadge = getReviewBadge(insight.humanReview.status);
  const ReviewIcon = reviewBadge.icon;

  const handleReviewFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onReviewSubmit) return;
    try {
      setIsSubmittingReview(true);
      setReviewSuccessMsg(null);
      await onReviewSubmit(
        selectedDecision,
        reviewerComment,
        selectedDecision === 'MODIFIED' ? modifiedRec : undefined
      );
      setReviewSuccessMsg(`Human review recorded as ${selectedDecision}. Audit trail updated.`);
      setTimeout(() => setReviewSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to submit driver safety review:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div
      id={`ai-driver-safety-insight-${insight.id}`}
      className="bg-[#0B132B] border border-amber-500/30 rounded-xl p-5 md:p-6 space-y-6 shadow-2xl relative overflow-hidden"
    >
      {/* Decorative ambient gradient backdrop */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 relative">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              AI DRIVER SAFETY INTELLIGENCE
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              PART 6
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Insight ID: {insight.id}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(insight.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Urgency Badge */}
          <div
            id="badge-driver-safety-urgency"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border ${urgencyBadge.classes}`}
          >
            <UrgencyIcon className="h-3.5 w-3.5" />
            {urgencyBadge.label}
          </div>

          {/* Review Status Badge */}
          <div
            id="badge-driver-safety-review"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border ${reviewBadge.classes}`}
          >
            <ReviewIcon className="h-3.5 w-3.5" />
            {reviewBadge.label}
          </div>

          {onRefreshInsight && (
            <button
              type="button"
              id="btn-refresh-driver-safety-insight"
              onClick={onRefreshInsight}
              title="Re-run RAG retrieval & operational context sync"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Existing CV Signal & Operational Context Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CV Signal Box */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Eye className="h-3.5 w-3.5" />
              Existing CV Signal
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {insight.inputSummary.rawEventType}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-200">
            {insight.inputSummary.displaySignal}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono text-slate-400 border-t border-slate-800/60">
            <div>
              <span className="text-slate-500">Confidence: </span>
              <span className="text-slate-200 font-semibold">{insight.inputSummary.confidenceText}</span>
            </div>
            <div>
              <span className="text-slate-500">CV Severity: </span>
              <span className="text-slate-200 font-semibold">{insight.inputSummary.severityText}</span>
            </div>
            {insight.inputSummary.durationText && (
              <div>
                <span className="text-slate-500">Duration: </span>
                <span className="text-slate-200 font-semibold">{insight.inputSummary.durationText}</span>
              </div>
            )}
            {insight.inputSummary.rawRiskScore != null && (
              <div>
                <span className="text-slate-500">Risk Score: </span>
                <span className="text-slate-200 font-semibold">{insight.inputSummary.rawRiskScore}/100</span>
              </div>
            )}
          </div>
          {insight.inputSummary.metricsSummary && (
            <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 rounded px-2 py-1 border border-slate-800">
              <span className="text-slate-500">Landmark Telemetry: </span>
              <span className="text-cyan-300">{insight.inputSummary.metricsSummary}</span>
            </div>
          )}
        </div>

        {/* Operational Context Box */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
              <Bus className="h-3.5 w-3.5" />
              Solvofin Operational Context
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {insight.inputSummary.busNumberText}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            {insight.contextEnrichment.routeInformation}
          </p>
          <div className="space-y-1 pt-1 text-xs font-mono text-slate-400 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Corridor Flow:</span>
              <span className="text-slate-300">{insight.contextEnrichment.corridorTrafficCongestion}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Past Bus Alerts / Events:</span>
              <span className="text-slate-300">
                {insight.contextEnrichment.recentVehicleAlertsCount} alerts • {insight.contextEnrichment.recentDriverEventsCount} driver events ({insight.contextEnrichment.recentCriticalEventsCount} critical)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Ambient Thermal:</span>
              <span className="text-slate-300">{insight.contextEnrichment.heatwaveAlert}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Non-Diagnosis Safeguard Banner */}
      <div
        id="safeguard-non-diagnosis-banner"
        className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-3.5 flex items-start gap-3"
      >
        <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wide">
            Strict Non-Diagnosis & Observability Principle
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {insight.interpretation.observableSignalDescription}{' '}
            <strong className="text-amber-200">{insight.interpretation.underlyingCauseStatement}</strong>{' '}
            {insight.interpretation.safeguardDisclaimer}
          </p>
        </div>
      </div>

      {/* AI Interpretation Section */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
          <Activity className="h-4 w-4 text-cyan-400" />
          <span className="font-bold text-slate-200">AI Operational Interpretation</span>
          <span className="text-[10px] text-slate-500">(Observable Signals & Context Only)</span>
        </div>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          {insight.interpretation.interpretationRationale}
        </p>
        <div className="pt-2">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wide block mb-1.5">
            Operational Factors Synthesized:
          </span>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs font-mono text-slate-300">
            {insight.interpretation.factorsConsidered.map((factor, idx) => (
              <li key={idx} className="flex items-center gap-2 bg-slate-950/40 px-2.5 py-1 rounded border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                <span className="truncate">{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Authoritative RAG Grounding Section */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <FileText className="h-4 w-4 text-emerald-400" />
            <span className="font-bold text-slate-200">Retrieved Authoritative Evidence (RAG Grounding)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {insight.hasEvidence ? `${insight.retrievedEvidence.length} Standard Chunk(s)` : 'No RAG Match'}
          </span>
        </div>

        {insight.hasEvidence ? (
          <div className="space-y-2.5">
            {insight.retrievedEvidence.map((chunk, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      {chunk.organization}
                    </span>
                    <span className="text-white font-semibold truncate max-w-sm">
                      {chunk.documentTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    {chunk.section && <span>Section: {chunk.section}</span>}
                    {chunk.page && <span>• Page {chunk.page}</span>}
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px]">
                      Match: {(chunk.similarityScore * 100).toFixed(0)}%
                    </span>
                    {chunk.url && (
                      <a
                        href={chunk.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-0.5"
                        title="View official publication"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
                <blockquote className="text-slate-300 italic border-l-2 border-emerald-500/50 pl-2.5 py-0.5 leading-relaxed text-xs">
                  "{chunk.text}"
                </blockquote>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded p-3 text-xs font-mono text-slate-400 flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-500 shrink-0" />
            <span>{insight.evidenceDisclaimer}</span>
          </div>
        )}
      </div>

      {/* AI-Assisted Safety Recommendation */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wider">
              AI-Assisted Safety Recommendation
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
            NON-AUTONOMOUS ADVISORY
          </span>
        </div>

        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-white font-mono">
            {insight.recommendedAction.title}
          </h4>
          <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-sans">
            {insight.recommendedAction.actionText}
          </p>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 pt-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Target Response Window: {insight.recommendedAction.urgencyText}</span>
          </div>
        </div>

        {/* Prohibited Actions Disclaimed Notice */}
        <div className="text-[11px] font-mono text-slate-400 bg-slate-950/80 rounded p-2.5 border border-slate-800/80 flex items-start gap-2">
          <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
          <span>
            <strong>Safeguard Constraint:</strong> {insight.recommendedAction.disclaimer}
          </span>
        </div>
      </div>

      {/* "Why This Result?" Collapsible Section */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/30">
        <button
          type="button"
          id="btn-toggle-why-this-result"
          onClick={() => setIsWhyExpanded(!isWhyExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/70 hover:bg-slate-800/80 text-left transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
            <Info className="h-4 w-4 text-cyan-400" />
            <span>Why This Result? (Traceable Decision Breakdown)</span>
          </div>
          {isWhyExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {isWhyExpanded && (
          <div className="p-4 space-y-3 text-xs font-mono text-slate-300 border-t border-slate-800 space-y-3">
            <div className="space-y-1">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block font-bold">
                1. What the CV System Observed
              </span>
              <p className="bg-slate-950/60 p-2 rounded border border-slate-800/60 text-slate-200">
                {insight.whyThisResult.observedCvCharacteristics}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block font-bold">
                2. What Operational Data Was Available
              </span>
              <p className="bg-slate-950/60 p-2 rounded border border-slate-800/60 text-slate-200">
                {insight.whyThisResult.operationalDataAvailable}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block font-bold">
                3. What RAG Evidence Was Retrieved
              </span>
              <p className="bg-slate-950/60 p-2 rounded border border-slate-800/60 text-slate-200">
                {insight.whyThisResult.ragEvidenceRetrieved}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block font-bold">
                4. What the AI Interpreted
              </span>
              <p className="bg-slate-950/60 p-2 rounded border border-slate-800/60 text-slate-200">
                {insight.whyThisResult.aiInterpreted}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block font-bold">
                5. What Recommendation Was Produced
              </span>
              <p className="bg-slate-950/60 p-2 rounded border border-slate-800/60 text-slate-200">
                {insight.whyThisResult.recommendationProduced}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block font-bold">
                6. What Information Was Unavailable
              </span>
              <p className="bg-slate-950/60 p-2 rounded border border-slate-800/60 text-slate-400 italic">
                {insight.whyThisResult.informationUnavailable}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Limitations Collapsible */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/30">
        <button
          type="button"
          id="btn-toggle-limitations"
          onClick={() => setIsLimitationsExpanded(!isLimitationsExpanded)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900/70 hover:bg-slate-800/80 text-left transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
            <Scale className="h-3.5 w-3.5 text-slate-400" />
            <span>Operational Limitations & Ethical Boundaries</span>
          </div>
          {isLimitationsExpanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
        </button>

        {isLimitationsExpanded && (
          <div className="p-4 space-y-2 text-xs font-mono text-slate-400 border-t border-slate-800">
            <ul className="space-y-1.5 list-disc list-inside">
              {insight.limitations.map((limit, idx) => (
                <li key={idx} className="leading-relaxed text-slate-300">
                  {limit}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Human Review & Audit Trail (Part 4/6 Reuse) */}
      <div className="bg-slate-900/60 border border-cyan-500/30 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Human Review & Oversight (Part 4 / 6)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Reviewer: <strong className="text-slate-200">{reviewerIdentity}</strong> ({reviewerRole})
          </span>
        </div>

        {/* Current Review State Display */}
        {insight.humanReview.status !== 'PENDING' && (
          <div className="bg-slate-950/80 border border-slate-800 rounded p-3 text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <ReviewIcon className="h-3.5 w-3.5 text-cyan-400" />
                Current Status: <strong className="text-white">{insight.humanReview.status}</strong>
              </span>
              <span>
                By: {insight.humanReview.reviewedBy || reviewerIdentity} at{' '}
                {insight.humanReview.reviewedAt ? new Date(insight.humanReview.reviewedAt).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
            {insight.humanReview.reviewerComments && (
              <p className="text-slate-300">
                <span className="text-slate-500">Comments: </span>
                {insight.humanReview.reviewerComments}
              </p>
            )}
            {insight.humanReview.modifiedRecommendation && (
              <div className="p-2 bg-cyan-950/30 border border-cyan-500/30 rounded text-cyan-200">
                <span className="text-cyan-400 font-semibold block text-[10px] uppercase">
                  Supervisor Modified Directive:
                </span>
                {insight.humanReview.modifiedRecommendation}
              </div>
            )}
          </div>
        )}

        {/* Interactive Human Review Action Form */}
        {onReviewSubmit && (
          <form onSubmit={handleReviewFormSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Record Review Decision:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="btn-decision-accept"
                  onClick={() => setSelectedDecision('ACCEPTED')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-mono font-semibold border transition-all ${
                    selectedDecision === 'ACCEPTED'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  ACCEPT
                </button>

                <button
                  type="button"
                  id="btn-decision-modify"
                  onClick={() => setSelectedDecision('MODIFIED')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-mono font-semibold border transition-all ${
                    selectedDecision === 'MODIFIED'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  MODIFY
                </button>

                <button
                  type="button"
                  id="btn-decision-reject"
                  onClick={() => setSelectedDecision('REJECTED')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-mono font-semibold border transition-all ${
                    selectedDecision === 'REJECTED'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-950'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                  REJECT
                </button>
              </div>
            </div>

            {/* Modified text input when MODIFY selected */}
            {selectedDecision === 'MODIFIED' && (
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">
                  Supervisor Modified Safety Directive:
                </label>
                <textarea
                  id="textarea-modified-recommendation"
                  rows={2}
                  value={modifiedRec}
                  onChange={(e) => setModifiedRec(e.target.value)}
                  placeholder="Specify adapted instruction (e.g., Driver contacted on cabin channel 4; verified responsive; scheduling relief driver at Sector 9 terminus)..."
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded p-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            {/* Comments input */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Supervisor Audit Comments / Verification Notes:
              </label>
              <textarea
                id="textarea-reviewer-comments"
                rows={2}
                value={reviewerComment}
                onChange={(e) => setReviewerComment(e.target.value)}
                placeholder="Document human verification findings, cabin communication outcome, or justification..."
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-700"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-slate-500">
                Preserves original AI recommendation & logs append-only audit entry
              </span>
              <button
                type="submit"
                id="btn-submit-human-review"
                disabled={isSubmittingReview}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded text-xs font-mono font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-50"
              >
                {isSubmittingReview ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserCheck className="h-3.5 w-3.5" />
                )}
                Submit Human Review
              </button>
            </div>

            {reviewSuccessMsg && (
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{reviewSuccessMsg}</span>
              </div>
            )}
          </form>
        )}

        {/* Audit Trail History Collapsible */}
        {insight.auditTrail && insight.auditTrail.length > 0 && (
          <div className="border-t border-slate-800 pt-3">
            <button
              type="button"
              id="btn-toggle-audit-trail"
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="w-full flex items-center justify-between text-xs font-mono text-slate-400 hover:text-slate-300"
            >
              <span className="flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-cyan-400" />
                Historical Audit Trail ({insight.auditTrail.length} Recorded Reviews)
              </span>
              {isHistoryExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {isHistoryExpanded && (
              <div className="space-y-2 mt-3">
                {insight.auditTrail.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-cyan-300 font-semibold">{entry.reviewDecision}</span>
                      <span>{new Date(entry.reviewTimestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-300">
                      Reviewer: {entry.reviewerIdentity} ({entry.reviewerRole})
                    </div>
                    {entry.reviewerComment && (
                      <div className="text-slate-400 italic">"{entry.reviewerComment}"</div>
                    )}
                    {entry.modifiedRecommendation && (
                      <div className="text-cyan-400">Modified: {entry.modifiedRecommendation}</div>
                    )}
                    <div className="text-slate-500 text-[10px]">
                      Original AI Recommendation: {entry.originalAiRecommendation.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SDG 11 Alignment & Responsible AI Transparency Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <HeartHandshake className="h-4 w-4 text-emerald-400" />
          <span className="text-emerald-400 font-semibold">{insight.sdgAlignment.sdgGoal}</span>
          <span>•</span>
          <span className="text-slate-400">{insight.sdgAlignment.target}</span>
        </div>
        <div className="text-[11px] text-slate-500">
          Designed to support safe municipal transport operations with human oversight
        </div>
      </div>
    </div>
  );
};
