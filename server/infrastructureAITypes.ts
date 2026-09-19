// SOLVOFIN Infrastructure AI Intelligence Layer - Types & Contracts
// Adheres strictly to non-destructive additive extension principles (Part 3)

export type RiskInterpretationLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'UNABLE_TO_DETERMINE';

export type HumanReviewStatus = 'PENDING' | 'ACCEPTED' | 'MODIFIED' | 'REJECTED';

export interface HumanReviewRecord {
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

export interface AuditTrailEntry {
  auditId: string;
  insightId: string;
  detectionId?: string;
  defectType: string;
  componentCategory?: string;
  location?: string;
  busNumber?: string;
  timestampAiGeneration: string;
  originalAiInterpretation: {
    level: RiskInterpretationLevel;
    rationale: string;
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

export interface InfrastructureCvInput {
  defectId?: string;
  defectType: string;
  componentCategory?: string;
  description?: string;
  severity?: string; // from existing CV, or undefined
  confidence?: number | null; // from existing CV, or null if unavailable
  location?: {
    latitude?: number | null;
    longitude?: number | null;
    address?: string;
    locationDescription?: string;
  };
  busNumber?: string;
  timestamp?: string;
  bbox?: [number, number, number, number] | number[];
  imageUrl?: string;
  sourceContext?: string; // e.g. 'CABIN_INSPECTION' | 'ROAD_DEFECT' | 'PRESET_PHOTO'
  existingMetadata?: Record<string, any>;
}

export interface InfrastructureContextEnrichment {
  matchedBus: {
    id: string;
    route_name: string;
    speed_kmh?: number;
    status: string;
  } | null;
  corridorInformation: string;
  historicalDefectsCount: number;
  linkedWorkOrdersCount: number;
  openWorkOrderDetails: string;
  heatwaveAlert: string;
  trafficBottleneck: string;
  dataAvailability: {
    hasGps: boolean;
    hasFleetTelemetry: boolean;
    hasWorkOrderMatch: boolean;
    hasEnvironmentalData: boolean;
  };
}

export interface InfrastructureAIInsight {
  id: string;
  timestamp: string;
  inputSummary: {
    defectId?: string;
    detectedIssue: string;
    componentCategory: string;
    locationText: string;
    confidenceText: string; // e.g. "92%" or "Confidence unavailable"
    rawConfidence: number | null;
    rawSeverity: string;
    busNumber?: string;
    bbox?: number[];
  };
  contextEnrichment: InfrastructureContextEnrichment;
  riskInterpretation: {
    level: RiskInterpretationLevel;
    rationale: string;
    factorsConsidered: string[];
  };
  whyThisResult: {
    summary: string;
    observableCvCharacteristics: string;
    contextualFactors: string;
    evidenceCorrelation: string;
    missingInformationNotes: string;
  };
  retrievedEvidence: Array<{
    chunkId: string;
    documentId: string;
    documentTitle: string;
    organization: string;
    category: string;
    section: string;
    page?: string | number;
    source: string;
    url?: string;
    similarityScore: number;
    text: string;
  }>;
  hasEvidence: boolean;
  evidenceDisclaimer: string;
  recommendedAction: {
    title: string;
    actionText: string;
    urgencyText: string;
    isAutonomous: false;
    requiresHumanReview: true;
  };
  missingInformation: string[];
  limitations: string[];
  sdgAlignment: {
    sdgGoal: 'SDG 11: Sustainable Cities and Communities';
    target: 'Target 11.2: Affordable and sustainable transport systems';
    contributionNote: string;
  };
  humanReview: HumanReviewRecord;
  reviewHistory?: HumanReviewRecord[];
  auditTrail?: AuditTrailEntry[];
}
