// SOLVOFIN Incident AI Intelligence Service (Part 7)
// Modular decision-support intelligence layer built additively on top of existing Solvofin incident records.
// Grounded in real Solvofin database telemetry and the authoritative Document RAG Engine.
// Strictly enforces non-fabrication, evidence provenance, human-in-the-loop review, and append-only audit trail.

import fs from 'fs';
import path from 'path';
import { db } from './db';
import { ragEngine } from './ragEngine';
import {
  IncidentAIInput,
  IncidentAIInsight,
  IncidentCategory,
  IncidentContextEnrichment,
  IncidentAISummary,
  IncidentAIInterpretation,
  IncidentAIRecommendation,
  IncidentWhyThisResult,
  IncidentAuditTrailEntry,
  IncidentHumanReviewRecord,
  IncidentSuggestedAttentionLevel,
} from './incidentAITypes';
import { HumanReviewStatus } from './infrastructureAITypes';

const INCIDENTS_STORAGE_PATH = path.join(process.cwd(), 'data', 'solvofin_incident_insights.json');

export class IncidentAIService {
  private insightsCache: Map<string, IncidentAIInsight> = new Map();

  constructor() {
    this.loadPersistedInsights();
  }

  private loadPersistedInsights(): void {
    try {
      if (fs.existsSync(INCIDENTS_STORAGE_PATH)) {
        const raw = fs.readFileSync(INCIDENTS_STORAGE_PATH, 'utf-8');
        const parsed: IncidentAIInsight[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item && item.id) {
              this.insightsCache.set(item.id, item);
            }
          });
        }
      }
    } catch (err) {
      console.warn('[IncidentAI] Failed to load persisted incident insights, starting fresh:', err);
    }
  }

  private persistInsights(): void {
    try {
      const dataDir = path.dirname(INCIDENTS_STORAGE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const array = Array.from(this.insightsCache.values());
      fs.writeFileSync(INCIDENTS_STORAGE_PATH, JSON.stringify(array, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[IncidentAI] Failed to persist incident insights to disk:', err);
    }
  }

  /**
   * Enriches existing incident data with real operational records from the Solvofin database.
   * STRICT NON-FABRICATION RULE: Only queries data that actually exists in db.ts.
   */
  private enrichContext(input: IncidentAIInput): IncidentContextEnrichment {
    const allMedia = db.getMediaList ? db.getMediaList(true) : [];
    const allPlates = db.getAllLicensePlates ? db.getAllLicensePlates() : [];
    const allVehicles = db.getAllVehicles ? db.getAllVehicles() : [];
    const campusBuses = db.getCampusBuses ? db.getCampusBuses() : [];
    const roadDefects = db.getAllRoadDefects ? db.getAllRoadDefects() : [];
    const bottlenecks = db.getTrafficBottlenecks ? db.getTrafficBottlenecks() : [];
    const heatwaves = db.getHeatwaveAnalytics ? db.getHeatwaveAnalytics() : [];
    const workOrders = db.getWorkOrders ? db.getWorkOrders() : [];
    const allIncidents = db.getAllIncidents ? db.getAllIncidents() : [];

    // 1. Matched Media record
    let matchedMedia: IncidentContextEnrichment['matchedMedia'] = null;
    if (input.media_id) {
      const m = allMedia.find((item: any) => item.id === input.media_id);
      if (m) {
        matchedMedia = {
          id: m.id,
          filename: m.original_filename || undefined,
          road_name: m.scene_location?.address_or_name || m.upload_location?.address_or_name || undefined,
          location: m.scene_location?.address_or_name || m.upload_location?.address_or_name || undefined,
          capture_time: m.upload_time || m.created_at || undefined,
        };
      }
    }

    // 2. Matched Plate & Vehicle
    let matchedVehiclePlate: IncidentContextEnrichment['matchedVehiclePlate'] = null;
    if (input.plate_number) {
      const cleanPlate = input.plate_number.replace(/\s+/g, '').toUpperCase();
      const matched = allPlates.find((p: any) =>
        (p.plate_number || '').replace(/\s+/g, '').toUpperCase() === cleanPlate
      );
      const vehicle = allVehicles.find((v: any) =>
        (input.vehicle_track_id && v.track_id === input.vehicle_track_id) ||
        (matched && v.license_plate_id === matched.id)
      );

      if (matched) {
        matchedVehiclePlate = {
          plate: matched.plate_number,
          category: vehicle?.vehicle_type || undefined,
          speed: vehicle?.speed_kmh_est ?? null,
          jurisdiction: matched.state_or_jurisdiction || 'Indian State Transit',
        };
      } else {
        matchedVehiclePlate = {
          plate: input.plate_number,
          category: vehicle?.vehicle_type || undefined,
          speed: vehicle?.speed_kmh_est ?? null,
          jurisdiction: 'Unverified plate entry',
        };
      }
    }

    // 3. Matched Transit Bus
    let matchedTransitBus: IncidentContextEnrichment['matchedTransitBus'] = null;
    if (input.plate_number || input.vehicle_track_id) {
      const key = (input.plate_number || input.vehicle_track_id || '').replace(/\s+/g, '').toUpperCase();
      const bus = campusBuses.find((b: any) => {
        const busId = (b.id || '').replace(/\s+/g, '').toUpperCase();
        const route = (b.route_name || '').replace(/\s+/g, '').toUpperCase();
        return busId.includes(key) || key.includes(busId) || route.includes(key);
      });
      if (bus) {
        matchedTransitBus = {
          id: bus.id,
          route_name: bus.route_name || 'Standard Route',
          driver_name: bus.driver_name || undefined,
          status: bus.status || 'ACTIVE',
        };
      }
    }

    // 4. Nearby road defects if coordinates or media location match
    const nearbyDefects = roadDefects.filter((d: any) => {
      if (input.latitude != null && input.longitude != null && d.latitude != null && d.longitude != null) {
        const dLat = Math.abs(d.latitude - input.latitude);
        const dLng = Math.abs(d.longitude - input.longitude);
        return dLat < 0.015 && dLng < 0.015; // ~1.5 km
      }
      if (input.media_id && d.media_id === input.media_id) return true;
      return false;
    });

    const nearbyRoadDefectsCount = nearbyDefects.length;
    const nearbyRoadDefectsSummary =
      nearbyRoadDefectsCount > 0
        ? `${nearbyRoadDefectsCount} road defect(s) logged near corridor (${nearbyDefects.map((d: any) => `${d.defect_type || 'Defect'} [${d.severity || 'WARN'}]`).slice(0, 3).join(', ')})`
        : 'No recorded pavement defects within immediate corridor proximity';

    // 5. Nearby bottlenecks
    let nearbyBottlenecksSummary = 'No severe traffic bottlenecks flagged in corridor telemetry';
    if (bottlenecks.length > 0) {
      const matchingB = bottlenecks.find((b: any) => {
        if (input.latitude != null && input.longitude != null && b.location?.latitude && b.location?.longitude) {
          const dLat = Math.abs(b.location.latitude - input.latitude);
          const dLng = Math.abs(b.location.longitude - input.longitude);
          return dLat < 0.02 && dLng < 0.02;
        }
        return false;
      }) || bottlenecks[0];

      if (matchingB) {
        nearbyBottlenecksSummary = `${matchingB.corridor_name}: Congestion index ${matchingB.congestion_index ?? 'Active'} (Queue: ${matchingB.queue_length_meters ?? 0}m, Delay: ${matchingB.avg_delay_minutes ?? 0}m)`;
      }
    }

    // 6. Heatwave alerts
    let heatwaveAlertSummary = 'Ambient corridor thermal levels nominal';
    if (heatwaves.length > 0) {
      const severeH = heatwaves.find((h: any) => h.alert_level === 'RED_SEVERE' || h.alert_level === 'ORANGE_ALERT') || heatwaves[0];
      if (severeH) {
        heatwaveAlertSummary = `${severeH.zone_name}: ${severeH.surface_temperature_c}°C asphalt surface (${severeH.alert_level})`;
      }
    }

    // 7. Active work orders
    const activeWorkOrders = workOrders.filter((w: any) => {
      const desc = (w.description || '').toUpperCase();
      const loc = (w.location_address || '').toUpperCase();
      const plate = (input.plate_number || '').toUpperCase();
      const mediaLoc = (matchedMedia?.location || '').toUpperCase();
      return (plate && desc.includes(plate)) || (mediaLoc && (loc.includes(mediaLoc) || desc.includes(mediaLoc)));
    });

    // 8. Prior corridor incidents
    const priorCorridorIncidents = allIncidents.filter((inc: any) => {
      if (inc.id === input.incidentId) return false;
      if (input.media_id && inc.media_id === input.media_id) return true;
      if (input.latitude != null && input.longitude != null && inc.latitude != null && inc.longitude != null) {
        return Math.abs(inc.latitude - input.latitude) < 0.015 && Math.abs(inc.longitude - input.longitude) < 0.015;
      }
      return false;
    });

    const hasGps = input.latitude != null && input.longitude != null;
    const hasMediaContext = Boolean(matchedMedia);
    const hasPlateOrVehicle = Boolean(input.plate_number || input.vehicle_track_id);
    const hasNearbyDefects = nearbyRoadDefectsCount > 0;
    const hasWorkOrders = activeWorkOrders.length > 0;
    const hasCorridorTelemetry = bottlenecks.length > 0 || heatwaves.length > 0;

    return {
      matchedMedia,
      matchedVehiclePlate,
      matchedTransitBus,
      nearbyRoadDefectsCount,
      nearbyRoadDefectsSummary,
      nearbyBottlenecksSummary,
      heatwaveAlertSummary,
      activeWorkOrdersCount: activeWorkOrders.length,
      corridorPriorIncidentsCount: priorCorridorIncidents.length,
      dataAvailability: {
        hasGps,
        hasMediaContext,
        hasPlateOrVehicle,
        hasNearbyDefects,
        hasWorkOrders,
        hasCorridorTelemetry,
      },
    };
  }

  /**
   * Classify incident into standard Solvofin transit safety taxonomy.
   */
  private classifyCategory(type?: string, description?: string): IncidentCategory {
    const text = `${type || ''} ${description || ''}`.toUpperCase();
    if (text.includes('PEDESTRIAN') || text.includes('CROSSWALK') || text.includes('ZEBRA') || text.includes('CHILD')) {
      return 'PEDESTRIAN_SAFETY';
    }
    if (text.includes('RASH') || text.includes('ZIGZAG') || text.includes('WEAVING') || text.includes('OVERTAKE') || text.includes('SPEED')) {
      return 'ERRATIC_DRIVING';
    }
    if (text.includes('STALL') || text.includes('CONGESTION') || text.includes('GRIDLOCK') || text.includes('BOTTLENECK') || text.includes('QUEUE')) {
      return 'TRAFFIC_FLOW_OBSTRUCTION';
    }
    if (text.includes('POTHOLE') || text.includes('DIVIDER') || text.includes('CRACK') || text.includes('WATERLOGGING') || text.includes('ROAD_DEFECT')) {
      return 'INFRASTRUCTURE_HAZARD';
    }
    if (text.includes('BUS') || text.includes('TRUCK') || text.includes('SMOKE') || text.includes('FLEET')) {
      return 'COMMERCIAL_TRANSIT';
    }
    if (text.includes('HEAT') || text.includes('THERMAL') || text.includes('WEATHER') || text.includes('FLOOD')) {
      return 'ENVIRONMENTAL_HAZARD';
    }
    return 'OTHER';
  }

  /**
   * Derives a qualitative AI-suggested attention level without fabricating numerical probabilities.
   */
  private deriveSuggestedAttentionLevel(
    severity?: string,
    category?: IncidentCategory,
    nearbyDefects?: number
  ): IncidentSuggestedAttentionLevel {
    const sev = (severity || '').toUpperCase();
    if (sev === 'CRITICAL' || category === 'PEDESTRIAN_SAFETY') {
      return 'High';
    }
    if (sev === 'HIGH' || sev === 'MEDIUM' || (nearbyDefects && nearbyDefects > 1)) {
      return 'Moderate';
    }
    if (sev === 'LOW') {
      return 'Low';
    }
    return 'Unable to determine';
  }

  /**
   * Generates comprehensive AI Incident Intelligence grounded in real DB records and RAG documents.
   */
  public async generateInsight(input: IncidentAIInput): Promise<IncidentAIInsight> {
    const insightId = `INSIGHT-INC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    // 1. Context Enrichment from real DB records
    const contextEnrichment = this.enrichContext(input);

    // 2. Incident Categorization
    const category = this.classifyCategory(input.type, input.description);

    // Confidence handling: Use existing confidence if available and valid; otherwise "Confidence unavailable"
    let categoryConfidenceText = 'Confidence unavailable';
    let rawConfidence: number | null = null;
    if (typeof input.confidence === 'number' && !isNaN(input.confidence) && input.confidence >= 0 && input.confidence <= 1) {
      rawConfidence = input.confidence;
      categoryConfidenceText = `${Math.round(input.confidence * 100)}%`;
    }

    // 3. Document RAG Retrieval from Authoritative Standards
    const ragQuery = [
      input.type,
      input.description,
      category,
      contextEnrichment.matchedMedia?.road_name,
      contextEnrichment.nearbyRoadDefectsCount > 0 ? 'road defect crosswalk black spot safety' : '',
      'public transport collision mitigation traffic safety standard MoRTH',
    ]
      .filter(Boolean)
      .join(' ');

    const retrievedEvidence = ragEngine.retrieveRelevantChunks(ragQuery, 3, 0.07);
    const hasEvidence = retrievedEvidence.length > 0;
    const evidenceDisclaimer = hasEvidence
      ? 'Relevant evidence retrieved from authoritative transit safety and civil engineering standards (MoRTH / NUTP / IRC).'
      : 'No relevant knowledge-base evidence was retrieved for this case.';

    // 4. Incident Summarization (AI-generated concise summary)
    const whatHappened = input.description
      ? `Recorded incident indicates: ${input.description}`
      : input.type
      ? `A ${input.type.replace(/_/g, ' ').toLowerCase()} event was flagged in the telemetry stream.`
      : 'Incident logged without detailed narrative in source record.';

    let whereItOccurred = 'Location context unavailable';
    if (input.latitude != null && input.longitude != null) {
      whereItOccurred = `${input.latitude.toFixed(4)}° N, ${input.longitude.toFixed(4)}° E`;
      if (contextEnrichment.matchedMedia?.location) {
        whereItOccurred += ` (${contextEnrichment.matchedMedia.location})`;
      } else if (contextEnrichment.matchedMedia?.road_name) {
        whereItOccurred += ` (${contextEnrichment.matchedMedia.road_name})`;
      }
    } else if (contextEnrichment.matchedMedia?.location) {
      whereItOccurred = contextEnrichment.matchedMedia.location;
    } else if (contextEnrichment.matchedMedia?.road_name) {
      whereItOccurred = contextEnrichment.matchedMedia.road_name;
    }

    let whenItOccurred = 'Timestamp unrecorded';
    if (input.timestamp_sec != null) {
      whenItOccurred = `@ ${input.timestamp_sec}s into video stream (Frame #${input.frame_number ?? 'unrecorded'})`;
      if (contextEnrichment.matchedMedia?.capture_time) {
        whenItOccurred += ` [Capture Time: ${contextEnrichment.matchedMedia.capture_time}]`;
      }
    } else if (contextEnrichment.matchedMedia?.capture_time) {
      whenItOccurred = contextEnrichment.matchedMedia.capture_time;
    }

    const contextParts = [];
    if (input.plate_number) contextParts.push(`Plate: ${input.plate_number}`);
    if (input.vehicle_track_id) contextParts.push(`Track ID: ${input.vehicle_track_id}`);
    if (contextEnrichment.matchedTransitBus) contextParts.push(`Transit Bus: ${contextEnrichment.matchedTransitBus.id} (${contextEnrichment.matchedTransitBus.route_name})`);
    if (contextEnrichment.nearbyRoadDefectsCount > 0) contextParts.push(`${contextEnrichment.nearbyRoadDefectsCount} nearby road defect(s)`);
    if (contextEnrichment.activeWorkOrdersCount > 0) contextParts.push(`${contextEnrichment.activeWorkOrdersCount} active work order(s)`);
    const relevantAvailableContext = contextParts.length > 0 ? contextParts.join(' • ') : 'No additional contextual metadata recorded.';

    const summary: IncidentAISummary = {
      header: 'AI-generated summary',
      whatHappened,
      whereItOccurred,
      whenItOccurred,
      relevantAvailableContext,
    };

    // 5. Attention / Priority Handling
    const existingPriorityPreserved = input.severity ? `${input.severity.toUpperCase()}` : 'Unspecified';
    const suggestedAttentionLevel = this.deriveSuggestedAttentionLevel(
      input.severity,
      category,
      contextEnrichment.nearbyRoadDefectsCount
    );

    // 6. Evidence-Grounded Interpretation
    const factorsConsidered: string[] = [];
    factorsConsidered.push(`Source event type: ${input.type || 'Unspecified'}`);
    if (input.severity) factorsConsidered.push(`Original recorded severity: ${input.severity}`);
    if (contextEnrichment.dataAvailability.hasGps) factorsConsidered.push(`Geospatial coordinates (${whereItOccurred})`);
    if (contextEnrichment.nearbyRoadDefectsCount > 0) factorsConsidered.push(contextEnrichment.nearbyRoadDefectsSummary);
    if (contextEnrichment.matchedVehiclePlate) factorsConsidered.push(`Vehicle record (${contextEnrichment.matchedVehiclePlate.plate})`);
    if (hasEvidence) factorsConsidered.push(`Authoritative standards: ${retrievedEvidence.map((e) => e.documentTitle).join(', ')}`);

    let attentionRationale = '';
    if (suggestedAttentionLevel === 'High') {
      attentionRationale =
        'High attention is recommended due to potential pedestrian exposure or critical safety risk in the operational roadway.';
    } else if (suggestedAttentionLevel === 'Moderate') {
      attentionRationale =
        'Moderate attention is warranted to monitor traffic flow stability and ensure no corridor compounding hazards develop.';
    } else if (suggestedAttentionLevel === 'Low') {
      attentionRationale =
        'Low immediate urgency; routine monitoring during standard traffic management duty cycles is appropriate.';
    } else {
      attentionRationale =
        'Unable to determine attention level conclusively due to sparse contextual data.';
    }

    const interpretation: IncidentAIInterpretation = {
      suggestedAttentionLevel,
      attentionRationale,
      factorsConsidered,
      underlyingCauseStatement:
        'The underlying root cause cannot be conclusively established from this recorded incident excerpt alone.',
      legalLiabilityDisclaimer:
        'This advisory intelligence does not establish legal liability, driver fault, or statutory culpability.',
    };

    // 7. Advisory Recommendation (Non-autonomous decision support)
    let recTitle = 'Perform Routine Incident Verification';
    let recAction = 'Designated traffic control operator should verify the camera playback frame and note local road conditions.';
    let recUrgency = 'Within standard operational review cycle (30-60 minutes)';
    let recTeam = 'Traffic Control Command Center';

    if (category === 'PEDESTRIAN_SAFETY') {
      recTitle = 'Verify Pedestrian Safety Infrastructure & Crosswalk Marking';
      recAction =
        'Dispatch field team to verify crosswalk paint reflectivity and evaluate pedestrian refuge signal timing at this intersection.';
      recUrgency = 'Within 4-8 hours for high-footfall intersections';
      recTeam = 'Municipal Road Safety & Pedestrian Infrastructure Cell';
    } else if (category === 'ERRATIC_DRIVING') {
      recTitle = 'Correlate Telemetry with Corridor Speed Enforcements';
      recAction =
        'Cross-check vehicle track progression with upstream radar and automated ANPR speed sensors to evaluate recurring corridor weaving.';
      recUrgency = 'Next shift supervisory audit';
      recTeam = 'Traffic Enforcement & Surveillance Branch';
    } else if (category === 'TRAFFIC_FLOW_OBSTRUCTION') {
      recTitle = 'Monitor Corridor Queue Clearance & Bottleneck Dissipation';
      recAction =
        'Coordinate with corridor patrol unit to ensure stalled or slow vehicles clear the primary transit lane and prevent upstream spillover.';
      recUrgency = 'Immediate (15-30 minutes)';
      recTeam = 'Corridor Patrol & Quick Response Dispatch';
    } else if (category === 'INFRASTRUCTURE_HAZARD') {
      recTitle = 'Cross-Reference Active Road Defect & Work Orders';
      recAction =
        'Inspect matching pavement defect logs in the municipality database and confirm whether repair work order has been scheduled.';
      recUrgency = 'Within 24 hours';
      recTeam = 'Public Works Highway Maintenance Division';
    }

    const recommendedAction: IncidentAIRecommendation = {
      title: recTitle,
      actionText: recAction,
      urgencyText: recUrgency,
      targetTeam: recTeam,
      isAutonomous: false,
      requiresHumanReview: true,
      disclaimer:
        'Advisory decision support only. Does not automatically close/delete incidents, assign legal liability, issue citations, dispatch emergency services, or authorize expenditures.',
    };

    // 8. Missing Information Tracking
    const missingInformation: string[] = [];
    if (!contextEnrichment.dataAvailability.hasGps) {
      missingInformation.push('Accurate geolocation coordinates unavailable in incident record.');
    }
    if (rawConfidence == null) {
      missingInformation.push('Optical detection confidence score unrecorded in source record.');
    }
    if (!input.plate_number) {
      missingInformation.push('Vehicle registration plate unrecorded or obscured in source camera feed.');
    }
    if (!contextEnrichment.matchedVehiclePlate?.speed) {
      missingInformation.push('Instantaneous vehicle speed telemetry unavailable.');
    }
    missingInformation.push('Driver interview / statement unrecorded.');
    missingInformation.push('External ambient audio and micro-weather sensor telemetry unrecorded.');

    // 9. "Why This Result?" structured explanation
    const whyThisResult: IncidentWhyThisResult = {
      summary: `AI analyzed incident #${input.incidentId} (${input.type || 'Unspecified'}) with ${existingPriorityPreserved} priority.`,
      existingIncidentInfoConsidered: `Type: ${input.type || 'N/A'}, Severity: ${existingPriorityPreserved}, Description: "${input.description || 'N/A'}", Timestamp: ${whenItOccurred}, Confidence: ${categoryConfidenceText}.`,
      additionalOperationalContextConsidered: `Media: ${contextEnrichment.matchedMedia?.filename || 'N/A'}, Road: ${contextEnrichment.matchedMedia?.road_name || 'N/A'}, Defect context: ${contextEnrichment.nearbyRoadDefectsSummary}, Bottleneck context: ${contextEnrichment.nearbyBottlenecksSummary}.`,
      ragEvidenceRetrieved: hasEvidence
        ? retrievedEvidence.map((e) => `[${e.organization}] ${e.documentTitle} (${e.section || 'General'}, p.${e.page || 'N/A'})`).join('; ')
        : 'No relevant knowledge-base evidence was retrieved for this case.',
      aiInterpretation: `Classified as ${category} with suggested attention level "${suggestedAttentionLevel}". Rationale: ${attentionRationale}`,
      recommendationProduced: `Advisory action: "${recTitle}" targeting ${recTeam}. (Target urgency: ${recUrgency}).`,
      missingInformation: missingInformation.join('; '),
    };

    // 10. Limitations
    const limitations: string[] = [
      'Advisory Decision Support Only: This AI Incident Intelligence layer provides structured operational decision support for transit dispatchers and urban safety supervisors. It does not replace professional human judgment.',
      'Non-Autonomous Operations: The system does not automatically close incidents, modify statutory records, issue citations, dispatch emergency units, or authorize financial expenditures.',
      'Strict Prohibition on Fault & Liability: Optical and telemetric data cannot establish legal fault, intentionality, or statutory liability without authorized judicial or administrative proceedings.',
      'Contextual Dependency: Analysis is bounded by available video timestamps, camera resolution, lighting quality, and database telemetry completeness.',
      'Authoritative Standard Alignment: Retrieved evidence reflects standard public safety guidelines (MoRTH / NUTP / IRC) and must be applied in accordance with local municipal protocols.',
    ];

    // 11. Initial Human Review State (Pending)
    const initialHumanReview: IncidentHumanReviewRecord = {
      status: 'PENDING',
      originalAiRecommendation: { ...recommendedAction },
    };

    // 12. Audit Trail Entry
    const initialAuditEntry: IncidentAuditTrailEntry = {
      auditId: `AUDIT-INC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      insightId,
      incidentId: input.incidentId,
      timestampAiGeneration: timestamp,
      existingIncidentRecordSummary: `${input.type || 'INCIDENT'} | ${existingPriorityPreserved} | ${whereItOccurred} | ${whenItOccurred}`,
      originalAiSummary: { ...summary },
      originalAiInterpretation: { ...interpretation },
      originalAiRecommendation: { ...recommendedAction },
      evidenceReferences: retrievedEvidence.map((e) => ({
        documentId: e.documentId,
        documentTitle: e.documentTitle,
        organization: e.organization,
        section: e.section,
        page: e.page,
        url: e.url,
      })),
      reviewDecision: 'PENDING',
      reviewerIdentity: 'Automated AI Intelligence Synthesizer',
      reviewerRole: 'SYSTEM',
      reviewTimestamp: timestamp,
      reviewerComment: 'Initial AI-generated decision support package queued for human supervisor review.',
    };

    const insight: IncidentAIInsight = {
      id: insightId,
      incidentId: input.incidentId,
      timestamp,
      category,
      categoryConfidenceText,
      rawConfidence,
      summary,
      existingPriorityPreserved,
      contextEnrichment,
      retrievedEvidence,
      hasEvidence,
      evidenceDisclaimer,
      interpretation,
      recommendedAction,
      whyThisResult,
      missingInformation,
      limitations,
      sdgAlignment: {
        sdgGoal: 'SDG 11: Sustainable Cities and Communities',
        target: 'Target 11.2: Safe, accessible, and sustainable public transport systems for all',
        contributionNote:
          'This Incident AI Intelligence layer supports municipal traffic safety managers by synthesizing incident evidence with authoritative transit safety standards, contributing to safer, accessible, and resilient urban mobility.',
      },
      humanReview: initialHumanReview,
      reviewHistory: [initialHumanReview],
      auditTrail: [initialAuditEntry],
    };

    this.insightsCache.set(insight.id, insight);
    this.persistInsights();

    return insight;
  }

  /**
   * Submits a human review decision (ACCEPTED, MODIFIED, REJECTED) with an append-only audit entry.
   */
  public submitHumanReview(
    insightId: string,
    status: HumanReviewStatus,
    reviewerComments: string,
    modifiedRecommendation?: string,
    reviewedBy?: string,
    reviewerRole?: string
  ): IncidentAIInsight | null {
    const insight = this.insightsCache.get(insightId);
    if (!insight) return null;

    const reviewId = `REV-INC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const reviewedAt = new Date().toISOString();
    const effectiveReviewer = reviewedBy || 'Municipal Traffic Safety Supervisor';
    const effectiveRole = reviewerRole || 'AUTHORITY';

    const reviewRecord: IncidentHumanReviewRecord = {
      reviewId,
      status,
      reviewedBy: effectiveReviewer,
      reviewerRole: effectiveRole,
      reviewedAt,
      reviewerComments,
      modifiedRecommendation: status === 'MODIFIED' ? modifiedRecommendation : undefined,
      originalAiRecommendation: insight.recommendedAction ? { ...insight.recommendedAction } : undefined,
    };

    // Append to review history
    insight.humanReview = reviewRecord;
    insight.reviewHistory = insight.reviewHistory || [];
    insight.reviewHistory.push(reviewRecord);

    // If human modified recommendation, update current display while preserving original in audit
    if (status === 'MODIFIED' && modifiedRecommendation) {
      insight.recommendedAction.actionText = modifiedRecommendation;
    }

    // Append append-only audit trail entry
    const auditEntry: IncidentAuditTrailEntry = {
      auditId: `AUDIT-INC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      insightId: insight.id,
      incidentId: insight.incidentId,
      timestampAiGeneration: insight.timestamp,
      existingIncidentRecordSummary: `${insight.summary.whatHappened} | ${insight.summary.whereItOccurred}`,
      originalAiSummary: { ...insight.summary },
      originalAiInterpretation: { ...insight.interpretation },
      originalAiRecommendation: reviewRecord.originalAiRecommendation || { ...insight.recommendedAction },
      evidenceReferences: insight.retrievedEvidence.map((e) => ({
        documentId: e.documentId,
        documentTitle: e.documentTitle,
        organization: e.organization,
        section: e.section,
        page: e.page,
        url: e.url,
      })),
      reviewDecision: status,
      modifiedRecommendation: status === 'MODIFIED' ? modifiedRecommendation : undefined,
      reviewerIdentity: effectiveReviewer,
      reviewerRole: effectiveRole,
      reviewTimestamp: reviewedAt,
      reviewerComment: reviewerComments || 'No reviewer comments provided.',
    };

    insight.auditTrail = insight.auditTrail || [];
    insight.auditTrail.push(auditEntry);

    this.insightsCache.set(insight.id, insight);
    this.persistInsights();

    return insight;
  }

  public getAllInsights(): IncidentAIInsight[] {
    return Array.from(this.insightsCache.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getInsightById(id: string): IncidentAIInsight | undefined {
    return this.insightsCache.get(id);
  }

  public getInsightByIncidentId(incidentId: string): IncidentAIInsight | undefined {
    return Array.from(this.insightsCache.values()).find((i) => i.incidentId === incidentId);
  }
}

export const incidentAIService = new IncidentAIService();
