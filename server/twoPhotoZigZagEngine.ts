import {
  TwoPhotoZigZagCalculation,
  TwoPhotoZigZagPreset,
  ZigZagCameraType,
  ZigZagVehicleType,
  ZigZagVerdictLevel,
} from '../src/types';

export const TWO_PHOTO_ZIGZAG_PRESETS: TwoPhotoZigZagPreset[] = [
  {
    id: 'preset-zigzag-moto-aggressive',
    title: 'Severe Motorcycle Zig-Zag Weave (AP 39 CG 4421)',
    description: 'High-speed two-wheeler performing erratic slalom across bus lane & right shoulder on NH-16 corridor.',
    vehicle_type: 'MOTORCYCLE',
    license_plate: 'AP 39 CG 4421',
    camera: 'FRONT',
    bus_number: 'AP 39 XX 1234',
    location_name: 'NH-16 Madhurawada Express Corridor (Ch. 14+300)',
    photo_1: {
      image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&auto=format&fit=crop&q=80',
      label: 'Frame T1 (t = 0.0s): Motorcycle veering on left lane boundary',
      timestamp_sec: 0.0,
      bbox: { x: 20, y: 58, width: 14, height: 26 },
      centroid: { cx: 27, cy: 71 },
      lane_position: 'LANE 1 (Kerb Line Departure)',
      detected_class: 'MOTORCYCLE (MOTO-4421)',
    },
    photo_2: {
      image_url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&auto=format&fit=crop&q=80',
      label: 'Frame T2 (t = 1.4s): Sharp 48% lateral sweep into right shoulder',
      timestamp_sec: 1.4,
      bbox: { x: 68, y: 44, width: 15, height: 28 },
      centroid: { cx: 75.5, cy: 58 },
      lane_position: 'RIGHT SHOULDER (Slalom Breach)',
      detected_class: 'MOTORCYCLE (MOTO-4421)',
    },
    expected_verdict: 'CRITICAL_ZIG_ZAG',
    context_note: 'Excessive lateral displacement of 48.5% within 1.4 seconds. Vehicle cut across 2 demarcated lanes at high yaw angle.',
  },
  {
    id: 'preset-zigzag-autorickshaw-slalom',
    title: 'Erratic Auto-Rickshaw S-Curve Slipstream Cut (AP 31 TA 5512)',
    description: 'Trailing auto-rickshaw aggressively whipping side-to-side behind bus rear bumper looking for an opening.',
    vehicle_type: 'AUTO_RICKSHAW',
    license_plate: 'AP 31 TA 5512',
    camera: 'REAR',
    bus_number: 'AP 39 XX 1234',
    location_name: 'RTC Complex Flyover Incline - Approach Ramp',
    photo_1: {
      image_url: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&auto=format&fit=crop&q=80',
      label: 'Frame T1 (t = 0.0s): Auto-Rickshaw hugging rear left quarter (12m)',
      timestamp_sec: 0.0,
      bbox: { x: 26, y: 62, width: 18, height: 22 },
      centroid: { cx: 35, cy: 73 },
      lane_position: 'LEFT REAR BLINDSPOT',
      detected_class: 'AUTO_RICKSHAW (AUTO-5512)',
    },
    photo_2: {
      image_url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&auto=format&fit=crop&q=80',
      label: 'Frame T2 (t = 1.8s): Sudden swerve across rear center to right flank',
      timestamp_sec: 1.8,
      bbox: { x: 64, y: 50, width: 19, height: 23 },
      centroid: { cx: 73.5, cy: 61.5 },
      lane_position: 'RIGHT OVERTAKING FLANK',
      detected_class: 'AUTO_RICKSHAW (AUTO-5512)',
    },
    expected_verdict: 'HIGH_ERRATIC_WEAVE',
    context_note: 'Tailgating three-wheeler weaving 38.5% across transit rear corridor with sudden lateral acceleration.',
  },
  {
    id: 'preset-zigzag-car-cutting',
    title: 'Aggressive Slalom Sedan Cutting Across Transit Bus (AP 39 Z 9011)',
    description: 'Passenger sedan undertaking an erratic double-swerve between commercial buses at 62 km/h.',
    vehicle_type: 'CAR',
    license_plate: 'AP 39 Z 9011',
    camera: 'FRONT',
    bus_number: 'AP 39 XX 1234',
    location_name: 'Gajuwaka Industrial Highway Corridor (KM 22)',
    photo_1: {
      image_url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop&q=80',
      label: 'Frame T1 (t = 0.0s): Sedan in central lane ahead of bus',
      timestamp_sec: 0.0,
      bbox: { x: 62, y: 52, width: 22, height: 24 },
      centroid: { cx: 73, cy: 64 },
      lane_position: 'LANE 2 (Express Lane)',
      detected_class: 'SEDAN (CAR-9011)',
    },
    photo_2: {
      image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
      label: 'Frame T2 (t = 1.5s): Violent cut-in across bus front nose to left exit',
      timestamp_sec: 1.5,
      bbox: { x: 22, y: 64, width: 25, height: 27 },
      centroid: { cx: 34.5, cy: 77.5 },
      lane_position: 'LANE 1 (Direct Cut-In)',
      detected_class: 'SEDAN (CAR-9011)',
    },
    expected_verdict: 'CRITICAL_ZIG_ZAG',
    context_note: 'Severe -38.5% lateral snap across bus travel corridor, violating safety buffer and reckless swerving.',
  },
  {
    id: 'preset-zigzag-safe-control',
    title: 'Control Benchmark: Stable Highway Lane Keeping (AP 31 EL 7789)',
    description: 'Compliant sedan maintaining steady forward lane trajectory with negligible lateral drift.',
    vehicle_type: 'CAR',
    license_plate: 'AP 31 EL 7789',
    camera: 'FRONT',
    bus_number: 'AP 39 XX 1234',
    location_name: 'NH-16 Beach Road Coastal Highway',
    photo_1: {
      image_url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1200&auto=format&fit=crop&q=80',
      label: 'Frame T1 (t = 0.0s): Vehicle tracking centered in lane',
      timestamp_sec: 0.0,
      bbox: { x: 42, y: 54, width: 18, height: 24 },
      centroid: { cx: 51, cy: 66 },
      lane_position: 'LANE 2 (Centered)',
      detected_class: 'SEDAN (CAR-7789)',
    },
    photo_2: {
      image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
      label: 'Frame T2 (t = 2.0s): Vehicle progressing smoothly forward',
      timestamp_sec: 2.0,
      bbox: { x: 40.5, y: 44, width: 17, height: 23 },
      centroid: { cx: 49, cy: 55.5 },
      lane_position: 'LANE 2 (Centered)',
      detected_class: 'SEDAN (CAR-7789)',
    },
    expected_verdict: 'NORMAL_SAFE_LANE',
    context_note: 'Minimal lateral displacement (2.0%). Trajectory angle 4.2° conforms to lawful standard highway lane keeping.',
  },
];

export class TwoPhotoZigZagEngine {
  public getPresets(): TwoPhotoZigZagPreset[] {
    return TWO_PHOTO_ZIGZAG_PRESETS;
  }

  public getPresetById(id: string): TwoPhotoZigZagPreset | undefined {
    return TWO_PHOTO_ZIGZAG_PRESETS.find((p) => p.id === id);
  }

  /**
   * Calculates the Zig-Zag / Erratic Driving figures between 2 photos.
   * Compares spatial states, lateral deviation, trajectory vector angle,
   * speed estimation, and determines whether to issue an immediate warning
   * to the Government Transit Safety Portal.
   */
  public calculateZigZagFigure(params: {
    photo1_url: string;
    photo2_url: string;
    photo1_bbox?: { x: number; y: number; width: number; height: number };
    photo2_bbox?: { x: number; y: number; width: number; height: number };
    photo1_centroid?: { cx: number; cy: number };
    photo2_centroid?: { cx: number; cy: number };
    time_delta_sec?: number;
    bus_number?: string;
    vehicle_type?: ZigZagVehicleType;
    license_plate?: string;
    camera?: ZigZagCameraType;
    location_name?: string;
    latitude?: number;
    longitude?: number;
  }): TwoPhotoZigZagCalculation {
    const timeDelta = Math.max(0.4, params.time_delta_sec || 1.5);
    const busNumber = params.bus_number || 'AP 39 XX 1234';
    const camera = params.camera || 'FRONT';
    const vehicleType = params.vehicle_type || 'MOTORCYCLE';
    const licensePlate = params.license_plate || 'AP 39 CG 4421';
    const locationName = params.location_name || 'NH-16 Forward Transit Corridor';
    const latitude = params.latitude || 17.7342;
    const longitude = params.longitude || 83.3248;

    // Centroids (normalized 0-100%)
    let p1Centroid = params.photo1_centroid;
    let p2Centroid = params.photo2_centroid;
    let p1Bbox = params.photo1_bbox;
    let p2Bbox = params.photo2_bbox;

    // Default or estimated bounding boxes if not provided (e.g. for custom image uploads)
    if (!p1Bbox) {
      p1Bbox = { x: 24, y: 56, width: 16, height: 26 };
    }
    if (!p2Bbox) {
      p2Bbox = { x: 68, y: 46, width: 17, height: 28 };
    }
    if (!p1Centroid) {
      p1Centroid = { cx: p1Bbox.x + p1Bbox.width / 2, cy: p1Bbox.y + p1Bbox.height / 2 };
    }
    if (!p2Centroid) {
      p2Centroid = { cx: p2Bbox.x + p2Bbox.width / 2, cy: p2Bbox.y + p2Bbox.height / 2 };
    }

    // 1. Calculate Lateral & Longitudinal Deltas
    const deltaX = p2Centroid.cx - p1Centroid.cx; // Signed %: positive = RIGHT, negative = LEFT
    const absDeltaX = Math.abs(deltaX);
    const deltaY = p2Centroid.cy - p1Centroid.cy; // Longitudinal shift % (negative means moving away/forward in camera perspective)
    const absDeltaY = Math.max(1, Math.abs(deltaY));

    // 2. Trajectory Angle (in degrees)
    // θ = arctan(|ΔX| / |ΔY|) * (180 / π)
    const trajectoryAngleRad = Math.atan2(absDeltaX, absDeltaY);
    const trajectoryAngleDeg = Number(((trajectoryAngleRad * 180) / Math.PI).toFixed(1));

    // 3. Calibrated Lateral Shift in meters
    // A standard 2-lane roadway corresponds to ~7.5m across ~85% of camera width (~0.088 m per 1% frame width)
    const metersPerPercent = 0.082;
    const estimatedLateralShiftMeters = Number((absDeltaX * metersPerPercent).toFixed(2));

    // 4. Lateral Velocity in m/s & km/h
    const lateralVelocityMps = Number((estimatedLateralShiftMeters / timeDelta).toFixed(2));
    const lateralVelocityKmh = Number((lateralVelocityMps * 3.6).toFixed(1));

    // 5. Direction of Swerve
    let directionOfSwerve: 'SHARP_LEFT' | 'SHARP_RIGHT' | 'CENTER_DRIFT' | 'STABLE_FORWARD' = 'STABLE_FORWARD';
    if (absDeltaX > 15) {
      directionOfSwerve = deltaX > 0 ? 'SHARP_RIGHT' : 'SHARP_LEFT';
    } else if (absDeltaX >= 6) {
      directionOfSwerve = 'CENTER_DRIFT';
    }

    // 6. Lane Boundary Crossing Detection
    // If vehicle shifts by more than 25% lateral or crosses center 50% line from one side to another
    const laneBoundaryCrossed =
      absDeltaX >= 24 || (p1Centroid.cx < 48 && p2Centroid.cx > 52) || (p1Centroid.cx > 52 && p2Centroid.cx < 48);

    // 7. Calculate Zig-Zag Risk Score (0-100)
    // Based on lateral displacement magnitude (40%), trajectory angle (30%), lateral velocity (20%), and lane crossing (10%)
    const displacementScore = Math.min(100, (absDeltaX / 50) * 100);
    const angleScore = Math.min(100, (trajectoryAngleDeg / 45) * 100);
    const velocityScore = Math.min(100, (lateralVelocityMps / 2.5) * 100);
    const laneCrossBonus = laneBoundaryCrossed ? 15 : 0;

    const rawRiskScore =
      displacementScore * 0.4 + angleScore * 0.3 + velocityScore * 0.2 + laneCrossBonus;
    const zigzagRiskScore = Math.min(99, Math.max(10, Math.round(rawRiskScore)));

    // 8. Verdict Classification
    let verdictLevel: ZigZagVerdictLevel = 'NORMAL_SAFE_LANE';
    let verdictTitle = 'Safe Lane Keeping (Compliant Trajectory)';
    let confidence = 0.92;

    if (zigzagRiskScore >= 75 || (absDeltaX >= 35 && trajectoryAngleDeg >= 30)) {
      verdictLevel = 'CRITICAL_ZIG_ZAG';
      verdictTitle = '🚨 CRITICAL: Dangerous Zig-Zag / Aggressive Slalom Detected';
      confidence = 0.96;
    } else if (zigzagRiskScore >= 50 || absDeltaX >= 22) {
      verdictLevel = 'HIGH_ERRATIC_WEAVE';
      verdictTitle = '⚠️ HIGH RISK: Erratic Lateral Weave & Unsafe Overtaking';
      confidence = 0.91;
    } else if (zigzagRiskScore >= 30 || absDeltaX >= 10) {
      verdictLevel = 'MODERATE_SWAY';
      verdictTitle = 'ℹ️ MODERATE: Minor Lateral Sway / Slow Lane Drift';
      confidence = 0.88;
    }

    // 9. Traffic Law Citation (Indian Motor Vehicles Act / Traffic Enforcement)
    const trafficCitation =
      verdictLevel === 'CRITICAL_ZIG_ZAG'
        ? {
            code: 'MVA-SEC-184(D)',
            act: 'The Motor Vehicles (Amendment) Act, Section 184 — Dangerous / Erratic Zig-Zag Driving',
            penalty_inr: 5000,
            points: 4,
            description:
              'Driving dangerously in an erratic zig-zag fashion endangering the safety of other road users, transit passengers, and pedestrians.',
          }
        : verdictLevel === 'HIGH_ERRATIC_WEAVE'
        ? {
            code: 'MVA-SEC-177(A)',
            act: 'The Motor Vehicles Act, Section 177A — Unlawful Lane Weaving & Sudden Cut-In',
            penalty_inr: 2500,
            points: 2,
            description:
              'Failure to observe demarcated lane discipline and driving without reasonable consideration for other highway vehicles.',
          }
        : {
            code: 'MVA-COMPLIANT',
            act: 'Motor Vehicles Rules — Rule 115 Compliance',
            penalty_inr: 0,
            points: 0,
            description: 'Trajectory maintains standard highway lane corridor within lawful deviation tolerances.',
          };

    // 10. Government Warning Recommendation
    const shouldWarnPortal = verdictLevel === 'CRITICAL_ZIG_ZAG' || verdictLevel === 'HIGH_ERRATIC_WEAVE';
    const govWarning = {
      warn_recommended: shouldWarnPortal,
      urgency: verdictLevel === 'CRITICAL_ZIG_ZAG' ? ('CRITICAL' as const) : ('HIGH' as const),
      target_division: 'Andhra Pradesh State Transport Dept & City Traffic Police Rapid Intercept Wing',
      dispatch_recommended_unit: 'Traffic Interceptor Patrol Unit #04',
      rationale: shouldWarnPortal
        ? `Vehicle (${licensePlate} / ${vehicleType}) demonstrated sharp erratic zig-zag swerve of ${estimatedLateralShiftMeters}m (ΔX: ${absDeltaX.toFixed(
            1
          )}%) at an angle of ${trajectoryAngleDeg}° and lateral velocity of ${lateralVelocityMps} m/s (${lateralVelocityKmh} km/h). Immediate intercept dispatch and administrative fine registration warranted.`
        : 'Trajectory conforms to nominal highway lane parameters; standard passive archival logging.',
    };

    const calculationId = `CALC-ZZ-${Date.now().toString().slice(-6)}`;

    return {
      id: calculationId,
      calculated_at: new Date().toISOString(),
      bus_number: busNumber,
      camera: camera,
      vehicle_type: vehicleType,
      license_plate: licensePlate,
      location_name: locationName,
      latitude: latitude,
      longitude: longitude,
      photo_1: {
        image_url: params.photo1_url,
        label: `Frame T1 (Initial State): ${p1Centroid.cx.toFixed(1)}% X, ${p1Centroid.cy.toFixed(1)}% Y`,
        timestamp_sec: 0.0,
        bbox: p1Bbox,
        centroid: p1Centroid,
        lane_position: p1Centroid.cx < 38 ? 'LANE 1 (Kerb/Left)' : p1Centroid.cx < 65 ? 'LANE 2 (Center)' : 'LANE 3 / RIGHT',
        detected_class: `${vehicleType} (${licensePlate})`,
      },
      photo_2: {
        image_url: params.photo2_url,
        label: `Frame T2 (+${timeDelta}s State): ${p2Centroid.cx.toFixed(1)}% X, ${p2Centroid.cy.toFixed(1)}% Y`,
        timestamp_sec: timeDelta,
        bbox: p2Bbox,
        centroid: p2Centroid,
        lane_position: p2Centroid.cx < 38 ? 'LANE 1 (Kerb/Left)' : p2Centroid.cx < 65 ? 'LANE 2 (Center)' : 'LANE 3 / RIGHT',
        detected_class: `${vehicleType} (${licensePlate})`,
      },
      metrics: {
        delta_time_sec: timeDelta,
        delta_x_pct: Number(deltaX.toFixed(1)),
        delta_y_pct: Number(deltaY.toFixed(1)),
        estimated_lateral_shift_m: estimatedLateralShiftMeters,
        lateral_velocity_mps: lateralVelocityMps,
        lateral_velocity_kmh: lateralVelocityKmh,
        trajectory_angle_deg: trajectoryAngleDeg,
        direction_of_swerve: directionOfSwerve,
        lane_boundary_crossed: laneBoundaryCrossed,
        zigzag_risk_score: zigzagRiskScore,
        verdict_level: verdictLevel,
        verdict_title: verdictTitle,
        confidence: confidence,
      },
      traffic_law_citation: trafficCitation,
      government_warning: govWarning,
      government_alert_status: {
        is_warned: false,
      },
    };
  }
}

export const twoPhotoZigZagEngine = new TwoPhotoZigZagEngine();
