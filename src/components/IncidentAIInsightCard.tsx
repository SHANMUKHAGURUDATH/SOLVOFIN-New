// SOLVOFIN Incident AI Intelligence & RAG Grounded Decision Support Card (Part 7)
// Additive evidence-grounded decision support layer built on top of existing Solvofin incident records.
// Strictly enforces non-fabrication, evidence provenance, human review, audit trail, and SDG 11 alignment.

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
  UserCheck,
  Info,
  Clock,
  MapPin,
  Car,
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
  Layers,
  Download,
} from 'lucide-react';
import {
  IncidentAIInsight,
  IncidentSuggestedAttentionLevel,
} from '../../server/incidentAITypes';
import { HumanReviewStatus } from '../../server/infrastructureAITypes';

interface IncidentAIInsightCardProps {
  insight: IncidentAIInsight | null;
  isLoading?: boolean;
  onRefreshInsight?: () => void;
  onReviewSubmit?: (
    status: HumanReviewStatus,
    comments: string,
    modifiedRecommendation?: string
  ) => Promise<void>;
  reviewerIdentity?: string;
  reviewerRole?: string;
  onClose?: () => void;
}

export const IncidentAIInsightCard: React.FC<IncidentAIInsightCardProps> = ({
  insight,
  isLoading = false,
  onRefreshInsight,
  onReviewSubmit,
  reviewerIdentity = 'Municipal Traffic Safety Supervisor',
  reviewerRole = 'AUTHORITY',
  onClose,
}) => {
  const [isWhyOpen, setIsWhyOpen] = useState<boolean>(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState<boolean>(true);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState<boolean>(false);
  const [isContextOpen, setIsContextOpen] = useState<boolean>(false);

  // Human review interactive state
  const [selectedStatus, setSelectedStatus] = useState<HumanReviewStatus>('PENDING');
  const [reviewComments, setReviewComments] = useState<string>('');
  const [modifiedRec, setModifiedRec] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  // Sync state if insight changes
  React.useEffect(() => {
    if (insight?.humanReview) {
      setSelectedStatus(insight.humanReview.status);
      setReviewComments(insight.humanReview.reviewerComments || '');
      setModifiedRec(
        insight.humanReview.modifiedRecommendation ||
          insight.recommendedAction?.actionText ||
          ''
      );
    }
  }, [insight?.id, insight?.humanReview?.status]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-[#0F172A] p-6 text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-amber-500/10 text-amber-400">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
        <h3 className="text-sm font-bold text-slate-100 font-mono">
          Synthesizing Incident Evidence & Querying Knowledge Standards...
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Correlating incident record with Solvofin road defects, traffic telemetry, and authoritative MoRTH / NUTP / IRC safety guidelines.
        </p>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-5 text-center space-y-2">
        <div className="inline-flex p-2 rounded-md bg-slate-800 text-slate-400">
          <Sparkles className="h-5 w-5" />
        </div>
        <h4 className="text-xs font-mono font-bold text-slate-200">
          No AI Incident Intelligence Generated Yet
        </h4>
        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
          Select an incident to synthesize multi-source telemetry and RAG-backed decision support.
        </p>
        {onRefreshInsight && (
          <button
            type="button"
            onClick={onRefreshInsight}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Synthesize Incident with AI
          </button>
        )}
      </div>
    );
  }

  const handleReviewClick = async (status: HumanReviewStatus) => {
    setSelectedStatus(status);
    if (!onReviewSubmit) return;
    try {
      setIsSubmittingReview(true);
      setReviewFeedback(null);
      await onReviewSubmit(
        status,
        reviewComments,
        status === 'MODIFIED' ? modifiedRec : undefined
      );
      setReviewFeedback(`Decision "${status}" recorded immutably in incident audit log.`);
      setTimeout(() => setReviewFeedback(null), 4000);
    } catch (err: any) {
      setReviewFeedback(`Error updating review: ${err.message || 'Network error'}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getAttentionColor = (lvl: IncidentSuggestedAttentionLevel) => {
    switch (lvl) {
      case 'High':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'Moderate':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'Low':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const getReviewStatusBadge = (status: HumanReviewStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return {
          label: 'REVIEW: ACCEPTED BY AUTHORITY',
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-700',
          icon: ShieldCheck,
        };
      case 'MODIFIED':
        return {
          label: 'REVIEW: MODIFIED BY SUPERVISOR',
          bg: 'bg-blue-950/80 text-blue-300 border-blue-700',
          icon: Edit3,
        };
      case 'REJECTED':
        return {
          label: 'REVIEW: REJECTED / DISMISSED',
          bg: 'bg-rose-950/80 text-rose-300 border-rose-700',
          icon: X,
        };
      default:
        return {
          label: 'HUMAN REVIEW PENDING',
          bg: 'bg-amber-950/80 text-amber-300 border-amber-700 animate-pulse',
          icon: Clock,
        };
    }
  };

  const reviewBadge = getReviewStatusBadge(insight.humanReview?.status || 'PENDING');
  const ReviewBadgeIcon = reviewBadge.icon;

  return (
    <div
      id="incident-ai-intelligence-card"
      className="rounded-lg border border-amber-500/30 bg-[#0B132B] shadow-xl overflow-hidden text-slate-200 font-sans"
    >
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-b border-amber-500/20 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white font-mono uppercase tracking-tight">
                AI Incident Intelligence & Decision Support
              </h3>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PART 7
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Incident #{insight.incidentId} • Grounded in Solvofin Telemetry & Document RAG
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* SDG 11 Badge */}
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
            <Layers className="h-3 w-3 text-emerald-400" />
            SDG 11.2 Public Transport Safety
          </span>

          {/* Human Review Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-bold border ${reviewBadge.bg}`}
          >
            <ReviewBadgeIcon className="h-3 w-3 shrink-0" />
            {reviewBadge.label}
          </span>

          {/* Export Incident PDF Report (Part 8) */}
          <a
            href={`/api/reports/incident/${insight.incidentId}/pdf?includeAI=true`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors shadow-sm"
            title="Download Official Incident Report PDF with AI Decision Support & Audit Appendix"
          >
            <Download className="h-3 w-3 text-amber-400" />
            <span>Export Report (PDF)</span>
          </a>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close AI Insight"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* 2. AI-Generated Summary (Section 4) */}
        <div className="rounded-md border border-slate-800 bg-[#0F172A] p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5 text-amber-400" />
              <span>Incident Summary</span>
              <span className="text-[10px] text-slate-400 font-normal ml-1">
                (AI-generated summary)
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Generated: {new Date(insight.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  What Happened (Recorded):
                </span>
                <p className="text-slate-200 font-medium leading-relaxed">
                  {insight.summary.whatHappened}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Relevant Available Context:
                </span>
                <p className="text-slate-300 font-mono text-[11px]">
                  {insight.summary.relevantAvailableContext}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
              <div className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">
                    Where It Occurred:
                  </span>
                  <span className="text-slate-200 font-mono text-[11px]">
                    {insight.summary.whereItOccurred}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-1.5 pt-1">
                <Clock className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">
                    When It Occurred:
                  </span>
                  <span className="text-slate-200 font-mono text-[11px]">
                    {insight.summary.whenItOccurred}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Categorization & Attention Matrix (Section 5 & 11) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          {/* Box 1: Categorization */}
          <div className="rounded border border-slate-800 bg-[#0F172A] p-3 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">
              Incident Category
            </span>
            <div className="font-bold text-white text-sm">
              {insight.category.replace(/_/g, ' ')}
            </div>
            <div className="text-[10px] text-slate-400">
              Classification Confidence:{' '}
              <strong className="text-cyan-400">{insight.categoryConfidenceText}</strong>
            </div>
          </div>

          {/* Box 2: Official Severity Preserved */}
          <div className="rounded border border-slate-800 bg-[#0F172A] p-3 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">
              Official Priority (Preserved)
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-rose-400 text-sm">
                {insight.existingPriorityPreserved}
              </span>
              <span className="text-[10px] text-slate-500">(Authoritative)</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Record source status: unchanged
            </div>
          </div>

          {/* Box 3: Qualitative AI-Suggested Attention Level */}
          <div className="rounded border border-slate-800 bg-[#0F172A] p-3 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">
              AI-Suggested Attention Level
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold border ${getAttentionColor(
                  insight.interpretation.suggestedAttentionLevel
                )}`}
              >
                {insight.interpretation.suggestedAttentionLevel.toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-400">(Advisory)</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Does not alter official severity
            </div>
          </div>
        </div>

        {/* 4. Operational Context Enrichment (Section 6) */}
        <div className="rounded-md border border-slate-800 bg-[#0F172A] overflow-hidden">
          <button
            type="button"
            onClick={() => setIsContextOpen(!isContextOpen)}
            className="w-full p-3.5 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between text-left text-xs font-mono font-bold text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-emerald-400" />
              <span>
                Available Operational Context & Telemetry (
                {insight.contextEnrichment.nearbyRoadDefectsCount} defects •{' '}
                {insight.contextEnrichment.activeWorkOrdersCount} work orders •{' '}
                {insight.contextEnrichment.corridorPriorIncidentsCount} prior corridor events)
              </span>
            </div>
            <span className="text-slate-400">
              {isContextOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </button>

          {isContextOpen && (
            <div className="p-4 border-t border-slate-800 space-y-3 text-xs font-mono">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1 bg-slate-950 p-2.5 rounded border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase">
                    Vehicle & Plate Context:
                  </div>
                  <div className="text-slate-200">
                    {insight.contextEnrichment.matchedVehiclePlate ? (
                      <>
                        Plate:{' '}
                        <strong className="text-emerald-400">
                          {insight.contextEnrichment.matchedVehiclePlate.plate}
                        </strong>{' '}
                        ({insight.contextEnrichment.matchedVehiclePlate.jurisdiction})
                        {insight.contextEnrichment.matchedVehiclePlate.speed != null && (
                          <span className="ml-2 text-cyan-400">
                            • Speed: {insight.contextEnrichment.matchedVehiclePlate.speed} km/h
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400">Vehicle context unrecorded</span>
                    )}
                  </div>
                  {insight.contextEnrichment.matchedTransitBus && (
                    <div className="text-blue-300 text-[11px] pt-0.5">
                      Campus Transit Bus: {insight.contextEnrichment.matchedTransitBus.id} on route &quot;{insight.contextEnrichment.matchedTransitBus.route_name}&quot;
                    </div>
                  )}
                </div>

                <div className="space-y-1 bg-slate-950 p-2.5 rounded border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase">
                    Corridor & Environmental Context:
                  </div>
                  <div className="text-slate-200 text-[11px]">
                    {insight.contextEnrichment.nearbyBottlenecksSummary}
                  </div>
                  <div className="text-amber-400 text-[11px]">
                    {insight.contextEnrichment.heatwaveAlertSummary}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 text-[11px]">
                <span className="text-slate-400">Nearby Road Hazards: </span>
                <span className="text-rose-300">
                  {insight.contextEnrichment.nearbyRoadDefectsSummary}
                </span>
              </div>

              {/* Data Availability Checklist */}
              <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-2 text-[10px]">
                <span className="text-slate-400 uppercase">Data Checklist:</span>
                <span
                  className={`px-2 py-0.5 rounded border ${
                    insight.contextEnrichment.dataAvailability.hasGps
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  GPS Coordinates: {insight.contextEnrichment.dataAvailability.hasGps ? 'YES' : 'UNAVAILABLE'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded border ${
                    insight.contextEnrichment.dataAvailability.hasPlateOrVehicle
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Plate / Vehicle: {insight.contextEnrichment.dataAvailability.hasPlateOrVehicle ? 'YES' : 'UNAVAILABLE'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded border ${
                    insight.contextEnrichment.dataAvailability.hasNearbyDefects
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Nearby Defects: {insight.contextEnrichment.dataAvailability.hasNearbyDefects ? 'YES' : 'NONE'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded border ${
                    insight.contextEnrichment.dataAvailability.hasWorkOrders
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Work Orders: {insight.contextEnrichment.dataAvailability.hasWorkOrders ? 'YES' : 'NONE'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 5. Authoritative Document RAG Evidence (Section 7 & 13) */}
        <div className="rounded-md border border-slate-800 bg-[#0F172A] overflow-hidden">
          <div className="p-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-400" />
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Authoritative Knowledge Evidence (Document RAG)
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {insight.retrievedEvidence.length} source chunks
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsEvidenceOpen(!isEvidenceOpen)}
              className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              {isEvidenceOpen ? 'Collapse' : 'Expand'}
              {isEvidenceOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          {isEvidenceOpen && (
            <div className="p-4 space-y-3">
              <p className="text-[11px] font-mono text-slate-400">
                {insight.evidenceDisclaimer}
              </p>

              {insight.hasEvidence ? (
                <div className="space-y-2.5">
                  {insight.retrievedEvidence.map((chunk, idx) => (
                    <div
                      key={chunk.chunkId || idx}
                      className="rounded border border-slate-800 bg-slate-950 p-3 space-y-1.5 text-xs font-mono"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                        <span className="font-bold text-amber-300">
                          {chunk.documentTitle}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Org: {chunk.organization} • Sec: {chunk.section || 'N/A'} • p.{chunk.page || 'N/A'}
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans text-xs leading-relaxed italic border-l-2 border-amber-500/40 pl-2.5 py-0.5">
                        &quot;{chunk.text}&quot;
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span>Source: {chunk.source || chunk.documentTitle}</span>
                        <span className="text-cyan-400">
                          Match Similarity: {Math.round((chunk.similarityScore || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded border border-slate-800 bg-slate-950 text-center">
                  <p className="text-xs font-mono text-slate-400">
                    No relevant knowledge-base evidence was retrieved for this case.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Analysis proceeds using recorded telemetry without fabricating standard citations.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 6. Evidence-Grounded Interpretation (Section 8) */}
        <div className="rounded-md border border-slate-800 bg-[#0F172A] p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase border-b border-slate-800 pb-2">
            <Scale className="h-4 w-4 text-cyan-400" />
            <span>Evidence-Grounded Interpretation & Multi-Source Synthesis</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-2 bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                Attention Rationale:
              </span>
              <p className="text-slate-200 leading-relaxed">
                {insight.interpretation.attentionRationale}
              </p>
              <div className="text-[11px] text-slate-400 pt-1">
                <strong>Factors Considered:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-300">
                  {insight.interpretation.factorsConsidered.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2.5 bg-slate-950 p-3 rounded border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase block">
                  Root Cause Boundary:
                </span>
                <p className="text-slate-300 text-xs italic mt-0.5">
                  {insight.interpretation.underlyingCauseStatement}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Statutory & Legal Liability Disclaimer:
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {insight.interpretation.legalLiabilityDisclaimer}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 7. AI-Assisted Recommendation (Section 12) */}
        <div className="rounded-md border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                AI-Assisted Recommendation (Decision Support)
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
              NON-AUTONOMOUS
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h5 className="text-sm font-bold text-emerald-300">
                {insight.recommendedAction.title}
              </h5>
              <span className="text-xs font-mono text-slate-400">
                Target Team:{' '}
                <strong className="text-slate-200">
                  {insight.recommendedAction.targetTeam}
                </strong>
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {insight.recommendedAction.actionText}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-mono">
              <span className="text-amber-300">
                Urgency: {insight.recommendedAction.urgencyText}
              </span>
              <span className="text-[11px] text-slate-400 italic">
                {insight.recommendedAction.disclaimer}
              </span>
            </div>
          </div>
        </div>

        {/* 8. "Why This Result?" Expandable Breakdown (Section 10) */}
        <div className="rounded-md border border-slate-800 bg-[#0F172A] overflow-hidden">
          <button
            type="button"
            onClick={() => setIsWhyOpen(!isWhyOpen)}
            className="w-full p-3.5 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between text-left text-xs font-mono font-bold text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-cyan-400" />
              <span>Why This Result? Structured Explainability & Provenance</span>
            </div>
            <span className="text-slate-400">
              {isWhyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </button>

          {isWhyOpen && (
            <div className="p-4 border-t border-slate-800 space-y-3 text-xs font-mono">
              <div className="space-y-2">
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-cyan-400 font-bold block mb-1">
                    1. Existing Incident Information Considered:
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    {insight.whyThisResult.existingIncidentInfoConsidered}
                  </p>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-cyan-400 font-bold block mb-1">
                    2. Additional Operational Context Considered:
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    {insight.whyThisResult.additionalOperationalContextConsidered}
                  </p>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-cyan-400 font-bold block mb-1">
                    3. RAG Evidence Retrieved:
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    {insight.whyThisResult.ragEvidenceRetrieved}
                  </p>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-cyan-400 font-bold block mb-1">
                    4. AI Interpretation:
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    {insight.whyThisResult.aiInterpretation}
                  </p>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-cyan-400 font-bold block mb-1">
                    5. Recommendation Produced:
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    {insight.whyThisResult.recommendationProduced}
                  </p>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-rose-400 font-bold block mb-1">
                    6. Missing Information Disclosed:
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    {insight.whyThisResult.missingInformation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 9. Human Review & Decision Panel (Section 14 & Part 4) */}
        <div className="rounded-md border border-slate-800 bg-[#0F172A] p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-amber-400" />
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Human-in-the-Loop Supervisory Review (Part 4 Integration)
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Reviewer: <strong className="text-slate-200">{reviewerIdentity}</strong> ({reviewerRole})
            </span>
          </div>

          <div className="space-y-3">
            {/* Status Selection Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedStatus('ACCEPTED')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all border ${
                  selectedStatus === 'ACCEPTED'
                    ? 'bg-emerald-600 text-slate-950 border-emerald-400 shadow-md'
                    : 'bg-slate-900 text-emerald-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                ACCEPT RECOMMENDATION
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('MODIFIED')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all border ${
                  selectedStatus === 'MODIFIED'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                    : 'bg-slate-900 text-blue-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                MODIFY ACTION
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('REJECTED')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all border ${
                  selectedStatus === 'REJECTED'
                    ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                    : 'bg-slate-900 text-rose-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <X className="h-3.5 w-3.5" />
                REJECT / DISMISS
              </button>
            </div>

            {/* Modified Recommendation Input Field */}
            {selectedStatus === 'MODIFIED' && (
              <div className="space-y-1.5 bg-slate-950 p-3 rounded border border-blue-500/40">
                <label className="text-[11px] font-mono text-blue-300 font-bold block">
                  Supervisor Modified Action Directives:
                </label>
                <textarea
                  value={modifiedRec}
                  onChange={(e) => setModifiedRec(e.target.value)}
                  placeholder="Enter custom supervisory directive for incident remediation..."
                  rows={2}
                  className="w-full rounded bg-slate-900 border border-slate-700 p-2 text-xs font-sans text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] font-mono text-slate-400 block">
                  Original AI recommendation will be immutably preserved in the audit log.
                </span>
              </div>
            )}

            {/* Supervisor Comments */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 block">
                Supervisor Rationale & Operational Notes:
              </label>
              <input
                type="text"
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="e.g. Field inspection confirmed crosswalk fading; work order dispatch approved."
                className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs font-sans text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Submit Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleReviewClick(selectedStatus)}
                disabled={isSubmittingReview}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors disabled:opacity-50"
              >
                <UserCheck className="h-4 w-4" />
                {isSubmittingReview ? 'Recording Decision...' : 'Commit Supervisory Review'}
              </button>

              <button
                type="button"
                onClick={() => setIsAuditTrailOpen(!isAuditTrailOpen)}
                className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <History className="h-3.5 w-3.5" />
                {isAuditTrailOpen ? 'Hide Audit History' : 'View Audit History & Provenance'}
              </button>
            </div>

            {reviewFeedback && (
              <div className="p-2.5 rounded bg-emerald-950/80 border border-emerald-700 text-xs font-mono text-emerald-300">
                {reviewFeedback}
              </div>
            )}
          </div>
        </div>

        {/* 10. Append-Only Audit Trail Inspector (Section 15) */}
        {isAuditTrailOpen && (
          <div className="rounded-md border border-slate-800 bg-[#0F172A] p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                Append-Only Audit Trail ({insight.auditTrail?.length || 0} entries)
              </span>
              <span className="text-[10px] text-slate-500">
                Append-Only Log
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(insight.auditTrail || []).map((entry, idx) => (
                <div
                  key={entry.auditId || idx}
                  className="rounded bg-slate-950 p-2.5 border border-slate-800/80 space-y-1 text-[11px]"
                >
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="text-amber-400 font-bold">{entry.auditId}</span>
                    <span>{new Date(entry.reviewTimestamp).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Decision: </span>
                    <strong
                      className={
                        entry.reviewDecision === 'ACCEPTED'
                          ? 'text-emerald-400'
                          : entry.reviewDecision === 'MODIFIED'
                          ? 'text-blue-400'
                          : entry.reviewDecision === 'REJECTED'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }
                    >
                      {entry.reviewDecision}
                    </strong>
                    <span className="text-slate-400 ml-2">by {entry.reviewerIdentity}</span>
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-500">Comments: </span>
                    {entry.reviewerComment}
                  </div>
                  {entry.modifiedRecommendation && (
                    <div className="text-blue-300">
                      <span className="text-slate-500">Modified: </span>
                      {entry.modifiedRecommendation}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 pt-0.5 border-t border-slate-900 flex justify-between">
                    <span>Orig AI Rec: {entry.originalAiRecommendation?.title}</span>
                    <span>Evidence Cited: {entry.evidenceReferences?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. Limitations & Safeguards Disclosure (Section 17 & 18) */}
        <div className="rounded border border-slate-800/80 bg-slate-950/60 p-3 text-[11px] font-mono text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Info className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>Responsible AI Safeguards & Decision Support Limitations</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-400">
            {insight.limitations.map((lim, idx) => (
              <li key={idx} className="leading-relaxed">
                {lim}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
