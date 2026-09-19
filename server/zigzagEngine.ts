import {
  ZigZagIncident,
  ZigZagSensitivityConfig,
  ZigZagSimulationScenario,
  ZigZagCameraType,
  ZigZagSeverity,
  ZigZagVehicleType,
} from '../src/types';

// Default sensitivity configuration
export const DEFAULT_ZIGZAG_CONFIG: ZigZagSensitivityConfig = {
  temporal_window_sec: 4.5,
  smoothing_k_frames: 3,
  lateral_shift_threshold_pct: 3.5,
  req_direction_changes: 3,
  camera_vibration_damping: 85,
};

// Initial verified incident records flagged by bus front and rear cameras
export const INITIAL_ZIGZAG_INCIDENTS: ZigZagIncident[] = [
  {
    id: 'ZZ-MOTO-118',
    track_id: 'MOTO-118',
    license_plate: 'AP39BK9021',
    vehicle_type: 'MOTORCYCLE',
    severity: 'HIGH',
    status: 'ACTIVE',
    camera: 'FRONT',
    camera_name: 'FRONT CAMERA',
    description:
      'Potential Zig-Zag / Erratic Driving: Motorcycle (MOTO-118) exhibited 4 alternating lateral direction changes (LEFT ➔ RIGHT ➔ LEFT ➔ RIGHT) within a 4.2s window. Aggressive lane weaving between transit bus and curb.',
    direction_sequence: ['RIGHT', 'LEFT', 'RIGHT', 'LEFT'],
    direction_changes_count: 4,
    time_str: '23:05',
    bus_number: 'AP 39 XX 1234',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    time_window_sec: 4.2,
    confidence: 0.94,
    avg_lateral_velocity_mps: 1.85,
    max_lateral_displacement_pct: 64,
    location_name: 'NH-16 Madhurawada Bypass (Ch. 14+200)',
    latitude: 17.8182,
    longitude: 83.3541,
    road_speed_kmh: 58,
    trajectory_points: [
      { frame: 1, t_sec: 0.0, cx_pct: 50, cy_pct: 78, raw_cx_pct: 49.8, delta_x_pct: 0, direction: 'CENTER' },
      { frame: 6, t_sec: 0.8, cx_pct: 74, cy_pct: 72, raw_cx_pct: 75.2, delta_x_pct: 24, direction: 'RIGHT' },
      { frame: 12, t_sec: 1.8, cx_pct: 26, cy_pct: 64, raw_cx_pct: 24.9, delta_x_pct: -48, direction: 'LEFT' },
      { frame: 18, t_sec: 2.8, cx_pct: 78, cy_pct: 56, raw_cx_pct: 79.1, delta_x_pct: 52, direction: 'RIGHT' },
      { frame: 25, t_sec: 3.8, cx_pct: 22, cy_pct: 48, raw_cx_pct: 20.8, delta_x_pct: -56, direction: 'LEFT' },
      { frame: 30, t_sec: 4.2, cx_pct: 45, cy_pct: 42, raw_cx_pct: 44.5, delta_x_pct: 23, direction: 'RIGHT' },
    ],
  },
  {
    id: 'ZZ-AUTO-112',
    track_id: 'AUTO-112',
    license_plate: 'AP31TA5512',
    vehicle_type: 'AUTO_RICKSHAW',
    severity: 'MEDIUM',
    status: 'ACKNOWLEDGED',
    camera: 'REAR',
    camera_name: 'REAR CAMERA',
    description:
      'Potential Zig-Zag / Erratic Driving: Auto-Rickshaw (AUTO-112) exhibited 3 quick lateral directional switches (RIGHT ➔ LEFT ➔ RIGHT) trailing 12m behind rear bus bumper.',
    direction_sequence: ['RIGHT', 'LEFT', 'RIGHT'],
    direction_changes_count: 3,
    time_str: '22:48',
    bus_number: 'AP 39 XX 1234',
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    time_window_sec: 3.8,
    confidence: 0.88,
    avg_lateral_velocity_mps: 1.35,
    max_lateral_displacement_pct: 46,
    location_name: 'RTC Complex - Gurudwara Junction Flyover approach',
    latitude: 17.7289,
    longitude: 83.3082,
    road_speed_kmh: 42,
    trajectory_points: [
      { frame: 1, t_sec: 0.0, cx_pct: 48, cy_pct: 82, raw_cx_pct: 47.5, delta_x_pct: 0, direction: 'CENTER' },
      { frame: 8, t_sec: 1.1, cx_pct: 72, cy_pct: 74, raw_cx_pct: 73.1, delta_x_pct: 24, direction: 'RIGHT' },
      { frame: 16, t_sec: 2.2, cx_pct: 32, cy_pct: 65, raw_cx_pct: 31.2, delta_x_pct: -40, direction: 'LEFT' },
      { frame: 24, t_sec: 3.3, cx_pct: 68, cy_pct: 58, raw_cx_pct: 69.4, delta_x_pct: 36, direction: 'RIGHT' },
      { frame: 30, t_sec: 3.8, cx_pct: 54, cy_pct: 52, raw_cx_pct: 53.6, delta_x_pct: -14, direction: 'LEFT' },
    ],
  },
  {
    id: 'ZZ-CAR-109',
    track_id: 'CAR-109',
    license_plate: 'AP31TV9204',
    vehicle_type: 'CAR',
    severity: 'LOW',
    status: 'RESOLVED',
    camera: 'FRONT',
    camera_name: 'FRONT CAMERA',
    description:
      'Potential Zig-Zag / Erratic Driving: Sedan (CAR-109) made 3 erratic steering corrections while attempting to bypass shoulder obstacle.',
    direction_sequence: ['LEFT', 'RIGHT', 'LEFT'],
    direction_changes_count: 3,
    time_str: '22:22',
    bus_number: 'AP 31 Z 9884',
    timestamp: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
    time_window_sec: 4.4,
    confidence: 0.79,
    avg_lateral_velocity_mps: 0.95,
    max_lateral_displacement_pct: 38,
    location_name: 'Gajuwaka Industrial Corridor (Zinc Gate)',
    latitude: 17.6942,
    longitude: 83.2105,
    road_speed_kmh: 48,
    trajectory_points: [
      { frame: 1, t_sec: 0.0, cx_pct: 52, cy_pct: 70, raw_cx_pct: 52.0, delta_x_pct: 0, direction: 'CENTER' },
      { frame: 8, t_sec: 1.2, cx_pct: 34, cy_pct: 62, raw_cx_pct: 33.2, delta_x_pct: -18, direction: 'LEFT' },
      { frame: 17, t_sec: 2.5, cx_pct: 66, cy_pct: 54, raw_cx_pct: 67.1, delta_x_pct: 32, direction: 'RIGHT' },
      { frame: 25, t_sec: 3.6, cx_pct: 38, cy_pct: 46, raw_cx_pct: 37.4, delta_x_pct: -28, direction: 'LEFT' },
      { frame: 30, t_sec: 4.4, cx_pct: 48, cy_pct: 40, raw_cx_pct: 48.2, delta_x_pct: 10, direction: 'RIGHT' },
    ],
  },
];

// Realistic simulation scenarios for Front & Rear Camera views
export const ZIGZAG_SIMULATION_SCENARIOS: ZigZagSimulationScenario[] = [
  {
    id: 'scenario-front-zigzag-moto',
    title: 'Zig-Zag Weaving (Motorcycle / Auto)',
    vehicle_type: 'MOTORCYCLE',
    track_id: 'MOTO-ZIGZAG-303',
    license_plate: 'AP 39 CG 4421',
    bus_number: 'AP 39 XX 1234',
    camera: 'FRONT',
    camera_label: 'CAM: FRONT-ROOFTOP • Facing Ahead (Forward Corridor)',
    total_frames: 30,
    context_description:
      'Aggressive Zig-Zag / Erratic Lane Weaving: Two-wheeler / car repeatedly sweeping across lanes (LEFT ➔ RIGHT ➔ LEFT ➔ RIGHT) within 4 seconds. Exceeds lateral displacement and alternating direction thresholds.',
    frames: [
      // 30 frames spanning ~4.5s
      { frame: 1, time_sec: 0.15, cx: 50.0, cy: 75.0, width: 9.0, height: 14.0, direction_shift: null, shift_count: 0, direction_sequence: [], is_flagged: false, status_text: 'NORMAL LANE' },
      { frame: 2, time_sec: 0.30, cx: 53.0, cy: 74.0, width: 9.0, height: 14.0, direction_shift: null, shift_count: 0, direction_sequence: [], is_flagged: false, status_text: 'NORMAL LANE' },
      { frame: 3, time_sec: 0.45, cx: 58.5, cy: 73.0, width: 9.2, height: 14.2, direction_shift: null, shift_count: 0, direction_sequence: [], is_flagged: false, status_text: 'NORMAL LANE' },
      { frame: 4, time_sec: 0.60, cx: 65.0, cy: 71.5, width: 9.4, height: 14.4, direction_shift: 'RIGHT', shift_count: 1, direction_sequence: ['RIGHT'], is_flagged: false, status_text: 'NORMAL LANE' },
      { frame: 5, time_sec: 0.75, cx: 72.0, cy: 70.0, width: 9.5, height: 14.5, direction_shift: null, shift_count: 1, direction_sequence: ['RIGHT'], is_flagged: false, status_text: 'NORMAL LANE' },
      { frame: 6, time_sec: 0.90, cx: 77.5, cy: 68.5, width: 9.6, height: 14.6, direction_shift: null, shift_count: 1, direction_sequence: ['RIGHT'], is_flagged: false, status_text: 'NORMAL LANE' },
      { frame: 7, time_sec: 1.05, cx: 75.0, cy: 67.0, width: 9.6, height: 14.6, direction_shift: null, shift_count: 1, direction_sequence: ['RIGHT'], is_flagged: false, status_text: 'NORMAL LANE' },
      { frame: 8, time_sec: 1.20, cx: 68.0, cy: 65.5, width: 9.8, height: 14.8, direction_shift: null, shift_count: 1, direction_sequence: ['RIGHT'], is_flagged: false, status_text: 'NORMAL LANE' },
      { frame: 9, time_sec: 1.35, cx: 59.0, cy: 64.0, width: 10.0, height: 15.0, direction_shift: null, shift_count: 1, direction_sequence: ['RIGHT'], is_flagged: false, status_text: 'NORMAL LANE' },
      { frame: 10, time_sec: 1.50, cx: 48.0, cy: 62.5, width: 10.0, height: 15.0, direction_shift: 'LEFT', shift_count: 2, direction_sequence: ['RIGHT', 'LEFT'], is_flagged: false, status_text: 'LATERAL SWAY (2 SHIFTS)' },
      { frame: 11, time_sec: 1.65, cx: 38.0, cy: 61.0, width: 10.2, height: 15.2, direction_shift: null, shift_count: 2, direction_sequence: ['RIGHT', 'LEFT'], is_flagged: false, status_text: 'LATERAL SWAY (2 SHIFTS)' },
      { frame: 12, time_sec: 1.80, cx: 28.5, cy: 59.5, width: 10.2, height: 15.2, direction_shift: null, shift_count: 2, direction_sequence: ['RIGHT', 'LEFT'], is_flagged: false, status_text: 'LATERAL SWAY (2 SHIFTS)' },
      { frame: 13, time_sec: 1.95, cx: 23.0, cy: 58.0, width: 10.4, height: 15.4, direction_shift: null, shift_count: 2, direction_sequence: ['RIGHT', 'LEFT'], is_flagged: false, status_text: 'LATERAL SWAY (2 SHIFTS)' },
      { frame: 14, time_sec: 2.10, cx: 26.0, cy: 56.5, width: 10.4, height: 15.4, direction_shift: null, shift_count: 2, direction_sequence: ['RIGHT', 'LEFT'], is_flagged: false, status_text: 'LATERAL SWAY (2 SHIFTS)' },
      { frame: 15, time_sec: 2.25, cx: 34.0, cy: 55.0, width: 10.6, height: 15.6, direction_shift: null, shift_count: 2, direction_sequence: ['RIGHT', 'LEFT'], is_flagged: false, status_text: 'LATERAL SWAY (2 SHIFTS)' },
      { frame: 16, time_sec: 2.40, cx: 45.0, cy: 53.5, width: 10.6, height: 15.6, direction_shift: null, shift_count: 2, direction_sequence: ['RIGHT', 'LEFT'], is_flagged: false, status_text: 'LATERAL SWAY (2 SHIFTS)' },
      { frame: 17, time_sec: 2.55, cx: 58.0, cy: 52.0, width: 10.8, height: 15.8, direction_shift: null, shift_count: 2, direction_sequence: ['RIGHT', 'LEFT'], is_flagged: false, status_text: 'LATERAL SWAY (2 SHIFTS)' },
      { frame: 18, time_sec: 2.70, cx: 70.0, cy: 50.5, width: 10.8, height: 15.8, direction_shift: 'RIGHT', shift_count: 3, direction_sequence: ['RIGHT', 'LEFT', 'RIGHT'], is_flagged: true, status_text: 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' },
      { frame: 19, time_sec: 2.85, cx: 79.0, cy: 49.0, width: 11.0, height: 16.0, direction_shift: null, shift_count: 3, direction_sequence: ['RIGHT', 'LEFT', 'RIGHT'], is_flagged: true, status_text: 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' },
      { frame: 20, time_sec: 3.00, cx: 82.0, cy: 47.5, width: 11.0, height: 16.0, direction_shift: null, shift_count: 3, direction_sequence: ['RIGHT', 'LEFT', 'RIGHT'], is_flagged: true, status_text: 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' },
      { frame: 21, time_sec: 3.15, cx: 76.0, cy: 46.0, width: 11.2, height: 16.2, direction_shift: null, shift_count: 3, direction_sequence: ['RIGHT', 'LEFT', 'RIGHT'], is_flagged: true, status_text: 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' },
      { frame: 22, time_sec: 3.30, cx: 66.0, cy: 44.5, width: 11.2, height: 16.2, direction_shift: null, shift_count: 3, direction_sequence: ['RIGHT', 'LEFT', 'RIGHT'], is_flagged: true, status_text: 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' },
      { frame: 23, time_sec: 3.45, cx: 53.0, cy: 43.0, width: 11.4, height: 16.4, direction_shift: null, shift_count: 3, direction_sequence: ['RIGHT', 'LEFT', 'RIGHT'], is_flagged: true, status_text: 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' },
      { frame: 24, time_sec: 3.60, cx: 38.0, cy: 41.5, width: 11.4, height: 16.4, direction_shift: 'LEFT', shift_count: 4, direction_sequence: ['RIGHT', 'LEFT', 'RIGHT', 'LEFT'], is_flagged: true, status_text: 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' },
      { frame: 25, time_sec: 3.75, cx: 25.0, cy: 40.0, width: 11.6, height: 16.6, direction_shift: null, shift_count: 4, direction_sequence: ['RIGHT', 'LEFT', 'RIGHT', 'LEFT'], is_flagged: true, status_text: 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' },
      { frame: 26, time_sec: 3.90, cx: 21.0, cy: 38.5, width: 11.6, height: 16.6, direction_shift: null, shift_count: 4, direction_sequence: ['RIGHT', 'LEFT', 'RIGHT', 'LEFT'], is_flagged: true, status_text: 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' },
      { frame: 27, time_sec: 4.05, cx: 26.5, cy: 37.0, width: 11.8, height: 16.8, direction_shift: null, shift_count: 4, direction_sequence: ['RIGHT', 'LEFT', 'RIGHT', 'LEFT'], is_flagged: true, status_text: 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' },
      { frame: 28, time_sec: 4.20, cx: 36.0, cy: 35.5, width: 11.8, height: 16.8, direction_shift: null, shift_count: 4, direction_sequence: ['RIGHT', 'LEFT', 'RIGHT', 'LEFT'], is_flagged: true, status_text: 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' },
      { frame: 29, time_sec: 4.35, cx: 46.0, cy: 34.0, width: 12.0, height: 17.0, direction_shift: null, shift_count: 4, direction_sequence: ['RIGHT', 'LEFT', 'RIGHT', 'LEFT'], is_flagged: true, status_text: 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' },
      { frame: 30, time_sec: 4.50, cx: 50.0, cy: 32.5, width: 12.0, height: 17.0, direction_shift: null, shift_count: 4, direction_sequence: ['RIGHT', 'LEFT', 'RIGHT', 'LEFT'], is_flagged: true, status_text: 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' },
    ],
  },
  {
    id: 'scenario-rear-auto-slalom',
    title: 'Rear Camera: Trailing Auto-Rickshaw Weaving (AUTO-112)',
    vehicle_type: 'AUTO_RICKSHAW',
    track_id: 'AUTO-112',
    license_plate: 'AP31TA5512',
    bus_number: 'AP 39 XX 1234',
    camera: 'REAR',
    camera_label: 'CAM: REAR-BUMPER • Facing Behind (Trailing Corridor)',
    total_frames: 30,
    context_description:
      'Trailing Auto-Rickshaw tailgating transit bus, abruptly veering from right blind-spot into left shoulder repeatedly attempting an unsafe slipstream pass.',
    frames: [
      { frame: 1, time_sec: 0.15, cx: 52.0, cy: 80.0, width: 13.0, height: 16.0, direction_shift: null, shift_count: 0, direction_sequence: [], is_flagged: false, status_text: 'NORMAL LANE' },
      { frame: 5, time_sec: 0.75, cx: 73.0, cy: 76.0, width: 13.2, height: 16.2, direction_shift: 'RIGHT', shift_count: 1, direction_sequence: ['RIGHT'], is_flagged: false, status_text: 'NORMAL LANE' },
      { frame: 10, time_sec: 1.50, cx: 62.0, cy: 71.0, width: 13.5, height: 16.5, direction_shift: null, shift_count: 1, direction_sequence: ['RIGHT'], is_flagged: false, status_text: 'NORMAL LANE' },
      { frame: 14, time_sec: 2.10, cx: 33.0, cy: 66.0, width: 13.8, height: 16.8, direction_shift: 'LEFT', shift_count: 2, direction_sequence: ['RIGHT', 'LEFT'], is_flagged: false, status_text: 'LATERAL SWAY (2 SHIFTS)' },
      { frame: 18, time_sec: 2.70, cx: 28.0, cy: 61.0, width: 14.0, height: 17.0, direction_shift: null, shift_count: 2, direction_sequence: ['RIGHT', 'LEFT'], is_flagged: false, status_text: 'LATERAL SWAY (2 SHIFTS)' },
      { frame: 22, time_sec: 3.30, cx: 69.0, cy: 56.0, width: 14.2, height: 17.2, direction_shift: 'RIGHT', shift_count: 3, direction_sequence: ['RIGHT', 'LEFT', 'RIGHT'], is_flagged: true, status_text: 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' },
      { frame: 26, time_sec: 3.90, cx: 74.0, cy: 52.0, width: 14.5, height: 17.5, direction_shift: null, shift_count: 3, direction_sequence: ['RIGHT', 'LEFT', 'RIGHT'], is_flagged: true, status_text: 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' },
      { frame: 30, time_sec: 4.50, cx: 52.0, cy: 48.0, width: 14.8, height: 17.8, direction_shift: null, shift_count: 3, direction_sequence: ['RIGHT', 'LEFT', 'RIGHT'], is_flagged: true, status_text: 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' },
    ],
  },
  {
    id: 'scenario-front-car-controlled-normal',
    title: 'Compliant Gradual Highway Lane Shift (Normal Vehicle)',
    vehicle_type: 'CAR',
    track_id: 'CAR-SAFE-801',
    license_plate: 'AP 31 EL 7789',
    bus_number: 'AP 31 Z 9884',
    camera: 'FRONT',
    camera_label: 'CAM: FRONT-ROOFTOP • Facing Ahead (Forward Corridor)',
    total_frames: 30,
    context_description:
      'Control Benchmark: Sedan performing a single, controlled transition from Lane 2 to Lane 1. Lateral movement is monotonic in one direction with zero oscillation.',
    frames: [
      { frame: 1, time_sec: 0.15, cx: 50.0, cy: 75.0, width: 14.0, height: 18.0, direction_shift: null, shift_count: 0, direction_sequence: [], is_flagged: false, status_text: 'NORMAL LANE' },
      { frame: 8, time_sec: 1.20, cx: 44.0, cy: 68.0, width: 14.2, height: 18.2, direction_shift: null, shift_count: 0, direction_sequence: [], is_flagged: false, status_text: 'NORMAL LANE' },
      { frame: 15, time_sec: 2.25, cx: 36.0, cy: 60.0, width: 14.5, height: 18.5, direction_shift: 'LEFT', shift_count: 1, direction_sequence: ['LEFT'], is_flagged: false, status_text: 'CONTROLLED SHIFT (1 DIR)' },
      { frame: 22, time_sec: 3.30, cx: 28.0, cy: 52.0, width: 14.8, height: 18.8, direction_shift: null, shift_count: 1, direction_sequence: ['LEFT'], is_flagged: false, status_text: 'CONTROLLED SHIFT (1 DIR)' },
      { frame: 30, time_sec: 4.50, cx: 25.0, cy: 45.0, width: 15.0, height: 19.0, direction_shift: null, shift_count: 1, direction_sequence: ['LEFT'], is_flagged: false, status_text: 'NORMAL LANE' },
    ],
  },
];

export class ZigZagEngine {
  private config: ZigZagSensitivityConfig = { ...DEFAULT_ZIGZAG_CONFIG };

  public getConfig(): ZigZagSensitivityConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<ZigZagSensitivityConfig>): ZigZagSensitivityConfig {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    return { ...this.config };
  }

  public resetConfig(): ZigZagSensitivityConfig {
    this.config = { ...DEFAULT_ZIGZAG_CONFIG };
    return { ...this.config };
  }

  /**
   * Evaluates a trajectory series through the 8-Stage CV Pipeline:
   * 1. Vehicle Detection BBox
   * 2. Track ID
   * 3. Normalized Cx, Cy
   * 4. 4.5s Buffer Window
   * 5. Moving-Bus Smoothing Filter (K=3)
   * 6. Frame-to-Frame Lateral Shift ΔX
   * 7. Alternating Direction Shift Counter
   * 8. Probabilistic Zig-Zag / Erratic Driving Flag
   */
  public evaluateTrajectory(
    points: { cx: number; cy: number; t: number }[],
    config: ZigZagSensitivityConfig = this.config
  ) {
    const k = config.smoothing_k_frames || 3;
    const threshold = config.lateral_shift_threshold_pct || 3.5;
    const reqChanges = config.req_direction_changes || 3;

    // Stage 5: Moving average smoothing
    const smoothed: { cx: number; cy: number; t: number }[] = [];
    for (let i = 0; i < points.length; i++) {
      let sumX = 0;
      let sumY = 0;
      let count = 0;
      for (let j = Math.max(0, i - Math.floor(k / 2)); j <= Math.min(points.length - 1, i + Math.floor(k / 2)); j++) {
        sumX += points[j].cx;
        sumY += points[j].cy;
        count++;
      }
      smoothed.push({
        cx: sumX / count,
        cy: sumY / count,
        t: points[i].t,
      });
    }

    // Stage 6 & 7: Lateral shift ΔX and Alternating Direction changes
    const directionSequence: ('LEFT' | 'RIGHT')[] = [];
    let lastDirection: 'LEFT' | 'RIGHT' | null = null;
    let totalChanges = 0;

    for (let i = 1; i < smoothed.length; i++) {
      const deltaX = smoothed[i].cx - smoothed[i - 1].cx;
      if (Math.abs(deltaX) >= threshold) {
        const currentDir = deltaX > 0 ? 'RIGHT' : 'LEFT';
        if (lastDirection !== null && currentDir !== lastDirection) {
          totalChanges++;
          directionSequence.push(currentDir);
        } else if (lastDirection === null) {
          directionSequence.push(currentDir);
        }
        lastDirection = currentDir;
      }
    }

    const isFlagged = totalChanges >= reqChanges;
    const confidence = Math.min(0.98, Math.max(0.65, 0.7 + totalChanges * 0.06));

    return {
      smoothed_points: smoothed,
      direction_sequence: directionSequence,
      direction_changes_count: totalChanges,
      is_flagged: isFlagged,
      confidence: confidence,
      classification: isFlagged ? 'POTENTIAL ZIG-ZAG / ERRATIC DRIVING' : 'NORMAL LANE',
    };
  }
}

export const zigZagEngine = new ZigZagEngine();
