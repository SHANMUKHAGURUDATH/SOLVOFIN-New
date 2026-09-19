// SOLVOFIN AI Report & Audit Integration - Types & Contracts (Part 8)
// Additive reporting and audit layer appending AI intelligence, RAG evidence, human review status, and audit history to reports.
// Strictly non-destructive: does not modify or replace existing report formats or business logic.

import { RetrievedChunk } from './ragTypes';

export type ReportCoverageType =
  | 'INCIDENT'
  | 'INFRASTRUCTURE'
  | 'DRIVER_SAFETY'
  | 'OPERATIONAL';

export type ReportAuditAction =
  | 'AI_INSIGHT_GENERATED'
  | 'AI_EVIDENCE_RETRIEVED'
  | 'AI_REPORT_SECTION_GENERATED'
  | 'HUMAN_REVIEW_PERFORMED'
  | 'HUMAN_RECOMMENDATION_MODIFIED'
  | 'HUMAN_RECOMMENDATION_REJECTED'
  | 'REPORT_EXPORTED';

export interface ReportAuditEntry {
  auditId: string;
  timestamp: string;
  action: ReportAuditAction;
  reportType: ReportCoverageType;
  entityId: string;
  user: string;
  userRole: string;
  status: string;
  comment?: string;
  metadata?: Record<string, any>;
}

export interface AIReportEvidenceItem {
  documentId?: string;
  documentTitle: string;
  organization: string;
  section?: string;
  page?: string | number;
  excerpt: string;
  url?: string;
  versionOrDate?: string;
}

export interface AIReportSection {
  reportType: ReportCoverageType;
  entityId: string;
  generatedAt: string;
  
  // Section 2 structure
  summary: {
    header: string;
    whatHappened: string;
    whereItOccurred?: string;
    whenItOccurred?: string;
    relevantAvailableContext?: string;
  };
  
  observedInformation: Record<string, string | number | boolean | null | undefined>;
  operationalContext: Record<string, string | number | boolean | null | undefined>;
  
  aiInterpretation: {
    label: string;
    primaryFinding: string;
    suggestedAttentionLevel?: string;
    rationale?: string;
  };
  
  recommendedAction: {
    advisoryLevel: string;
    actionText: string;
    targetGroup?: string;
    estimatedUrgency?: string;
  };
  
  ragEvidence: {
    retrieved: boolean;
    evidenceList: AIReportEvidenceItem[];
    disclaimer: string;
  };
  
  missingInformation: string[];
  aiLimitations: string[];
  
  humanReview: {
    reviewed: boolean;
    status: string;
    originalRecommendation?: string;
    modifiedRecommendation?: string;
    reviewedBy?: string;
    reviewerRole?: string;
    reviewedAt?: string;
    reviewerComments?: string;
    reviewHistoryCount: number;
  };
  
  auditInfo: {
    recordedActionsCount: number;
    latestAuditAction?: string;
    auditTrailSnippet?: Array<{
      timestamp: string;
      action: string;
      user?: string;
      status?: string;
      comment?: string;
    }>;
  };
  
  responsibleAINotes: {
    humanOversightNotice: string;
    evidenceProvenanceNotice: string;
    liabilityNotice: string;
    privacyNotice: string;
    boundaries: string[];
  };
  
  sdg11Context: {
    statement: string;
    metricStatus: string;
  };
}

export interface AIReportOptions {
  includeAI?: boolean;
  requestedBy?: string;
  reviewerRole?: string;
  userComments?: string;
}
