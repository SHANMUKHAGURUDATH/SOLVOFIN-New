/**
 * Solvofin Controlled AI Navigator & Global AI Search Engine (Part 10)
 *
 * NON-NEGOTIABLE PRINCIPLES:
 * 1. STRICTLY READ-ONLY BY DEFAULT:
 *    No autonomous record creation, updates, deletions, work orders, incident closure,
 *    recommendation acceptance, dispatching, or database mutations.
 * 2. TOOL ALLOWLIST:
 *    Every operation strictly maps to an explicit approved server-side read function.
 *    No arbitrary SQL, arbitrary queries, shell execution, or code execution.
 * 3. ROLE-BASED ACCESS:
 *    Respects GOVERNMENT vs CITIZEN permissions. Sensitive driver biometrics, internal
 *    contractor rates, and administrative audit logs are restricted from CITIZEN view.
 * 4. STRICT RAG GROUNDING:
 *    Reuses existing Solvofin Document RAG Engine (ragEngine). Displays complete metadata
 *    (Title, Organization, Section, Page, URL). Never fabricates citations.
 *    If no evidence retrieved, explicitly states:
 *    "No relevant knowledge-base evidence was retrieved for this question."
 * 5. LIVE DATA + RAG SEPARATION:
 *    Clearly differentiates: Answer, Observed Solvofin Data, Retrieved Evidence,
 *    AI Interpretation, Recommended Next View, and Information Missing.
 * 6. PROMPT INJECTION RESISTANCE:
 *    Treats retrieved data as untrusted data, never as system instructions.
 * 7. AUDIT LOGGING:
 *    Integrates append-only audit tracking into existing aiReportService.
 */

import { db } from './db.js';
import { ragEngine } from './ragEngine.js';
import { infrastructureAIService } from './infrastructureAI.js';
import { driverSafetyAIService } from './driverSafetyAI.js';
import { incidentAIService } from './incidentAI.js';
import { aiReportService } from './aiReportService.js';
import { RetrievedChunk } from './ragTypes.js';

export type AllowedNavigatorTool =
  | 'search_incidents'
  | 'get_incident'
  | 'search_infrastructure'
  | 'get_infrastructure_case'
  | 'search_driver_safety'
  | 'get_driver_safety_case'
  | 'search_work_orders'
  | 'get_work_order'
  | 'search_routes'
  | 'get_route'
  | 'search_vehicles'
  | 'get_vehicle'
  | 'search_alerts'
  | 'get_alert'
  | 'search_traffic'
  | 'search_heatwave'
  | 'search_rag_documents'
  | 'get_ai_insight'
  | 'get_human_review'
  | 'get_audit_history'
  | 'navigate_to_view'
  | 'unauthorized_access'
  | 'refused_mutation';

export interface NavigatorObservedItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  severityOrStatus?: string;
  location?: string;
  details?: string;
  rawData?: any;
}

export interface NavigatorRecommendedView {
  tabId: string;
  label: string;
  description: string;
  badge?: string;
}

export interface NavigatorQueryResponse {
  answer: string;
  toolUsed: AllowedNavigatorTool;
  role: string;
  observedData: NavigatorObservedItem[];
  retrievedEvidence: RetrievedChunk[];
  aiInterpretation: string;
  recommendedNextView?: NavigatorRecommendedView;
  informationMissing?: string;
  safetyNotice?: string;
  limitationsNotice: string;
  executionTimestamp: string;
}

export interface ToolDefinition {
  name: AllowedNavigatorTool;
  description: string;
  accessRole: 'ALL' | 'GOVERNMENT_ONLY';
  category: 'SAFETY' | 'INFRASTRUCTURE' | 'MOBILITY' | 'STANDARDS' | 'GOVERNANCE' | 'SYSTEM';
}

export const ALLOWLISTED_NAVIGATOR_TOOLS: ToolDefinition[] = [
  {
    name: 'search_incidents',
    description: 'Searches recorded transit accidents, near-misses, and safety events.',
    accessRole: 'ALL',
    category: 'SAFETY',
  },
  {
    name: 'get_incident',
    description: 'Retrieves a specific recorded incident by its unique identifier.',
    accessRole: 'ALL',
    category: 'SAFETY',
  },
  {
    name: 'search_infrastructure',
    description: 'Searches detected road defects, potholes, surface cracking, and road hazards.',
    accessRole: 'ALL',
    category: 'INFRASTRUCTURE',
  },
  {
    name: 'get_infrastructure_case',
    description: 'Retrieves comprehensive inspection details and repair history for a specific defect.',
    accessRole: 'ALL',
    category: 'INFRASTRUCTURE',
  },
  {
    name: 'search_driver_safety',
    description: 'Searches in-cabin driver vigilance, drowsiness, and distraction safety events (Government only).',
    accessRole: 'GOVERNMENT_ONLY',
    category: 'SAFETY',
  },
  {
    name: 'get_driver_safety_case',
    description: 'Retrieves detailed telemetry for a driver vigilance event (Government only).',
    accessRole: 'GOVERNMENT_ONLY',
    category: 'SAFETY',
  },
  {
    name: 'search_work_orders',
    description: 'Searches municipal Bill of Quantities (BOQ) work orders and repair dispatch status.',
    accessRole: 'ALL',
    category: 'INFRASTRUCTURE',
  },
  {
    name: 'get_work_order',
    description: 'Retrieves specific municipal work order specifications and material estimates.',
    accessRole: 'ALL',
    category: 'INFRASTRUCTURE',
  },
  {
    name: 'search_routes',
    description: 'Searches transit corridors, origin-destination matrices, and schedule delays.',
    accessRole: 'ALL',
    category: 'MOBILITY',
  },
  {
    name: 'get_route',
    description: 'Retrieves detailed corridor delay metrics and queue lengths for a specific route.',
    accessRole: 'ALL',
    category: 'MOBILITY',
  },
  {
    name: 'search_vehicles',
    description: 'Searches active transit and campus fleet buses, occupancy, and current coordinates.',
    accessRole: 'ALL',
    category: 'MOBILITY',
  },
  {
    name: 'get_vehicle',
    description: 'Retrieves real-time status and hazard notifications for a specific vehicle.',
    accessRole: 'ALL',
    category: 'MOBILITY',
  },
  {
    name: 'search_alerts',
    description: 'Searches municipal and transit safety alerts broadcast across the city.',
    accessRole: 'ALL',
    category: 'GOVERNANCE',
  },
  {
    name: 'get_alert',
    description: 'Retrieves full advisory bulletin details for an alert.',
    accessRole: 'ALL',
    category: 'GOVERNANCE',
  },
  {
    name: 'search_traffic',
    description: 'Searches urban bottleneck chokepoints and congestion choke-points.',
    accessRole: 'ALL',
    category: 'MOBILITY',
  },
  {
    name: 'search_heatwave',
    description: 'Searches urban microclimate thermal zones and surface temperature anomalies.',
    accessRole: 'ALL',
    category: 'MOBILITY',
  },
  {
    name: 'search_rag_documents',
    description: 'Retrieves authoritative civil engineering and transit safety standards (IRC, MoRTH, AIS-140, SDG 11).',
    accessRole: 'ALL',
    category: 'STANDARDS',
  },
  {
    name: 'get_ai_insight',
    description: 'Retrieves AI-generated decision-support insights and explainability trees.',
    accessRole: 'ALL',
    category: 'GOVERNANCE',
  },
  {
    name: 'get_human_review',
    description: 'Retrieves human-in-the-loop oversight review decisions (Accepted / Modified / Rejected).',
    accessRole: 'ALL',
    category: 'GOVERNANCE',
  },
  {
    name: 'get_audit_history',
    description: 'Retrieves append-only audit trail logs for municipal accountability (Government only).',
    accessRole: 'GOVERNMENT_ONLY',
    category: 'GOVERNANCE',
  },
  {
    name: 'navigate_to_view',
    description: 'Assists with rapid, direct navigation to authorized application dashboards and views.',
    accessRole: 'ALL',
    category: 'SYSTEM',
  },
];

const STANDARD_LIMITATION_NOTICE =
  'AI Navigator provides information and decision support using available Solvofin data and retrieved knowledge-base evidence. It may be incomplete or incorrect. Human review remains required for consequential operational decisions.';

export class ControlledAINavigatorService {
  /**
   * Main entry point for AI Navigator queries.
   */
  public async executeQuery(
    rawQuery: string,
    role: string = 'GOVERNMENT',
    currentView?: string
  ): Promise<NavigatorQueryResponse> {
    const timestamp = new Date().toISOString();
    const query = (rawQuery || '').trim();
    const normalizedQuery = query.toLowerCase();
    const isCitizen = role.toUpperCase() === 'CITIZEN';

    // -----------------------------------------------------------------------
    // 1. SAFETY & IMMUTABILITY CHECK (Refuse destructive or mutation actions)
    // -----------------------------------------------------------------------
    if (this.isAttemptedMutation(normalizedQuery)) {
      const refusalMsg =
        'The AI Navigator is strictly read-only and advisory. Any operational decision or data modification (such as creating work orders, closing incidents, modifying human reviews, changing database records, or issuing penalties) requires authorized human review through the designated operational portal.';

      // Record refusal event in audit trail
      aiReportService.recordReportAuditAction({
        action: 'AI_EVIDENCE_RETRIEVED',
        reportType: 'OPERATIONAL',
        entityId: 'REFUSED_MUTATION',
        userRole: role,
        comment: `AI Navigator intercepted and refused attempted mutation: "${query.slice(0, 80)}"`,
        metadata: { query: query.slice(0, 100), refused: true },
      });

      return {
        answer: refusalMsg,
        toolUsed: 'refused_mutation',
        role,
        observedData: [],
        retrievedEvidence: [],
        aiInterpretation:
          'Safety policy enforcement: Autonomous execution of operational modifications is prohibited by system design.',
        safetyNotice: 'Mutation commands are intercepted and blocked.',
        limitationsNotice: STANDARD_LIMITATION_NOTICE,
        executionTimestamp: timestamp,
      };
    }

    // -----------------------------------------------------------------------
    // 2. DETERMINISTIC NAVIGATION RECOGNITION (Fast, zero-latency routing)
    // -----------------------------------------------------------------------
    const navMatch = this.detectNavigationIntent(normalizedQuery, isCitizen);
    if (navMatch) {
      // Record navigation assistance in audit trail
      aiReportService.recordReportAuditAction({
        action: 'AI_EVIDENCE_RETRIEVED',
        reportType: 'OPERATIONAL',
        entityId: 'NAVIGATE_TO_VIEW',
        userRole: role,
        comment: `AI Navigator guided user to view: ${navMatch.tabId}`,
        metadata: { query: query.slice(0, 100), targetTab: navMatch.tabId },
      });

      return {
        answer: `Navigating to **${navMatch.label}**. ${navMatch.description}`,
        toolUsed: 'navigate_to_view',
        role,
        observedData: [],
        retrievedEvidence: [],
        aiInterpretation: `Direct navigation requested for view "${navMatch.tabId}".`,
        recommendedNextView: navMatch,
        limitationsNotice: STANDARD_LIMITATION_NOTICE,
        executionTimestamp: timestamp,
      };
    }

    // -----------------------------------------------------------------------
    // 3. ALLOWLISTED TOOL SELECTION & EXECUTION
    // -----------------------------------------------------------------------
    let toolUsed: AllowedNavigatorTool = 'search_infrastructure';
    let observedData: NavigatorObservedItem[] = [];
    let retrievedEvidence: RetrievedChunk[] = [];
    let answer = '';
    let aiInterpretation = '';
    let recommendedView: NavigatorRecommendedView | undefined;
    let informationMissing: string | undefined;

    // Check specific domain queries:

    // A. Driver Safety
    if (
      normalizedQuery.includes('driver') ||
      normalizedQuery.includes('drowsiness') ||
      normalizedQuery.includes('perclos') ||
      normalizedQuery.includes('yawn') ||
      normalizedQuery.includes('distraction') ||
      normalizedQuery.includes('vigilance')
    ) {
      if (isCitizen) {
        toolUsed = 'unauthorized_access';
        answer =
          'Driver vigilance and facial landmark telemetry contains restricted internal transport safety records not accessible from the Citizen role. Please switch to Government or Operator role to inspect driver safety monitoring.';
        aiInterpretation = 'Role-based access boundary enforced for driver telemetry.';
        recommendedView = {
          tabId: 'citizen_portal',
          label: 'Citizen Portal',
          description: 'Return to public citizen reports and urban transit tracking.',
        };
      } else {
        toolUsed = 'search_driver_safety';
        const events = db.getDriverSafetyEvents();
        observedData = events.slice(0, 6).map((e) => ({
          id: e.id,
          type: 'Driver Safety Event',
          title: `${e.event_type.replace(/_/g, ' ')} (${e.severity})`,
          subtitle: `Bus: ${e.bus_number} | Risk Score: ${e.risk_score}/100`,
          severityOrStatus: e.severity,
          location: e.latitude && e.longitude ? `📍 ${e.latitude.toFixed(4)}, ${e.longitude.toFixed(4)}` : 'On Transit Route',
          details: `Confidence: ${(e.confidence * 100).toFixed(1)}% | Status: ${e.status} ${e.notes ? `| Notes: ${e.notes}` : ''}`,
        }));

        retrievedEvidence = ragEngine.retrieveRelevantChunks('AIS-140 driver drowsiness in-cabin vigilance fatigue', 2);

        answer = `Found **${events.length} driver vigilance event(s)** in the live database. ${
          events.filter((e) => e.severity === 'CRITICAL').length
        } critical events flagged (including prolonged eye closure and yawning).`;
        aiInterpretation =
          'Driver monitoring signals are advisory indicators to assist shift supervisors with fatigue management, not definitive medical diagnoses.';
        recommendedView = {
          tabId: 'driver_safety',
          label: 'Driver Safety Hub',
          description: 'Inspect live webcam vigilance, PERCLOS charts, and supervisor dispatch controls.',
          badge: `${events.length} Events`,
        };
        informationMissing = 'Driver shift duty hours and cumulative weekly driving hours require external transit HR roster integration.';
      }
    }
    // B. Incidents
    else if (
      normalizedQuery.includes('incident') ||
      normalizedQuery.includes('accident') ||
      normalizedQuery.includes('collision') ||
      normalizedQuery.includes('near-miss') ||
      normalizedQuery.includes('near miss')
    ) {
      toolUsed = 'search_incidents';
      const incidents = db.getAllIncidents();
      const filtered = normalizedQuery.includes('critical')
        ? incidents.filter((i) => i.severity === 'CRITICAL')
        : incidents;

      observedData = filtered.slice(0, 6).map((i) => ({
        id: i.id,
        type: 'Transit Incident',
        title: `${i.type.replace(/_/g, ' ')} (${i.severity})`,
        subtitle: `Status: ${i.status || 'ACTIVE'} | Media ID: ${i.media_id}`,
        severityOrStatus: i.status || 'ACTIVE',
        location: i.latitude && i.longitude ? `📍 ${i.latitude.toFixed(4)}, ${i.longitude.toFixed(4)}` : 'Urban Corridor',
        details: i.description || 'Logged transit safety occurrence.',
      }));

      retrievedEvidence = ragEngine.retrieveRelevantChunks('MoRTH road accident incident emergency protocols', 2);

      answer = `Retrieved **${incidents.length} recorded transit incident(s)** from the database (${
        incidents.filter((i) => i.status === 'ACTIVE').length
      } active, ${incidents.filter((i) => i.severity === 'CRITICAL').length} critical).`;
      aiInterpretation =
        'Incidents reflect observed road/transit events logged from video streams and telemetry. Consequential dispatch requires human operator authorization.';
      recommendedView = {
        tabId: 'dashboard',
        label: 'Incident Command Center',
        description: 'Review active incident logs, spatial clustering, and incident dispatch.',
      };
      informationMissing = 'Longitudinal police FIR records and hospital injury severity registries are not integrated.';
    }
    // C. Work Orders & BOQ
    else if (
      normalizedQuery.includes('work order') ||
      normalizedQuery.includes('boq') ||
      normalizedQuery.includes('contractor') ||
      normalizedQuery.includes('repair') ||
      normalizedQuery.includes('asphalt ton') ||
      normalizedQuery.includes('material')
    ) {
      toolUsed = 'search_work_orders';
      const orders = db.getWorkOrders();
      observedData = orders.slice(0, 6).map((w) => ({
        id: w.id,
        type: 'Municipal Work Order',
        title: `Work Order ${w.id} — ${w.title || 'Road Repair'}`,
        subtitle: `Status: ${w.status} | Division: ${w.division_assigned || 'Civil Works'}`,
        severityOrStatus: w.status,
        location: w.location?.address || 'Municipal Roadway',
        details: isCitizen
          ? `Status: ${w.status} | Asphalt: ${w.material_estimate?.asphalt_tons || 0} MT`
          : `Status: ${w.status} | Asphalt: ${w.material_estimate?.asphalt_tons || 0} MT | Cost: ₹${w.material_estimate?.total_cost_inr?.toLocaleString('en-IN') || 0}`,
      }));

      retrievedEvidence = ragEngine.retrieveRelevantChunks('IRC:82-2015 maintenance of bituminous surfaces pothole repairs BOQ', 2);

      answer = `Found **${orders.length} municipal work order(s)** (${
        orders.filter((w) => w.status === 'DISPATCHED').length
      } dispatched, ${orders.filter((w) => w.status === 'COMPLETED').length} completed).`;
      aiInterpretation =
        'Work orders translate detected road defect geometry into IRC-compliant Bill of Quantities (BOQ) material and crew dispatch schedules.';
      recommendedView = {
        tabId: 'workorders',
        label: 'Work Orders & BOQ',
        description: 'View asphalt tonnage estimates, contractor assignments, and dispatch approvals.',
      };
      if (isCitizen) {
        informationMissing = 'Detailed contractor unit pricing rates are classified for internal municipal administration.';
      }
    }
    // D. Traffic Bottlenecks & Mobility Delays
    else if (
      normalizedQuery.includes('traffic') ||
      normalizedQuery.includes('bottleneck') ||
      normalizedQuery.includes('congestion') ||
      normalizedQuery.includes('delay') ||
      normalizedQuery.includes('queue') ||
      normalizedQuery.includes('corridor')
    ) {
      toolUsed = 'search_traffic';
      const bottlenecks = db.getTrafficBottlenecks();
      const delays = db.getRouteDelays();

      observedData = bottlenecks.slice(0, 6).map((b) => ({
        id: b.id,
        type: 'Traffic Bottleneck',
        title: `${b.corridor_name} (${b.severity})`,
        subtitle: `Congestion: ${b.congestion_index}% | Delay: +${b.avg_delay_minutes} min`,
        severityOrStatus: b.severity,
        location: b.location?.address || 'Corridor Intersection',
        details: `Cause: ${b.bottleneck_cause.replace(/_/g, ' ')} | Queues: ${b.queue_length_meters}m | Recommendation: ${b.mitigation_action}`,
      }));

      retrievedEvidence = ragEngine.retrieveRelevantChunks('urban mobility traffic bottleneck corridor signal optimization', 2);

      answer = `Monitored **${bottlenecks.length} primary urban bottleneck chokepoints** and ${delays.length} active transit corridors. Average peak bottleneck delay is **${
        bottlenecks.length > 0 ? (bottlenecks.reduce((s, b) => s + b.avg_delay_minutes, 0) / bottlenecks.length).toFixed(1) : 0
      } minutes**.`;
      aiInterpretation =
        'Bottlenecks are identified through optical vehicle flow counts, queue tracking, and route timetable variance.';
      recommendedView = {
        tabId: 'od_delays',
        label: 'OD Matrix & Delays',
        description: 'Inspect corridor delays, origin-destination matrices, and intersection queues.',
      };
      informationMissing = 'Real-time adaptive traffic light controller (SCATS/ATCS) live telemetry feeds are not currently linked.';
    }
    // E. Heatwave & Thermal Microclimate
    else if (
      normalizedQuery.includes('heat') ||
      normalizedQuery.includes('heatwave') ||
      normalizedQuery.includes('temperature') ||
      normalizedQuery.includes('thermal') ||
      normalizedQuery.includes('hotspot')
    ) {
      toolUsed = 'search_heatwave';
      const heatwaves = db.getHeatwaveAnalytics();

      observedData = heatwaves.slice(0, 6).map((h) => ({
        id: h.id,
        type: 'Heatwave Thermal Zone',
        title: `${h.zone_name} (${h.alert_level})`,
        subtitle: `Surface Temp: ${h.surface_temperature_c}°C | Air Temp: ${h.ambient_temperature_c}°C`,
        severityOrStatus: h.alert_level,
        location: h.location?.address || 'Urban Zone',
        details: `Vulnerability Index: ${h.heat_vulnerability_index}/100 | Interventions: ${h.urban_cooling_interventions?.join(', ') || 'Tree canopy shade'}`,
      }));

      retrievedEvidence = ragEngine.retrieveRelevantChunks('heatwave urban heat island pavement softening temperatures', 2);

      const maxTemp = heatwaves.length > 0 ? Math.max(...heatwaves.map((h) => h.surface_temperature_c)) : 0;
      answer = `Recorded **${heatwaves.length} urban heatwave monitoring zones**. Maximum observed surface pavement temperature is **${maxTemp}°C**.`;
      aiInterpretation =
        'Extreme surface heat increases bituminous asphalt softening risk and causes commuter heat stress at unsheltered transit stops.';
      recommendedView = {
        tabId: 'analytics',
        label: 'Urban & Heatwave Hub',
        description: 'Explore thermal vulnerability maps, vegetation canopy coverage, and asphalt risk zones.',
      };
    }
    // F. Campus Buses & Transit Fleet
    else if (
      normalizedQuery.includes('bus') ||
      normalizedQuery.includes('fleet') ||
      normalizedQuery.includes('anits') ||
      normalizedQuery.includes('transit route')
    ) {
      toolUsed = 'search_vehicles';
      const buses = db.getCampusBuses();

      observedData = buses.slice(0, 6).map((b) => ({
        id: b.id,
        type: 'Transit Fleet Bus',
        title: `${b.bus_number} — ${b.route_name}`,
        subtitle: `Status: ${b.status} | Speed: ${b.current_location.speed_kmh} km/h`,
        severityOrStatus: b.status,
        location: `Occupancy: ${b.occupied_seats}/${b.capacity} seats`,
        details: `Driver: ${b.driver_name} | Hazards Ahead: ${b.hazard_alerts_ahead.length > 0 ? b.hazard_alerts_ahead.join(', ') : 'None'}`,
      }));

      retrievedEvidence = ragEngine.retrieveRelevantChunks('AIS-140 public transit tracking passenger safety regulations', 2);

      answer = `Tracking **${buses.length} active campus transit buses**. Current average speed is **${
        buses.length > 0 ? (buses.reduce((s, b) => s + b.current_location.speed_kmh, 0) / buses.length).toFixed(1) : 0
      } km/h**.`;
      aiInterpretation =
        'Live fleet coordinates are cross-referenced with roadway defect geospatial points to issue real-time hazard warnings to approaching vehicles.';
      recommendedView = {
        tabId: 'fleet',
        label: 'Campus Fleet Live',
        description: 'Track real-time bus locations, capacity occupancy, and corridor telematics.',
      };
    }
    // G. SDG 11 & Sustainability Impact
    else if (
      normalizedQuery.includes('sdg') ||
      normalizedQuery.includes('sustainability') ||
      normalizedQuery.includes('impact') ||
      normalizedQuery.includes('target 11') ||
      normalizedQuery.includes('emissions') ||
      normalizedQuery.includes('carbon')
    ) {
      toolUsed = 'search_rag_documents';
      retrievedEvidence = ragEngine.retrieveRelevantChunks('SDG 11 Target 11.2 safe accessible sustainable public transport', 3);

      const defects = db.getAllRoadDefects();
      const incidents = db.getAllIncidents();
      const orders = db.getWorkOrders();

      observedData = [
        {
          id: 'SDG-OBS-1',
          type: 'Observed Metric',
          title: 'Directly Observed Transit Safety & Defect Observations',
          details: `${incidents.length} recorded incidents, ${defects.length} detected road defects, ${orders.length} municipal work orders.`,
        },
        {
          id: 'SDG-OBS-2',
          type: 'Decision Support',
          title: 'AI Decision Support & Human Review Governance',
          details: 'Human-in-the-loop review workflow enforced with append-only audit logging.',
        },
        {
          id: 'SDG-OBS-3',
          type: 'Unmeasured Impact Boundary',
          title: 'Carbon / Fuel & Causal Accident Reduction Status',
          details: 'Not currently measured due to absence of vehicle tailpipe flow meters and external longitudinal hospital crash registries.',
        },
      ];

      answer =
        'Solvofin aligns with **UN Sustainable Development Goal 11 (Sustainable Cities and Communities)**, specifically **Target 11.2** concerning safe, accessible, and sustainable transport systems for all.';
      aiInterpretation =
        'The platform enforces empirical transparency by strictly differentiating directly observed sensor data from AI advisory support and unmeasured longitudinal outcomes.';
      recommendedView = {
        tabId: 'impact',
        label: 'Sustainability & Impact',
        description: 'View the SDG 11 impact intelligence dashboard, three tiers of reality, and transparency matrix.',
      };
      informationMissing =
        'CO₂ emissions savings and longitudinal multi-year accident reduction require external registries not measured by optical computer vision.';
    }
    // H. Authoritative Standards / RAG Evidence Questions
    else if (
      normalizedQuery.includes('standard') ||
      normalizedQuery.includes('evidence') ||
      normalizedQuery.includes('irc') ||
      normalizedQuery.includes('morth') ||
      normalizedQuery.includes('ais') ||
      normalizedQuery.includes('guideline') ||
      normalizedQuery.includes('code') ||
      normalizedQuery.includes('regulation')
    ) {
      toolUsed = 'search_rag_documents';
      retrievedEvidence = ragEngine.retrieveRelevantChunks(query, 4);

      if (retrievedEvidence.length > 0) {
        answer = `Retrieved **${retrievedEvidence.length} authoritative document reference(s)** from the Solvofin knowledge base matching your query.`;
        aiInterpretation =
          'Retrieved standards represent official government and technical guidelines used for contextual validation of engineering and safety workflows.';
      } else {
        answer = 'No relevant knowledge-base evidence was retrieved for this question.';
        aiInterpretation = 'The search query did not match any indexed clauses in the current RAG knowledge base.';
      }

      recommendedView = {
        tabId: 'responsible_ai',
        label: 'Responsible AI & SDG 11',
        description: 'Examine authoritative RAG documents, chunk metadata, and explainability cards.',
      };
    }
    // I. Audit History (Government Only)
    else if (
      normalizedQuery.includes('audit') ||
      normalizedQuery.includes('review decision') ||
      normalizedQuery.includes('reviewer') ||
      normalizedQuery.includes('history')
    ) {
      if (isCitizen) {
        toolUsed = 'unauthorized_access';
        answer =
          'Municipal operational audit trails and human review logs are restricted to Government and Administrative personnel. Please log in with a Government account to review audit logs.';
        aiInterpretation = 'Role-based access boundary enforced for administrative audit logs.';
        recommendedView = {
          tabId: 'citizen_portal',
          label: 'Citizen Portal',
          description: 'Return to public citizen reports and urban transit tracking.',
        };
      } else {
        toolUsed = 'get_audit_history';
        const audits = aiReportService.getReportAuditHistory();
        observedData = audits.slice(0, 6).map((a) => ({
          id: a.auditId,
          type: 'Audit Trail Entry',
          title: `${a.action.replace(/_/g, ' ')} (${a.status})`,
          subtitle: `Officer: ${a.user} | Role: ${a.userRole}`,
          severityOrStatus: a.status,
          location: `Entity: ${a.entityId}`,
          details: `${a.comment} | Timestamp: ${new Date(a.timestamp).toLocaleString()}`,
        }));

        answer = `Found **${audits.length} recorded audit trail entry/entries** in the append-only operational log.`;
        aiInterpretation =
          'Append-only audit logs track every consequential human review decision, report generation, and system alert for complete municipal accountability.';
        recommendedView = {
          tabId: 'responsible_ai',
          label: 'Responsible AI & SDG 11',
          description: 'Audit RAG provenance, human review verification, and governance records.',
        };
      }
    }
    // J. Default: Infrastructure / Road Defect Search
    else {
      toolUsed = 'search_infrastructure';
      const defects = db.getAllRoadDefects();
      const potholes = defects.filter((d) => d.type === 'POTHOLE');

      observedData = defects.slice(0, 6).map((d) => ({
        id: d.id,
        type: d.type,
        title: `${d.type} (${d.severity})`,
        subtitle: `Depth: ${d.depth_cm || 0} cm | Dimensions: ${d.length_cm || 0}x${d.width_cm || 0} cm`,
        severityOrStatus: d.severity,
        location: d.latitude && d.longitude ? `📍 ${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}` : 'Road Section',
        details: `Confidence: ${(d.confidence * 100).toFixed(0)}% | Asphalt: ${d.asphalt_tons || 0} MT | Cost: ₹${d.repair_cost_inr ? d.repair_cost_inr.toLocaleString('en-IN') : 0}`,
      }));

      // Also retrieve RAG evidence for road maintenance
      retrievedEvidence = ragEngine.retrieveRelevantChunks(query, 2);

      answer = `Found **${defects.length} detected road defect(s)** across the municipal network (${potholes.length} active potholes, ${
        defects.filter((d) => d.severity === 'CRITICAL').length
      } critical severity).`;
      aiInterpretation =
        'Defects are detected from forward-facing vehicular video runs using computer vision bounding boxes and dimensional asphalt volume estimation.';
      recommendedView = {
        tabId: 'roads',
        label: 'Road Defects & Potholes',
        description: 'Explore detected road hazards, cavity dimensions, and repair priority rankings.',
        badge: `${defects.length} Defects`,
      };
      informationMissing = 'Sub-surface structural pavement layer tests (Falling Weight Deflectometer) are not performed by optical cameras.';
    }

    // -----------------------------------------------------------------------
    // 4. AUDIT LOGGING OF THE NAVIGATOR SEARCH EVENT
    // -----------------------------------------------------------------------
    try {
      aiReportService.recordReportAuditAction({
        action: 'AI_EVIDENCE_RETRIEVED',
        reportType: 'OPERATIONAL',
        entityId: toolUsed,
        userRole: role,
        comment: `AI Navigator executed query "${query.slice(0, 80)}" via tool ${toolUsed}.`,
        metadata: {
          query: query.slice(0, 100),
          tool: toolUsed,
          resultsCount: observedData.length,
          evidenceCount: retrievedEvidence.length,
          recommendedTab: recommendedView?.tabId,
        },
      });
    } catch (auditErr) {
      console.warn('[AI Navigator] Non-critical audit logging warning:', auditErr);
    }

    return {
      answer,
      toolUsed,
      role,
      observedData,
      retrievedEvidence,
      aiInterpretation,
      recommendedNextView: recommendedView,
      informationMissing,
      limitationsNotice: STANDARD_LIMITATION_NOTICE,
      executionTimestamp: timestamp,
    };
  }

  /**
   * Helper to detect attempted destructive, modifying, or mutation queries.
   */
  private isAttemptedMutation(q: string): boolean {
    const mutationPatterns = [
      /\bdelete\b/i,
      /\bremove\b/i,
      /\bdrop\b/i,
      /\btruncate\b/i,
      /\bupdate\b/i,
      /\bmodify\b/i,
      /\bchange\b/i,
      /\bedit\b/i,
      /\bcreate\s+(a\s+)?work\s*order\b/i,
      /\bcreate\b/i,
      /\bdispatch\s+crew\b/i,
      /\bdispatch\b/i,
      /\bclose\s+incident\b/i,
      /\breject\s+incident\b/i,
      /\breject\b/i,
      /\baccept\s+recommendation\b/i,
      /\baccept\s+ai\b/i,
      /\bfine\s+driver\b/i,
      /\bpunish(\s+the\s+driver)?\b/i,
      /\bpenalize\b/i,
      /\bshut\s+down\s+route\b/i,
      /\b(run|execute)\s+(sql|query|shell|cmd|command|script|code)\b/i,
      /\b(shell\s+command|exec|terminal|bash)\b/i,
      /\b(alter\s+table|insert\s+into|select\s+\*|from\s+users)\b/i,
      /\brun\s+sql\b/i,
      /\bsql\b/i,
      /\bkill\b/i,
      /\bformat\s+disk\b/i,
    ];

    return mutationPatterns.some((pattern) => pattern.test(q));
  }

  /**
   * Helper to detect direct navigation requests.
   */
  private detectNavigationIntent(q: string, isCitizen: boolean): NavigatorRecommendedView | null {
    // Check if query is a navigation command
    const isNavWord =
      q.startsWith('open ') ||
      q.startsWith('go to ') ||
      q.startsWith('navigate to ') ||
      q.startsWith('take me to ') ||
      q.startsWith('show view ') ||
      q === 'dashboard' ||
      q === 'potholes' ||
      q === 'driver safety' ||
      q === 'fleet' ||
      q === 'impact' ||
      q === 'responsible ai';

    if (!isNavWord) return null;

    if (q.includes('driver safety') || q.includes('driver')) {
      if (isCitizen) return null;
      return {
        tabId: 'driver_safety',
        label: 'Driver Safety Hub',
        description: 'Real-time in-cabin driver vigilance and facial landmark monitoring.',
      };
    }

    if (q.includes('road') || q.includes('pothole') || q.includes('defect')) {
      return {
        tabId: 'roads',
        label: 'Road Defects & Potholes',
        description: 'Comprehensive inventory of detected road hazards and cavity calculations.',
      };
    }

    if (q.includes('work order') || q.includes('boq')) {
      return {
        tabId: 'workorders',
        label: 'Work Orders & BOQ',
        description: 'Municipal repair orders and asphalt material requirements.',
      };
    }

    if (q.includes('impact') || q.includes('sustainability') || q.includes('sdg')) {
      return {
        tabId: 'impact',
        label: 'Sustainability & Impact',
        description: 'SDG 11 impact intelligence and system transparency matrix.',
      };
    }

    if (q.includes('responsible ai') || q.includes('rag') || q.includes('standards')) {
      return {
        tabId: 'responsible_ai',
        label: 'Responsible AI & SDG 11',
        description: 'Authoritative RAG document library and explainability records.',
      };
    }

    if (q.includes('fleet') || q.includes('bus')) {
      return {
        tabId: 'fleet',
        label: 'Campus Fleet Live',
        description: 'Live GPS telemetry and route occupancy for transit buses.',
      };
    }

    if (q.includes('traffic') || q.includes('delay') || q.includes('od')) {
      return {
        tabId: 'od_delays',
        label: 'OD Matrix & Delays',
        description: 'Urban mobility delays and origin-destination bottleneck matrices.',
      };
    }

    if (q.includes('heatwave') || q.includes('thermal') || q.includes('analytics')) {
      return {
        tabId: 'analytics',
        label: 'Urban & Heatwave Hub',
        description: 'Thermal microclimates and surface radiance analytics.',
      };
    }

    if (q.includes('citizen portal') || q.includes('report issue')) {
      return {
        tabId: 'citizen_portal',
        label: 'Citizen Reports & Tracking',
        description: 'Civic complaint lodging, photo uploads, and SLA resolution tracking.',
      };
    }

    if (q.includes('gis') || q.includes('map')) {
      return {
        tabId: 'map',
        label: 'GIS Map',
        description: 'Interactive geospatial mapping of all urban telemetry.',
      };
    }

    if (q.includes('dashboard') || q.includes('command')) {
      return {
        tabId: isCitizen ? 'citizen_portal' : 'dashboard',
        label: isCitizen ? 'Citizen Portal' : 'Central Command Dashboard',
        description: 'Primary operational overview and key indicators.',
      };
    }

    return null;
  }

  /**
   * Retrieves predefined quick suggestions for search palette.
   */
  public getSuggestions(role: string = 'GOVERNMENT'): string[] {
    const isCitizen = role.toUpperCase() === 'CITIZEN';
    if (isCitizen) {
      return [
        'Show unresolved infrastructure issues',
        'Summarize recent incidents',
        'Show the relevant SDG 11 context',
        'Which work orders relate to this defect?',
        'Summarize traffic bottlenecks',
        'What standards apply to road repairs?',
        'Open Citizen Portal',
        'Show Sustainability & Impact',
      ];
    }

    return [
      'Show unresolved infrastructure issues',
      'Summarize recent incidents',
      'Explain this infrastructure AI recommendation',
      'What evidence supports this recommendation?',
      'Show driver-safety observations',
      'Which work orders relate to this defect?',
      'Summarize traffic bottlenecks',
      'What information is missing for this incident?',
      'Show the relevant SDG 11 context',
      'Open Driver Safety',
      'Show Sustainability & Impact',
      'Open Responsible AI',
    ];
  }
}

export const controlledAiNavigatorService = new ControlledAINavigatorService();
