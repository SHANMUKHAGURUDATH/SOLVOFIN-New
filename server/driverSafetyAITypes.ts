// SOLVOFIN Driver Safety AI Intelligence Layer - Types & Contracts (Part 6)
// Strictly non-destructive additive extension: consumes existing Driver Safety CV outputs.
// Enforces strict safeguards: NO medical diagnosis, NO intoxication claims, NO autonomous penalties.

import { HumanReviewStatus } from './infrastructureAITypes';
import { RetrievedChunk } from './ragTypes';

export type DriverSafetyOperationalUrgency =
  | 'IMMEDIATE_HUMAN_VERIFICATION'
  | 'CAUTIONARY_MONITOR'
  | 'ROUTINE_OBSERVATION'
  | 'UNABLE_TO_DETERMINE';

export interface DriverSafetyCvInput {
  eventId?: string;
  eventType: string; // e.g. 'PROLONGED_DROWSINESS' | 'CRITICAL_DROWSINESS' | 'EYE_CLOSURE' | 'YAWN' | 'HEAD_NOD' | 'DISTRACTED_LOOKING_AWAY' | 'LANE_TRANSITION_ALERT' | 'ERRATIC_SWERVE'
  severity?: string; // from existing CV: 'CRITICAL' | 'WARNING' | 'LOW' | 'NORMAL' | undefined
  confidence?: number | null; // from existing CV; if undefined/null or < 0 => "Confidence unavailable"
  riskScore?: number | null; // from existing CV (0-100)
  durationSec?: number | null; // from existing CV
  metrics?: {
    ear_avg?: number;
    ear_left?: number;
    ear_right?: number;
    mar?: number;
    perclos?: number;
    blink_rate_bpm?: number;
    blink_count?: number;
    head_pitch?: number;
    head_yaw?: number;
    head_roll?: number;
    attention_direction?: string;
    lighting_quality?: string;
  };
  busNumber?: string;
  cameraId?: string;
  location?: {
    latitude?: number | null;
    longitude?: number | null;
    address?: string;
    locationDescription?: string;
  };
  timestamp?: string;
  notes?: string;
  sourceModule?: string; // e.g. 'FACE_DROWSINESS_CV' | 'LANE_TRANSITION_CV' | 'ZIGZAG_CV'
}

export interface DriverSafetyContextEnrichment {
  matchedBus: {
    id: string;
    route_name: string;
    driver_name?: string;
    speed_kmh?: number;
    status: string;
  } | null;
  routeInformation: string;
  recentVehicleAlertsCount: number;
  recentDriverEventsCount: number;
  recentCriticalEventsCount: number;
  corridorTrafficCongestion: string;
  heatwaveAlert: string;
  dataAvailability: {
    hasGps: boolean;
    hasFleetTelemetry: boolean;
    hasSpeedTelemetry: boolean;
    hasCorridorTraffic: boolean;
    hasHistoricalEvents: boolean;
  };
}

export interface DriverSafetyWhyThisResult {
  summary: string;
  observedCvCharacteristics: string;
  operationalDataAvailable: string;
  ragEvidenceRetrieved: string;
  aiInterpreted: string;
  recommendationProduced: string;
  informationUnavailable: string;
}

export interface DriverSafetyAuditTrailEntry {
  auditId: string;
  insightId: string;
  eventId?: string;
  busNumber?: string;
  existingCvSignal: string;
  timestampAiGeneration: string;
  observedCvSignal: string;
  operationalContextSummary: string;
  originalAiInterpretation: {
    urgency: DriverSafetyOperationalUrgency;
    rationale: string;
    underlyingCauseNotice: string;
  };
  originalAiRecommendation: {
    title: string;
    actionText: string;
    urgencyText: string;
  };
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

export interface DriverSafetyHumanReviewRecord {
  reviewId?: string;
  status: HumanReviewStatus;
  reviewedBy?: string;
  reviewerRole?: string;
  reviewedAt?: string;
  reviewerComments?: string;
  modifiedRecommendation?: string;
  actionTaken?: string;
  originalAiRecommendation?: {
    title: string;
    actionText: string;
    urgencyText: string;
  };
}

export interface DriverSafetyAIInsight {
  id: string;
  timestamp: string;
  inputSummary: {
    eventId?: string;
    rawEventType: string;
    displaySignal: string; // observable language, e.g. "CV-detected drowsiness-related visual signal"
    severityText: string; // e.g. "CRITICAL" | "WARNING" | "LOW" | "NORMAL"
    confidenceText: string; // e.g. "94%" or "Confidence unavailable"
    rawConfidence: number | null;
    rawRiskScore: number | null;
    busNumberText: string; // "AP 39 XX 1234" or "Vehicle context unavailable"
    locationText: string; // "17.7342° N, 83.3248° E" or "Location context unavailable"
    cameraIdText: string;
    durationText: string;
    metricsSummary?: string;
  };
  contextEnrichment: DriverSafetyContextEnrichment;
  interpretation: {
    urgency: DriverSafetyOperationalUrgency;
    observableSignalDescription: string;
    underlyingCauseStatement: string; // "The underlying cause cannot be determined from this visual signal alone."
    interpretationRationale: string;
    factorsConsidered: string[];
    safeguardDisclaimer: string; // Explicit non-diagnosis disclaimer
  };
  whyThisResult: DriverSafetyWhyThisResult;
  retrievedEvidence: RetrievedChunk[];
  hasEvidence: boolean;
  evidenceDisclaimer: string;
  recommendedAction: {
    title: string;
    actionText: string;
    urgencyText: string;
    isAutonomous: false;
    requiresHumanReview: true;
    disclaimer: string;
  };
  missingInformation: string[];
  limitations: string[];
  sdgAlignment: {
    sdgGoal: 'SDG 11: Sustainable Cities and Communities';
    target: 'Target 11.2: Safe, accessible, and sustainable public transport systems for all';
    contributionNote: string;
  };
  humanReview: DriverSafetyHumanReviewRecord;
  reviewHistory: DriverSafetyHumanReviewRecord[];
  auditTrail: DriverSafetyAuditTrailEntry[];
}
