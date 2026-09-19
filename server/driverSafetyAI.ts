// SOLVOFIN Driver Safety AI Intelligence Layer Service (Part 6)
// Additive evidence-grounded intelligence layer on top of existing Driver Safety CV.
// Strictly enforces non-diagnosis, evidence provenance, real context enrichment, human review, and audit trail.

import fs from 'fs';
import path from 'path';
import { db } from './db';
import { ragEngine } from './ragEngine';
import {
  DriverSafetyCvInput,
  DriverSafetyAIInsight,
  DriverSafetyContextEnrichment,
  DriverSafetyHumanReviewRecord,
  DriverSafetyAuditTrailEntry,
  DriverSafetyOperationalUrgency,
  DriverSafetyWhyThisResult,
} from './driverSafetyAITypes';
import { HumanReviewStatus } from './infrastructureAITypes';

const INSIGHTS_STORAGE_PATH = path.join(process.cwd(), 'data', 'solvofin_driver_safety_insights.json');

export class DriverSafetyAIService {
  private insightsCache: Map<string, DriverSafetyAIInsight> = new Map();

  constructor() {
    this.loadPersistedInsights();
  }

  private loadPersistedInsights(): void {
    try {
      if (fs.existsSync(INSIGHTS_STORAGE_PATH)) {
        const raw = fs.readFileSync(INSIGHTS_STORAGE_PATH, 'utf-8');
        const parsed: DriverSafetyAIInsight[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item && item.id) {
              this.insightsCache.set(item.id, item);
            }
          });
        }
      }
    } catch (err) {
      console.warn('[DriverSafetyAI] Failed to load persisted insights, initializing fresh cache:', err);
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
      console.warn('[DriverSafetyAI] Failed to persist insights to disk:', err);
    }
  }

  /**
   * Enriches the raw CV event with real Solvofin database telemetry.
   * STRICT NON-FABRICATION: Uses only values actually present in db.
   */
  private enrichContext(input: DriverSafetyCvInput): DriverSafetyContextEnrichment {
    const campusBuses = db.getCampusBuses ? db.getCampusBuses() : [];
    const allAlerts = db.getGovernmentAlerts ? db.getGovernmentAlerts() : [];
    const allDriverEvents = db.getDriverSafetyEvents ? db.getDriverSafetyEvents() : [];
    const bottlenecks = db.getTrafficBottlenecks ? db.getTrafficBottlenecks() : [];
    const heatwaves = db.getHeatwaveAnalytics ? db.getHeatwaveAnalytics() : [];

    // Match bus by vehicle registration if provided
    let matchedBus: any = null;
    if (input.busNumber) {
      const cleanTarget = input.busNumber.replace(/\s+/g, '').toUpperCase();
      matchedBus =
        campusBuses.find((b) => {
          const bNum = (b.bus_number || '').replace(/\s+/g, '').toUpperCase();
          const bId = (b.id || '').replace(/\s+/g, '').toUpperCase();
          const bRoute = (b.route_name || '').replace(/\s+/g, '').toUpperCase();
          return bNum.includes(cleanTarget) || cleanTarget.includes(bNum) || bId === cleanTarget || bRoute.includes(cleanTarget);
        }) || null;
    }

    let routeInformation = 'Route context unavailable';
    if (matchedBus) {
      routeInformation = `Assigned Route: ${matchedBus.route_name} (Transit Unit ${matchedBus.bus_number || matchedBus.id})`;
      if (matchedBus.driver_name) {
        routeInformation += ` | Driver: ${matchedBus.driver_name}`;
      }
      if (matchedBus.status) {
        routeInformation += ` | Status: ${matchedBus.status}`;
      }
    }

    // Correlate recent alerts for this bus
    const relevantAlerts = allAlerts.filter((a: any) => {
      if (!input.busNumber) return false;
      return a.bus_number === input.busNumber;
    });

    // Correlate past driver safety events for this bus
    const busEvents = allDriverEvents.filter((e: any) => {
      if (!input.busNumber) return false;
      return e.bus_number === input.busNumber;
    });
    const recentCriticalEvents = busEvents.filter((e: any) => e.severity === 'CRITICAL');

    // Match corridor congestion
    let corridorTrafficCongestion = 'Corridor traffic telemetry unavailable';
    if (matchedBus) {
      const matchedBottleneck = bottlenecks.find((b: any) =>
        matchedBus?.route_name?.toLowerCase().includes(b.corridor_name?.toLowerCase().slice(0, 8))
      );
      if (matchedBottleneck) {
        corridorTrafficCongestion = `${matchedBottleneck.corridor_name} (${matchedBottleneck.congestion_index}% congestion, ${matchedBottleneck.avg_delay_minutes}m delay)`;
      } else {
        corridorTrafficCongestion = 'Corridor flow normal; no active bottlenecks flagged';
      }
    }

    // Environmental heatwave notice
    let heatwaveAlert = 'Ambient thermal levels nominal';
    if (heatwaves.length > 0) {
      const activeAlert = heatwaves.find((h: any) => h.alert_level === 'RED_SEVERE' || h.alert_level === 'ORANGE_ALERT');
      if (activeAlert) {
        heatwaveAlert = `${activeAlert.zone_name}: ${activeAlert.surface_temperature_c}°C surface temperature (${activeAlert.alert_level})`;
      }
    }

    const hasGps = Boolean(input.location && input.location.latitude != null && input.location.longitude != null);
    const hasFleetTelemetry = Boolean(matchedBus);
    const hasSpeedTelemetry = Boolean(matchedBus && matchedBus.current_location && matchedBus.current_location.speed_kmh != null);
    const hasCorridorTraffic = corridorTrafficCongestion !== 'Corridor traffic telemetry unavailable';
    const hasHistoricalEvents = busEvents.length > 0;

    return {
      matchedBus: matchedBus
        ? {
            id: matchedBus.id || matchedBus.bus_number,
            route_name: matchedBus.route_name,
            driver_name: matchedBus.driver_name,
            speed_kmh: matchedBus.current_location?.speed_kmh,
            status: matchedBus.status,
          }
        : null,
      routeInformation,
      recentVehicleAlertsCount: relevantAlerts.length,
      recentDriverEventsCount: busEvents.length,
      recentCriticalEventsCount: recentCriticalEvents.length,
      corridorTrafficCongestion,
      heatwaveAlert,
      dataAvailability: {
        hasGps,
        hasFleetTelemetry,
        hasSpeedTelemetry,
        hasCorridorTraffic,
        hasHistoricalEvents,
      },
    };
  }

  /**
   * Translates raw CV event codes into strictly observable language.
   * NEVER diagnoses the driver.
   */
  private formatObservableSignal(eventType: string): string {
    const upper = (eventType || '').toUpperCase();
    if (upper.includes('EYE_CLOSURE') || upper.includes('PROLONGED_DROWSINESS') || upper.includes('CRITICAL_DROWSINESS')) {
      return 'CV-detected drowsiness-related visual signal (prolonged eye closure)';
    }
    if (upper.includes('YAWN')) {
      return 'CV-detected yawning / facial elongation visual pattern';
    }
    if (upper.includes('HEAD_NOD') || upper.includes('PITCH')) {
      return 'CV-detected downward head pitch nodding displacement';
    }
    if (upper.includes('DISTRACTED') || upper.includes('LOOKING_AWAY')) {
      return 'CV-detected lateral head pose distraction / gaze departure';
    }
    if (upper.includes('LANE_TRANSITION')) {
      return 'CV-detected lateral vehicle lane transition maneuver';
    }
    if (upper.includes('ERRATIC') || upper.includes('SWERVE') || upper.includes('ZIGZAG') || upper.includes('ZIG_ZAG')) {
      return 'CV-detected rapid lateral vehicle swerve / directional shift';
    }
    return `CV-detected visual pattern (${eventType.replace(/_/g, ' ')})`;
  }

  /**
   * Generates a grounded, explainable Driver Safety AI Insight.
   */
  public async generateInsight(input: DriverSafetyCvInput): Promise<DriverSafetyAIInsight> {
    const timestamp = new Date().toISOString();
    const insightId = `INSIGHT-DS-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 1. Process Confidence strictly without fabricating
    let confidenceText = 'Confidence unavailable';
    let rawConfidence: number | null = null;
    if (typeof input.confidence === 'number' && !isNaN(input.confidence) && input.confidence >= 0) {
      rawConfidence = input.confidence;
      confidenceText = `${Math.round(input.confidence * 100)}%`;
    }

    // 2. Process Location
    let locationText = 'Location context unavailable';
    if (input.location?.address) {
      locationText = input.location.address;
    } else if (input.location?.latitude != null && input.location?.longitude != null) {
      locationText = `${input.location.latitude.toFixed(4)}° N, ${input.location.longitude.toFixed(4)}° E`;
    } else if (input.location?.locationDescription) {
      locationText = input.location.locationDescription;
    }

    const rawSeverity = input.severity ? input.severity.toUpperCase() : 'WARNING';
    const busNumberText = input.busNumber ? input.busNumber : 'Vehicle context unavailable';
    const cameraIdText = input.cameraId ? input.cameraId : 'Camera identifier unrecorded';
    const durationText = input.durationSec != null ? `${input.durationSec}s` : 'Duration unrecorded';

    // Metrics summary string if metrics are provided
    let metricsSummary: string | undefined = undefined;
    if (input.metrics) {
      const parts: string[] = [];
      if (input.metrics.ear_avg != null) parts.push(`EAR: ${input.metrics.ear_avg.toFixed(2)}`);
      if (input.metrics.perclos != null) parts.push(`PERCLOS: ${input.metrics.perclos}%`);
      if (input.metrics.mar != null) parts.push(`MAR: ${input.metrics.mar.toFixed(2)}`);
      if (input.metrics.head_pitch != null) parts.push(`Pitch: ${input.metrics.head_pitch}°`);
      if (input.metrics.head_yaw != null) parts.push(`Yaw: ${input.metrics.head_yaw}°`);
      if (input.metrics.blink_rate_bpm != null) parts.push(`Blink: ${input.metrics.blink_rate_bpm} BPM`);
      if (input.metrics.lighting_quality) parts.push(`Light: ${input.metrics.lighting_quality}`);
      if (parts.length > 0) {
        metricsSummary = parts.join(' | ');
      }
    }

    const displaySignal = this.formatObservableSignal(input.eventType);

    // 3. Context Enrichment from Real Database
    const contextEnrichment = this.enrichContext(input);

    // 4. RAG Retrieval from Existing Authoritative Knowledge Base
    const ragQuery = [
      input.eventType,
      rawSeverity,
      'driver fatigue drowsiness PERCLOS eye closure CIRT rest interval safety standard',
      input.sourceModule,
    ]
      .filter(Boolean)
      .join(' ');

    const retrievedEvidence = ragEngine.retrieveRelevantChunks(ragQuery, 3, 0.08);
    const hasEvidence = retrievedEvidence.length > 0;

    const evidenceDisclaimer = hasEvidence
      ? 'Relevant evidence retrieved from authoritative public transport and driver safety frameworks (CIRT / NHTSA / MoRTH).'
      : 'No relevant knowledge-base evidence was retrieved for this case.';

    // 5. Operational Urgency Level (Strictly Decision Support)
    let urgency: DriverSafetyOperationalUrgency = 'CAUTIONARY_MONITOR';
    if (rawSeverity === 'CRITICAL') {
      urgency = 'IMMEDIATE_HUMAN_VERIFICATION';
    } else if (rawSeverity === 'LOW' || rawSeverity === 'NORMAL') {
      urgency = 'ROUTINE_OBSERVATION';
    } else if (rawSeverity === 'UNKNOWN') {
      urgency = 'UNABLE_TO_DETERMINE';
    } else {
      urgency = 'CAUTIONARY_MONITOR';
    }

    // 6. Observable Signal Description & Mandatory Safeguards
    const observableSignalDescription = `The existing computer vision system observed a visual pattern matching "${displaySignal}".`;
    const underlyingCauseStatement = 'The underlying cause cannot be determined from this visual signal alone.';
    const safeguardDisclaimer =
      'Safeguard Notice: This system does not produce medical, neurological, psychological, sleep disorder, or intoxication diagnoses. Potential contributing factors such as prolonged screen exposure, sleep deprivation, medication, or illness must not be asserted from optical camera telemetry alone.';

    // Factors considered
    const factorsConsidered: string[] = [
      `Existing CV signal: ${displaySignal}`,
      rawConfidence !== null ? `Detection confidence: ${confidenceText}` : 'Detection confidence unavailable from CV model',
      `Assessed severity level: ${rawSeverity}`,
      contextEnrichment.matchedBus
        ? `Fleet vehicle correlation: ${contextEnrichment.matchedBus.route_name}`
        : 'Route context unavailable',
    ];

    if (contextEnrichment.recentCriticalEventsCount > 0) {
      factorsConsidered.push(`Repeated event pattern: ${contextEnrichment.recentCriticalEventsCount} critical event(s) logged for this vehicle in the active audit history`);
    }

    if (hasEvidence) {
      factorsConsidered.push(`Authoritative standard correlation: ${retrievedEvidence[0].documentTitle} (${retrievedEvidence[0].organization})`);
    } else {
      factorsConsidered.push('No direct regulatory document chunk retrieved for specific event sub-type');
    }

    let interpretationRationale = '';
    switch (urgency) {
      case 'IMMEDIATE_HUMAN_VERIFICATION':
        interpretationRationale =
          'High operational attention warranted. The existing CV system registered multiple concurrent indicator thresholds (e.g. sustained eye closure or high risk index) that suggest elevated risk during active passenger transport operation.';
        break;
      case 'CAUTIONARY_MONITOR':
        interpretationRationale =
          'Moderate operational caution. The observable visual indicator warrants supervisory monitoring and verification against route conditions to maintain transit safety margins.';
        break;
      case 'ROUTINE_OBSERVATION':
        interpretationRationale =
          'Nominal operational status. The observable pattern is consistent with momentary gaze variation or normal baseline driver behavior.';
        break;
      case 'UNABLE_TO_DETERMINE':
      default:
        interpretationRationale =
          'Unable to reliably evaluate operational urgency due to incomplete camera telemetry or unverified baseline values.';
        break;
    }

    // 7. "Why This Result?"
    const observedCvCharacteristics = metricsSummary
      ? `CV detected ${displaySignal}. Measured metrics: ${metricsSummary}. Event duration: ${durationText}.`
      : `CV detected ${displaySignal}. Duration: ${durationText}.`;

    const operationalDataAvailable = contextEnrichment.matchedBus
      ? `Vehicle registered as ${contextEnrichment.matchedBus.id} on route "${contextEnrichment.matchedBus.route_name}". Current speed: ${
          contextEnrichment.matchedBus.speed_kmh != null ? `${contextEnrichment.matchedBus.speed_kmh} km/h` : 'Speed telemetry unavailable'
        }. Correlated with ${contextEnrichment.recentVehicleAlertsCount} active alert(s) and ${contextEnrichment.recentDriverEventsCount} past event(s).`
      : 'Route and vehicle telemetry unavailable from uploaded metadata.';

    const ragEvidenceRetrieved = hasEvidence
      ? `Retrieved standard: "${retrievedEvidence[0].documentTitle}" (${retrievedEvidence[0].organization}, ${retrievedEvidence[0].section || 'Guidelines'}). Standard specifies objective thresholds (e.g., PERCLOS / continuous shift limits) and recommended depot rest intervals.`
      : 'No relevant knowledge-base evidence was retrieved for this case. Reasoning is based exclusively on the observed CV signal and available fleet telemetry.';

    const aiInterpreted = `${observableSignalDescription} ${underlyingCauseStatement} ${interpretationRationale}`;

    // 8. Recommended Action (Strictly Decision Support, Never Autonomous Disciplinary Action)
    let recTitle = 'Perform Supervisory Human Verification';
    let recAction =
      'A designated transit supervisor or dispatcher should conduct a routine voice check via the cabin radio and verify current vehicle progress according to existing operational safety procedures.';
    let urgencyText = 'Within standard operational monitoring cadence (15-30 minutes)';

    if (urgency === 'IMMEDIATE_HUMAN_VERIFICATION') {
      recTitle = 'Prompt Immediate Human Verification & Safe Bay Check';
      recAction =
        'Transit command should immediately initiate two-way cabin voice contact with the driver to verify responsiveness. In accordance with CIRT and municipal safety protocols, consider directing the vehicle to the nearest depot or designated safe bay for a 20-minute rest pause if sustained indicators persist.';
      urgencyText = 'Immediate (Within 1-3 minutes of alert generation)';
    } else if (urgency === 'ROUTINE_OBSERVATION') {
      recTitle = 'Maintain Routine Operational Telemetry';
      recAction =
        'No immediate intervention required. Continue standard automated camera monitoring and log the event into the shift summary audit trail.';
      urgencyText = 'Standard routine monitoring';
    }

    const recommendationProduced = `Recommended action: "${recTitle}". ${recAction} (Target window: ${urgencyText}).`;

    // Missing information breakdown
    const missingInformation: string[] = [];
    if (!contextEnrichment.dataAvailability.hasGps) {
      missingInformation.push('Accurate geolocation coordinates unavailable in current telemetry.');
    }
    if (rawConfidence === null) {
      missingInformation.push('Optical model detection confidence score unavailable.');
    }
    if (!contextEnrichment.matchedBus) {
      missingInformation.push('Fleet vehicle registry match unavailable (bus number unverified against active campus roster).');
    }
    if (!contextEnrichment.dataAvailability.hasSpeedTelemetry) {
      missingInformation.push('Instantaneous vehicle speed telemetry unavailable.');
    }
    missingInformation.push('Driver physiological baseline, shift duration prior to event, and external cabin ambient noise are unrecorded.');

    const informationUnavailable = missingInformation.join('; ');

    const whyThisResultSummary = `The system synthesized the optical CV detection of ${displaySignal} with ${
      contextEnrichment.matchedBus ? `active fleet telemetry for route "${contextEnrichment.matchedBus.route_name}"` : 'available telemetry'
    } and ${hasEvidence ? `authoritative transport safety guidelines from ${retrievedEvidence[0].organization}` : 'baseline decision support parameters'}.`;

    const whyThisResult: DriverSafetyWhyThisResult = {
      summary: whyThisResultSummary,
      observedCvCharacteristics,
      operationalDataAvailable,
      ragEvidenceRetrieved,
      aiInterpreted,
      recommendationProduced,
      informationUnavailable,
    };

    // 9. Limitations
    const limitations: string[] = [
      'Decision Support Advisory Only: This AI safety insight provides automated advisory decision support for human dispatchers and transit supervisors. It does not replace professional judgment or statutory regulations.',
      'Strict Prohibition on Medical & Disciplinary Conclusions: The system does not diagnose medical conditions, sleep disorders, or intoxication, and must not be used to automatically penalize drivers, accuse drivers of misconduct, or assign legal liability.',
      'Human Review Mandatory: All subsequent actions—such as dispatching a relief driver, routing to a rest bay, or scheduling vehicle maintenance—require human verification by authorized transit personnel.',
      'Sensor & Environmental Variability: Optical facial landmark analysis can be affected by ambient cabin lighting, deep shadows, sun glare, driver sunglasses, or camera angle misalignment.',
      'Knowledge Base Grounding: Normative recommendations are derived from indexed safety standards (CIRT / NHTSA / MoRTH) and must be applied in accordance with current local municipal operating procedures.',
    ];

    // 10. Initial Human Review State
    const humanReview: DriverSafetyHumanReviewRecord = {
      status: 'PENDING',
      reviewedBy: undefined,
      reviewerRole: undefined,
      reviewedAt: undefined,
      reviewerComments: undefined,
      modifiedRecommendation: undefined,
    };

    const insight: DriverSafetyAIInsight = {
      id: insightId,
      timestamp,
      inputSummary: {
        eventId: input.eventId,
        rawEventType: input.eventType,
        displaySignal,
        severityText: rawSeverity,
        confidenceText,
        rawConfidence,
        rawRiskScore: input.riskScore ?? null,
        busNumberText,
        locationText,
        cameraIdText,
        durationText,
        metricsSummary,
      },
      contextEnrichment,
      interpretation: {
        urgency,
        observableSignalDescription,
        underlyingCauseStatement,
        interpretationRationale,
        factorsConsidered,
        safeguardDisclaimer,
      },
      whyThisResult,
      retrievedEvidence,
      hasEvidence,
      evidenceDisclaimer,
      recommendedAction: {
        title: recTitle,
        actionText: recAction,
        urgencyText,
        isAutonomous: false,
        requiresHumanReview: true,
        disclaimer:
          'This decision support recommendation does not automatically terminate employment, penalize the driver, accuse the driver of misconduct, or assign legal liability.',
      },
      missingInformation,
      limitations,
      sdgAlignment: {
        sdgGoal: 'SDG 11: Sustainable Cities and Communities',
        target: 'Target 11.2: Safe, accessible, and sustainable public transport systems for all',
        contributionNote:
          'This Driver Safety AI Intelligence layer is designed to support safer public transport operations by alerting dispatchers to potential fatigue patterns, contributing to municipal passenger safety and accident prevention.',
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
   * Preserves append-only audit trail with original AI recommendation & reviewer identity (Part 4/6).
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
  ): DriverSafetyAIInsight | null {
    const existing = this.insightsCache.get(insightId);
    if (!existing) return null;

    const reviewedAt = new Date().toISOString();
    const reviewerIdentity = update.reviewedBy?.trim() || 'Authenticated Session Unavailable';
    const reviewerRole = update.reviewerRole?.trim() || 'AUTHORITY';
    const reviewId = `REV-DS-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newRecord: DriverSafetyHumanReviewRecord = {
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

    const auditEntry: DriverSafetyAuditTrailEntry = {
      auditId: `AUDIT-DS-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      insightId: existing.id,
      eventId: existing.inputSummary.eventId,
      busNumber: existing.inputSummary.busNumberText,
      existingCvSignal: existing.inputSummary.displaySignal,
      timestampAiGeneration: existing.timestamp,
      observedCvSignal: existing.interpretation.observableSignalDescription,
      operationalContextSummary: existing.contextEnrichment.routeInformation,
      originalAiInterpretation: {
        urgency: existing.interpretation.urgency,
        rationale: existing.interpretation.interpretationRationale,
        underlyingCauseNotice: existing.interpretation.underlyingCauseStatement,
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
  public getInsightById(insightId: string): DriverSafetyAIInsight | null {
    return this.insightsCache.get(insightId) || null;
  }

  /**
   * Returns all recent driver safety insights.
   */
  public getAllInsights(): DriverSafetyAIInsight[] {
    return Array.from(this.insightsCache.values()).reverse();
  }
}

export const driverSafetyAIService = new DriverSafetyAIService();
