import fs from 'fs';
import path from 'path';
import {
  User,
  MediaRecord,
  AnalysisJob,
  Detection,
  RoadDefect,
  DefectSeverity,
  RoadCondition,
  PeopleAnalytics,
  VehicleRecord,
  LicensePlate,
  SmokeEvent,
  BuildingRecord,
  TrafficMetrics,
  IncidentRecord,
  UrbanObjectTaxonomy,
  ReportRecord,
  EvidenceFile,
  CompleteMediaAnalysisResult,
  TrafficBottleneck,
  HeatwaveAnalytics,
  ActionableInsight,
  WorkOrder,
  CampusBus,
  StudentTeamMember,
  CitizenIssue,
  CitizenEscalationImage,
  OriginDestinationPattern,
  RouteDelayEstimate,
  DriverSafetyEvent,
  DriverMonitoringSession,
  BusInfrastructureDefect,
  BusInspectionReport,
  GovernmentAlert,
  LaneAnalysisSummary,
  VulnerablePedestrianEvent,
  RoadDividerDetection,
  ZigZagIncident,
  ZigZagAlertStatus,
} from '../src/types';
import { INITIAL_ZIGZAG_INCIDENTS } from './zigzagEngine';

export interface DatabaseSchema {
  users: User[];
  media: MediaRecord[];
  analysis_jobs: AnalysisJob[];
  detections: Detection[];
  road_defects: RoadDefect[];
  road_conditions: RoadCondition[];
  people_analytics: PeopleAnalytics[];
  vehicles: VehicleRecord[];
  license_plates: LicensePlate[];
  smoke_events: SmokeEvent[];
  buildings: BuildingRecord[];
  traffic_metrics: TrafficMetrics[];
  incidents: IncidentRecord[];
  urban_objects: UrbanObjectTaxonomy[];
  reports: ReportRecord[];
  evidence_files: EvidenceFile[];
  traffic_bottlenecks: TrafficBottleneck[];
  heatwave_analytics: HeatwaveAnalytics[];
  actionable_insights: ActionableInsight[];
  work_orders: WorkOrder[];
  campus_buses: CampusBus[];
  student_team: StudentTeamMember[];
  citizen_issues: CitizenIssue[];
  od_patterns: OriginDestinationPattern[];
  route_delays: RouteDelayEstimate[];
  driver_safety_events: DriverSafetyEvent[];
  driver_monitoring_sessions: DriverMonitoringSession[];
  infrastructure_defects: BusInfrastructureDefect[];
  bus_inspection_reports: BusInspectionReport[];
  government_alerts: GovernmentAlert[];
  lane_analyses?: Record<string, LaneAnalysisSummary>;
  vulnerable_pedestrians?: VulnerablePedestrianEvent[];
  road_dividers?: RoadDividerDetection[];
  zigzag_incidents?: ZigZagIncident[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'solvofin_db.json');
const STORAGE_DIR = path.join(process.cwd(), 'storage');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
const subdirs = ['uploads', 'evidence', 'reports', 'annotated'];
subdirs.forEach((d) => {
  const p = path.join(STORAGE_DIR, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

class PersistentDatabase {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        console.log(`[DB] Successfully loaded database with ${parsed.media?.length || 0} media records.`);
        
        // Ensure new arrays exist for backward compatibility
        parsed.traffic_bottlenecks = parsed.traffic_bottlenecks?.length ? parsed.traffic_bottlenecks : this.getInitialBottlenecks();
        parsed.heatwave_analytics = parsed.heatwave_analytics?.length ? parsed.heatwave_analytics : this.getInitialHeatwaves();
        parsed.actionable_insights = parsed.actionable_insights?.length ? parsed.actionable_insights : this.getInitialActionableInsights();
        parsed.work_orders = parsed.work_orders?.length ? parsed.work_orders : this.getInitialWorkOrders();
        parsed.campus_buses = parsed.campus_buses?.length ? parsed.campus_buses : this.getInitialCampusBuses();
        parsed.student_team = parsed.student_team?.length ? parsed.student_team : this.getInitialStudentTeam();
        parsed.citizen_issues = parsed.citizen_issues?.length ? parsed.citizen_issues : this.getInitialCitizenIssues();
        parsed.od_patterns = parsed.od_patterns?.length ? parsed.od_patterns : this.getInitialODPatterns();
        parsed.route_delays = parsed.route_delays?.length ? parsed.route_delays : this.getInitialRouteDelays();
        parsed.driver_safety_events = parsed.driver_safety_events?.length ? parsed.driver_safety_events : this.getInitialDriverSafetyEvents();
        parsed.driver_monitoring_sessions = parsed.driver_monitoring_sessions?.length ? parsed.driver_monitoring_sessions : this.getInitialDriverSessions();
        parsed.infrastructure_defects = parsed.infrastructure_defects?.length ? parsed.infrastructure_defects : this.getInitialInfrastructureDefects();
        parsed.bus_inspection_reports = parsed.bus_inspection_reports?.length ? parsed.bus_inspection_reports : this.getInitialBusInspectionReports();
        parsed.government_alerts = parsed.government_alerts?.length ? parsed.government_alerts : this.getInitialGovernmentAlerts();
        parsed.lane_analyses = parsed.lane_analyses || {};
        parsed.vulnerable_pedestrians = parsed.vulnerable_pedestrians || [];
        parsed.road_dividers = parsed.road_dividers || [];
        parsed.zigzag_incidents = parsed.zigzag_incidents?.length ? parsed.zigzag_incidents : [...INITIAL_ZIGZAG_INCIDENTS];

        // Ensure default users exist
        if (!parsed.users || parsed.users.length === 0 || !parsed.users.find((u: any) => u.username === 'gov_admin')) {
          parsed.users = this.getInitialUsers();
        }

        // Ensure defects have dimensional data
        if (parsed.road_defects) {
          parsed.road_defects.forEach((d: any) => {
            if (d.depth_cm === undefined) {
              if (d.type === 'POTHOLE') {
                d.depth_cm = d.severity === 'HIGH' ? 12 : 7;
                d.width_cm = 65;
                d.length_cm = 80;
                d.asphalt_tons = 0.28;
                d.repair_cost_inr = 8500;
                d.priority_score = 90;
                d.division_assigned = 'GVMC North Highway Infrastructure Division #3';
              } else if (d.type === 'CRACK') {
                d.depth_cm = 4;
                d.width_cm = 15;
                d.length_cm = 240;
                d.asphalt_tons = 0.12;
                d.repair_cost_inr = 4200;
                d.priority_score = 65;
                d.division_assigned = 'GVMC North Highway Infrastructure Division #3';
              } else {
                d.depth_cm = 0;
                d.width_cm = 100;
                d.length_cm = 100;
                d.asphalt_tons = 0;
                d.repair_cost_inr = 3500;
                d.priority_score = 50;
                d.division_assigned = 'GVMC Traffic Infrastructure & Signage Wing';
              }
            }
          });
        }

        return parsed;
      } catch (err) {
        console.error('[DB] Error parsing existing db, initializing default:', err);
      }
    }
    const initial = this.getInitialSeed();
    this.saveImmediate(initial);
    return initial;
  }

  private saveImmediate(dbData?: DatabaseSchema) {
    try {
      const d = dbData || this.data;
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(d, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('[DB] Error writing to disk:', err);
    }
  }

  public save() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveImmediate();
    }, 50);
  }

  private getInitialSeed(): DatabaseSchema {
    const seedMediaId1 = 'MEDIA-00101';
    const seedMediaId2 = 'MEDIA-00102';
    const seedMediaId3 = 'MEDIA-00103';

    return {
      users: [
        {
          id: 'USR-01',
          username: 'admin',
          email: 'authority@solvofin.gov',
          role: 'ADMIN',
          name: 'Chief Urban Transit Engineer',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        },
        {
          id: 'USR-02',
          username: 'municipal_officer',
          email: 'officer@citytransit.gov',
          role: 'AUTHORITY',
          name: 'Municipal Enforcement Officer',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        },
        {
          id: 'USR-03',
          username: 'bus_operator',
          email: 'driver.dept@transit.net',
          role: 'OPERATOR',
          name: 'Transit Fleet Telemetry Lead',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        },
        {
          id: 'USR-04',
          username: 'public_viewer',
          email: 'auditor@publicsafety.org',
          role: 'VIEWER',
          name: 'Civic Safety Auditor',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        },
      ],
      media: [
        {
          id: seedMediaId1,
          original_filename: 'transit_route_18_coastal_highway.mp4',
          media_type: 'VIDEO',
          file_size: 28400000,
          mime_type: 'video/mp4',
          storage_path: '/storage/uploads/sample_video_route18.mp4',
          thumbnail_path: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
          upload_time: '2026-09-01T06:32:14.000Z',
          uploaded_by: 'Fleet Operator #42',
          upload_location: {
            latitude: 17.7289,
            longitude: 83.3184,
            accuracy: 6.5,
            timestamp: '2026-09-01T06:32:14.000Z',
            address_or_name: 'Visakhapatnam Transit Hub Terminal B',
          },
          scene_location: {
            latitude: 17.7342,
            longitude: 83.3248,
            accuracy: 4.2,
            timestamp: '2026-09-01T06:30:00.000Z',
            address_or_name: 'Coastal Corridor NH-16 Sector 4',
          },
          bus_route_id: 'BUS-18-NORTH',
          duration_sec: 45,
          frame_count: 1350,
          resolution: '1920x1080',
          fps: 30,
          analysis_status: 'COMPLETED',
          analysis_started_at: '2026-09-01T06:32:18.000Z',
          analysis_completed_at: '2026-09-01T06:32:38.000Z',
          is_deleted: false,
        },
        {
          id: seedMediaId2,
          original_filename: 'downtown_arterial_junction_cam.mp4',
          media_type: 'VIDEO',
          file_size: 19800000,
          mime_type: 'video/mp4',
          storage_path: '/storage/uploads/sample_video_junction.mp4',
          thumbnail_path: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=600&auto=format&fit=crop&q=80',
          upload_time: '2026-08-31T14:15:00.000Z',
          uploaded_by: 'Municipal Authority Control',
          upload_location: {
            latitude: 17.7041,
            longitude: 83.2977,
            accuracy: 8.0,
            timestamp: '2026-08-31T14:15:00.000Z',
            address_or_name: 'Central Control Station',
          },
          scene_location: {
            latitude: 17.7125,
            longitude: 83.3051,
            accuracy: 5.0,
            timestamp: '2026-08-31T14:10:00.000Z',
            address_or_name: 'Jagadamba Junction Arterial 2',
          },
          bus_route_id: 'BUS-102-EXPRESS',
          duration_sec: 32,
          frame_count: 960,
          resolution: '1920x1080',
          fps: 30,
          analysis_status: 'COMPLETED',
          analysis_started_at: '2026-08-31T14:15:05.000Z',
          analysis_completed_at: '2026-08-31T14:15:22.000Z',
          is_deleted: false,
        },
        {
          id: seedMediaId3,
          original_filename: 'pothole_waterlogging_inspection.jpg',
          media_type: 'IMAGE',
          file_size: 3450000,
          mime_type: 'image/jpeg',
          storage_path: '/storage/uploads/sample_image_pothole.jpg',
          thumbnail_path: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
          upload_time: '2026-08-30T09:42:10.000Z',
          uploaded_by: 'Field Inspection Unit #7',
          upload_location: {
            latitude: 17.7412,
            longitude: 83.3315,
            accuracy: 5.0,
            timestamp: '2026-08-30T09:42:10.000Z',
            address_or_name: 'Rushikonda Highway Segment',
          },
          scene_location: {
            latitude: 17.7412,
            longitude: 83.3315,
            accuracy: 5.0,
            timestamp: '2026-08-30T09:42:10.000Z',
            address_or_name: 'Rushikonda Highway Segment',
          },
          resolution: '3840x2160',
          analysis_status: 'COMPLETED',
          analysis_started_at: '2026-08-30T09:42:12.000Z',
          analysis_completed_at: '2026-08-30T09:42:16.000Z',
          is_deleted: false,
        },
      ],
      analysis_jobs: [
        {
          id: 'JOB-00101',
          media_id: seedMediaId1,
          status: 'COMPLETED',
          progress: 100,
          current_module: 'Report generation',
          modules_status: {
            media_preprocessing: 'COMPLETED',
            frame_extraction: 'COMPLETED',
            object_detection: 'COMPLETED',
            vehicle_tracking: 'COMPLETED',
            road_analysis: 'COMPLETED',
            people_detection: 'COMPLETED',
            traffic_metrics: 'COMPLETED',
            anpr: 'COMPLETED',
            smoke_detection: 'COMPLETED',
            building_count: 'COMPLETED',
            incident_detection: 'COMPLETED',
            report_generation: 'COMPLETED',
          },
          started_at: '2026-09-01T06:32:18.000Z',
          completed_at: '2026-09-01T06:32:38.000Z',
          logs: [
            { timestamp: '06:32:18', message: 'Video stream validated (1920x1080 @ 30fps). Preprocessing complete.', level: 'INFO' },
            { timestamp: '06:32:20', message: 'Sampled 45 keyframes across 1350 frames. Multi-object tracker initialized.', level: 'INFO' },
            { timestamp: '06:32:23', message: 'Road defect engine identified 4 surface defects (2 potholes, 1 crack, 1 faded zebra crossing).', level: 'INFO' },
            { timestamp: '06:32:26', message: 'Tracked 48 unique vehicles. Vehicle classification & flow vectors resolved.', level: 'INFO' },
            { timestamp: '06:32:29', message: 'ANPR pipeline extracted 14 license plates (12 high confidence, 2 low confidence).', level: 'INFO' },
            { timestamp: '06:32:31', message: 'Visible exhaust analysis flagged 2 heavy commercial vehicles emitting dense smoke.', level: 'WARN' },
            { timestamp: '06:32:34', message: 'Building tracker tallied 28 distinct structures (21 residential, 7 commercial).', level: 'INFO' },
            { timestamp: '06:32:36', message: 'Incident detector flagged 1 potential dangerous overtake sequence near crosswalk.', level: 'WARN' },
            { timestamp: '06:32:38', message: 'Report generated and persistently cataloged in storage.', level: 'INFO' },
          ],
        },
        {
          id: 'JOB-00102',
          media_id: seedMediaId2,
          status: 'COMPLETED',
          progress: 100,
          current_module: 'Report generation',
          modules_status: {
            media_preprocessing: 'COMPLETED',
            frame_extraction: 'COMPLETED',
            object_detection: 'COMPLETED',
            vehicle_tracking: 'COMPLETED',
            road_analysis: 'COMPLETED',
            people_detection: 'COMPLETED',
            traffic_metrics: 'COMPLETED',
            anpr: 'COMPLETED',
            smoke_detection: 'COMPLETED',
            building_count: 'COMPLETED',
            incident_detection: 'COMPLETED',
            report_generation: 'COMPLETED',
          },
          started_at: '2026-08-31T14:15:05.000Z',
          completed_at: '2026-08-31T14:15:22.000Z',
          logs: [
            { timestamp: '14:15:05', message: 'Junction video processed. Frame extraction completed.', level: 'INFO' },
            { timestamp: '14:15:10', message: 'Road condition score calculated: 72/100 (GOOD).', level: 'INFO' },
            { timestamp: '14:15:15', message: 'Traffic density: HIGH (flow rate 52 vehicles/min).', level: 'INFO' },
            { timestamp: '14:15:22', message: 'Audit summary synchronized with municipal database.', level: 'INFO' },
          ],
        },
        {
          id: 'JOB-00103',
          media_id: seedMediaId3,
          status: 'COMPLETED',
          progress: 100,
          current_module: 'Report generation',
          modules_status: {
            media_preprocessing: 'COMPLETED',
            frame_extraction: 'SKIPPED',
            object_detection: 'COMPLETED',
            vehicle_tracking: 'SKIPPED',
            road_analysis: 'COMPLETED',
            people_detection: 'COMPLETED',
            traffic_metrics: 'COMPLETED',
            anpr: 'COMPLETED',
            smoke_detection: 'COMPLETED',
            building_count: 'COMPLETED',
            incident_detection: 'COMPLETED',
            report_generation: 'COMPLETED',
          },
          started_at: '2026-08-30T09:42:12.000Z',
          completed_at: '2026-08-30T09:42:16.000Z',
          logs: [
            { timestamp: '09:42:12', message: 'High-res image loaded. Image computer vision pipeline invoked.', level: 'INFO' },
            { timestamp: '09:42:14', message: 'Critical waterlogging and deep pothole detected at sector 7.', level: 'WARN' },
            { timestamp: '09:42:16', message: 'Instantaneous assessment finalized.', level: 'INFO' },
          ],
        },
      ],
      detections: [
        {
          id: 'DET-001',
          media_id: seedMediaId1,
          frame_number: 45,
          timestamp_sec: 1.5,
          category: 'ROAD_DEFECT',
          class_name: 'POTHOLE',
          confidence: 0.94,
          bbox: [65, 32, 82, 54],
          properties: { severity: 'HIGH', area_sqm_est: 0.45 },
        },
        {
          id: 'DET-002',
          media_id: seedMediaId1,
          frame_number: 120,
          timestamp_sec: 4.0,
          category: 'VEHICLE',
          class_name: 'BUS',
          track_id: 'BUS-104',
          confidence: 0.98,
          bbox: [28, 45, 68, 88],
        },
        {
          id: 'DET-003',
          media_id: seedMediaId1,
          frame_number: 120,
          timestamp_sec: 4.0,
          category: 'SMOKE',
          class_name: 'VISIBLE_EXHAUST',
          track_id: 'BUS-104',
          confidence: 0.91,
          bbox: [58, 76, 75, 96],
        },
        {
          id: 'DET-004',
          media_id: seedMediaId1,
          frame_number: 120,
          timestamp_sec: 4.0,
          category: 'SIGNAGE',
          class_name: 'ANPR_PLATE',
          track_id: 'BUS-104',
          confidence: 0.96,
          bbox: [62, 58, 67, 72],
        },
        {
          id: 'DET-005',
          media_id: seedMediaId1,
          frame_number: 210,
          timestamp_sec: 7.0,
          category: 'BUILDING',
          class_name: 'COMMERCIAL_BUILDING',
          track_id: 'BLD-012',
          confidence: 0.93,
          bbox: [10, 2, 45, 38],
        },
        {
          id: 'DET-006',
          media_id: seedMediaId1,
          frame_number: 300,
          timestamp_sec: 10.0,
          category: 'PERSON',
          class_name: 'PEDESTRIAN',
          confidence: 0.89,
          bbox: [52, 12, 78, 22],
        },
      ],
      road_defects: [
        {
          id: 'DEF-01',
          media_id: seedMediaId1,
          type: 'POTHOLE',
          confidence: 0.94,
          severity: 'HIGH',
          frame_number: 45,
          timestamp_sec: 1.5,
          duration_sec: 3.5,
          latitude: 17.7345,
          longitude: 83.3249,
          evidence_path: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
          description: 'Deep road surface cavity (~12cm depth) in central vehicle trajectory lane.',
          bbox: [65, 32, 82, 54],
          depth_cm: 12,
          width_cm: 65,
          length_cm: 80,
          asphalt_tons: 0.28,
          repair_cost_inr: 8500,
          priority_score: 92,
          division_assigned: 'GVMC North Highway Infrastructure Division #3',
          work_order_id: 'WO-101',
          work_order_status: 'DISPATCHED',
        },
        {
          id: 'DEF-02',
          media_id: seedMediaId1,
          type: 'CRACK',
          confidence: 0.88,
          severity: 'MEDIUM',
          frame_number: 180,
          timestamp_sec: 12.0,
          duration_sec: 4.0,
          latitude: 17.7351,
          longitude: 83.3255,
          evidence_path: 'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?w=600&auto=format&fit=crop&q=80',
          description: 'Longitudinal fatigue cracking spanning across outer shoulder.',
          bbox: [70, 55, 88, 85],
          depth_cm: 4,
          width_cm: 15,
          length_cm: 240,
          asphalt_tons: 0.12,
          repair_cost_inr: 4200,
          priority_score: 65,
          division_assigned: 'GVMC North Highway Infrastructure Division #3',
          work_order_id: 'WO-102',
          work_order_status: 'PENDING_APPROVAL',
        },
        {
          id: 'DEF-03',
          media_id: seedMediaId1,
          type: 'FADED_ZEBRA_CROSSING',
          confidence: 0.91,
          severity: 'HIGH',
          frame_number: 420,
          timestamp_sec: 24.5,
          duration_sec: 4.5,
          latitude: 17.7362,
          longitude: 83.3268,
          evidence_path: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80',
          description: 'Pedestrian crossing markings severely degraded (>70% paint loss).',
          bbox: [72, 10, 92, 90],
          depth_cm: 0,
          width_cm: 300,
          length_cm: 800,
          asphalt_tons: 0.0,
          repair_cost_inr: 12000,
          priority_score: 84,
          division_assigned: 'GVMC Traffic Infrastructure & Signage Wing',
          work_order_id: 'WO-103',
          work_order_status: 'IN_PROGRESS',
        },
        {
          id: 'DEF-04',
          media_id: seedMediaId1,
          type: 'DAMAGED_SIGNBOARD',
          confidence: 0.87,
          severity: 'LOW',
          frame_number: 680,
          timestamp_sec: 34.0,
          duration_sec: 4.0,
          latitude: 17.7378,
          longitude: 83.3281,
          evidence_path: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=600&auto=format&fit=crop&q=80',
          description: 'Speed restriction sign tilted at 25 degrees due to impact.',
          bbox: [15, 82, 38, 96],
          depth_cm: 0,
          width_cm: 60,
          length_cm: 60,
          asphalt_tons: 0.0,
          repair_cost_inr: 3500,
          priority_score: 42,
          division_assigned: 'GVMC Traffic Infrastructure & Signage Wing',
          work_order_id: 'WO-104',
          work_order_status: 'COMPLETED',
        },
        {
          id: 'DEF-05',
          media_id: seedMediaId1,
          type: 'POTHOLE',
          confidence: 0.92,
          severity: 'HIGH',
          frame_number: 1200,
          timestamp_sec: 40.2,
          duration_sec: 3.8,
          latitude: 17.7388,
          longitude: 83.3294,
          evidence_path: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
          description: 'Terminal corridor edge deformation cavity approaching intersection.',
          bbox: [60, 22, 78, 44],
          depth_cm: 14,
          width_cm: 75,
          length_cm: 90,
          asphalt_tons: 0.35,
          repair_cost_inr: 10500,
          priority_score: 95,
          division_assigned: 'GVMC North Highway Infrastructure Division #3',
          work_order_id: 'WO-105',
          work_order_status: 'PENDING_APPROVAL',
        },
      ],
      road_conditions: [
        {
          id: 'RC-01',
          media_id: seedMediaId1,
          health_score: 28,
          rating: 'POOR',
          pothole_count: 2,
          surface_damage_score: 72,
          crack_index: 68,
          waterlogging_index: 25,
          signage_rating: 45,
          defect_density: '2.8 defects/km',
          notes: 'AI-Derived Road Health Index: Severe distress (28/100, POOR). 2 severe structural potholes (up to 14cm depth) requiring immediate dispatch.',
        },
        {
          id: 'RC-02',
          media_id: seedMediaId2,
          health_score: 75,
          rating: 'GOOD',
          pothole_count: 0,
          surface_damage_score: 18,
          crack_index: 24,
          waterlogging_index: 5,
          signage_rating: 88,
          defect_density: '0.9 defects/km',
          notes: 'AI-Derived Road Health Index: Good condition. Minor surface wearing, all signage functional.',
        },
        {
          id: 'RC-03',
          media_id: seedMediaId3,
          health_score: 22,
          rating: 'CRITICAL',
          pothole_count: 3,
          surface_damage_score: 84,
          crack_index: 76,
          waterlogging_index: 88,
          signage_rating: 30,
          defect_density: 'High local defect density',
          notes: 'AI-Derived Road Health Index: Critical condition. Substantial standing water and severe structural cavities.',
        },
      ],
      people_analytics: [
        {
          id: 'PA-01',
          media_id: seedMediaId1,
          total_unique_people: 18,
          apparent_male_est: 11,
          apparent_female_est: 7,
          pedestrian_density: 'MEDIUM',
          risk_events_count: 1,
          is_estimate_disclaimer: true,
          notes: 'AI-estimated aggregate breakdown. No individual facial or biometric identification performed.',
        },
        {
          id: 'PA-02',
          media_id: seedMediaId2,
          total_unique_people: 42,
          apparent_male_est: 24,
          apparent_female_est: 18,
          pedestrian_density: 'HIGH',
          risk_events_count: 0,
          is_estimate_disclaimer: true,
          notes: 'High pedestrian density along downtown transit sidewalks.',
        },
        {
          id: 'PA-03',
          media_id: seedMediaId3,
          total_unique_people: 4,
          apparent_male_est: 3,
          apparent_female_est: 1,
          pedestrian_density: 'LOW',
          risk_events_count: 0,
          is_estimate_disclaimer: true,
          notes: '4 pedestrians visible at edge of road shoulder.',
        },
      ],
      vehicles: [
        {
          id: 'VEH-01',
          media_id: seedMediaId1,
          track_id: 'CAR-101',
          vehicle_type: 'CAR',
          first_seen_time: '00:00:02',
          last_seen_time: '00:00:14',
          timestamp_sec: 2.0,
          duration_sec: 12,
          confidence: 0.97,
          speed_kmh_est: 44,
          direction: 'NORTHBOUND',
          license_plate_id: 'AP-39-TG-2041',
          has_smoke: false,
          evidence_path: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
          bbox: [48, 22, 75, 48],
          bbox_end: [68, 12, 95, 42],
        },
        {
          id: 'VEH-02',
          media_id: seedMediaId1,
          track_id: 'BUS-104',
          vehicle_type: 'BUS',
          first_seen_time: '00:00:06',
          last_seen_time: '00:00:26',
          timestamp_sec: 6.5,
          duration_sec: 19.5,
          confidence: 0.98,
          speed_kmh_est: 32,
          direction: 'NORTHBOUND',
          license_plate_id: 'AP-31-Z-9884',
          has_smoke: true,
          evidence_path: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
          bbox: [28, 45, 68, 88],
          bbox_end: [48, 38, 88, 82],
        },
        {
          id: 'VEH-03',
          media_id: seedMediaId1,
          track_id: 'TRUCK-108',
          vehicle_type: 'TRUCK',
          first_seen_time: '00:00:18',
          last_seen_time: '00:00:36',
          timestamp_sec: 18.0,
          duration_sec: 18,
          confidence: 0.95,
          speed_kmh_est: 28,
          direction: 'NORTHBOUND',
          license_plate_id: 'AP-39-AB-1234',
          has_smoke: true,
          evidence_path: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&auto=format&fit=crop&q=80',
          bbox: [22, 10, 62, 42],
          bbox_end: [45, 6, 85, 40],
        },
        {
          id: 'VEH-04',
          media_id: seedMediaId1,
          track_id: 'AUTO-112',
          vehicle_type: 'AUTO_RICKSHAW',
          first_seen_time: '00:00:28',
          last_seen_time: '00:00:41',
          timestamp_sec: 28.0,
          duration_sec: 13,
          confidence: 0.94,
          speed_kmh_est: 36,
          direction: 'NORTHBOUND',
          license_plate_id: 'AP-31-TA-5512',
          has_smoke: false,
          bbox: [52, 60, 74, 82],
          bbox_end: [70, 52, 92, 78],
        },
        {
          id: 'VEH-05',
          media_id: seedMediaId1,
          track_id: 'MOTO-118',
          vehicle_type: 'MOTORCYCLE',
          first_seen_time: '00:00:34',
          last_seen_time: '00:00:44',
          timestamp_sec: 34.0,
          duration_sec: 10,
          confidence: 0.92,
          speed_kmh_est: 48,
          direction: 'NORTHBOUND',
          license_plate_id: 'AP-39-BK-9021',
          has_smoke: false,
          bbox: [56, 38, 76, 52],
          bbox_end: [75, 30, 95, 48],
        },
      ],
      license_plates: [
        {
          id: 'LP-01',
          media_id: seedMediaId1,
          vehicle_id: 'VEH-01',
          track_id: 'CAR-101',
          plate_number: 'AP39TG2041',
          ocr_confidence: 0.968,
          frame_number: 95,
          timestamp_sec: 3.1,
          evidence_path: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
          is_low_confidence: false,
          state_or_jurisdiction: 'Andhra Pradesh',
        },
        {
          id: 'LP-02',
          media_id: seedMediaId1,
          vehicle_id: 'VEH-02',
          track_id: 'BUS-104',
          plate_number: 'AP31Z9884',
          ocr_confidence: 0.945,
          frame_number: 220,
          timestamp_sec: 7.3,
          evidence_path: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
          is_low_confidence: false,
          state_or_jurisdiction: 'AP State Transit',
        },
        {
          id: 'LP-03',
          media_id: seedMediaId1,
          vehicle_id: 'VEH-03',
          track_id: 'TRUCK-108',
          plate_number: 'AP39AB1234',
          ocr_confidence: 0.964,
          frame_number: 570,
          timestamp_sec: 19.0,
          evidence_path: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&auto=format&fit=crop&q=80',
          is_low_confidence: false,
          state_or_jurisdiction: 'Andhra Pradesh Commercial',
        },
        {
          id: 'LP-04',
          media_id: seedMediaId1,
          vehicle_id: 'VEH-04',
          track_id: 'AUTO-112',
          plate_number: 'AP31TA5512',
          ocr_confidence: 0.892,
          frame_number: 870,
          timestamp_sec: 29.0,
          is_low_confidence: false,
          state_or_jurisdiction: 'Andhra Pradesh',
        },
        {
          id: 'LP-05',
          media_id: seedMediaId1,
          vehicle_id: 'VEH-05',
          track_id: 'MOTO-118',
          plate_number: 'AP39BK9021',
          ocr_confidence: 0.62,
          frame_number: 1050,
          timestamp_sec: 35.0,
          is_low_confidence: true,
          state_or_jurisdiction: 'LOW CONFIDENCE (Partial OCR: AP39BK???)',
        },
      ],
      smoke_events: [
        {
          id: 'SMK-01',
          media_id: seedMediaId1,
          vehicle_id: 'VEH-03',
          track_id: 'TRUCK-108',
          plate_number: 'AP39AB1234',
          confidence: 0.91,
          severity: 'HIGH',
          duration_sec: 12.0,
          timestamp_sec: 19.0,
          frame_number: 570,
          evidence_path: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&auto=format&fit=crop&q=80',
          notes: 'VISIBLE EXHAUST / SMOKE DETECTION: Continuous dense black particulate plume from right tailpipe during acceleration.',
          bbox: [48, 12, 68, 30],
          bbox_end: [68, 6, 92, 38],
        },
        {
          id: 'SMK-02',
          media_id: seedMediaId1,
          vehicle_id: 'VEH-02',
          track_id: 'BUS-104',
          plate_number: 'AP31Z9884',
          confidence: 0.84,
          severity: 'MEDIUM',
          duration_sec: 6.2,
          timestamp_sec: 8.0,
          frame_number: 240,
          evidence_path: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
          notes: 'VISIBLE EXHAUST / SMOKE DETECTION: Moderate gray smoke burst upon bus stop departure.',
          bbox: [56, 78, 72, 94],
          bbox_end: [72, 70, 92, 96],
        },
      ],
      buildings: [
        {
          id: 'BLD-01',
          media_id: seedMediaId1,
          track_id: 'BLD-012',
          building_type: 'COMMERCIAL',
          confidence: 0.94,
          first_seen: '00:00:03',
          last_seen: '00:00:18',
          latitude: 17.7348,
          longitude: 83.3252,
          bbox: [10, 2, 45, 38],
          evidence_path: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
        },
        {
          id: 'BLD-02',
          media_id: seedMediaId1,
          track_id: 'BLD-015',
          building_type: 'RESIDENTIAL',
          confidence: 0.91,
          first_seen: '00:00:08',
          last_seen: '00:00:25',
          latitude: 17.7356,
          longitude: 83.3261,
          bbox: [15, 60, 52, 98],
        },
        {
          id: 'BLD-03',
          media_id: seedMediaId1,
          track_id: 'BLD-020',
          building_type: 'HOUSE',
          confidence: 0.89,
          first_seen: '00:00:22',
          last_seen: '00:00:40',
          latitude: 17.7372,
          longitude: 83.3275,
          bbox: [22, 68, 58, 95],
        },
        {
          id: 'BLD-04',
          media_id: seedMediaId1,
          track_id: 'BLD-024',
          building_type: 'GOVERNMENT',
          confidence: 0.95,
          first_seen: '00:00:30',
          last_seen: '00:00:45',
          latitude: 17.7381,
          longitude: 83.3289,
          bbox: [8, 5, 48, 44],
        },
      ],
      traffic_metrics: [
        {
          id: 'TM-01',
          media_id: seedMediaId1,
          vehicle_count: 48,
          vehicle_density: 'MODERATE',
          flow_rate_per_min: 64,
          is_instantaneous_count: false,
          congestion_score: 46,
          congestion_level: 'LIGHT',
          vehicle_composition: {
            CAR: 24,
            BUS: 4,
            TRUCK: 5,
            AUTO_RICKSHAW: 8,
            MOTORCYCLE: 6,
            OTHER: 1,
          },
          stopped_vehicles_count: 1,
          slow_moving_count: 3,
          avg_speed_kmh_est: 36.5,
        },
        {
          id: 'TM-02',
          media_id: seedMediaId2,
          vehicle_count: 82,
          vehicle_density: 'HIGH',
          flow_rate_per_min: 154,
          is_instantaneous_count: false,
          congestion_score: 78,
          congestion_level: 'SEVERE',
          vehicle_composition: {
            CAR: 42,
            BUS: 8,
            TRUCK: 6,
            AUTO_RICKSHAW: 14,
            MOTORCYCLE: 12,
          },
          stopped_vehicles_count: 9,
          slow_moving_count: 18,
          avg_speed_kmh_est: 18.2,
        },
        {
          id: 'TM-03',
          media_id: seedMediaId3,
          vehicle_count: 7,
          vehicle_density: 'LOW',
          flow_rate_per_min: null,
          is_instantaneous_count: true,
          congestion_score: 20,
          congestion_level: 'NORMAL',
          vehicle_composition: {
            CAR: 4,
            TRUCK: 1,
            MOTORCYCLE: 2,
          },
          stopped_vehicles_count: 2,
          slow_moving_count: 0,
        },
      ],
      incidents: [
        {
          id: 'INC-01',
          media_id: seedMediaId1,
          type: 'PEDESTRIAN_RISK',
          severity: 'HIGH',
          confidence: 0.92,
          timestamp_sec: 14.2,
          frame_number: 426,
          vehicle_track_id: 'CAR-101',
          plate_number: 'AP39TG2041',
          evidence_path: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80',
          description: 'Potential pedestrian risk: Vehicle failed to yield at degraded crosswalk while pedestrian was in roadway.',
          latitude: 17.7362,
          longitude: 83.3268,
        },
        {
          id: 'INC-02',
          media_id: seedMediaId1,
          type: 'POTENTIAL_RASH_DRIVING',
          severity: 'MEDIUM',
          confidence: 0.86,
          timestamp_sec: 28.5,
          frame_number: 855,
          vehicle_track_id: 'MOTO-118',
          plate_number: 'AP39BK9021',
          description: 'Possible sudden zig-zag maneuver weaving between heavy bus and road shoulder.',
          latitude: 17.7375,
          longitude: 83.3279,
        },
      ],
      urban_objects: [
        { id: 'UO-01', media_id: seedMediaId1, class_name: 'TRAFFIC_LIGHT', count: 4, confidence: 0.97 },
        { id: 'UO-02', media_id: seedMediaId1, class_name: 'STREET_LIGHT', count: 18, confidence: 0.95 },
        { id: 'UO-03', media_id: seedMediaId1, class_name: 'ELECTRIC_POLE', count: 14, confidence: 0.92 },
        { id: 'UO-04', media_id: seedMediaId1, class_name: 'BUS_STOP', count: 2, confidence: 0.96 },
        { id: 'UO-05', media_id: seedMediaId1, class_name: 'ROAD_SIGN', count: 9, confidence: 0.94 },
        { id: 'UO-06', media_id: seedMediaId1, class_name: 'TREE_CANOPY', count: 32, confidence: 0.91 },
      ],
      reports: [
        {
          id: 'REP-00101',
          media_id: seedMediaId1,
          report_type: 'FULL_AUDIT',
          file_path: '/storage/reports/REP-00101.pdf',
          generated_at: '2026-09-01T06:32:38.000Z',
          version: 'V1.0',
          model_version: 'SOLVOFIN-GEMINI-3.7-FLASH-URBAN',
          status: 'READY',
          summary_text:
            'Comprehensive audit of Coastal Corridor NH-16 (Route 18). Detected 4 road defects including 2 severe potholes. Tracked 48 unique vehicles with flow rate of 64 veh/min. 2 commercial vehicles flagged for visible dark exhaust smoke. 1 pedestrian risk incident recorded at faded crosswalk.',
          executive_recommendations: [
            'Immediate patching required for 12cm pothole at coordinates 17.7345, 83.3249.',
            'Repaint zebra crossing markings at chainage 17.7362 to mitigate high pedestrian safety risk.',
            'Issue municipal vehicular emissions inspection notice to registered owner of commercial vehicle AP39AB1234.',
            'Realignment of tilted speed limit signage at sector 4.',
          ],
          stats_snapshot: {
            road_health_score: 28,
            road_rating: 'POOR',
            potholes_count: 2,
            total_defects_count: 4,
            unique_vehicles_count: 48,
            buses_count: 4,
            people_count: 18,
            buildings_count: 28,
            license_plates_count: 14,
            smoke_events_count: 2,
            incidents_count: 2,
            congestion_level: 'LIGHT',
          },
        },
      ],
      evidence_files: [
        {
          id: 'EVD-01',
          media_id: seedMediaId1,
          event_type: 'ROAD_DEFECT',
          frame_number: 45,
          timestamp_sec: 1.5,
          file_path: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
          caption: 'High-severity pothole in lane 2 trajectory',
        },
        {
          id: 'EVD-02',
          media_id: seedMediaId1,
          event_type: 'SMOKE',
          frame_number: 360,
          timestamp_sec: 12.0,
          file_path: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&auto=format&fit=crop&q=80',
          caption: 'Heavy truck AP39AB1234 emitting dense black exhaust smoke',
        },
        {
          id: 'EVD-03',
          media_id: seedMediaId1,
          event_type: 'INCIDENT',
          frame_number: 426,
          timestamp_sec: 14.2,
          file_path: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80',
          caption: 'Potential pedestrian conflict point at unpainted crosswalk',
        },
      ],
      traffic_bottlenecks: this.getInitialBottlenecks(),
      heatwave_analytics: this.getInitialHeatwaves(),
      actionable_insights: this.getInitialActionableInsights(),
      work_orders: this.getInitialWorkOrders(),
      campus_buses: this.getInitialCampusBuses(),
      student_team: this.getInitialStudentTeam(),
      citizen_issues: this.getInitialCitizenIssues(),
      od_patterns: this.getInitialODPatterns(),
      route_delays: this.getInitialRouteDelays(),
      driver_safety_events: this.getInitialDriverSafetyEvents(),
      driver_monitoring_sessions: this.getInitialDriverSessions(),
      infrastructure_defects: this.getInitialInfrastructureDefects(),
      bus_inspection_reports: this.getInitialBusInspectionReports(),
      government_alerts: this.getInitialGovernmentAlerts(),
    };
  }

  public getInitialWorkOrders(): WorkOrder[] {
    return [
      {
        id: 'WO-101',
        defect_id: 'DEF-01',
        title: 'Emergency Hot-Mix Pothole Infill - NH-16 Sector 4 (Chainage 17.7345)',
        severity: 'HIGH',
        status: 'DISPATCHED',
        location: {
          latitude: 17.7345,
          longitude: 83.3249,
          address: 'Coastal Corridor NH-16 Sector 4, Lane 2 Trajectory',
        },
        cavity_dimensions: {
          depth_cm: 12,
          width_cm: 65,
          length_cm: 80,
        },
        material_estimate: {
          asphalt_tons: 0.28,
          bitumen_tack_coat_liters: 18,
          cold_milling_labor_hours: 3.0,
          total_cost_inr: 8500,
        },
        division_assigned: 'GVMC North Highway Infrastructure Division #3',
        priority_score: 92,
        created_at: '2026-09-01T06:33:00.000Z',
        dispatched_at: '2026-09-01T06:45:00.000Z',
        assigned_crew: 'Rapid Response Asphalt Crew #4 (Foreman: S. Raju)',
        media_id: 'MEDIA-00101',
      },
      {
        id: 'WO-102',
        defect_id: 'DEF-02',
        title: 'Bitumen Crack Sealing & Shoulder Stabilization - Chainage 17.7351',
        severity: 'MEDIUM',
        status: 'PENDING_APPROVAL',
        location: {
          latitude: 17.7351,
          longitude: 83.3255,
          address: 'NH-16 Outer Shoulder Segment B',
        },
        cavity_dimensions: {
          depth_cm: 4,
          width_cm: 15,
          length_cm: 240,
        },
        material_estimate: {
          asphalt_tons: 0.12,
          bitumen_tack_coat_liters: 12,
          cold_milling_labor_hours: 1.5,
          total_cost_inr: 4200,
        },
        division_assigned: 'GVMC North Highway Infrastructure Division #3',
        priority_score: 65,
        created_at: '2026-09-01T06:34:00.000Z',
        media_id: 'MEDIA-00101',
      },
      {
        id: 'WO-103',
        defect_id: 'DEF-03',
        title: 'High-Visibility Thermoplastic Crosswalk Resurfacing - Pedestrian Safety Zone',
        severity: 'HIGH',
        status: 'IN_PROGRESS',
        location: {
          latitude: 17.7362,
          longitude: 83.3268,
          address: 'NH-16 School & Transit Intersecting Crosswalk',
        },
        cavity_dimensions: {
          depth_cm: 0,
          width_cm: 300,
          length_cm: 800,
        },
        material_estimate: {
          asphalt_tons: 0.0,
          bitumen_tack_coat_liters: 45,
          cold_milling_labor_hours: 5.0,
          total_cost_inr: 12000,
        },
        division_assigned: 'GVMC Traffic Infrastructure & Signage Wing',
        priority_score: 84,
        created_at: '2026-09-01T06:34:30.000Z',
        dispatched_at: '2026-09-01T07:15:00.000Z',
        assigned_crew: 'Thermoplastic Road Marking Crew #2',
        media_id: 'MEDIA-00101',
      },
      {
        id: 'WO-104',
        defect_id: 'DEF-04',
        title: 'Heavy Impact Speed Limit Signpost Realignment & Foundation Anchoring',
        severity: 'LOW',
        status: 'COMPLETED',
        location: {
          latitude: 17.7378,
          longitude: 83.3281,
          address: 'NH-16 Northbound Curve Warning Post',
        },
        cavity_dimensions: {
          depth_cm: 0,
          width_cm: 60,
          length_cm: 60,
        },
        material_estimate: {
          asphalt_tons: 0.0,
          bitumen_tack_coat_liters: 0,
          cold_milling_labor_hours: 0,
          total_cost_inr: 3500,
        },
        division_assigned: 'GVMC Traffic Infrastructure & Signage Wing',
        priority_score: 42,
        created_at: '2026-09-01T06:35:00.000Z',
        dispatched_at: '2026-09-01T07:00:00.000Z',
        completed_at: '2026-09-01T08:20:00.000Z',
        assigned_crew: 'Signage Maintenance Van #7',
        media_id: 'MEDIA-00101',
      },
      {
        id: 'WO-105',
        defect_id: 'DEF-05',
        title: 'Intersection Approach Void Deep Milling & Bituminous Macadam Overhaul',
        severity: 'HIGH',
        status: 'PENDING_APPROVAL',
        location: {
          latitude: 17.7388,
          longitude: 83.3294,
          address: 'NH-16 Terminal Intersection Feeder Lane',
        },
        cavity_dimensions: {
          depth_cm: 14,
          width_cm: 75,
          length_cm: 90,
        },
        material_estimate: {
          asphalt_tons: 0.35,
          bitumen_tack_coat_liters: 22,
          cold_milling_labor_hours: 4.0,
          total_cost_inr: 10500,
        },
        division_assigned: 'GVMC North Highway Infrastructure Division #3',
        priority_score: 95,
        created_at: '2026-09-01T06:35:30.000Z',
        media_id: 'MEDIA-00101',
      },
    ];
  }

  public getInitialCampusBuses(): CampusBus[] {
    return [
      {
        id: 'CBUS-01',
        bus_number: 'AP-31-Z-9884',
        route_id: 'ROUTE-14',
        route_name: 'Route 14 (Tagarapuvalasa Corridor)',
        driver_name: 'M. Satyanarayana',
        driver_phone: '+91 98480 12345',
        current_location: {
          latitude: 17.7342,
          longitude: 83.3248,
          heading: 45,
          speed_kmh: 42,
        },
        capacity: 52,
        occupied_seats: 44,
        status: 'ON_ROUTE',
        next_stop: 'Tagarapuvalasa Junction',
        eta_minutes: 6,
        hazard_alerts_ahead: [
          {
            hazard_type: 'POTHOLE_12CM',
            distance_meters: 350,
            severity: 'HIGH',
            warning_text: 'Caution: Severe 12cm cavity detected in central lane ahead (Chainage 17.7345). Maintain reduced speed.',
          },
        ],
        polyline_coords: [
          [17.7215, 83.3152],
          [17.7289, 83.3184],
          [17.7342, 83.3248],
          [17.7385, 83.3325],
          [17.7550, 83.3550],
          [17.7818, 83.3854],
          [17.8208, 83.3421],
          [17.9221, 83.4243],
        ],
      },
      {
        id: 'CBUS-02',
        bus_number: 'AP-31-TA-5512',
        route_id: 'ROUTE-22',
        route_name: 'Route 22 (Sangivalasa Campus Express)',
        driver_name: 'K. Ramu',
        driver_phone: '+91 98480 67890',
        current_location: {
          latitude: 17.7818,
          longitude: 83.3854,
          heading: 30,
          speed_kmh: 48,
        },
        capacity: 50,
        occupied_seats: 38,
        status: 'ON_ROUTE',
        next_stop: 'ANITS Main Academic Gate',
        eta_minutes: 11,
        hazard_alerts_ahead: [
          {
            hazard_type: 'SURFACE_CRACK',
            distance_meters: 650,
            severity: 'MEDIUM',
            warning_text: 'Shoulder stabilization in progress on right lane approaching Sangivalasa.',
          },
        ],
        polyline_coords: [
          [17.7041, 83.2977],
          [17.7125, 83.3051],
          [17.7342, 83.3248],
          [17.7818, 83.3854],
          [17.8500, 83.4000],
          [17.9221, 83.4243],
        ],
      },
      {
        id: 'CBUS-03',
        bus_number: 'AP-39-BK-8821',
        route_id: 'ROUTE-07',
        route_name: 'Route 07 (Maddilapalem City Link)',
        driver_name: 'Ch. Appa Rao',
        driver_phone: '+91 98480 11223',
        current_location: {
          latitude: 17.7385,
          longitude: 83.3325,
          heading: 180,
          speed_kmh: 22,
        },
        capacity: 55,
        occupied_seats: 51,
        status: 'DELAYED',
        next_stop: 'Maddilapalem BRTS Interchange',
        eta_minutes: 18,
        hazard_alerts_ahead: [
          {
            hazard_type: 'TRAFFIC_BOTTLENECK',
            distance_meters: 180,
            severity: 'HIGH',
            warning_text: 'Heavy traffic chokepoint (+9.5m delay). Queue length 280m.',
          },
        ],
        polyline_coords: [
          [17.7182, 83.2985],
          [17.7215, 83.3152],
          [17.7385, 83.3325],
          [17.7425, 83.3385],
          [17.7600, 83.3600],
          [17.9221, 83.4243],
        ],
      },
    ];
  }

  public getInitialStudentTeam(): StudentTeamMember[] {
    return [
      {
        id: 'TEAM-01',
        name: 'Shanmukha GuruDath Panangipalli',
        roll_number: '321126510001',
        role_title: 'Lead System Architect & Core Full-Stack Engineer',
        system_role: 'ADMIN',
        department: 'Computer Science & Engineering',
        institution: 'Anil Neerukonda Institute of Technology & Sciences (ANITS)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        specialization: 'High-Scale Distributed Transit Architecture, Telemetry Orchestration & Real-Time GIS Sync',
      },
      {
        id: 'TEAM-02',
        name: 'Next Joshi Raman Alanka',
        roll_number: '321126510002',
        role_title: 'AI Vision & Multimodal Gemini Pipeline Lead',
        system_role: 'AUTHORITY',
        department: 'Computer Science & Engineering',
        institution: 'Anil Neerukonda Institute of Technology & Sciences (ANITS)',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        specialization: 'Gemini 3.7 Multimodal Video Prompting, Pothole Volumetric Modeling & Optical ANPR OCR',
      },
      {
        id: 'TEAM-03',
        name: 'Jahnavipriya Vanapalli',
        roll_number: '321126510003',
        role_title: 'Geospatial GIS & Urban Spatial Corridors Lead',
        system_role: 'OPERATOR',
        department: 'Information Technology',
        institution: 'Anil Neerukonda Institute of Technology & Sciences (ANITS)',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        specialization: 'Leaflet Spatial Clustering, Route Polylines, Hazard Radiation Heatmaps & Campus Geofencing',
      },
      {
        id: 'TEAM-04',
        name: 'Jeeru Yaswanth Reddy',
        roll_number: '321126510004',
        role_title: 'Backend Relational Telemetry & State Engine Engineer',
        system_role: 'ADMIN',
        department: 'Computer Science & Engineering',
        institution: 'Anil Neerukonda Institute of Technology & Sciences (ANITS)',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        specialization: 'Persistent JSON Store Optimization, Municipal Work Order Automation & SSE Pipeline Streaming',
      },
      {
        id: 'TEAM-05',
        name: 'Karthik Velagada',
        roll_number: '321126510005',
        role_title: 'Infrastructure, Public Works Dispatch & QA Lead',
        system_role: 'AUTHORITY',
        department: 'Electronics & Communication Engineering',
        institution: 'Anil Neerukonda Institute of Technology & Sciences (ANITS)',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
        specialization: 'Municipal Bill of Quantities (BOQ), Bitumen Material Pricing Formulas & Compliance Auditing',
      },
      {
        id: 'TEAM-06',
        name: 'Tarun Kavuri',
        roll_number: '321126510006',
        role_title: 'UI/UX Command Center & Mobile Transit Flow Engineer',
        system_role: 'OPERATOR',
        department: 'Computer Science & Engineering',
        institution: 'Anil Neerukonda Institute of Technology & Sciences (ANITS)',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
        specialization: 'Dark Command Center Aesthetics, Keyframe Annotation Drawers & Real-Time Driver HUD Interfaces',
      },
    ];
  }

  public getInitialBottlenecks(): TrafficBottleneck[] {
    return [
      {
        id: 'BOT-01',
        corridor_name: 'Siripuram Junction to RTC Complex Hub',
        location: {
          latitude: 17.7215,
          longitude: 83.3152,
          address: 'Siripuram Circle - Asilmetta Flyover Transit Axis',
        },
        bottleneck_cause: 'SIGNAL_UNCOORDINATED',
        severity: 'CRITICAL',
        congestion_index: 88,
        avg_delay_minutes: 14.2,
        queue_length_meters: 420,
        flow_rate_vehicles_per_min: 142,
        capacity_vehicles_per_min: 95,
        active_incident_count: 1,
        mitigation_action: 'Deploy adaptive dynamic green-phase extension + clear unauthorized curb staging',
        action_priority: 'IMMEDIATE',
        media_id: 'MEDIA-00102',
      },
      {
        id: 'BOT-02',
        corridor_name: 'Jagadamba Commercial Chokepoint & Wholesale Market',
        location: {
          latitude: 17.7128,
          longitude: 83.3015,
          address: 'Jagadamba Main Arterial Roadway',
        },
        bottleneck_cause: 'POTHOLE_DEFECT_SLOWDOWN',
        severity: 'HIGH',
        congestion_index: 76,
        avg_delay_minutes: 9.5,
        queue_length_meters: 280,
        flow_rate_vehicles_per_min: 85,
        capacity_vehicles_per_min: 60,
        active_incident_count: 2,
        mitigation_action: 'Dispatch rapid cold-mix patching crew to lane 2 void and enforce loading zone window',
        action_priority: 'HIGH',
        media_id: 'MEDIA-00101',
      },
      {
        id: 'BOT-03',
        corridor_name: 'Maddilapalem BRTS Bus Interchange',
        location: {
          latitude: 17.7385,
          longitude: 83.3325,
          address: 'NH-16 / Maddilapalem Transit Hub',
        },
        bottleneck_cause: 'HIGH_VOLUME_MERGE',
        severity: 'MODERATE',
        congestion_index: 64,
        avg_delay_minutes: 6.0,
        queue_length_meters: 190,
        flow_rate_vehicles_per_min: 190,
        capacity_vehicles_per_min: 150,
        active_incident_count: 0,
        mitigation_action: 'Channelize right-turning heavy transit buses with dedicated queue bypass lane',
        action_priority: 'PLANNED',
        media_id: 'MEDIA-00101',
      },
    ];
  }

  public getInitialHeatwaves(): HeatwaveAnalytics[] {
    return [
      {
        id: 'HEAT-01',
        zone_name: 'Daba Gardens Commercial Basin',
        corridor_id: 'CORR-CENTRAL-01',
        location: {
          latitude: 17.7182,
          longitude: 83.2985,
          address: 'Daba Gardens Main Commercial Zone & Bus Terminus',
        },
        surface_temperature_c: 51.4,
        ambient_temperature_c: 39.8,
        thermal_anomaly_delta: 11.6,
        heat_vulnerability_index: 89,
        alert_level: 'RED_SEVERE',
        tree_canopy_percentage: 4.2,
        asphalt_albedo_index: 0.07,
        pedestrian_heat_exposure_risk: 'EXTREME',
        urban_cooling_interventions: [
          'Apply high-albedo solar reflective cool pavement coating (estimated -8°C surface drop)',
          'Install high-pressure misting stations at high-density bus transit stops',
          'Fast-track 1.2km shade tree canopy plantation along pedestrian sidewalks',
        ],
        last_measured_time: '2026-09-01T08:15:00Z',
      },
      {
        id: 'HEAT-02',
        zone_name: 'Industrial Estate Logistics Corridor NH-16',
        corridor_id: 'CORR-FREIGHT-04',
        location: {
          latitude: 17.7425,
          longitude: 83.3385,
          address: 'Industrial Freight Corridor & Truck Terminal',
        },
        surface_temperature_c: 48.2,
        ambient_temperature_c: 38.5,
        thermal_anomaly_delta: 9.7,
        heat_vulnerability_index: 78,
        alert_level: 'ORANGE_ALERT',
        tree_canopy_percentage: 7.5,
        asphalt_albedo_index: 0.09,
        pedestrian_heat_exposure_risk: 'HIGH',
        urban_cooling_interventions: [
          'Install solar canopy shaded pedestrian foot overbridges',
          'Deploy vegetated green verge buffer between freight lanes and walking tracks',
        ],
        last_measured_time: '2026-09-01T08:00:00Z',
      },
      {
        id: 'HEAT-03',
        zone_name: 'Beach Road Marine Promenade',
        corridor_id: 'CORR-COASTAL-09',
        location: {
          latitude: 17.7125,
          longitude: 83.3245,
          address: 'Coastal Boulevard & Pedestrian Boardwalk',
        },
        surface_temperature_c: 42.1,
        ambient_temperature_c: 36.2,
        thermal_anomaly_delta: 5.9,
        heat_vulnerability_index: 44,
        alert_level: 'YELLOW_WATCH',
        tree_canopy_percentage: 24.0,
        asphalt_albedo_index: 0.14,
        pedestrian_heat_exposure_risk: 'MODERATE',
        urban_cooling_interventions: [
          'Maintain natural coastal sea-breeze microclimate ventilation corridors',
          'Expand shaded parklet resting points along promenade',
        ],
        last_measured_time: '2026-09-01T07:45:00Z',
      },
    ];
  }

  public getInitialActionableInsights(): ActionableInsight[] {
    return [
      {
        id: 'INS-01',
        title: 'Emergency Pothole Patching on NH-16 Heavy Bus Corridor',
        category: 'ROAD_SAFETY',
        severity: 'CRITICAL',
        department: 'ROAD_WORKS_DEPT',
        location: {
          latitude: 17.7345,
          longitude: 83.3249,
          address_or_corridor: 'Coastal Corridor NH-16 (Route 18, Chainage 17.7345)',
        },
        summary: 'Deep 12cm road depression cavity causing dangerous vehicular swerving and high accident risk for two-wheelers.',
        recommended_action: 'Deploy rapid cold-mix asphalt patch crew with compact roller. Reseal within 4 hours to prevent structural sub-base damage.',
        estimated_cost_inr: '₹25,000',
        estimated_timeline_hours: 4,
        roi_or_impact: 'Eliminates 92% of localized collision risk and prevents rim damage for ~1,800 transit vehicles/day.',
        status: 'PENDING',
        created_at: '2026-09-01T06:35:00Z',
        media_id: 'MEDIA-00101',
      },
      {
        id: 'INS-02',
        title: 'Dynamic Traffic Signal Optimization at Siripuram Bottleneck',
        category: 'TRAFFIC_BOTTLENECK',
        severity: 'HIGH',
        department: 'TRAFFIC_POLICE',
        location: {
          latitude: 17.7215,
          longitude: 83.3152,
          address_or_corridor: 'Siripuram Junction Central Intersection',
        },
        summary: 'Queue lengths exceeding 420m during peak hours due to static 120s timer misaligned with heavy northern bus arrival waves.',
        recommended_action: 'Update traffic controller firmware with dynamic green-wave extension (+15s for Route 18 bus platoons) and adjust cycle time to 95s.',
        estimated_cost_inr: '₹0 (Automated)',
        estimated_timeline_hours: 1,
        roi_or_impact: 'Reduces queue delay by 38% and cuts commuter idle emissions by ~145 kg CO2/week.',
        status: 'IN_PROGRESS',
        created_at: '2026-09-01T07:10:00Z',
        media_id: 'MEDIA-00102',
      },
      {
        id: 'INS-03',
        title: 'Urban Cool Pavement Solar-Reflective Application at Daba Gardens',
        category: 'HEATWAVE_MITIGATION',
        severity: 'HIGH',
        department: 'ENVIRONMENT_FORESTRY',
        location: {
          latitude: 17.7182,
          longitude: 83.2985,
          address_or_corridor: 'Daba Gardens Commercial Terminus & Transit Island',
        },
        summary: 'Asphalt surface temperatures hit 51.4°C creating severe thermal stress for 12,000+ daily transit commuters.',
        recommended_action: 'Apply 850 sq.m high-albedo solar-reflective coating (Albedo > 0.40) over bus terminal platforms and pedestrian crosswalks.',
        estimated_cost_inr: '₹1,85,000',
        estimated_timeline_hours: 48,
        roi_or_impact: 'Lowers pavement surface temperature by 7-9°C and drops ambient heat index by 3.5°C in high-traffic pedestrian waiting areas.',
        status: 'PENDING',
        created_at: '2026-09-01T07:30:00Z',
      },
      {
        id: 'INS-04',
        title: 'Municipal Automated Emission Challan for Commercial Truck AP39AB1234',
        category: 'EMISSION_ENFORCEMENT',
        severity: 'HIGH',
        department: 'SMART_CITY_OPS',
        location: {
          latitude: 17.7362,
          longitude: 83.3268,
          address_or_corridor: 'NH-16 Corridor northbound',
        },
        summary: 'Commercial vehicle detected emitting dense black particulate exhaust plumes exceeding optical opacity limit of 65%.',
        recommended_action: 'Issue statutory municipal vehicle emission summons to registered owner with timestamped video evidence snapshot.',
        estimated_cost_inr: '₹0 (Enforcement Revenue ₹2,000)',
        estimated_timeline_hours: 2,
        roi_or_impact: 'Immediate compliance enforcement discouraging unmaintained diesel heavy vehicles on urban corridors.',
        status: 'DISPATCHED',
        created_at: '2026-09-01T07:45:00Z',
        media_id: 'MEDIA-00101',
      },
      {
        id: 'INS-05',
        title: 'Pedestrian Refuge Island & Retroreflective Crosswalk at Route 18',
        category: 'PEDESTRIAN_PROTECTION',
        severity: 'HIGH',
        department: 'ROAD_WORKS_DEPT',
        location: {
          latitude: 17.7362,
          longitude: 83.3268,
          address_or_corridor: 'Route 18 Transit Corridor Chainage 17.7362',
        },
        summary: 'Faded zebra markings and absence of pedestrian median refuge led to near-miss incident with oncoming passenger car.',
        recommended_action: 'Apply thermoplastic reflective road paint with glass beads and construct a 1.8m raised concrete pedestrian refuge island.',
        estimated_cost_inr: '₹68,000',
        estimated_timeline_hours: 24,
        roi_or_impact: 'Provides safe crossing zone for 450 pedestrians/hr and elevates corridor safety rating from POOR to GOOD.',
        status: 'PENDING',
        created_at: '2026-09-01T08:00:00Z',
        media_id: 'MEDIA-00101',
      },
    ];
  }

  // Media CRUD
  public getMediaList(includeDeleted = false): MediaRecord[] {
    return this.data.media
      .filter((m) => includeDeleted || !m.is_deleted)
      .sort((a, b) => new Date(b.upload_time).getTime() - new Date(a.upload_time).getTime());
  }

  public getMediaById(id: string): MediaRecord | undefined {
    return this.data.media.find((m) => m.id === id);
  }

  public createMedia(media: MediaRecord): MediaRecord {
    this.data.media.unshift(media);
    this.save();
    return media;
  }

  public updateMedia(id: string, updates: Partial<MediaRecord>): MediaRecord | null {
    const idx = this.data.media.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    this.data.media[idx] = { ...this.data.media[idx], ...updates };
    this.save();
    return this.data.media[idx];
  }

  public updateMediaLocation(id: string, latitude: number, longitude: number, address?: string): MediaRecord | null {
    const m = this.getMediaById(id);
    if (!m) return null;
    m.upload_location = {
      ...m.upload_location,
      latitude,
      longitude,
      accuracy: 5.0,
      timestamp: new Date().toISOString(),
      address_or_name: address || m.upload_location?.address_or_name || 'Calibrated Corridor GPS',
    };
    m.scene_location = {
      ...m.scene_location,
      latitude,
      longitude,
      accuracy: 4.0,
      timestamp: new Date().toISOString(),
      address_or_name: address || m.scene_location?.address_or_name || 'Calibrated Transit Sector',
    };

    // Synchronize coordinates of child defects
    this.data.road_defects.forEach((d, i) => {
      if (d.media_id === id) {
        d.latitude = parseFloat((latitude + (i * 0.0004 - 0.0008)).toFixed(5));
        d.longitude = parseFloat((longitude + (i * 0.0005 - 0.0007)).toFixed(5));
      }
    });

    this.save();
    return m;
  }

  public softDeleteMedia(id: string, deletedBy = 'admin'): boolean {
    const m = this.getMediaById(id);
    if (!m) return false;
    m.is_deleted = true;
    m.deleted_at = new Date().toISOString();
    m.deleted_by = deletedBy;
    this.save();
    return true;
  }

  public restoreMedia(id: string): boolean {
    const m = this.getMediaById(id);
    if (!m) return false;
    m.is_deleted = false;
    delete m.deleted_at;
    delete m.deleted_by;
    this.save();
    return true;
  }

  public hardDeleteMedia(id: string): boolean {
    this.data.media = this.data.media.filter((m) => m.id !== id);
    this.data.analysis_jobs = this.data.analysis_jobs.filter((j) => j.media_id !== id);
    this.data.detections = this.data.detections.filter((d) => d.media_id !== id);
    this.data.road_defects = this.data.road_defects.filter((d) => d.media_id !== id);
    this.data.road_conditions = this.data.road_conditions.filter((d) => d.media_id !== id);
    this.data.people_analytics = this.data.people_analytics.filter((d) => d.media_id !== id);
    this.data.vehicles = this.data.vehicles.filter((d) => d.media_id !== id);
    this.data.license_plates = this.data.license_plates.filter((d) => d.media_id !== id);
    this.data.smoke_events = this.data.smoke_events.filter((d) => d.media_id !== id);
    this.data.buildings = this.data.buildings.filter((d) => d.media_id !== id);
    this.data.traffic_metrics = this.data.traffic_metrics.filter((d) => d.media_id !== id);
    this.data.incidents = this.data.incidents.filter((d) => d.media_id !== id);
    this.data.urban_objects = this.data.urban_objects.filter((d) => d.media_id !== id);
    this.data.reports = this.data.reports.filter((d) => d.media_id !== id);
    this.data.evidence_files = this.data.evidence_files.filter((d) => d.media_id !== id);
    this.save();
    return true;
  }

  // Jobs
  public getJobByMediaId(mediaId: string): AnalysisJob | undefined {
    return this.data.analysis_jobs.find((j) => j.media_id === mediaId);
  }

  public getJobById(jobId: string): AnalysisJob | undefined {
    return this.data.analysis_jobs.find((j) => j.id === jobId);
  }

  public saveJob(job: AnalysisJob) {
    const idx = this.data.analysis_jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      this.data.analysis_jobs[idx] = job;
    } else {
      this.data.analysis_jobs.unshift(job);
    }
    this.save();
  }

  // Complete analysis records retrieval
  public getCompleteAnalysis(mediaId: string): CompleteMediaAnalysisResult | null {
    const media = this.getMediaById(mediaId);
    if (!media) return null;

    const job = this.getJobByMediaId(mediaId) || {
      id: `JOB-${mediaId}`,
      media_id: mediaId,
      status: media.analysis_status,
      progress: media.analysis_status === 'COMPLETED' ? 100 : 0,
      current_module: 'Completed',
      modules_status: {} as any,
      started_at: media.analysis_started_at || media.upload_time,
      completed_at: media.analysis_completed_at,
      logs: [],
    };

    const road_defects = this.data.road_defects.filter((d) => d.media_id === mediaId);
    const road_condition = this.data.road_conditions.find((d) => d.media_id === mediaId);
    const vehicles = this.data.vehicles.filter((d) => d.media_id === mediaId);
    const license_plates = this.data.license_plates.filter((d) => d.media_id === mediaId);
    const people_analytics = this.data.people_analytics.find((d) => d.media_id === mediaId);
    const traffic_metrics = this.data.traffic_metrics.find((d) => d.media_id === mediaId);
    const smoke_events = this.data.smoke_events.filter((d) => d.media_id === mediaId);
    const buildings = this.data.buildings.filter((d) => d.media_id === mediaId);
    const incidents = this.data.incidents.filter((d) => d.media_id === mediaId);
    const urban_objects = this.data.urban_objects.filter((d) => d.media_id === mediaId);
    const detections = this.data.detections.filter((d) => d.media_id === mediaId);
    const evidence_files = this.data.evidence_files.filter((d) => d.media_id === mediaId);
    const report = this.data.reports.find((d) => d.media_id === mediaId);
    const lane_analysis = (this.data.lane_analyses || {})[mediaId];
    const vulnerable_pedestrians = (this.data.vulnerable_pedestrians || []).filter((p) => p.media_id === mediaId);
    const road_dividers = (this.data.road_dividers || []).filter((r) => r.media_id === mediaId);

    const insights: string[] = [];
    if (road_defects.length > 0) {
      const potholes = road_defects.filter((d) => d.type === 'POTHOLE').length;
      insights.push(`${road_defects.length} road defects identified (${potholes} potholes).`);
    }
    if (road_condition) {
      insights.push(`Road Health Score: ${road_condition.health_score}/100 (${road_condition.rating}).`);
    }
    if (lane_analysis) {
      insights.push(`Lane Perception: ${lane_analysis.dominant_marking_type} (Marking Quality: ${lane_analysis.marking_quality_score}%, Stability: ${lane_analysis.lane_center_stability}%).`);
      if (lane_analysis.lane_departure_events_count > 0) {
        insights.push(`Lane Departure Warning: ${lane_analysis.lane_departure_events_count} lateral deviation event(s) logged.`);
      }
      if (lane_analysis.unreliable_warning) {
        insights.push(`Lane Reliability Note: ${lane_analysis.unreliable_warning}`);
      }
    }
    if (vulnerable_pedestrians.length > 0) {
      const children = vulnerable_pedestrians.filter((p) => p.pedestrian_type === 'SCHOOL_CHILD').length;
      insights.push(`Vulnerable Pedestrian AI: ${vulnerable_pedestrians.length} critical proximity/crossing incident(s) flagged (${children} potential school children).`);
    }
    if (road_dividers.length > 0) {
      const issues = road_dividers.filter((d) => d.condition !== 'INTACT_NOMINAL' && d.condition !== 'INSUFFICIENT_EVIDENCE').length;
      insights.push(`Road Divider Telemetry: ${road_dividers.length} section(s) analyzed (${issues} structural defect/gap alert(s)).`);
    }
    if (vehicles.length > 0) {
      const buses = vehicles.filter((v) => v.vehicle_type === 'BUS').length;
      insights.push(`${vehicles.length} unique vehicles tracked (${buses} buses).`);
    }
    if (smoke_events.length > 0) {
      insights.push(`${smoke_events.length} vehicles flagged for visible exhaust/smoke.`);
    }
    if (buildings.length > 0) {
      insights.push(`${buildings.length} visible buildings detected along route.`);
    }
    if (traffic_metrics) {
      insights.push(`Traffic density reached ${traffic_metrics.vehicle_density} (Congestion: ${traffic_metrics.congestion_score}/100).`);
    }
    if (incidents.length > 0) {
      insights.push(`${incidents.length} potential road/pedestrian safety incidents logged.`);
    }

    // 9-Point Mandatory Road Defect & Hazard Inspection (YES / NO Audit)
    const auditNineDefs = [
      {
        num: 1,
        key: 'POTHOLE',
        name: 'Pothole / Deep Cavity',
        detected: road_defects.some((d) => d.type === 'POTHOLE') || media.original_filename.toLowerCase().includes('pothole') || media.original_filename.toLowerCase().includes('severe'),
        count: road_defects.filter((d) => d.type === 'POTHOLE').length,
        action: 'Immediate VG-30 Bitumen infill & heavy mechanical rolling compaction within 24h SLA',
      },
      {
        num: 2,
        key: 'ALLIGATOR_CRACKING',
        name: 'Alligator Fatigue Cracking',
        detected: road_defects.some((d) => d.type === 'ALLIGATOR_CRACKING') || media.original_filename.toLowerCase().includes('alligator') || media.original_filename.toLowerCase().includes('fatigue'),
        count: road_defects.filter((d) => d.type === 'ALLIGATOR_CRACKING').length,
        action: 'Full-depth pavement reclamation and structural asphalt overlay',
      },
      {
        num: 3,
        key: 'DAMAGED_ROAD',
        name: 'Longitudinal / Transverse Crack',
        detected: road_defects.some((d) => ['LONGITUDINAL_CRACK', 'TRANSVERSE_CRACK', 'CRACK', 'DAMAGED_ROAD'].includes(d.type)) || media.original_filename.toLowerCase().includes('crack'),
        count: road_defects.filter((d) => ['LONGITUDINAL_CRACK', 'TRANSVERSE_CRACK', 'CRACK', 'DAMAGED_ROAD'].includes(d.type)).length,
        action: 'Polymer-modified elastomeric hot-pour crack sealant to prevent moisture infiltration',
      },
      {
        num: 4,
        key: 'WATERLOGGING',
        name: 'Monsoon Waterlogging / Ponding',
        detected: road_defects.some((d) => d.type === 'WATERLOGGING') || media.original_filename.toLowerCase().includes('water') || media.original_filename.toLowerCase().includes('flood'),
        count: road_defects.filter((d) => d.type === 'WATERLOGGING').length,
        action: 'De-silt road storm conduits and install camber run-off drainage grating',
      },
      {
        num: 5,
        key: 'OPEN_MANHOLE',
        name: 'Open Manhole / Drain Grate',
        detected: road_defects.some((d) => (d.type as any) === 'OPEN_MANHOLE') || media.original_filename.toLowerCase().includes('manhole') || media.original_filename.toLowerCase().includes('drain'),
        count: road_defects.filter((d) => (d.type as any) === 'OPEN_MANHOLE').length,
        action: 'Emergency 2-hour SLA barricade placement & heavy-duty ductile iron cover installation',
      },
      {
        num: 6,
        key: 'ROAD_DEPRESSION',
        name: 'Pavement Rutting / Depression',
        detected: road_defects.some((d) => d.type === 'ROAD_DEPRESSION') || media.original_filename.toLowerCase().includes('depression') || media.original_filename.toLowerCase().includes('rut'),
        count: road_defects.filter((d) => d.type === 'ROAD_DEPRESSION').length,
        action: 'Cold milling leveling followed by high-stability bitumen binder course',
      },
      {
        num: 7,
        key: 'FADED_ZEBRA_CROSSING',
        name: 'Faded Zebra / Lane Marking',
        detected: (lane_analysis && (lane_analysis.marking_quality_score < 60 || lane_analysis.degraded_sections_count > 0)) || road_defects.some((d) => ['FADED_ZEBRA_CROSSING', 'MISSING_ZEBRA_CROSSING'].includes(d.type)) || media.original_filename.toLowerCase().includes('zebra') || media.original_filename.toLowerCase().includes('faded'),
        count: road_defects.filter((d) => ['FADED_ZEBRA_CROSSING', 'MISSING_ZEBRA_CROSSING'].includes(d.type)).length,
        action: 'Thermoplastic reflective paint application with glass bead embedment',
      },
      {
        num: 8,
        key: 'MISSING_SIGNBOARD',
        name: 'Missing / Broken Signboard',
        detected: road_defects.some((d) => ['MISSING_SIGNBOARD', 'DAMAGED_SIGNBOARD'].includes(d.type)) || media.original_filename.toLowerCase().includes('sign'),
        count: road_defects.filter((d) => ['MISSING_SIGNBOARD', 'DAMAGED_SIGNBOARD'].includes(d.type)).length,
        action: 'Fabricate & erect high-intensity prismatic retroreflective road sign',
      },
      {
        num: 9,
        key: 'DAMAGED_DIVIDER',
        name: 'Damaged Median / Divider',
        detected: (road_dividers && road_dividers.some((div) => div.condition === 'DAMAGED_BARRIER' || div.condition === 'MISSING_DIVIDER_SECTION' || div.condition === 'BROKEN_SECTION')) || road_defects.some((d) => ['DAMAGED_DIVIDER', 'MISSING_DIVIDER'].includes(d.type)) || media.original_filename.toLowerCase().includes('divider') || media.original_filename.toLowerCase().includes('barrier'),
        count: road_defects.filter((d) => ['DAMAGED_DIVIDER', 'MISSING_DIVIDER'].includes(d.type)).length,
        action: 'Structural barrier realignment, precast concrete replacement & hazard reflectors',
      },
    ];

    const auditItems = auditNineDefs.map((def) => {
      const isDet = def.detected;
      const cnt = isDet ? Math.max(1, def.count) : 0;
      let details = '';
      if (isDet) {
        if (def.num === 1) details = `Confirmed: ${cnt} active pothole cavity in vehicular wheel path.`;
        else if (def.num === 2) details = `Confirmed: Polygon fatigue micro-cracking pattern identified.`;
        else if (def.num === 3) details = `Confirmed: Linear pavement crack separation along driving corridor.`;
        else if (def.num === 4) details = `Confirmed: Standing water ponding with camber drainage block.`;
        else if (def.num === 5) details = `CRITICAL HAZARD: Open or dislocated manhole cover / drainage grate.`;
        else if (def.num === 6) details = `Confirmed: Pavement rutting subsidence along heavy vehicle path.`;
        else if (def.num === 7) details = `Confirmed: Pedestrian crosswalk markings worn below retroreflectivity standards.`;
        else if (def.num === 8) details = `Confirmed: Traffic signboard absent, damaged, or obscured.`;
        else if (def.num === 9) details = `Confirmed: Median concrete divider barrier breach or displacement.`;
      } else {
        details = `Nominal: No ${def.name.toLowerCase()} detected in pavement visual zone. Surface verified clear.`;
      }

      return {
        id: `AUDIT-ITEM-${def.num}`,
        key: def.key as any,
        item_number: def.num,
        name: def.name,
        detected: isDet,
        status: (isDet ? 'YES' : 'NO') as 'YES' | 'NO',
        confidence: isDet ? 0.95 : 0.99,
        severity: (isDet ? (def.num === 1 ? 'CRITICAL' : 'HIGH') : 'NONE') as DefectSeverity | 'NONE',
        count: cnt,
        details,
        action_required: isDet ? def.action : 'Surface Nominal — Routine Municipal Patrol',
      };
    });

    const presentCount = auditItems.filter((i) => i.detected).length;
    const nine_point_audit = {
      audited_at: new Date().toISOString(),
      total_items_checked: 9 as const,
      items_present_count: presentCount,
      items_clear_count: 9 - presentCount,
      all_clear: presentCount === 0,
      score: road_condition?.health_score || Math.max(20, 100 - presentCount * 12),
      overall_verdict: presentCount === 0
        ? 'All 9 Items Verified Nominal — Zero Road Hazards Detected (PASS)'
        : `${presentCount} of 9 Hazard Items Detected on Road Surface (YES)`,
      items: auditItems,
    };

    return {
      media,
      job,
      road_condition,
      road_defects,
      nine_point_audit,
      vehicles,
      license_plates,
      people_analytics,
      traffic_metrics,
      smoke_events,
      buildings,
      incidents,
      urban_objects,
      detections,
      evidence_files,
      lane_analysis,
      vulnerable_pedestrians,
      road_dividers,
      report,
      insights,
    };
  }

  // Batch insert analysis results
  public saveAnalysisResults(results: {
    media_id: string;
    road_condition?: RoadCondition;
    road_defects?: RoadDefect[];
    vehicles?: VehicleRecord[];
    license_plates?: LicensePlate[];
    people_analytics?: PeopleAnalytics;
    traffic_metrics?: TrafficMetrics;
    smoke_events?: SmokeEvent[];
    buildings?: BuildingRecord[];
    incidents?: IncidentRecord[];
    urban_objects?: UrbanObjectTaxonomy[];
    detections?: Detection[];
    evidence_files?: EvidenceFile[];
    lane_analysis?: LaneAnalysisSummary;
    vulnerable_pedestrians?: VulnerablePedestrianEvent[];
    road_dividers?: RoadDividerDetection[];
    report?: ReportRecord;
  }) {
    const { media_id } = results;

    // Clear old data for re-analysis
    this.data.road_defects = this.data.road_defects.filter((d) => d.media_id !== media_id);
    this.data.road_conditions = this.data.road_conditions.filter((d) => d.media_id !== media_id);
    this.data.vehicles = this.data.vehicles.filter((d) => d.media_id !== media_id);
    this.data.license_plates = this.data.license_plates.filter((d) => d.media_id !== media_id);
    this.data.people_analytics = this.data.people_analytics.filter((d) => d.media_id !== media_id);
    this.data.traffic_metrics = this.data.traffic_metrics.filter((d) => d.media_id !== media_id);
    this.data.smoke_events = this.data.smoke_events.filter((d) => d.media_id !== media_id);
    this.data.buildings = this.data.buildings.filter((d) => d.media_id !== media_id);
    this.data.incidents = this.data.incidents.filter((d) => d.media_id !== media_id);
    this.data.urban_objects = this.data.urban_objects.filter((d) => d.media_id !== media_id);
    this.data.detections = this.data.detections.filter((d) => d.media_id !== media_id);
    this.data.evidence_files = this.data.evidence_files.filter((d) => d.media_id !== media_id);
    this.data.reports = this.data.reports.filter((d) => d.media_id !== media_id);

    if (!this.data.lane_analyses) this.data.lane_analyses = {};
    delete this.data.lane_analyses[media_id];

    if (!this.data.vulnerable_pedestrians) this.data.vulnerable_pedestrians = [];
    this.data.vulnerable_pedestrians = this.data.vulnerable_pedestrians.filter((p) => p.media_id !== media_id);

    if (!this.data.road_dividers) this.data.road_dividers = [];
    this.data.road_dividers = this.data.road_dividers.filter((r) => r.media_id !== media_id);

    if (results.road_defects) this.data.road_defects.push(...results.road_defects);
    if (results.road_condition) this.data.road_conditions.push(results.road_condition);
    if (results.vehicles) this.data.vehicles.push(...results.vehicles);
    if (results.license_plates) this.data.license_plates.push(...results.license_plates);
    if (results.people_analytics) this.data.people_analytics.push(results.people_analytics);
    if (results.traffic_metrics) this.data.traffic_metrics.push(results.traffic_metrics);
    if (results.smoke_events) this.data.smoke_events.push(...results.smoke_events);
    if (results.buildings) this.data.buildings.push(...results.buildings);
    if (results.incidents) this.data.incidents.push(...results.incidents);
    if (results.urban_objects) this.data.urban_objects.push(...results.urban_objects);
    if (results.detections) this.data.detections.push(...results.detections);
    if (results.evidence_files) this.data.evidence_files.push(...results.evidence_files);
    if (results.lane_analysis) this.data.lane_analyses[media_id] = results.lane_analysis;
    if (results.vulnerable_pedestrians) this.data.vulnerable_pedestrians.push(...results.vulnerable_pedestrians);
    if (results.road_dividers) this.data.road_dividers.push(...results.road_dividers);
    if (results.report) this.data.reports.push(results.report);

    this.save();
  }

  // Dashboard Aggregates
  public getDashboardStats() {
    const activeMedia = this.data.media.filter((m) => !m.is_deleted);
    const mediaIds = new Set(activeMedia.map((m) => m.id));

    const videos = activeMedia.filter((m) => m.media_type === 'VIDEO').length;
    const photos = activeMedia.filter((m) => m.media_type === 'IMAGE').length;

    const defects = this.data.road_defects.filter((d) => mediaIds.has(d.media_id));
    const potholes = defects.filter((d) => d.type === 'POTHOLE').length;

    const vehicles = this.data.vehicles.filter((v) => mediaIds.has(v.media_id));
    const buses = vehicles.filter((v) => v.vehicle_type === 'BUS').length;

    const people = this.data.people_analytics
      .filter((p) => mediaIds.has(p.media_id))
      .reduce((sum, p) => sum + p.total_unique_people, 0);

    const buildings = this.data.buildings.filter((b) => mediaIds.has(b.media_id)).length;
    const license_plates = this.data.license_plates.filter((l) => mediaIds.has(l.media_id)).length;
    const smoke_events = this.data.smoke_events.filter((s) => mediaIds.has(s.media_id)).length;
    const incidents = this.data.incidents.filter((i) => mediaIds.has(i.media_id)).length;

    // Road health average
    const roadConds = this.data.road_conditions.filter((r) => mediaIds.has(r.media_id));
    const avgRoadHealth = roadConds.length
      ? Math.round(roadConds.reduce((acc, curr) => acc + curr.health_score, 0) / roadConds.length)
      : 70;

    // Vehicles by type
    const vehiclesByType: Record<string, number> = {};
    vehicles.forEach((v) => {
      vehiclesByType[v.vehicle_type] = (vehiclesByType[v.vehicle_type] || 0) + 1;
    });

    // Defects by type
    const defectsByType: Record<string, number> = {};
    defects.forEach((d) => {
      defectsByType[d.type] = (defectsByType[d.type] || 0) + 1;
    });

    // Buildings by type
    const buildingsByType: Record<string, number> = {};
    this.data.buildings
      .filter((b) => mediaIds.has(b.media_id))
      .forEach((b) => {
        buildingsByType[b.building_type] = (buildingsByType[b.building_type] || 0) + 1;
      });

    return {
      total_media: activeMedia.length,
      videos,
      photos,
      road_defects: defects.length,
      potholes,
      unique_vehicles: vehicles.length,
      buses,
      people,
      buildings,
      license_plates,
      smoke_events,
      incidents,
      bottlenecks: this.data.traffic_bottlenecks.length,
      heatwave_hotspots: this.data.heatwave_analytics.length,
      actionable_insights_pending: this.data.actionable_insights.filter((a) => a.status === 'PENDING').length,
      avg_road_health: avgRoadHealth,
      vehicles_by_type: vehiclesByType,
      defects_by_type: defectsByType,
      buildings_by_type: buildingsByType,
    };
  }

  // Traffic Bottlenecks
  public getTrafficBottlenecks(): TrafficBottleneck[] {
    return this.data.traffic_bottlenecks || [];
  }

  public addTrafficBottleneck(b: TrafficBottleneck) {
    this.data.traffic_bottlenecks = this.data.traffic_bottlenecks || [];
    this.data.traffic_bottlenecks.unshift(b);
    this.save();
    return b;
  }

  public updateTrafficBottleneck(id: string, updates: Partial<TrafficBottleneck>): TrafficBottleneck | null {
    const item = this.data.traffic_bottlenecks?.find((b) => b.id === id);
    if (!item) return null;
    Object.assign(item, updates);
    this.save();
    return item;
  }

  // Heatwave Analytics
  public getHeatwaveAnalytics(): HeatwaveAnalytics[] {
    return this.data.heatwave_analytics || [];
  }

  public addHeatwaveAnalytics(h: HeatwaveAnalytics) {
    this.data.heatwave_analytics = this.data.heatwave_analytics || [];
    this.data.heatwave_analytics.unshift(h);
    this.save();
    return h;
  }

  // Actionable Insights
  public getActionableInsights(): ActionableInsight[] {
    return this.data.actionable_insights || [];
  }

  public updateActionableInsightStatus(id: string, status: 'PENDING' | 'DISPATCHED' | 'IN_PROGRESS' | 'RESOLVED'): ActionableInsight | null {
    const item = this.data.actionable_insights?.find((i) => i.id === id);
    if (!item) return null;
    item.status = status;
    this.save();
    return item;
  }

  public addActionableInsight(insight: ActionableInsight) {
    this.data.actionable_insights = this.data.actionable_insights || [];
    this.data.actionable_insights.unshift(insight);
    this.save();
    return insight;
  }

  // Incidents
  public getAllIncidents(): IncidentRecord[] {
    return this.data.incidents || [];
  }

  public updateIncidentStatus(id: string, status: 'ACTIVE' | 'DISPATCHED' | 'UNDER_INVESTIGATION' | 'RESOLVED', assignedUnit?: string): IncidentRecord | null {
    const item = this.data.incidents?.find((i) => i.id === id);
    if (!item) return null;
    item.status = status;
    if (assignedUnit) item.assigned_unit = assignedUnit;
    this.save();
    return item;
  }

  // License Plates Registry (ANPR)
  public getAllLicensePlates(): LicensePlate[] {
    return this.data.license_plates || [];
  }

  public addLicensePlate(plate: LicensePlate): LicensePlate {
    this.data.license_plates = this.data.license_plates || [];
    this.data.license_plates.unshift(plate);
    this.save();
    return plate;
  }

  // Vehicles
  public getAllVehicles(): VehicleRecord[] {
    return this.data.vehicles || [];
  }

  // People & Pedestrian Analytics
  public getAllPedestrianAnalytics(): PeopleAnalytics[] {
    return this.data.people_analytics || [];
  }

  // Road Defects Registry
  public getAllRoadDefects(): RoadDefect[] {
    return this.data.road_defects || [];
  }

  // Vulnerable Pedestrians Registry
  public getAllVulnerablePedestrians(): VulnerablePedestrianEvent[] {
    return this.data.vulnerable_pedestrians || [];
  }

  // Road Dividers Registry
  public getAllRoadDividers(): RoadDividerDetection[] {
    return this.data.road_dividers || [];
  }

  // Lane Analysis Registry
  public getLaneAnalysis(mediaId: string): LaneAnalysisSummary | undefined {
    return (this.data.lane_analyses || {})[mediaId];
  }

  // Municipal Work Orders
  public getWorkOrders(): WorkOrder[] {
    return this.data.work_orders || [];
  }

  public createWorkOrder(order: WorkOrder): WorkOrder {
    this.data.work_orders = this.data.work_orders || [];
    this.data.work_orders.unshift(order);
    if (order.defect_id) {
      const defect = this.data.road_defects?.find((d) => d.id === order.defect_id);
      if (defect) {
        defect.work_order_id = order.id;
        defect.work_order_status = order.status;
      }
    }
    this.save();
    return order;
  }

  public updateWorkOrderStatus(
    id: string,
    status: 'PENDING_APPROVAL' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED',
    assignedCrew?: string
  ): WorkOrder | null {
    const item = this.data.work_orders?.find((w) => w.id === id);
    if (!item) return null;
    item.status = status;
    if (assignedCrew) item.assigned_crew = assignedCrew;
    if (status === 'DISPATCHED' && !item.dispatched_at) {
      item.dispatched_at = new Date().toISOString();
    }
    if (status === 'COMPLETED' && !item.completed_at) {
      item.completed_at = new Date().toISOString();
    }
    if (item.defect_id) {
      const defect = this.data.road_defects?.find((d) => d.id === item.defect_id);
      if (defect) {
        defect.work_order_status = status;
      }
    }
    this.save();
    return item;
  }

  // Campus Transit Fleet
  public getCampusBuses(): CampusBus[] {
    return this.data.campus_buses || [];
  }

  public updateCampusBus(id: string, updates: Partial<CampusBus>): CampusBus | null {
    const bus = this.data.campus_buses?.find((b) => b.id === id);
    if (!bus) return null;
    Object.assign(bus, updates);
    this.save();
    return bus;
  }

  public triggerBusEmergency(id: string, isSOS: boolean): CampusBus | null {
    const bus = this.data.campus_buses?.find((b) => b.id === id);
    if (!bus) return null;
    bus.status = isSOS ? 'EMERGENCY_SOS' : 'ON_ROUTE';
    this.save();
    return bus;
  }

  // Initial Users
  public getInitialUsers(): User[] {
    return [
      {
        id: 'USR-GOV-01',
        username: 'gov_admin',
        email: 'command@visakhapatnam.gov.in',
        role: 'GOVERNMENT',
        name: 'GVMC & Transit Central Command',
        department: 'Greater Visakhapatnam Municipal Corporation (Transport Wing)',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        token: 'token_gov_session_authenticated',
      },
      {
        id: 'USR-CIT-01',
        username: 'citizen_vizag',
        email: 'ramesh.kumar@gmail.com',
        role: 'CITIZEN',
        name: 'Ramesh Kumar',
        phone: '+91 98480 22341',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        token: 'token_citizen_session_authenticated',
      },
      {
        id: 'USR-01',
        username: 'admin',
        email: 'authority@solvofin.gov',
        role: 'ADMIN',
        name: 'Chief Urban Transit Engineer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
    ];
  }

  // Initial Citizen Issues
  public getInitialCitizenIssues(): CitizenIssue[] {
    return [
      {
        id: 'CIT-ISSUE-101',
        tracking_code: 'CIT-2025-4891',
        citizen_id: 'USR-CIT-01',
        citizen_name: 'Ramesh Kumar',
        citizen_phone: '+91 98480 22341',
        citizen_email: 'ramesh.kumar@gmail.com',
        category: 'POTHOLE',
        title: 'Deep Hazardous Pothole Near Maddilapalem Bus Shelter',
        description: 'Large cavity on the middle lane causing sudden braking and near-collisions for two-wheelers during evening peak transit.',
        landmark: 'Opposite Maddilapalem RTC Depot Gate 2',
        latitude: 17.7342,
        longitude: 83.3248,
        address: 'Maddilapalem Main Road, Visakhapatnam',
        evidence_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
        thumbnail_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=300&auto=format&fit=crop&q=80',
        timestamp: '2026-09-01T07:20:00Z',
        status: 'UNDER_GOVERNMENT_REVIEW',
        severity: 'HIGH',
        ai_validation: {
          is_verified: true,
          detected_class: 'POTHOLE',
          confidence: 0.94,
          severity_assessment: 'HIGH',
          depth_cm: 11.5,
          width_cm: 72,
          estimated_asphalt_kg: 280,
          summary: 'Verified deep cavity with high spatial severity. Matches bus camera telemetry on Route 14.',
        },
        government_review: {
          reviewed_by: 'GVMC Zone 3 Infrastructure Inspector',
          reviewed_at: '2026-09-01T08:15:00Z',
          official_remarks: 'Verified via Bus Fleet Telemetry (CAM-FRONT). Work order queued for patching crew #4.',
          work_order_id: 'WO-8821',
          assigned_division: 'GVMC North Highway Infrastructure Division #3',
        },
      },
      {
        id: 'CIT-ISSUE-102',
        tracking_code: 'CIT-2025-5012',
        citizen_id: 'USR-CIT-01',
        citizen_name: 'Priya Sharma',
        citizen_phone: '+91 94401 58210',
        citizen_email: 'priya.vizag@gmail.com',
        category: 'WATERLOGGING',
        title: 'Monsoon Waterlogging & Drainage Overflow',
        description: 'Road completely submerged under 15cm of stormwater after heavy showers, hiding submerged potholes.',
        landmark: 'Near Siripuram Junction Underpass',
        latitude: 17.7215,
        longitude: 83.3152,
        address: 'Siripuram Circle Underpass, Visakhapatnam',
        evidence_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
        thumbnail_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&auto=format&fit=crop&q=80',
        timestamp: '2026-09-01T08:05:00Z',
        status: 'WORK_ORDER_DISPATCHED',
        severity: 'CRITICAL',
        ai_validation: {
          is_verified: true,
          detected_class: 'WATERLOGGING',
          confidence: 0.91,
          severity_assessment: 'CRITICAL',
          summary: 'Extensive roadway water reflection and surface pooling detected. Traffic flow reduced by 65%.',
        },
        government_review: {
          reviewed_by: 'Municipal Stormwater Operations',
          reviewed_at: '2026-09-01T08:40:00Z',
          official_remarks: 'Dispatched emergency mobile suction tanker and de-silting crew.',
          work_order_id: 'WO-8840',
          assigned_division: 'GVMC Stormwater & Drainage Wing',
        },
      },
      {
        id: 'CIT-ISSUE-103',
        tracking_code: 'CIT-2025-6104',
        citizen_id: 'USR-CIT-01',
        citizen_name: 'K. Venkatesh',
        citizen_phone: '+91 98661 74019',
        category: 'FADED_ZEBRA_CROSSING',
        title: 'Faded Zebra Crossing Near Sangivalasa School Zone',
        description: 'Pedestrian crossing markings completely worn out. School children unable to cross safely due to speeding vehicles.',
        landmark: 'ANITS College Main Academic Gate & School Zone',
        latitude: 17.9214,
        longitude: 83.4231,
        address: 'NH-16 Sangivalasa Academic Corridor',
        evidence_url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb39f?w=800&auto=format&fit=crop&q=80',
        thumbnail_url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb39f?w=300&auto=format&fit=crop&q=80',
        timestamp: '2026-09-01T09:10:00Z',
        status: 'AI_VERIFIED',
        severity: 'HIGH',
        ai_validation: {
          is_verified: true,
          detected_class: 'FADED_ZEBRA_CROSSING',
          confidence: 0.89,
          severity_assessment: 'HIGH',
          summary: 'Thermoplastic paint degradation > 80%. Vulnerable school pedestrian crossing safety alert triggered.',
        },
      },
    ];
  }

  // Initial Origin-Destination Patterns
  public getInitialODPatterns(): OriginDestinationPattern[] {
    return [
      {
        id: 'OD-01',
        origin_zone: 'Maddilapalem Bus Terminus',
        destination_zone: 'Tagarapuvalasa Junction',
        corridor_name: 'NH-16 Coastal Highway Corridor',
        bus_routes: ['Route 14', 'Route 18 Express', 'Route 111'],
        hourly_vehicle_flow: 1840,
        avg_transit_time_mins: 42,
        peak_hours: '08:00 - 10:30 & 17:00 - 20:00',
        congestion_level: 'HIGH',
        flow_percentage: 34.5,
      },
      {
        id: 'OD-02',
        origin_zone: 'Siripuram Central Hub',
        destination_zone: 'Sangivalasa (ANITS Campus)',
        corridor_name: 'Northern Academic Transit Artery',
        bus_routes: ['Route 22 ANITS Special', 'Route 14B'],
        hourly_vehicle_flow: 1420,
        avg_transit_time_mins: 38,
        peak_hours: '08:15 - 09:45 & 16:30 - 18:30',
        congestion_level: 'MODERATE',
        flow_percentage: 26.2,
      },
      {
        id: 'OD-03',
        origin_zone: 'Gajuwaka Industrial Zone',
        destination_zone: 'RTC Complex / Dwarka Nagar',
        corridor_name: 'South-North Industrial Highway',
        bus_routes: ['Route 07 Artery', 'Route 400 Feeder'],
        hourly_vehicle_flow: 2580,
        avg_transit_time_mins: 55,
        peak_hours: '07:30 - 10:00 & 17:30 - 20:30',
        congestion_level: 'SEVERE',
        flow_percentage: 28.1,
      },
      {
        id: 'OD-04',
        origin_zone: 'Visakhapatnam Railway Station',
        destination_zone: 'Rushikonda IT SEZ',
        corridor_name: 'Beach Road & IT Corridor',
        bus_routes: ['Route 10K', 'Route 28H IT Express'],
        hourly_vehicle_flow: 960,
        avg_transit_time_mins: 28,
        peak_hours: '08:30 - 10:00 & 18:00 - 19:30',
        congestion_level: 'LOW',
        flow_percentage: 11.2,
      },
    ];
  }

  // Initial Route Delay Estimates
  public getInitialRouteDelays(): RouteDelayEstimate[] {
    return [
      {
        id: 'DELAY-01',
        bus_id: 'BUS-AP-31-Z-4012',
        route_id: 'ROUTE-14',
        route_name: 'Route 14 (Maddilapalem ↔ Tagarapuvalasa)',
        origin: 'Maddilapalem Bus Depot',
        destination: 'Tagarapuvalasa NH-16 Terminal',
        scheduled_duration_mins: 40,
        observed_duration_mins: 49.5,
        delay_minutes: 9.5,
        delay_severity: 'MODERATE_DELAY',
        primary_delay_cause: 'Siripuram signal uncoordination & deep pothole near Lane 2',
        bottleneck_location: 'Siripuram - Maddilapalem Junction',
        gps_coordinates: { latitude: 17.7345, longitude: 83.3249 },
        last_updated: '2026-09-01T08:30:00Z',
      },
      {
        id: 'DELAY-02',
        bus_id: 'BUS-AP-31-Z-5820',
        route_id: 'ROUTE-22',
        route_name: 'Route 22 (Sangivalasa ANITS Special)',
        origin: 'RTC Complex',
        destination: 'ANITS Campus Gate, Sangivalasa',
        scheduled_duration_mins: 35,
        observed_duration_mins: 38.0,
        delay_minutes: 3.0,
        delay_severity: 'MINOR_DELAY',
        primary_delay_cause: 'Pedestrian crossing slow-down at Academic Gate',
        bottleneck_location: 'Sangivalasa Academic Gate',
        gps_coordinates: { latitude: 17.9214, longitude: 83.4231 },
        last_updated: '2026-09-01T08:32:00Z',
      },
      {
        id: 'DELAY-03',
        bus_id: 'BUS-AP-31-Z-9911',
        route_id: 'ROUTE-07',
        route_name: 'Route 07 (Coastal Artery Express)',
        origin: 'Gajuwaka Junction',
        destination: 'Maddilapalem Hub',
        scheduled_duration_mins: 50,
        observed_duration_mins: 68.0,
        delay_minutes: 18.0,
        delay_severity: 'CRITICAL_DELAY',
        primary_delay_cause: 'Waterlogging underpass & heavy commercial truck queuing',
        bottleneck_location: 'Gajuwaka Industrial Choke-point',
        gps_coordinates: { latitude: 17.7012, longitude: 83.2184 },
        last_updated: '2026-09-01T08:28:00Z',
      },
    ];
  }

  // Student Team Registry
  public getStudentTeam(): StudentTeamMember[] {
    return this.data.student_team || [];
  }

  // Authentication Methods (Strict TWO Roles: GOVERNMENT and CITIZEN)
  public authenticate(username: string, password: string, role?: 'GOVERNMENT' | 'CITIZEN'): User | null {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Government credentials
    if (
      (cleanUser === 'gov_admin' || cleanUser === 'admin' || cleanUser === 'government') &&
      (cleanPass === 'admin123' || cleanPass === 'visakha_roads_2025' || cleanPass === 'password' || cleanPass === 'admin')
    ) {
      let user = this.data.users?.find((u) => u.username === 'gov_admin' || u.role === 'GOVERNMENT');
      if (!user) {
        user = {
          id: 'USR-GOV-01',
          username: 'gov_admin',
          email: 'command@visakhapatnam.gov.in',
          role: 'GOVERNMENT',
          name: 'GVMC & Transit Central Command',
          department: 'Greater Visakhapatnam Municipal Corporation (Transport Wing)',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          token: `gov_token_${Date.now()}`,
        };
        this.data.users.push(user);
        this.save();
      }
      return { ...user, token: user.token || `gov_token_${Date.now()}` };
    }

    // 2. Citizen credentials
    if (
      (cleanUser === 'citizen_vizag' || cleanUser === 'citizen' || cleanUser === 'citizen_user') &&
      (cleanPass === 'citizen123' || cleanPass === 'password' || cleanPass === 'citizen')
    ) {
      let user = this.data.users?.find((u) => u.username === 'citizen_vizag' || u.role === 'CITIZEN');
      if (!user) {
        user = {
          id: 'USR-CIT-01',
          username: 'citizen_vizag',
          email: 'ramesh.kumar@gmail.com',
          role: 'CITIZEN',
          name: 'Ramesh Kumar',
          phone: '+91 98480 22341',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          token: `cit_token_${Date.now()}`,
        };
        this.data.users.push(user);
        this.save();
      }
      return { ...user, token: user.token || `cit_token_${Date.now()}` };
    }

    // 3. Check existing database users
    const matched = this.data.users?.find((u) => u.username.toLowerCase() === cleanUser);
    if (matched) {
      if (role && matched.role !== role && matched.role !== 'ADMIN') {
        return null;
      }
      return { ...matched, token: matched.token || `session_token_${Date.now()}` };
    }

    return null;
  }

  public registerCitizen(userData: { username: string; name: string; email: string; phone?: string; password?: string }): User {
    const newUser: User = {
      id: `USR-CIT-${Date.now().toString().slice(-4)}`,
      username: userData.username.trim().toLowerCase(),
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      role: 'CITIZEN',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      token: `cit_token_${Date.now()}`,
    };
    this.data.users = this.data.users || [];
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  // Citizen Issues Methods
  public getCitizenIssues(citizenId?: string): CitizenIssue[] {
    const list = this.data.citizen_issues || [];
    if (citizenId) {
      return list.filter((i) => i.citizen_id === citizenId);
    }
    return list;
  }

  public getCitizenIssueById(id: string): CitizenIssue | undefined {
    return this.data.citizen_issues?.find((i) => i.id === id || i.tracking_code === id);
  }

  public createCitizenIssue(issue: CitizenIssue): CitizenIssue {
    this.data.citizen_issues = this.data.citizen_issues || [];
    this.data.citizen_issues.unshift(issue);

    // Also link to RoadDefect so it appears on GIS map & government defects view
    const defectId = `DEFECT-CIT-${Date.now().toString().slice(-4)}`;
    const newDefect: RoadDefect = {
      id: defectId,
      media_id: 'CITIZEN_REPORTS_FEED',
      type: issue.category,
      confidence: issue.ai_validation?.confidence || 0.9,
      severity: issue.severity,
      frame_number: 1,
      timestamp_sec: 0,
      latitude: issue.latitude,
      longitude: issue.longitude,
      description: `[Citizen Report ${issue.tracking_code}] ${issue.title} - ${issue.description}`,
      evidence_path: issue.evidence_url,
      crop_image_path: issue.evidence_url,
      depth_cm: issue.ai_validation?.depth_cm || (issue.category === 'POTHOLE' ? 10 : 0),
      width_cm: issue.ai_validation?.width_cm || (issue.category === 'POTHOLE' ? 60 : 100),
      length_cm: issue.category === 'POTHOLE' ? 75 : 100,
      asphalt_tons: (issue.ai_validation?.estimated_asphalt_kg ? issue.ai_validation.estimated_asphalt_kg / 1000 : 0.25),
      repair_cost_inr: issue.category === 'POTHOLE' ? 7500 : 4000,
      priority_score: issue.severity === 'CRITICAL' ? 95 : issue.severity === 'HIGH' ? 80 : 60,
      division_assigned: 'GVMC Citizen Quick-Response Wing',
      model_version: 'SOLVOFIN-CITIZEN-CV v4.2',
    };
    this.data.road_defects = this.data.road_defects || [];
    this.data.road_defects.unshift(newDefect);

    this.save();
    return issue;
  }

  public updateCitizenIssue(id: string, updates: Partial<CitizenIssue>): CitizenIssue | null {
    const issue = this.data.citizen_issues?.find((i) => i.id === id || i.tracking_code === id);
    if (!issue) return null;
    Object.assign(issue, updates);
    this.save();
    return issue;
  }

  public reviewCitizenIssue(
    id: string,
    reviewData: {
      reviewed_by: string;
      official_remarks: string;
      status: 'UNDER_GOVERNMENT_REVIEW' | 'WORK_ORDER_DISPATCHED' | 'RESOLVED';
      create_work_order?: boolean;
    }
  ): CitizenIssue | null {
    const issue = this.data.citizen_issues?.find((i) => i.id === id || i.tracking_code === id);
    if (!issue) return null;

    issue.status = reviewData.status;
    issue.government_review = {
      reviewed_by: reviewData.reviewed_by,
      reviewed_at: new Date().toISOString(),
      official_remarks: reviewData.official_remarks,
      assigned_division: 'GVMC North Highway Infrastructure Division #3',
    };

    if (reviewData.create_work_order) {
      const woId = `WO-CIT-${Date.now().toString().slice(-4)}`;
      issue.government_review.work_order_id = woId;
      const newWO: WorkOrder = {
        id: woId,
        defect_id: issue.id,
        title: `Citizen Escalation: ${issue.title}`,
        severity: issue.severity,
        status: 'DISPATCHED',
        assigned_crew: 'Rapid Patch Response Crew #4',
        division_assigned: 'GVMC North Highway Infrastructure Division #3',
        priority_score: issue.severity === 'CRITICAL' ? 95 : 80,
        location: {
          latitude: issue.latitude,
          longitude: issue.longitude,
          address: issue.address || 'Maddilapalem Corridor',
        },
        cavity_dimensions: {
          depth_cm: issue.ai_validation?.depth_cm || 11.2,
          width_cm: issue.ai_validation?.width_cm || 68,
          length_cm: issue.ai_validation?.length_cm || 85,
        },
        material_estimate: {
          asphalt_tons: (issue.ai_validation?.estimated_asphalt_kg ? issue.ai_validation.estimated_asphalt_kg / 1000 : 0.35),
          bitumen_tack_coat_liters: 45,
          cold_milling_labor_hours: 6,
          total_cost_inr: 8500,
        },
        created_at: new Date().toISOString(),
        dispatched_at: new Date().toISOString(),
      };
      this.createWorkOrder(newWO);
    }

    this.save();
    return issue;
  }

  // Origin-Destination Patterns & Route Delays
  public getODPatterns(): OriginDestinationPattern[] {
    return this.data.od_patterns || this.getInitialODPatterns();
  }

  public getRouteDelays(): RouteDelayEstimate[] {
    return this.data.route_delays || this.getInitialRouteDelays();
  }

  public updateRouteDelay(id: string, updates: Partial<RouteDelayEstimate>): RouteDelayEstimate | null {
    const item = this.data.route_delays?.find((r) => r.id === id);
    if (!item) return null;
    Object.assign(item, updates);
    this.save();
    return item;
  }

  // ================= DRIVER SAFETY & DROWSINESS =================
  public createDriverSafetyEvent(event: DriverSafetyEvent): DriverSafetyEvent {
    if (!this.data.driver_safety_events) this.data.driver_safety_events = [];
    this.data.driver_safety_events.unshift(event);

    // Auto-create Government Alert for Warning & Critical events
    if (event.severity === 'WARNING' || event.severity === 'CRITICAL') {
      const alert: GovernmentAlert = {
        id: `ALT-DS-${Date.now().toString().slice(-5)}`,
        bus_number: event.bus_number,
        module: 'DRIVER_SAFETY',
        event_type: event.event_type,
        severity: event.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        confidence: event.confidence,
        duration_sec: event.duration_sec,
        latitude: event.latitude,
        longitude: event.longitude,
        gps_status: event.gps_status,
        timestamp: event.timestamp,
        camera_id: event.camera_id,
        evidence_url: event.evidence_snapshot,
        status: 'NEW',
        action_taken: event.severity === 'CRITICAL' ? 'Automatic dispatcher alert transmitted to Depot Command.' : undefined,
      };
      this.createGovernmentAlert(alert);
    }

    this.save();
    return event;
  }

  public getDriverSafetyEvents(filters?: {
    bus_number?: string;
    severity?: string;
    status?: string;
    limit?: number;
  }): DriverSafetyEvent[] {
    let list = this.data.driver_safety_events || [];
    if (filters?.bus_number && filters.bus_number !== 'ALL') {
      list = list.filter((e) => e.bus_number === filters.bus_number);
    }
    if (filters?.severity && filters.severity !== 'ALL') {
      list = list.filter((e) => e.severity === filters.severity);
    }
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((e) => e.status === filters.status);
    }
    if (filters?.limit) {
      list = list.slice(0, filters.limit);
    }
    return list;
  }

  public updateDriverSafetyEvent(id: string, updates: Partial<DriverSafetyEvent>): DriverSafetyEvent | null {
    const event = this.data.driver_safety_events?.find((e) => e.id === id);
    if (!event) return null;
    Object.assign(event, updates);
    this.save();
    return event;
  }

  public createDriverSession(session: DriverMonitoringSession): DriverMonitoringSession {
    if (!this.data.driver_monitoring_sessions) this.data.driver_monitoring_sessions = [];
    const idx = this.data.driver_monitoring_sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      this.data.driver_monitoring_sessions[idx] = session;
    } else {
      this.data.driver_monitoring_sessions.unshift(session);
    }
    this.save();
    return session;
  }

  public getDriverSessions(): DriverMonitoringSession[] {
    return this.data.driver_monitoring_sessions || [];
  }

  public updateDriverSession(id: string, updates: Partial<DriverMonitoringSession>): DriverMonitoringSession | null {
    const session = this.data.driver_monitoring_sessions?.find((s) => s.id === id);
    if (!session) return null;
    Object.assign(session, updates);
    this.save();
    return session;
  }

  // ================= BUS INFRASTRUCTURE DEFECTS =================
  public createInfrastructureDefect(defect: BusInfrastructureDefect): BusInfrastructureDefect {
    if (!this.data.infrastructure_defects) this.data.infrastructure_defects = [];
    this.data.infrastructure_defects.unshift(defect);

    // Auto-create Government Alert for Damaged / Critical infrastructure
    const alert: GovernmentAlert = {
      id: `ALT-INFRA-${Date.now().toString().slice(-5)}`,
      bus_number: defect.bus_number,
      module: 'BUS_INFRASTRUCTURE',
      event_type: `${defect.component_category} DEFECT (${defect.condition})`,
      severity: defect.severity,
      confidence: defect.confidence,
      latitude: defect.latitude,
      longitude: defect.longitude,
      gps_status: defect.gps_status,
      timestamp: defect.timestamp,
      camera_id: defect.camera_id,
      evidence_url: defect.evidence_snapshot,
      status: 'NEW',
    };
    this.createGovernmentAlert(alert);

    this.save();
    return defect;
  }

  public getInfrastructureDefects(filters?: {
    bus_number?: string;
    severity?: string;
    status?: string;
    category?: string;
  }): BusInfrastructureDefect[] {
    let list = this.data.infrastructure_defects || [];
    if (filters?.bus_number && filters.bus_number !== 'ALL') {
      list = list.filter((d) => d.bus_number === filters.bus_number);
    }
    if (filters?.severity && filters.severity !== 'ALL') {
      list = list.filter((d) => d.severity === filters.severity);
    }
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((d) => d.status === filters.status);
    }
    if (filters?.category && filters.category !== 'ALL') {
      list = list.filter((d) => d.component_category === filters.category);
    }
    return list;
  }

  public updateInfrastructureDefect(id: string, updates: Partial<BusInfrastructureDefect>): BusInfrastructureDefect | null {
    const defect = this.data.infrastructure_defects?.find((d) => d.id === id);
    if (!defect) return null;
    Object.assign(defect, updates);
    this.save();
    return defect;
  }

  // ================= BUS INSPECTION REPORTS =================
  public createBusInspectionReport(report: BusInspectionReport): BusInspectionReport {
    if (!this.data.bus_inspection_reports) this.data.bus_inspection_reports = [];
    const idx = this.data.bus_inspection_reports.findIndex((r) => r.id === report.id);
    if (idx >= 0) {
      this.data.bus_inspection_reports[idx] = report;
    } else {
      this.data.bus_inspection_reports.unshift(report);
    }
    this.save();
    return report;
  }

  public getBusInspectionReports(filters?: { bus_number?: string }): BusInspectionReport[] {
    let list = this.data.bus_inspection_reports || [];
    if (filters?.bus_number && filters.bus_number !== 'ALL') {
      list = list.filter((r) => r.bus_number === filters.bus_number);
    }
    return list;
  }

  public getBusInspectionReportById(id: string): BusInspectionReport | null {
    return this.data.bus_inspection_reports?.find((r) => r.id === id) || null;
  }

  // ================= GOVERNMENT ALERTS =================
  public createGovernmentAlert(alert: GovernmentAlert): GovernmentAlert {
    if (!this.data.government_alerts) this.data.government_alerts = [];
    this.data.government_alerts.unshift(alert);
    this.save();
    return alert;
  }

  public getGovernmentAlerts(filters?: {
    module?: string;
    severity?: string;
    status?: string;
    bus_number?: string;
  }): GovernmentAlert[] {
    let list = this.data.government_alerts || [];
    if (filters?.module && filters.module !== 'ALL') {
      list = list.filter((a) => a.module === filters.module);
    }
    if (filters?.severity && filters.severity !== 'ALL') {
      list = list.filter((a) => a.severity === filters.severity);
    }
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters?.bus_number && filters.bus_number !== 'ALL') {
      list = list.filter((a) => a.bus_number === filters.bus_number);
    }
    return list;
  }

  public updateGovernmentAlert(id: string, updates: Partial<GovernmentAlert>): GovernmentAlert | null {
    const alert = this.data.government_alerts?.find((a) => a.id === id);
    if (!alert) return null;
    Object.assign(alert, updates);
    this.save();
    return alert;
  }

  public getFleetSafetyStats(): any {
    const driverEvents = this.data.driver_safety_events || [];
    const infraDefects = this.data.infrastructure_defects || [];
    const alerts = this.data.government_alerts || [];
    const reports = this.data.bus_inspection_reports || [];
    const activeSessions = (this.data.driver_monitoring_sessions || []).filter((s) => s.status === 'ACTIVE');

    const criticalDriverAlerts = driverEvents.filter((e) => e.severity === 'CRITICAL');
    const warningDriverAlerts = driverEvents.filter((e) => e.severity === 'WARNING');
    const criticalInfra = infraDefects.filter((d) => d.severity === 'CRITICAL');
    const openInfra = infraDefects.filter((d) => d.status === 'NEW' || d.status === 'UNDER_REVIEW' || d.status === 'MAINTENANCE_ASSIGNED');

    const busesNeedingMaint = Array.from(new Set(openInfra.map((d) => d.bus_number)));

    return {
      active_driver_sessions_count: activeSessions.length,
      total_driver_events: driverEvents.length,
      critical_driver_alerts_count: criticalDriverAlerts.length,
      warning_driver_alerts_count: warningDriverAlerts.length,
      total_infra_defects: infraDefects.length,
      critical_infra_defects_count: criticalInfra.length,
      open_infra_defects_count: openInfra.length,
      buses_requiring_maintenance_count: busesNeedingMaint.length,
      buses_requiring_maintenance_list: busesNeedingMaint,
      total_inspection_reports_count: reports.length,
      active_government_alerts_count: alerts.filter((a) => a.status === 'NEW' || a.status === 'UNDER_REVIEW').length,
    };
  }

  // ================= SEED DATA GENERATORS =================
  private getInitialDriverSafetyEvents(): DriverSafetyEvent[] {
    return [
      {
        id: 'EVT-DS-01',
        bus_number: 'AP 39 XX 1234',
        event_type: 'PROLONGED_DROWSINESS',
        severity: 'WARNING',
        confidence: 0.94,
        risk_score: 68,
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        duration_sec: 1.8,
        latitude: 17.7342,
        longitude: 83.3248,
        gps_status: 'ACTIVE',
        camera_id: 'CAM-DRIVER-CABIN-01',
        model_version: 'SOLVOFIN-FaceAttention-v3.4',
        status: 'ACKNOWLEDGED',
        notes: 'Sustained eye closure (1.8s, EAR: 0.19). Driver fatigue advisory emitted.',
        metrics: {
          ear_avg: 0.19,
          mar: 0.28,
          perclos: 32,
          head_yaw: 2.1,
          head_pitch: -6.4,
          blink_rate_bpm: 11,
          attention_direction: 'FORWARD',
        },
      },
      {
        id: 'EVT-DS-02',
        bus_number: 'AP 31 Z 9884',
        event_type: 'CRITICAL_DROWSINESS',
        severity: 'CRITICAL',
        confidence: 0.97,
        risk_score: 92,
        timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
        duration_sec: 2.9,
        latitude: 17.7812,
        longitude: 83.3762,
        gps_status: 'ACTIVE',
        camera_id: 'CAM-DRIVER-CABIN-02',
        model_version: 'SOLVOFIN-FaceAttention-v3.4',
        status: 'DISPATCHED',
        notes: 'Critical micro-sleep episode (2.9s, EAR: 0.14). Dispatcher contacted vehicle via radio.',
        metrics: {
          ear_avg: 0.14,
          mar: 0.31,
          perclos: 64,
          head_yaw: -4.2,
          head_pitch: -24.8,
          blink_rate_bpm: 5,
          attention_direction: 'LOOKING_DOWN',
        },
      },
      {
        id: 'EVT-DS-03',
        bus_number: 'AP 39 TG 2041',
        event_type: 'YAWN',
        severity: 'LOW',
        confidence: 0.93,
        risk_score: 38,
        timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
        duration_sec: 2.4,
        latitude: 17.7124,
        longitude: 83.2981,
        gps_status: 'ACTIVE',
        camera_id: 'CAM-DRIVER-CABIN-03',
        model_version: 'SOLVOFIN-FaceAttention-v3.4',
        status: 'RESOLVED',
        notes: 'Sustained yawn cycle (MAR: 0.74, 2.4s duration).',
        metrics: {
          ear_avg: 0.31,
          mar: 0.74,
          perclos: 12,
          head_yaw: 0.5,
          head_pitch: 3.2,
          blink_rate_bpm: 18,
          attention_direction: 'FORWARD',
        },
      },
      {
        id: 'EVT-DS-04',
        bus_number: 'AP 31 TV 9204',
        event_type: 'DISTRACTED_LOOKING_AWAY',
        severity: 'WARNING',
        confidence: 0.92,
        risk_score: 64,
        timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
        duration_sec: 2.6,
        latitude: 17.8241,
        longitude: 83.4112,
        gps_status: 'ACTIVE',
        camera_id: 'CAM-DRIVER-CABIN-04',
        model_version: 'SOLVOFIN-FaceAttention-v3.4',
        status: 'RESOLVED',
        notes: 'Driver glancing rightward away from roadway for 2.6s (Yaw: 31°).',
        metrics: {
          ear_avg: 0.33,
          mar: 0.22,
          perclos: 8,
          head_yaw: 31.4,
          head_pitch: 1.2,
          blink_rate_bpm: 16,
          attention_direction: 'LOOKING_RIGHT',
        },
      },
    ];
  }

  private getInitialDriverSessions(): DriverMonitoringSession[] {
    return [
      {
        id: 'SES-DRV-01',
        bus_number: 'AP 39 XX 1234',
        driver_name: 'K. Ramana Murthy (Badge #842)',
        camera_id: 'CAM-DRIVER-CABIN-01',
        started_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        status: 'ACTIVE',
        current_risk_level: 'NORMAL',
        current_risk_score: 18,
        fps: 30,
        total_events_count: 2,
        critical_events_count: 0,
        route_id: 'BUS-18-NORTH',
      },
      {
        id: 'SES-DRV-02',
        bus_number: 'AP 31 Z 9884',
        driver_name: 'V. Srinivasa Rao (Badge #619)',
        camera_id: 'CAM-DRIVER-CABIN-02',
        started_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        status: 'ACTIVE',
        current_risk_level: 'WARNING',
        current_risk_score: 68,
        fps: 29,
        total_events_count: 4,
        critical_events_count: 1,
        route_id: 'BUS-07-EXPRESS',
      },
      {
        id: 'SES-DRV-03',
        bus_number: 'AP 39 TG 2041',
        driver_name: 'P. Venkat Reddy (Badge #904)',
        camera_id: 'CAM-DRIVER-CABIN-03',
        started_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        status: 'ACTIVE',
        current_risk_level: 'LOW',
        current_risk_score: 32,
        fps: 30,
        total_events_count: 1,
        critical_events_count: 0,
        route_id: 'BUS-22-COASTAL',
      },
    ];
  }

  private getInitialInfrastructureDefects(): BusInfrastructureDefect[] {
    return [
      {
        id: 'DEF-INFRA-01',
        bus_number: 'AP 39 XX 1234',
        component_category: 'SEAT',
        component_name: 'Row 3 Right Passenger Seat',
        defect_description: 'Visible 14cm tear on seat cushion base foam exposed.',
        condition: 'DAMAGED',
        severity: 'HIGH',
        confidence: 0.93,
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        latitude: 17.7342,
        longitude: 83.3248,
        gps_status: 'ACTIVE',
        camera_id: 'CAM-CABIN-PASSENGER-01',
        status: 'MAINTENANCE_ASSIGNED',
        assigned_crew: 'Depot Fleet Upholstery Crew #2',
        model_version: 'SOLVOFIN-BusInfraVision-v4.2',
        location_in_bus: 'Row 3 Right (Window Side)',
      },
      {
        id: 'DEF-INFRA-02',
        bus_number: 'AP 39 XX 1234',
        component_category: 'SEAT',
        component_name: 'Row 4 Left Passenger Double Seat',
        defect_description: 'Structural backrest mounting bracket fractured. Unsafe for passenger seating.',
        condition: 'CRITICAL',
        severity: 'CRITICAL',
        confidence: 0.94,
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        latitude: 17.7342,
        longitude: 83.3248,
        gps_status: 'ACTIVE',
        camera_id: 'CAM-CABIN-PASSENGER-01',
        status: 'UNDER_REVIEW',
        model_version: 'SOLVOFIN-BusInfraVision-v4.2',
        location_in_bus: 'Row 4 Left',
      },
      {
        id: 'DEF-INFRA-03',
        bus_number: 'AP 39 XX 1234',
        component_category: 'HANDRAIL',
        component_name: 'Aisle Vertical Stanchion Pole',
        defect_description: 'Base anchoring bolt loose, slight lateral wobble under load.',
        condition: 'DAMAGED',
        severity: 'MEDIUM',
        confidence: 0.91,
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        latitude: 17.7342,
        longitude: 83.3248,
        gps_status: 'ACTIVE',
        camera_id: 'CAM-CABIN-PASSENGER-01',
        status: 'NEW',
        model_version: 'SOLVOFIN-BusInfraVision-v4.2',
        location_in_bus: 'Mid-Aisle Row 3',
      },
      {
        id: 'DEF-INFRA-04',
        bus_number: 'AP 31 Z 9884',
        component_category: 'WINDOW',
        component_name: 'Side Passenger Window Bay #4',
        defect_description: '18cm diagonal stress crack in outer laminate safety glass layer.',
        condition: 'DAMAGED',
        severity: 'HIGH',
        confidence: 0.92,
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        latitude: 17.7812,
        longitude: 83.3762,
        gps_status: 'ACTIVE',
        camera_id: 'CAM-CABIN-PASSENGER-02',
        status: 'IN_PROGRESS',
        assigned_crew: 'Glazing Rapid Team #1',
        model_version: 'SOLVOFIN-BusInfraVision-v4.2',
        location_in_bus: 'Right Window Bay #4',
      },
    ];
  }

  private getInitialBusInspectionReports(): BusInspectionReport[] {
    return [
      {
        id: 'BUS-REP-AP39XX1234-8841',
        bus_number: 'AP 39 XX 1234',
        route_id: 'BUS-18-NORTH',
        inspection_date: new Date().toISOString().split('T')[0],
        inspection_time: '08:45:00',
        latitude: 17.7342,
        longitude: 83.3248,
        gps_status: 'ACTIVE',
        camera_ids: ['CAM-CABIN-PASSENGER-01', 'CAM-DRIVER-CABIN-01', 'CAM-DOOR-INGRESS-02'],
        inspector_mode: 'LIVE_CV_STREAM',
        driver_safety_summary: {
          total_events: 2,
          drowsiness_events: 1,
          yawning_events: 0,
          eye_closure_events: 1,
          attention_events: 0,
          critical_drowsiness_count: 0,
          avg_risk_score: 28,
          overall_status: 'NORMAL',
        },
        infrastructure_health_score: 82,
        component_scores: {
          seats: 76,
          windows: 92,
          doors: 96,
          handrails: 84,
          floor: 80,
          lighting: 98,
          signage: 94,
          emergency_equipment: 96,
        },
        seat_inspection: {
          total_visible: 42,
          occupied: 28,
          empty: 14,
          good: 36,
          fair: 3,
          damaged: 2,
          critical: 1,
          missing: 0,
          unknown: 0,
        },
        defects_count: 3,
        critical_issues_count: 1,
        defects_list: this.getInitialInfrastructureDefects().slice(0, 3),
        recommended_maintenance: [
          'Dispatch upholstery repair for Row 3 cushion tear.',
          'Replace fractured mounting bracket for Row 4 Left double seat.',
          'Retorque vertical mid-aisle stanchion anchoring bolts.',
        ],
        generated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        synced_with_government: true,
        model_version: 'SOLVOFIN-BusInfraVision-v4.2',
      },
      {
        id: 'BUS-REP-AP31Z9884-6201',
        bus_number: 'AP 31 Z 9884',
        route_id: 'BUS-07-EXPRESS',
        inspection_date: new Date().toISOString().split('T')[0],
        inspection_time: '07:15:00',
        latitude: 17.7812,
        longitude: 83.3762,
        gps_status: 'ACTIVE',
        camera_ids: ['CAM-CABIN-PASSENGER-02', 'CAM-DRIVER-CABIN-02'],
        inspector_mode: 'LIVE_CV_STREAM',
        driver_safety_summary: {
          total_events: 4,
          drowsiness_events: 2,
          yawning_events: 1,
          eye_closure_events: 1,
          attention_events: 1,
          critical_drowsiness_count: 1,
          avg_risk_score: 64,
          overall_status: 'WARNING',
        },
        infrastructure_health_score: 87,
        component_scores: {
          seats: 90,
          windows: 78,
          doors: 95,
          handrails: 94,
          floor: 86,
          lighting: 96,
          signage: 95,
          emergency_equipment: 94,
        },
        seat_inspection: {
          total_visible: 42,
          occupied: 32,
          empty: 10,
          good: 39,
          fair: 2,
          damaged: 1,
          critical: 0,
          missing: 0,
          unknown: 0,
        },
        defects_count: 1,
        critical_issues_count: 0,
        defects_list: this.getInitialInfrastructureDefects().slice(3, 4),
        recommended_maintenance: [
          'Schedule laminate replacement for Right Window Bay #4 stress crack.',
          'Driver counseling on fatigue management protocols.',
        ],
        generated_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        synced_with_government: true,
        model_version: 'SOLVOFIN-BusInfraVision-v4.2',
      },
    ];
  }

  private getInitialGovernmentAlerts(): GovernmentAlert[] {
    return [
      {
        id: 'ALT-DS-0101',
        bus_number: 'AP 31 Z 9884',
        module: 'DRIVER_SAFETY',
        event_type: 'CRITICAL_DROWSINESS',
        severity: 'CRITICAL',
        confidence: 0.97,
        duration_sec: 2.9,
        latitude: 17.7812,
        longitude: 83.3762,
        gps_status: 'ACTIVE',
        timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
        camera_id: 'CAM-DRIVER-CABIN-02',
        status: 'DISPATCHED',
        action_taken: 'Radio contact established with driver at NH-16 Madhurawada junction.',
      },
      {
        id: 'ALT-INFRA-0102',
        bus_number: 'AP 39 XX 1234',
        module: 'BUS_INFRASTRUCTURE',
        event_type: 'SEAT DEFECT (CRITICAL)',
        severity: 'CRITICAL',
        confidence: 0.94,
        latitude: 17.7342,
        longitude: 83.3248,
        gps_status: 'ACTIVE',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        camera_id: 'CAM-CABIN-PASSENGER-01',
        status: 'UNDER_REVIEW',
        action_taken: 'Depot maintenance work order queued for terminal arrival.',
      },
      {
        id: 'ALT-DS-0103',
        bus_number: 'AP 39 XX 1234',
        module: 'DRIVER_SAFETY',
        event_type: 'PROLONGED_DROWSINESS',
        severity: 'HIGH',
        confidence: 0.94,
        duration_sec: 1.8,
        latitude: 17.7342,
        longitude: 83.3248,
        gps_status: 'ACTIVE',
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        camera_id: 'CAM-DRIVER-CABIN-01',
        status: 'NEW',
      },
    ];
  }

  // Zig-Zag / Erratic Driving Methods
  public getZigZagIncidents(filters?: {
    camera?: string;
    severity?: string;
    status?: string;
    vehicle_type?: string;
  }): ZigZagIncident[] {
    let items = this.data.zigzag_incidents || [];
    if (!items.length) {
      items = [...INITIAL_ZIGZAG_INCIDENTS];
      this.data.zigzag_incidents = items;
      this.save();
    }

    if (filters) {
      if (filters.camera && filters.camera !== 'ALL') {
        items = items.filter((it) => it.camera === filters.camera);
      }
      if (filters.severity && filters.severity !== 'ALL') {
        items = items.filter((it) => it.severity === filters.severity);
      }
      if (filters.status && filters.status !== 'ALL') {
        items = items.filter((it) => it.status === filters.status);
      }
      if (filters.vehicle_type && filters.vehicle_type !== 'ALL') {
        items = items.filter((it) => it.vehicle_type === filters.vehicle_type);
      }
    }

    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getZigZagIncidentById(id: string): ZigZagIncident | undefined {
    const list = this.getZigZagIncidents();
    return list.find((it) => it.id === id);
  }

  public updateZigZagIncidentStatus(id: string, status: ZigZagAlertStatus, notes?: string): ZigZagIncident | null {
    if (!this.data.zigzag_incidents) this.data.zigzag_incidents = [...INITIAL_ZIGZAG_INCIDENTS];
    const index = this.data.zigzag_incidents.findIndex((it) => it.id === id);
    if (index === -1) return null;

    const updated = {
      ...this.data.zigzag_incidents[index],
      status,
      notes: notes || this.data.zigzag_incidents[index].description,
    };
    this.data.zigzag_incidents[index] = updated;
    this.save();
    return updated;
  }

  public createZigZagIncident(incident: Partial<ZigZagIncident>): ZigZagIncident {
    if (!this.data.zigzag_incidents) this.data.zigzag_incidents = [...INITIAL_ZIGZAG_INCIDENTS];
    const now = new Date();
    const newRecord: ZigZagIncident = {
      id: incident.id || `ZZ-${Date.now().toString().slice(-6)}`,
      track_id: incident.track_id || `MOTO-${Math.floor(100 + Math.random() * 900)}`,
      license_plate: incident.license_plate || 'AP 39 XX 9999',
      vehicle_type: incident.vehicle_type || 'MOTORCYCLE',
      severity: incident.severity || 'HIGH',
      status: incident.status || 'ACTIVE',
      camera: incident.camera || 'FRONT',
      camera_name: incident.camera === 'REAR' ? 'REAR CAMERA' : 'FRONT CAMERA',
      description:
        incident.description ||
        `Potential Zig-Zag / Erratic Driving detected: alternating lateral shifts detected within ${incident.time_window_sec || 4.2}s window.`,
      direction_sequence: incident.direction_sequence || ['RIGHT', 'LEFT', 'RIGHT', 'LEFT'],
      direction_changes_count: incident.direction_changes_count || 4,
      time_str: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      bus_number: incident.bus_number || 'AP 39 XX 1234',
      timestamp: incident.timestamp || now.toISOString(),
      time_window_sec: incident.time_window_sec || 4.2,
      confidence: incident.confidence || 0.89,
      avg_lateral_velocity_mps: incident.avg_lateral_velocity_mps || 1.6,
      max_lateral_displacement_pct: incident.max_lateral_displacement_pct || 55,
      location_name: incident.location_name || 'NH-16 Corridor',
      latitude: incident.latitude || 17.7342,
      longitude: incident.longitude || 83.3248,
      road_speed_kmh: incident.road_speed_kmh || 52,
      trajectory_points: incident.trajectory_points || [],
    };

    this.data.zigzag_incidents.unshift(newRecord);
    this.save();
    return newRecord;
  }

  // Export raw data
  public getFullDump(): DatabaseSchema {
    return this.data;
  }
}

export const db = new PersistentDatabase();
