// SOLVOFIN Infrastructure AI Intelligence Layer Service (Part 3)
// Modular reasoning layer that consumes existing CV output and enriches it with
// real Solvofin database telemetry and authoritative RAG knowledge retrieval.

import fs from 'fs';
import path from 'path';
import { db } from './db';
import { ragEngine } from './ragEngine';
import {
  InfrastructureCvInput,
  InfrastructureAIInsight,
  InfrastructureContextEnrichment,
  HumanReviewRecord,
  HumanReviewStatus,
  RiskInterpretationLevel,
  AuditTrailEntry,
} from './infrastructureAITypes';

const INSIGHTS_STORAGE_PATH = path.join(process.cwd(), 'data', 'solvofin_infra_insights.json');

export class InfrastructureAIService {
  private insightsCache: Map<string, InfrastructureAIInsight> = new Map();

  constructor() {
    this.loadPersistedInsights();
  }

  private loadPersistedInsights(): void {
    try {
      if (fs.existsSync(INSIGHTS_STORAGE_PATH)) {
        const raw = fs.readFileSync(INSIGHTS_STORAGE_PATH, 'utf-8');
        const parsed: InfrastructureAIInsight[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item && item.id) {
              this.insightsCache.set(item.id, item);
            }
          });
        }
      }
    } catch (err) {
      console.warn('[InfrastructureAI] Failed to load persisted insights, starting fresh cache:', err);
    }
  }

  private persistInsights(): void {
    try {
      const dataDir = path.dirname(INSIGHTS_STORAGE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const array = Array.from(this.insightsCache.values());
      fs.writeFileSync(INSIGHTS_STORAGE_PATH, JSON.stringify(array, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[InfrastructureAI] Failed to persist insights to disk:', err);
    }
  }

  /**
   * Enriches the raw CV detection with real operational telemetry from Solvofin DB.
   * STRICT NON-FABRICATION RULE: Only consumes data that actually exists in db.ts.
   */
  private enrichContext(input: InfrastructureCvInput): InfrastructureContextEnrichment {
    const campusBuses = db.getCampusBuses ? db.getCampusBuses() : [];
    const workOrders = db.getWorkOrders ? db.getWorkOrders() : [];
    const busDefects = db.getInfrastructureDefects ? db.getInfrastructureDefects() : [];
    const bottlenecks = db.getTrafficBottlenecks ? db.getTrafficBottlenecks() : [];
    const heatwaves = db.getHeatwaveAnalytics ? db.getHeatwaveAnalytics() : [];

    // Match bus by vehicle registration or ID if provided
    let matchedBus = null;
    if (input.busNumber) {
      const cleanInputBus = input.busNumber.replace(/\s+/g, '').toUpperCase();
      matchedBus =
        campusBuses.find((b) => {
          const bId = (b.id || '').replace(/\s+/g, '').toUpperCase();
          const bRoute = (b.route_name || '').replace(/\s+/g, '').toUpperCase();
          return bId.includes(cleanInputBus) || cleanInputBus.includes(bId) || bRoute.includes(cleanInputBus);
        }) || null;
    }

    // Historical defects on this vehicle or component category
    const relevantHistoricalDefects = busDefects.filter((d: any) => {
      if (input.busNumber && d.bus_number === input.busNumber) return true;
      if (input.componentCategory && d.component_category === input.componentCategory) return true;
      return false;
    });

    // Check open work orders for matching bus
    const matchingWorkOrders = workOrders.filter((w: any) => {
      const desc = (w.description || '').toUpperCase();
      const loc = (w.location_address || '').toUpperCase();
      const busTarget = (input.busNumber || '').toUpperCase();
      return (busTarget && desc.includes(busTarget)) || (loc && desc.includes(loc));
    });

    // Match corridor congestion or heatwave
    let corridorInformation = 'Corridor telemetry unavailable';
    let trafficBottleneck = 'No active corridor bottleneck flagged';
    let heatwaveAlert = 'Ambient thermal levels nominal';

    if (matchedBus) {
      corridorInformation = `Active Route: ${matchedBus.route_name} (Fleet Unit ${matchedBus.id})`;
      const matchedCongestion = bottlenecks.find((b: any) =>
        matchedBus?.route_name?.toLowerCase().includes(b.corridor_name?.toLowerCase().slice(0, 8))
      );
      if (matchedCongestion) {
        trafficBottleneck = `${matchedCongestion.corridor_name} (${matchedCongestion.congestion_index}% congestion, ${matchedCongestion.avg_delay_minutes}m delay)`;
      }
    }

    if (heatwaves.length > 0) {
      const activeAlert = heatwaves.find((h: any) => h.alert_level === 'RED_SEVERE' || h.alert_level === 'ORANGE_ALERT');
      if (activeAlert) {
        heatwaveAlert = `${activeAlert.zone_name}: ${activeAlert.surface_temperature_c}°C surface temp (${activeAlert.alert_level})`;
      }
    }

    const hasGps = Boolean(input.location && input.location.latitude != null && input.location.longitude != null);
    const hasFleetTelemetry = Boolean(matchedBus);
    const hasWorkOrderMatch = matchingWorkOrders.length > 0;
    const hasEnvironmentalData = heatwaves.length > 0 || bottlenecks.length > 0;

    return {
      matchedBus: matchedBus
        ? {
            id: matchedBus.id,
            route_name: matchedBus.route_name,
            speed_kmh: matchedBus.current_location?.speed_kmh,
            status: matchedBus.status,
          }
        : null,
      corridorInformation,
      historicalDefectsCount: relevantHistoricalDefects.length,
      linkedWorkOrdersCount: matchingWorkOrders.length,
      openWorkOrderDetails:
        matchingWorkOrders.length > 0
          ? `${matchingWorkOrders.length} active order(s): ${matchingWorkOrders.map((w: any) => `#${w.id} [${w.status}]`).join(', ')}`
          : 'No existing municipal work order linked to this component',
      heatwaveAlert,
      trafficBottleneck,
      dataAvailability: {
        hasGps,
        hasFleetTelemetry,
        hasWorkOrderMatch,
        hasEnvironmentalData,
      },
    };
  }

  /**
   * Generates a grounded, explainable AI insight from an existing CV detection.
   */
  public async generateInsight(input: InfrastructureCvInput): Promise<InfrastructureAIInsight> {
    const timestamp = new Date().toISOString();
    const insightId = `INSIGHT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 1. Process CV confidence strictly without inventing values
    let confidenceText = 'Confidence unavailable';
    let rawConfidence: number | null = null;
    if (typeof input.confidence === 'number' && !isNaN(input.confidence) && input.confidence >= 0) {
      rawConfidence = input.confidence;
      confidenceText = `${Math.round(input.confidence * 100)}%`;
    }

    // 2. Process Location
    let locationText = 'Location unavailable';
    if (input.location?.address) {
      locationText = input.location.address;
    } else if (input.location?.latitude != null && input.location?.longitude != null) {
      locationText = `${input.location.latitude.toFixed(4)}° N, ${input.location.longitude.toFixed(4)}° E`;
    } else if (input.location?.locationDescription) {
      locationText = input.location.locationDescription;
    }

    const rawSeverity = input.severity || 'MODERATE';
    const componentCategory = input.componentCategory || 'GENERAL_INFRASTRUCTURE';
    const detectedIssue = input.defectType || input.description || 'Infrastructure Physical Defect';

    // 3. Perform Context Enrichment from real DB data
    const contextEnrichment = this.enrichContext(input);

    // 4. Connect to Real RAG Engine (Created in Part 2)
    const ragQuery = [
      detectedIssue,
      componentCategory,
      input.description,
      'bus cabin passenger safety standard maintenance inspection requirement',
    ]
      .filter(Boolean)
      .join(' ');

    const retrievedChunks = ragEngine.retrieveRelevantChunks(ragQuery, 3, 0.07);
    const hasEvidence = retrievedChunks.length > 0;

    const evidenceDisclaimer = hasEvidence
      ? 'Relevant evidence retrieved from authoritative public transport safety and engineering frameworks.'
      : 'No relevant knowledge-base evidence was retrieved for this case.';

    // 5. Determine Qualitative Risk Interpretation (No fabricated probability scores)
    let riskLevel: RiskInterpretationLevel = 'MODERATE';
    const upperSev = rawSeverity.toUpperCase();
    if (upperSev === 'CRITICAL' || upperSev === 'CRITICAL_DEFECT' || upperSev === 'SAFETY_HOLD') {
      riskLevel = 'HIGH';
    } else if (upperSev === 'LOW' || upperSev === 'MINOR' || upperSev === 'GOOD') {
      riskLevel = 'LOW';
    } else if (upperSev === 'UNKNOWN' || upperSev === 'INDETERMINATE') {
      riskLevel = 'UNABLE_TO_DETERMINE';
    } else {
      riskLevel = 'MODERATE';
    }

    // Adjust risk level if missing grab rail or emergency equipment is detected
    if (componentCategory === 'EMERGENCY_EQUIPMENT' || componentCategory === 'HANDRAIL') {
      if (upperSev.includes('MISSING') || upperSev.includes('CRITICAL') || upperSev.includes('BROKEN')) {
        riskLevel = 'HIGH';
      }
    }

    // Risk rationale and factors
    const factorsConsidered: string[] = [
      `Computer Vision classification: ${detectedIssue} (${rawSeverity})`,
      rawConfidence !== null ? `Detection model confidence: ${confidenceText}` : 'Detection confidence unavailable from optical model',
      `Component category: ${componentCategory}`,
      contextEnrichment.matchedBus ? `Transit vehicle match: ${contextEnrichment.matchedBus.route_name}` : 'Transit fleet assignment: unverified/general',
    ];

    if (hasEvidence) {
      factorsConsidered.push(`Authoritative standard correlation: ${retrievedChunks[0].documentTitle}`);
    } else {
      factorsConsidered.push('No direct regulatory document chunk retrieved for specific component sub-type');
    }

    let riskRationale = '';
    switch (riskLevel) {
      case 'HIGH':
        riskRationale = `High operational concern. The detected ${componentCategory.toLowerCase()} anomaly represents an immediate physical integrity or commuter safety hazard under municipal public vehicle regulations.`;
        break;
      case 'MODERATE':
        riskRationale = `Moderate maintenance priority. The condition compromises commuter comfort or material service life, but does not present an immediate catastrophic hazard.`;
        break;
      case 'LOW':
        riskRationale = `Low operational urgency. The condition is cosmetic or within normal operational wear-and-tear thresholds.`;
        break;
      case 'UNABLE_TO_DETERMINE':
      default:
        riskRationale = `Unable to reliably determine risk level due to insufficient optical resolution or missing component classification.`;
        break;
    }

    // 6. Explainability: "Why This Result?"
    const observableCv = input.bbox
      ? `Computer Vision identified a localized anomaly in bounding coordinates [${input.bbox.map((n) => Math.round(n)).join(', ')}]% with optical characteristics matching ${detectedIssue}.`
      : `Computer Vision detected structural surface variation corresponding to ${detectedIssue} in the provided inspection frame.`;

    const contextualFactors = contextEnrichment.matchedBus
      ? `Correlated with fleet unit ${contextEnrichment.matchedBus.id} on route "${contextEnrichment.matchedBus.route_name}". ${contextEnrichment.openWorkOrderDetails}.`
      : `Vehicle route correlation unavailable from provided metadata. ${contextEnrichment.openWorkOrderDetails}.`;

    const evidenceCorrelation = hasEvidence
      ? `Correlated against ${retrievedChunks[0].documentTitle} (${retrievedChunks[0].organization}, ${retrievedChunks[0].section || 'Standard Guidelines'}). Guidance indicates specific inspection and remediation criteria for ${componentCategory.toLowerCase()} components.`
      : 'No exact regulatory standard matched the specific query terms in the knowledge base. Reasoning is based solely on CV detection and available vehicle telemetry.';

    const missingInformationNotes = !contextEnrichment.dataAvailability.hasGps
      ? 'Physical GPS coordinates were not embedded in the uploaded frame. Maintenance crew will require depot gate verification.'
      : 'Structural sub-surface material fatigue cannot be measured via single 2D optical frame; physical tactile inspection recommended.';

    const whyThisResultSummary = `The system processed the inspection frame using the active Computer Vision model, registering a ${detectedIssue} on component category ${componentCategory}. ${
      hasEvidence ? `Authoritative safety standards from ${retrievedChunks[0].organization} were retrieved to provide normative context.` : 'Decision support is formulated from observable physical properties.'
    }`;

    // 7. Recommended Action (Strictly Decision-Support, Never Autonomous Command)
    let recommendedActionTitle = 'Schedule Depot Mechanical Inspection';
    let recommendedActionText = 'Perform physical inspection of the flagged component during the upcoming scheduled maintenance cycle.';
    let urgencyText = 'Within standard maintenance window (48-72 hours)';

    if (riskLevel === 'HIGH') {
      recommendedActionTitle = 'Prioritize Immediate Physical Depot Verification';
      recommendedActionText = `Flag vehicle for prioritized inspection at depot. Assigned mechanical supervisor should verify ${componentCategory.toLowerCase()} integrity before dispatching on peak-hour passenger runs.`;
      urgencyText = 'Prioritized (Within 12-24 hours prior to next scheduled route)';
    } else if (riskLevel === 'LOW') {
      recommendedActionTitle = 'Log for Routine Preventive Servicing';
      recommendedActionText = `Record observation in fleet maintenance history for review during standard bi-weekly preventative servicing.`;
      urgencyText = 'Routine maintenance window (7-14 days)';
    }

    // 8. Missing Information & Limitations
    const missingInformation: string[] = [];
    if (!contextEnrichment.dataAvailability.hasGps) {
      missingInformation.push('Accurate geolocation coordinates unavailable in media metadata.');
    }
    if (rawConfidence === null) {
      missingInformation.push('Optical model detection confidence score unavailable.');
    }
    if (!contextEnrichment.matchedBus) {
      missingInformation.push('Fleet vehicle registry cross-reference unavailable (bus number not matched to active campus roster).');
    }
    missingInformation.push('Sub-surface fastener torque, tensile stress, and material fatigue are not measurable from 2D optical pixels.');

    const limitations: string[] = [
      'Decision Support Advisory Only: This AI analysis provides automated prioritization guidance for human inspectors and does not constitute statutory engineering certification.',
      'Human Review Required: All consequential maintenance actions, bus route suspensions, or work-order authorizations require physical sign-off by a certified municipal transport engineer.',
      'Optical Sensor Constraints: Visual CV inferences can be affected by ambient cabin lighting, occlusions, glare, and camera angle variations.',
      'Document Grounding Scope: Retrieved knowledge is grounded in indexed regulatory frameworks (SDG 11 / UNECE / IRC) and must be cross-checked against current depot SOPs.',
    ];

    // 9. Initial Human Review State
    const humanReview: HumanReviewRecord = {
      status: 'PENDING',
      reviewedBy: undefined,
      reviewerRole: undefined,
      reviewedAt: undefined,
      reviewerComments: undefined,
      modifiedRecommendation: undefined,
    };

    const insight: InfrastructureAIInsight = {
      id: insightId,
      timestamp,
      inputSummary: {
        defectId: input.defectId,
        detectedIssue,
        componentCategory,
        locationText,
        confidenceText,
        rawConfidence,
        rawSeverity,
        busNumber: input.busNumber,
        bbox: input.bbox ? Array.from(input.bbox) : undefined,
      },
      contextEnrichment,
      riskInterpretation: {
        level: riskLevel,
        rationale: riskRationale,
        factorsConsidered,
      },
      whyThisResult: {
        summary: whyThisResultSummary,
        observableCvCharacteristics: observableCv,
        contextualFactors,
        evidenceCorrelation,
        missingInformationNotes,
      },
      retrievedEvidence: retrievedChunks,
      hasEvidence,
      evidenceDisclaimer,
      recommendedAction: {
        title: recommendedActionTitle,
        actionText: recommendedActionText,
        urgencyText,
        isAutonomous: false,
        requiresHumanReview: true,
      },
      missingInformation,
      limitations,
      sdgAlignment: {
        sdgGoal: 'SDG 11: Sustainable Cities and Communities',
        target: 'Target 11.2: Affordable and sustainable transport systems',
        contributionNote:
          'Automated infrastructure intelligence assists municipal operators with public-transit safety reference indicators, reducing transit downtime and providing operational decision guidance without implying statutory compliance.',
      },
      humanReview,
      reviewHistory: [],
      auditTrail: [],
    };

    // Cache and persist
    this.insightsCache.set(insightId, insight);
    this.persistInsights();

    return insight;
  }

  /**
   * Updates Human Review status for an insight.
   * Preserves audit trail and sequential review history (Part 4).
   */
  public updateHumanReview(
    insightId: string,
    update: {
      status: HumanReviewStatus;
      reviewerComments?: string;
      modifiedRecommendation?: string;
      reviewedBy?: string;
      reviewerRole?: string;
      actionTaken?: string;
    }
  ): InfrastructureAIInsight | null {
    const existing = this.insightsCache.get(insightId);
    if (!existing) return null;

    const reviewedAt = new Date().toISOString();
    const reviewerIdentity = update.reviewedBy?.trim() || 'Authenticated Session Unavailable';
    const reviewerRole = update.reviewerRole?.trim() || 'AUTHORITY';
    const reviewId = `REV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newRecord: HumanReviewRecord = {
      reviewId,
      status: update.status,
      reviewedBy: reviewerIdentity,
      reviewerRole,
      reviewedAt,
      reviewerComments: update.reviewerComments?.trim() || '',
      modifiedRecommendation: update.status === 'MODIFIED' ? (update.modifiedRecommendation?.trim() || '') : undefined,
      actionTaken: update.actionTaken,
      originalAiRecommendation: {
        title: existing.recommendedAction.title,
        actionText: existing.recommendedAction.actionText,
        urgencyText: existing.recommendedAction.urgencyText,
      },
    };

    // Update latest review state
    existing.humanReview = newRecord;

    // Append to sequential review history
    if (!existing.reviewHistory) {
      existing.reviewHistory = [];
    }
    existing.reviewHistory.push(newRecord);

    // Append to append-only audit trail preserving original AI recommendation & interpretation
    if (!existing.auditTrail) {
      existing.auditTrail = [];
    }

    const auditEntry: AuditTrailEntry = {
      auditId: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      insightId: existing.id,
      detectionId: existing.inputSummary.defectId,
      defectType: existing.inputSummary.detectedIssue,
      componentCategory: existing.inputSummary.componentCategory,
      location: existing.inputSummary.locationText,
      busNumber: existing.inputSummary.busNumber,
      timestampAiGeneration: existing.timestamp,
      originalAiInterpretation: {
        level: existing.riskInterpretation.level,
        rationale: existing.riskInterpretation.rationale,
      },
      originalAiRecommendation: {
        title: existing.recommendedAction.title,
        actionText: existing.recommendedAction.actionText,
        urgencyText: existing.recommendedAction.urgencyText,
      },
      evidenceReferences: existing.retrievedEvidence.map((e) => ({
        documentId: e.documentId,
        documentTitle: e.documentTitle,
        organization: e.organization,
        section: e.section,
        page: e.page,
        url: e.url,
      })),
      reviewDecision: update.status,
      modifiedRecommendation: update.status === 'MODIFIED' ? (update.modifiedRecommendation?.trim() || '') : undefined,
      reviewerIdentity,
      reviewerRole,
      reviewTimestamp: reviewedAt,
      reviewerComment: update.reviewerComments?.trim() || '',
    };

    existing.auditTrail.push(auditEntry);

    this.insightsCache.set(insightId, existing);
    this.persistInsights();
    return existing;
  }

  /**
   * Retrieves an insight by ID.
   */
  public getInsightById(insightId: string): InfrastructureAIInsight | null {
    return this.insightsCache.get(insightId) || null;
  }

  /**
   * Returns all recent insights.
   */
  public getAllInsights(): InfrastructureAIInsight[] {
    return Array.from(this.insightsCache.values()).reverse();
  }
}

export const infrastructureAIService = new InfrastructureAIService();
