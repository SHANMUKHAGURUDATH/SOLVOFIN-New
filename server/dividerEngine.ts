import {
  RoadDividerDetection,
  RoadDividerType,
  RoadDividerCondition,
  DefectSeverity,
} from '../src/types';

export interface DividerCandidate {
  frame_number: number;
  timestamp_sec: number;
  bbox?: [number, number, number, number];
  raw_confidence: number;
  divider_type: RoadDividerType;
  condition: RoadDividerCondition;
  is_divided_highway_corridor: boolean;
  has_prior_barrier_continuity: boolean;
  gap_length_meters?: number;
  displacement_offset_cm?: number;
  gemini_notes?: string;
}

export class RoadDividerVisionEngine {
  public readonly MODEL_NAME = 'SOLVOFIN-RoadDividerInspection-v4.2';
  public readonly MODEL_VERSION = 'v4.2.1-MedianContinuity-MorphStructural';
  public readonly MODEL_HASH = 'sha256:5b80a11fc2e97483017a4198d02c914e6b12a';

  /**
   * Evaluates road median and barrier infrastructure.
   * Enforces strict false-positive suppression: roads without intended dividers
   * (e.g. single-lane local streets) are NEVER marked as "missing divider".
   * Only gaps in existing dividers, broken concrete segments, or displaced rails are flagged.
   * If evidence is ambiguous, explicitly tags 'INSUFFICIENT_EVIDENCE'.
   */
  public evaluateDividerCandidate(
    candidate: DividerCandidate,
    context: {
      mediaId: string;
      busId?: string;
      cameraId?: string;
      latitude?: number | null;
      longitude?: number | null;
    }
  ): RoadDividerDetection {
    const {
      frame_number,
      timestamp_sec,
      raw_confidence,
      divider_type,
      condition,
      is_divided_highway_corridor,
      has_prior_barrier_continuity,
      gap_length_meters = 0,
      displacement_offset_cm = 0,
    } = candidate;

    let finalCondition = condition;
    let isSufficientEvidence = true;
    let evidenceNote: string | undefined = undefined;
    let severity: DefectSeverity = 'LOW';
    let priorityScore = 40;

    // Strict validation rule:
    // If flagged as MISSING_DIVIDER_SECTION but the road is not a divided highway corridor
    // and lacks continuous prior barriers, do NOT false-flag as missing divider!
    if (finalCondition === 'MISSING_DIVIDER_SECTION') {
      if (!is_divided_highway_corridor && !has_prior_barrier_continuity) {
        finalCondition = 'INSUFFICIENT_EVIDENCE';
        isSufficientEvidence = false;
        evidenceNote = 'Insufficient visual evidence: Roadway is an undivided corridor without engineered central median continuity.';
      } else if (raw_confidence < 0.65) {
        finalCondition = 'INSUFFICIENT_EVIDENCE';
        isSufficientEvidence = false;
        evidenceNote = 'Insufficient visual evidence: Confidence below minimum barrier continuity verification threshold.';
      }
    }

    // Determine severity & priority
    switch (finalCondition) {
      case 'DISPLACED_INTO_LANE':
        severity = 'CRITICAL';
        priorityScore = 95;
        break;
      case 'MISSING_DIVIDER_SECTION':
        severity = gap_length_meters > 8 ? 'HIGH' : 'MEDIUM';
        priorityScore = gap_length_meters > 8 ? 85 : 70;
        break;
      case 'BROKEN_SECTION':
        severity = 'HIGH';
        priorityScore = 80;
        break;
      case 'DAMAGED_BARRIER':
        severity = 'MEDIUM';
        priorityScore = 65;
        break;
      case 'INSUFFICIENT_EVIDENCE':
        severity = 'LOW';
        priorityScore = 20;
        break;
      case 'INTACT_NOMINAL':
      default:
        severity = 'LOW';
        priorityScore = 15;
    }

    // Build descriptive message
    let description = '';
    let recommendedAction = '';
    const dividerLabel = divider_type.replace(/_/g, ' ').toLowerCase();

    if (finalCondition === 'INTACT_NOMINAL') {
      description = `Continuous nominal ${dividerLabel} verified along corridor median.`;
      recommendedAction = 'Routine optical monitoring.';
    } else if (finalCondition === 'INSUFFICIENT_EVIDENCE') {
      description = evidenceNote || 'Insufficient visual evidence to confirm divider defect.';
      recommendedAction = 'Maintain standard visual surveillance without manual dispatch.';
    } else if (finalCondition === 'MISSING_DIVIDER_SECTION') {
      description = `Critical gap detected in ${dividerLabel} (estimated ~${gap_length_meters.toFixed(1)}m gap) compromising median separation between opposing traffic streams.`;
      recommendedAction = `Dispatch Highway Maintenance Wing to install temporary safety drums and replace ~${Math.ceil(gap_length_meters)}m median section.`;
    } else if (finalCondition === 'DISPLACED_INTO_LANE') {
      description = `Damaged ${dividerLabel} displaced ~${displacement_offset_cm}cm into active traffic lane, posing immediate vehicular collision hazard.`;
      recommendedAction = 'Immediate emergency road crew dispatch to clear active lane obstruction.';
    } else if (finalCondition === 'BROKEN_SECTION') {
      description = `Structural fracture / concrete spalling detected across ${dividerLabel} section.`;
      recommendedAction = 'Schedule structural patch and re-anchoring within 48 hours.';
    } else {
      description = `Surface impact deformation and structural wear detected on ${dividerLabel}.`;
      recommendedAction = 'Log for scheduled highway maintenance cycle.';
    }

    const lat = context.latitude || null;
    const lng = context.longitude || null;

    return {
      id: `DIVIDER-${context.mediaId.slice(-4)}-${frame_number}`,
      media_id: context.mediaId,
      divider_type,
      condition: finalCondition,
      confidence: +raw_confidence.toFixed(2),
      is_sufficient_evidence: isSufficientEvidence,
      evidence_status_note: evidenceNote,
      severity,
      timestamp_sec: +timestamp_sec.toFixed(1),
      frame_number,
      camera_id: context.cameraId || 'CAM-FRONT',
      bus_id: context.busId || 'BUS-18-COASTAL-ROUTE',
      latitude: lat,
      longitude: lng,
      gps_status: lat && lng ? 'ACTIVE' : 'UNAVAILABLE',
      bbox: candidate.bbox || [42, 10, 88, 22],
      bbox_end: [
        Math.min(98, (candidate.bbox?.[0] || 42) + 2),
        Math.max(2, (candidate.bbox?.[1] || 10) - 2),
        Math.min(99, (candidate.bbox?.[2] || 88) + 2),
        Math.min(98, (candidate.bbox?.[3] || 22) + 2),
      ],
      barrier_length_meters_est: 25.0,
      gap_length_meters_est: gap_length_meters > 0 ? gap_length_meters : undefined,
      evidence_path: `/api/media/${context.mediaId}/evidence?frame=${frame_number}&type=DIVIDER`,
      description,
      recommended_action: recommendedAction,
      priority_score: priorityScore,
    };
  }

  /**
   * Calibrated divider scenarios for test suites:
   * 1. Clear highway with continuous median barrier
   * 2. Damaged jersey barrier / broken section
   * 3. Missing divider section on divided highway
   * 4. Undivided road where no divider is flagged (or marked Insufficient Evidence)
   */
  public generateCalibratedDividers(
    mediaId: string,
    durationSec: number,
    sceneType: 'NOMINAL' | 'DAMAGED_BARRIER' | 'MISSING_GAP' | 'UNDIVIDED_ROAD' = 'NOMINAL'
  ): DividerCandidate[] {
    if (sceneType === 'UNDIVIDED_ROAD') {
      // Must NOT flag missing divider!
      return [
        {
          frame_number: 30,
          timestamp_sec: 1.5,
          raw_confidence: 0.42,
          divider_type: 'CURB_MEDIAN_STRIP',
          condition: 'MISSING_DIVIDER_SECTION',
          is_divided_highway_corridor: false, // Undivided road
          has_prior_barrier_continuity: false,
        },
      ];
    }

    if (sceneType === 'MISSING_GAP') {
      return [
        {
          frame_number: 45,
          timestamp_sec: 2.2,
          bbox: [48, 8, 86, 20],
          raw_confidence: 0.92,
          divider_type: 'CONCRETE_JERSEY_BARRIER',
          condition: 'MISSING_DIVIDER_SECTION',
          is_divided_highway_corridor: true,
          has_prior_barrier_continuity: true,
          gap_length_meters: 12.5,
        },
      ];
    }

    if (sceneType === 'DAMAGED_BARRIER') {
      return [
        {
          frame_number: 60,
          timestamp_sec: 3.0,
          bbox: [50, 10, 88, 22],
          raw_confidence: 0.94,
          divider_type: 'STEEL_W_BEAM_GUARDRAIL',
          condition: 'DAMAGED_BARRIER',
          is_divided_highway_corridor: true,
          has_prior_barrier_continuity: true,
          displacement_offset_cm: 35,
        },
      ];
    }

    // NOMINAL
    return [
      {
        frame_number: 20,
        timestamp_sec: 1.0,
        bbox: [46, 6, 84, 18],
        raw_confidence: 0.96,
        divider_type: 'CONCRETE_JERSEY_BARRIER',
        condition: 'INTACT_NOMINAL',
        is_divided_highway_corridor: true,
        has_prior_barrier_continuity: true,
      },
    ];
  }
}

export const roadDividerVisionEngine = new RoadDividerVisionEngine();
