// SOLVOFIN Incident AI Intelligence Layer - Types & Contracts (Part 7)
// Additive evidence-grounded decision support layer on top of existing SOLVOFIN incident records.
// Strictly non-destructive: consumes existing incident records without altering existing data or workflows.
// Enforces responsible AI safeguards: no fabricated statistics, no automated legal liability, human-in-the-loop review.

import { HumanReviewStatus } from './infrastructureAITypes';
import { RetrievedChunk } from './ragTypes';

export type IncidentCategory =
  | 'PEDESTRIAN_SAFETY'
  | 'TRAFFIC_FLOW_OBSTRUCTION'
  | 'ERRATIC_DRIVING'
  | 'INFRASTRUCTURE_HAZARD'
  | 'COMMERCIAL_TRANSIT'
  | 'ENVIRONMENTAL_HAZARD'
  | 'OPERATIONAL_TRANSIT'
  | 'OTHER';

export type IncidentSuggestedAttentionLevel =
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Unable to determine';

export interface IncidentAIInput {
  incidentId: string;
  type?: string;
  description?: string;
  severity?: string;
  status?: string;
  confidence?: number | null;
  timestamp_sec?: number | null;
  frame_number?: number | null;
  vehicle_track_id?: string;
  plate_number?: string;
  evidence_path?: string;
  latitude?: number | null;
  longitude?: number | null;
  assigned_unit?: string;
  media_id?: string;
}

export interface IncidentContextEnrichment {
  matchedMedia: {
    id: string;
    filename?: string;
    road_name?: string;
    location?: string;
    capture_time?: string;
  } | null;
  matchedVehiclePlate: {
    plate: string;
    category?: string;
    speed?: number | null;
    jurisdiction?: string;
  } | null;
  matchedTransitBus: {
    id: string;
    route_name: string;
    driver_name?: string;
    status: string;
  } | null;
  nearbyRoadDefectsCount: number;
  nearbyRoadDefectsSummary: string;
  nearbyBottlenecksSummary: string;
  heatwaveAlertSummary: string;
  activeWorkOrdersCount: number;
  corridorPriorIncidentsCount: number;
  dataAvailability: {
    hasGps: boolean;
    hasMediaContext: boolean;
    hasPlateOrVehicle: boolean;
    hasNearbyDefects: boolean;
    hasWorkOrders: boolean;
    hasCorridorTelemetry: boolean;
  };
}

export interface IncidentAISummary {
  header: 'AI-generated summary';
  whatHappened: string;
  whereItOccurred: string;
  whenItOccurred: string;
  relevantAvailableContext: string;
}

export interface IncidentAIInterpretation {
  suggestedAttentionLevel: IncidentSuggestedAttentionLevel;
  attentionRationale: string;
  factorsConsidered: string[];
  underlyingCauseStatement: string;
  legalLiabilityDisclaimer: string;
}

export interface IncidentAIRecommendation {
  title: string;
  actionText: string;
  urgencyText: string;
  targetTeam: string;
  isAutonomous: false;
  requiresHumanReview: true;
  disclaimer: string;
}

export interface IncidentWhyThisResult {
  summary: string;
  existingIncidentInfoConsidered: string;
  additionalOperationalContextConsidered: string;
  ragEvidenceRetrieved: string;
  aiInterpretation: string;
  recommendationProduced: string;
  missingInformation: string;
}

export interface IncidentAuditTrailEntry {
  auditId: string;
  insightId: string;
  incidentId: string;
  timestampAiGeneration: string;
  existingIncidentRecordSummary: string;
  originalAiSummary: IncidentAISummary;
  originalAiInterpretation: IncidentAIInterpretation;
  originalAiRecommendation: IncidentAIRecommendation;
  evidenceReferences: Array<{
    documentId: string;
    documentTitle: string;
    organization: string;
    section?: string;
    page?: string | number;
    url?: string;
  }>;
  reviewDecision: HumanReviewStatus;
  modifiedRecommendation?: string;
  reviewerIdentity: string;
  reviewerRole?: string;
  reviewTimestamp: string;
  reviewerComment: string;
}

export interface IncidentHumanReviewRecord {
  reviewId?: string;
  status: HumanReviewStatus;
  reviewedBy?: string;
  reviewerRole?: string;
  reviewedAt?: string;
  reviewerComments?: string;
  modifiedRecommendation?: string;
  actionTaken?: string;
  originalAiRecommendation?: IncidentAIRecommendation;
}

export interface IncidentAIInsight {
  id: string;
  incidentId: string;
  timestamp: string;
  category: IncidentCategory;
  categoryConfidenceText: string; // e.g. "92%" or "Confidence unavailable"
  rawConfidence: number | null;
  summary: IncidentAISummary;
  existingPriorityPreserved: string; // Official priority preserved from original record
  contextEnrichment: IncidentContextEnrichment;
  retrievedEvidence: RetrievedChunk[];
  hasEvidence: boolean;
  evidenceDisclaimer: string;
  interpretation: IncidentAIInterpretation;
  recommendedAction: IncidentAIRecommendation;
  whyThisResult: IncidentWhyThisResult;
  missingInformation: string[];
  limitations: string[];
  sdgAlignment: {
    sdgGoal: 'SDG 11: Sustainable Cities and Communities';
    target: 'Target 11.2: Safe, accessible, and sustainable public transport systems for all';
    contributionNote: string;
  };
  humanReview: IncidentHumanReviewRecord;
  reviewHistory: IncidentHumanReviewRecord[];
  auditTrail: IncidentAuditTrailEntry[];
}
