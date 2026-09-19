export type UserRole = 'GOVERNMENT' | 'CITIZEN' | 'ADMIN' | 'AUTHORITY' | 'OPERATOR' | 'VIEWER';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  name: string;
  avatar?: string;
  department?: string;
  phone?: string;
  token?: string;
}

export type CameraPerspective = 'CAM-FRONT' | 'CAM-REAR' | 'CAM-LEFT' | 'CAM-RIGHT' | 'CAM-CABIN';

export interface CitizenEscalationImage {
  id: string;
  escalation_id?: string;
  original_url: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  uploaded_at: string;
  sha256_hash?: string;
}

export interface CitizenIssue {
  id: string;
  tracking_code: string;
  citizen_id: string;
  citizen_name: string;
  citizen_phone?: string;
  citizen_email?: string;
  category: RoadDefectType;
  title: string;
  description: string;
  landmark: string;
  latitude: number;
  longitude: number;
  address: string;
  evidence_url: string;
  thumbnail_url?: string;
  original_photo?: CitizenEscalationImage;
  annotated_photo_url?: string;
  timestamp: string;
  status: 'SUBMITTED' | 'AI_VERIFIED' | 'UNDER_GOVERNMENT_REVIEW' | 'WORK_ORDER_DISPATCHED' | 'RESOLVED';
  severity: DefectSeverity;
  ai_validation: {
    is_verified: boolean;
    detected_class: string;
    confidence: number;
    severity_assessment?: DefectSeverity;
    depth_cm?: number;
    width_cm?: number;
    length_cm?: number;
    estimated_asphalt_kg?: number;
    estimated_cost_inr?: number;
    priority_score?: number;
    sla_target_hours?: number;
    summary: string;
  };
  government_review?: {
    reviewed_by: string;
    reviewed_at: string;
    official_remarks: string;
    work_order_id?: string;
    assigned_division?: string;
  };
}

export interface OriginDestinationPattern {
  id: string;
  origin_zone?: string;
  destination_zone?: string;
  origin?: string;
  destination?: string;
  corridor_name: string;
  bus_routes: string[];
  hourly_vehicle_flow?: number;
  hourly_passenger_flow?: number;
  daily_total_volume?: number;
  avg_transit_time_mins?: number;
  avg_trip_duration_minutes?: number;
  peak_hours: string;
  congestion_level: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  flow_percentage: number;
}

export interface RouteDelayEstimate {
  id: string;
  bus_id: string;
  bus_count?: number;
  route_id: string;
  route_name: string;
  corridor?: string;
  origin: string;
  destination: string;
  scheduled_duration_mins: number;
  scheduled_duration_minutes?: number;
  observed_duration_mins: number;
  actual_duration_minutes?: number;
  delay_minutes: number;
  congestion_index?: number;
  delay_severity: 'ON_TIME' | 'MINOR_DELAY' | 'MODERATE_DELAY' | 'CRITICAL_DELAY';
  primary_delay_cause?: string;
  chokepoint_cause?: string;
  recommended_mitigation?: string;
  bottleneck_location: string;
  gps_coordinates: { latitude: number; longitude: number };
  last_updated: string;
}

export type MediaType = 'VIDEO' | 'IMAGE';
export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
export type RoadHealthRating = 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' | 'CRITICAL';
export type DefectSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RoadDefectType =
  | 'POTHOLE'
  | 'CRACK'
  | 'LONGITUDINAL_CRACK'
  | 'TRANSVERSE_CRACK'
  | 'ALLIGATOR_CRACKING'
  | 'ROAD_DEPRESSION'
  | 'DAMAGED_ROAD'
  | 'MISSING_DIVIDER'
  | 'DAMAGED_DIVIDER'
  | 'FADED_ZEBRA_CROSSING'
  | 'MISSING_ZEBRA_CROSSING'
  | 'DAMAGED_SIGNBOARD'
  | 'MISSING_SIGNBOARD'
  | 'WATERLOGGING'
  | 'OPEN_MANHOLE'
  | 'ROAD_DEBRIS'
  | 'OTHER_HAZARD';

// ================= 9-POINT MANDATORY ROAD DEFECT & INFRASTRUCTURE AUDIT =================
export interface NinePointRoadAuditItem {
  id: string;
  key: RoadDefectType;
  item_number: number;
  name: string;
  detected: boolean;
  status: 'YES' | 'NO';
  confidence: number;
  severity: DefectSeverity | 'NONE';
  count: number;
  details: string;
  action_required: string;
  bbox?: [number, number, number, number];
}

export interface NinePointRoadAuditResult {
  audited_at: string;
  total_items_checked: 9;
  items_present_count: number;
  items_clear_count: number;
  all_clear: boolean;
  score: number;
  overall_verdict: string;
  items: NinePointRoadAuditItem[];
}

export type VehicleType =
  | 'CAR'
  | 'BUS'
  | 'TRUCK'
  | 'MOTORCYCLE'
  | 'SCOOTER'
  | 'AUTO_RICKSHAW'
  | 'VAN'
  | 'BICYCLE'
  | 'EMERGENCY_VEHICLE'
  | 'OTHER';

export type BuildingType =
  | 'RESIDENTIAL'
  | 'COMMERCIAL'
  | 'HOUSE'
  | 'GOVERNMENT'
  | 'INDUSTRIAL'
  | 'OTHER';

export type IncidentType =
  | 'POTENTIAL_RASH_DRIVING'
  | 'SUDDEN_DANGEROUS_MANEUVER'
  | 'PEDESTRIAN_RISK'
  | 'POTENTIAL_HIT_AND_RUN'
  | 'STOPPED_VEHICLE'
  | 'ROAD_OBSTRUCTION'
  | 'UNUSUAL_TRAFFIC_EVENT';

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy?: number | null;
  timestamp?: string | null;
  address_or_name?: string | null;
}

export interface MediaRecord {
  id: string;
  title?: string;
  original_filename: string;
  media_type: MediaType;
  file_size: number;
  mime_type: string;
  storage_path: string;
  thumbnail_path?: string;
  upload_time: string;
  uploaded_by: string;
  
  // Explicit Distinction:
  upload_location: LocationData;
  scene_location: LocationData;
  bus_route_id?: string;
  
  duration_sec?: number;
  frame_count?: number;
  resolution?: string;
  fps?: number;
  
  analysis_status: JobStatus;
  analysis_started_at?: string;
  analysis_completed_at?: string;
  created_at?: string;
  ai_analysis_result?: any;
  
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

export interface BoundingBox {
  ymin: number; // 0 - 1000 or 0 - 100%
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface Detection {
  id: string;
  media_id: string;
  frame_number: number;
  timestamp_sec: number;
  category: 'VEHICLE' | 'ROAD_DEFECT' | 'PERSON' | 'BUILDING' | 'SIGNAGE' | 'SMOKE' | 'URBAN_OBJECT';
  class_name: string;
  track_id?: string;
  confidence: number;
  bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-100 scale
  properties?: Record<string, any>;
}

export interface RoadDefect {
  id: string;
  media_id: string;
  type: RoadDefectType;
  confidence: number;
  calibrated_confidence?: number;
  severity: DefectSeverity;
  frame_number: number;
  timestamp_sec: number;
  duration_sec?: number;
  latitude: number | null;
  longitude: number | null;
  evidence_path?: string;
  description: string;
  bbox?: [number, number, number, number];
  bbox_end?: [number, number, number, number];
  // Segmentation Mask & Geometry
  polygon_points?: [number, number][]; // [[x, y], [x, y], ...] normalized 0-100
  mask_area_px?: number;
  mask_area_sqm?: number;
  contour_points?: number;
  aspect_ratio?: number;
  // Tracking & Temporal Validation
  track_id?: string;
  track_length_frames?: number;
  is_temporal_validated?: boolean;
  temporal_status?: 'CONFIRMED' | 'SINGLE_FRAME_PROPOSAL' | 'TEMPORAL_SUPPRESSED';
  // Two-stage & Hard-negative verification
  stage1_proposal_score?: number;
  stage2_verifier_score?: number;
  verification_status?: 'CONFIRMED' | 'REJECTED_SHADOW' | 'REJECTED_MANHOLE' | 'REJECTED_PATCH' | 'REJECTED_WATER_REFLECTION' | 'UNCERTAIN';
  rejection_reason?: string;
  hard_negative_tested?: string[];
  // Environmental & Geometry
  distance_band?: 'NEAR' | 'MEDIUM' | 'FAR';
  road_roi_validated?: boolean;
  depth_cm?: number;
  width_cm?: number;
  length_cm?: number;
  asphalt_tons?: number;
  repair_cost_inr?: number;
  priority_score?: number;
  division_assigned?: string;
  work_order_id?: string;
  work_order_status?: 'PENDING_APPROVAL' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED';
  dimensions_cm?: { length?: number; width?: number; depth?: number };
  crop_image_path?: string;
  location?: { latitude: number; longitude: number };
  model_version?: string;
}

export interface PotholeBenchmarkResult {
  model_name: string;
  model_version: string;
  architecture: string;
  evaluation_date: string;
  dataset_summary: {
    total_test_samples: number;
    test_images_count: number;
    test_video_clips_count: number;
    total_annotated_potholes: number;
    total_hard_negatives: number;
    day_samples: number;
    night_lowlight_samples: number;
    rain_wet_samples: number;
    shadow_glare_samples: number;
    near_samples: number;
    medium_samples: number;
    far_samples: number;
  };
  metrics: {
    precision: number;
    recall: number;
    f1_score: number;
    map_50: number;
    map_50_95: number;
    mask_iou: number;
    true_positives: number;
    false_positives: number;
    false_negatives: number;
    true_negatives: number;
    avg_inference_latency_ms: number;
    video_fps: number;
    processing_time_per_min_video_sec: number;
  };
  mode_performance: {
    high_precision: { precision: number; recall: number; f1: number; threshold: number };
    balanced: { precision: number; recall: number; f1: number; threshold: number };
    high_recall: { precision: number; recall: number; f1: number; threshold: number };
  };
  error_analysis: {
    false_positives_breakdown: {
      tree_vehicle_shadows: number;
      manholes_drains: number;
      asphalt_repair_patches: number;
      oil_fuel_stains: number;
      water_reflection_glare: number;
      road_markings: number;
      mud_debris: number;
    };
    false_negatives_breakdown: {
      small_far_potholes: number;
      low_light_night: number;
      rain_glare_obscured: number;
      heavy_occlusion: number;
      shallow_nascent_depression: number;
    };
  };
  limitations: string[];
  recommended_next_improvements: string[];
}

export interface HumanReviewItem {
  id: string;
  media_id: string;
  defect_id?: string;
  thumbnail_url?: string;
  bbox: [number, number, number, number];
  polygon_points?: [number, number][];
  model_confidence: number;
  predicted_class: string;
  human_label?: 'TRUE_POTHOLE' | 'FALSE_POSITIVE_SHADOW' | 'FALSE_POSITIVE_MANHOLE' | 'FALSE_POSITIVE_PATCH' | 'FALSE_POSITIVE_OTHER' | 'UNCERTAIN';
  reviewer_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  status: 'PENDING_REVIEW' | 'REVIEWED' | 'EXPORTED_TO_TRAINING';
}

export interface RoadCondition {
  id: string;
  media_id: string;
  health_score: number; // 0-100
  rating: RoadHealthRating;
  pothole_count: number;
  surface_damage_score: number; // 0-100
  crack_index: number; // 0-100
  waterlogging_index: number; // 0-100
  signage_rating: number; // 0-100
  defect_density: string; // e.g. "3.2 defects/km" or "4 defects visible"
  notes: string;
}

export interface PeopleAnalytics {
  id: string;
  media_id: string;
  total_unique_people: number;
  apparent_male_est: number;
  apparent_female_est: number;
  pedestrian_density: 'LOW' | 'MEDIUM' | 'HIGH' | 'CROWD';
  risk_events_count: number;
  is_estimate_disclaimer: boolean;
  notes: string;
}

export interface VehicleRecord {
  id: string;
  media_id: string;
  track_id: string;
  vehicle_type: VehicleType;
  first_seen_time: string;
  last_seen_time: string;
  timestamp_sec?: number;
  duration_sec: number;
  confidence: number;
  speed_kmh_est?: number;
  direction?: string;
  license_plate_id?: string;
  has_smoke: boolean;
  evidence_path?: string;
  bbox?: [number, number, number, number];
  bbox_end?: [number, number, number, number];
}

export interface LicensePlate {
  id: string;
  media_id: string;
  vehicle_id?: string;
  track_id?: string;
  plate_number: string;
  raw_ocr_text?: string;
  normalized_plate?: string;
  ocr_confidence: number;
  frame_number: number;
  timestamp_sec: number;
  duration_sec?: number;
  evidence_path?: string;
  plate_crop_url?: string;
  vehicle_crop_url?: string;
  plate_crop_path?: string;
  vehicle_crop_path?: string;
  is_low_confidence: boolean;
  ocr_status?: 'RELIABLY_READ' | 'UNCERTAIN' | 'NOT_READABLE';
  ocr_notes?: string;
  state_or_jurisdiction?: string;
  bbox?: [number, number, number, number];
  bbox_end?: [number, number, number, number];
}

export interface SmokeEvent {
  id: string;
  media_id: string;
  vehicle_id?: string;
  track_id?: string;
  plate_number?: string;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  duration_sec: number;
  timestamp_sec: number;
  frame_number: number;
  evidence_path?: string;
  notes: string;
  bbox?: [number, number, number, number];
  bbox_end?: [number, number, number, number];
}

export interface BuildingRecord {
  id: string;
  media_id: string;
  track_id: string;
  building_type: BuildingType;
  confidence: number;
  first_seen: string | number;
  last_seen: string | number;
  latitude: number | null;
  longitude: number | null;
  bbox?: [number, number, number, number];
  evidence_path?: string;
}

export interface TrafficMetrics {
  id: string;
  media_id: string;
  vehicle_count: number;
  vehicle_density: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  flow_rate_per_min: number | null; // null for photos
  is_instantaneous_count: boolean; // true for single photo
  congestion_score: number; // 0-100
  congestion_level: 'NORMAL' | 'LIGHT' | 'MODERATE' | 'SEVERE';
  direction_stats?: Record<string, number>;
  vehicle_composition: Record<string, number>;
  stopped_vehicles_count: number;
  slow_moving_count: number;
  avg_speed_kmh_est?: number;
}

export interface IncidentRecord {
  id: string;
  media_id: string;
  type: IncidentType;
  severity: DefectSeverity;
  status?: 'ACTIVE' | 'DISPATCHED' | 'UNDER_INVESTIGATION' | 'RESOLVED';
  confidence: number;
  timestamp_sec: number;
  frame_number: number;
  vehicle_track_id?: string;
  plate_number?: string;
  evidence_path?: string;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
  assigned_unit?: string;
}

export interface TrafficBottleneck {
  id: string;
  corridor_name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  bottleneck_cause:
    | 'LANE_CONSTRICTION'
    | 'SIGNAL_UNCOORDINATED'
    | 'POTHOLE_DEFECT_SLOWDOWN'
    | 'ILLEGAL_PARKING_BLOCK'
    | 'HIGH_VOLUME_MERGE'
    | 'CONSTRUCTION_ZONE';
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'MINOR';
  congestion_index: number; // 0-100
  avg_delay_minutes: number;
  queue_length_meters: number;
  flow_rate_vehicles_per_min: number;
  capacity_vehicles_per_min: number;
  active_incident_count: number;
  mitigation_action: string;
  action_priority: 'IMMEDIATE' | 'HIGH' | 'PLANNED';
  media_id?: string;
}

export interface HeatwaveAnalytics {
  id: string;
  zone_name: string;
  corridor_id?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  surface_temperature_c: number; // e.g. 48.5
  ambient_temperature_c: number; // e.g. 38.6
  thermal_anomaly_delta: number; // e.g. +9.9
  heat_vulnerability_index: number; // 0-100
  alert_level: 'YELLOW_WATCH' | 'ORANGE_ALERT' | 'RED_SEVERE';
  tree_canopy_percentage: number; // 0-100%
  asphalt_albedo_index: number; // 0.0 - 1.0 (lower means absorbs more heat)
  pedestrian_heat_exposure_risk: 'EXTREME' | 'HIGH' | 'MODERATE';
  urban_cooling_interventions: string[];
  last_measured_time?: string;
}

export interface ActionableInsight {
  id: string;
  title: string;
  category:
    | 'ROAD_SAFETY'
    | 'TRAFFIC_BOTTLENECK'
    | 'HEATWAVE_MITIGATION'
    | 'EMISSION_ENFORCEMENT'
    | 'PEDESTRIAN_PROTECTION'
    | 'ANPR_FLAG';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  department:
    | 'ROAD_WORKS_DEPT'
    | 'TRAFFIC_POLICE'
    | 'ENVIRONMENT_FORESTRY'
    | 'TRANSIT_AUTHORITY'
    | 'SMART_CITY_OPS';
  location: {
    latitude: number;
    longitude: number;
    address_or_corridor: string;
  };
  summary: string;
  recommended_action: string;
  estimated_cost_inr: string;
  estimated_timeline_hours: number;
  roi_or_impact: string;
  status: 'PENDING' | 'DISPATCHED' | 'IN_PROGRESS' | 'RESOLVED';
  created_at: string;
  media_id?: string;
}

export interface UrbanObjectTaxonomy {
  id: string;
  media_id: string;
  class_name: string;
  count: number;
  confidence: number;
}

export interface AnalysisJob {
  id: string;
  media_id: string;
  status: JobStatus;
  progress: number; // 0-100
  current_module: string;
  modules_status: {
    media_preprocessing: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    frame_extraction: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    object_detection: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    vehicle_tracking: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    road_analysis: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    people_detection: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    traffic_metrics: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    anpr: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    smoke_detection: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    building_count: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    incident_detection: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    lane_detection?: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    vulnerable_pedestrians?: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    road_divider_inspection?: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    report_generation: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  };
  started_at: string;
  completed_at?: string;
  error_message?: string;
  logs: Array<{ timestamp: string; message: string; level: 'INFO' | 'WARN' | 'ERROR' }>;
}

export interface ReportRecord {
  id: string;
  media_id: string;
  report_type: 'FULL_AUDIT' | 'MUNICIPAL_SUMMARY' | 'SAFETY_ALERT';
  file_path: string;
  generated_at: string;
  version: string;
  model_version: string;
  status: 'READY' | 'GENERATING' | 'FAILED';
  summary_text: string;
  executive_recommendations: string[];
  stats_snapshot: {
    road_health_score: number;
    road_rating: string;
    potholes_count: number;
    total_defects_count: number;
    unique_vehicles_count: number;
    buses_count: number;
    people_count: number;
    buildings_count: number;
    license_plates_count: number;
    smoke_events_count: number;
    incidents_count: number;
    congestion_level: string;
  };
}

export interface EvidenceFile {
  id: string;
  media_id: string;
  event_type: 'ROAD_DEFECT' | 'VEHICLE' | 'ANPR' | 'SMOKE' | 'INCIDENT' | 'BUILDING' | 'PEOPLE';
  frame_number: number;
  timestamp_sec: number;
  file_path: string;
  caption: string;
  metadata?: Record<string, any>;
}

export interface WorkOrder {
  id: string;
  defect_id?: string;
  title: string;
  severity: DefectSeverity;
  status: 'PENDING_APPROVAL' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  cavity_dimensions: {
    depth_cm: number;
    width_cm: number;
    length_cm: number;
  };
  material_estimate: {
    asphalt_tons: number;
    bitumen_tack_coat_liters: number;
    cold_milling_labor_hours: number;
    total_cost_inr: number;
  };
  division_assigned: string;
  priority_score: number; // 0-100
  created_at: string;
  dispatched_at?: string;
  completed_at?: string;
  assigned_crew?: string;
  media_id?: string;
}

export interface CampusBus {
  id: string;
  bus_number: string;
  route_id: string;
  route_name: string;
  driver_name: string;
  driver_phone: string;
  current_location: {
    latitude: number;
    longitude: number;
    heading: number;
    speed_kmh: number;
  };
  capacity: number;
  occupied_seats: number;
  status: 'ON_ROUTE' | 'DELAYED' | 'ARRIVED' | 'EMERGENCY_SOS';
  next_stop: string;
  eta_minutes: number;
  hazard_alerts_ahead: Array<{
    hazard_type: string;
    distance_meters: number;
    severity: DefectSeverity;
    warning_text: string;
  }>;
  polyline_coords: Array<[number, number]>;
}

export interface StudentTeamMember {
  id: string;
  name: string;
  roll_number: string;
  student_id?: string;
  role_title: string;
  role?: string;
  system_role: 'ADMIN' | 'AUTHORITY' | 'OPERATOR' | 'VIEWER';
  department: string;
  institution: string;
  avatar: string;
  specialization: string;
  bio?: string;
  contributions?: string[];
  email?: string;
}

export interface GoogleMapsPlace {
  id: string;
  name: string;
  formatted_address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  google_maps_uri: string;
  open_now?: boolean;
  editorial_summary?: string;
  phone_number?: string;
}

export interface GoogleMapsRouteStep {
  instruction: string;
  distance_meters: number;
  distance_text: string;
  duration_seconds: number;
  duration_text: string;
  travel_mode: 'DRIVE' | 'WALK' | 'TRANSIT' | 'TWO_WHEELER';
  start_location?: { lat: number; lng: number };
  end_location?: { lat: number; lng: number };
}

export interface GoogleMapsRoute {
  origin_name: string;
  destination_name: string;
  origin_coords: { lat: number; lng: number; address?: string };
  destination_coords: { lat: number; lng: number; address?: string };
  distance_km: number;
  distance_text: string;
  duration_minutes: number;
  duration_text: string;
  duration_in_traffic_minutes?: number;
  travel_mode: 'DRIVE' | 'WALK' | 'TRANSIT' | 'TWO_WHEELER';
  polyline_points: Array<[number, number]>;
  encoded_polyline?: string;
  steps: GoogleMapsRouteStep[];
  google_maps_nav_url: string;
  toll_info?: { has_tolls: boolean; estimated_cost_inr?: number };
  eco_friendly?: boolean;
  warnings?: string[];
  hazards_along_route?: Array<{
    defect_id: string;
    hazard_type: string;
    severity: string;
    location: { lat: number; lng: number };
    chainage_km?: number;
    warning_message: string;
  }>;
}

export interface MapsAgentQueryResponse {
  answer: string;
  intent: 'PLACE_SEARCH' | 'ROUTE_DIRECTIONS' | 'MUNICIPAL_DETOUR' | 'TRANSIT_ANALYSIS' | 'GENERAL';
  places?: GoogleMapsPlace[];
  route?: GoogleMapsRoute;
  grounding_chunks?: Array<{
    title?: string;
    uri?: string;
    snippet?: string;
  }>;
  hazards_identified?: Array<{
    type: string;
    severity: string;
    distance_meters: number;
    recommended_action: string;
  }>;
}

export interface CompleteMediaAnalysisResult {
  media: MediaRecord;
  job: AnalysisJob;
  road_condition?: RoadCondition;
  road_defects: RoadDefect[];
  nine_point_audit?: NinePointRoadAuditResult;
  vehicles: VehicleRecord[];
  license_plates: LicensePlate[];
  people_analytics?: PeopleAnalytics;
  traffic_metrics?: TrafficMetrics;
  smoke_events: SmokeEvent[];
  buildings: BuildingRecord[];
  incidents: IncidentRecord[];
  urban_objects: UrbanObjectTaxonomy[];
  detections: Detection[];
  evidence_files: EvidenceFile[];
  lane_analysis?: LaneAnalysisSummary;
  vulnerable_pedestrians?: VulnerablePedestrianEvent[];
  road_dividers?: RoadDividerDetection[];
  report?: ReportRecord;
  insights: string[];
}

export type CompleteAnalysisResponse = CompleteMediaAnalysisResult;

// ================= MODULE 1: DRIVER SAFETY & DROWSINESS MONITORING =================
export type DriverRiskLevel = 'NORMAL' | 'LOW' | 'WARNING' | 'CRITICAL';

export type DriverSafetyEventType =
  | 'EYE_CLOSURE'
  | 'PROLONGED_DROWSINESS'
  | 'CRITICAL_DROWSINESS'
  | 'YAWN'
  | 'REPEATED_YAWNING'
  | 'DISTRACTED_LOOKING_AWAY'
  | 'HEAD_NOD'
  | 'LOW_ATTENTION'
  | 'OCCLUSION_LOW_VISIBILITY'
  | 'LANE_TRANSITION_ALERT';

export type DriverAttentionDirection = 'FORWARD' | 'LOOKING_LEFT' | 'LOOKING_RIGHT' | 'LOOKING_DOWN' | 'LOOKING_UP' | 'DISTRACTED';

export interface DriverSafetyMetrics {
  ear_left: number;
  ear_right: number;
  ear_avg: number;
  mar: number;
  perclos: number;
  blink_count: number;
  blink_rate_bpm: number;
  head_yaw: number; // degrees - left/right
  head_pitch: number; // degrees - up/down nod
  head_roll: number; // degrees - tilt
  attention_direction: DriverAttentionDirection;
  face_detected: boolean;
  face_visibility_score: number;
  lighting_quality: 'GOOD' | 'ADEQUATE' | 'LOW_LIGHT' | 'GLARE';
  fps: number;
  risk_score: number; // 0-100
  risk_level: DriverRiskLevel;
}

export interface DriverSafetyEvent {
  id: string;
  bus_id?: string;
  bus_number: string;
  event_type: DriverSafetyEventType;
  severity: DriverRiskLevel;
  confidence: number;
  risk_score: number; // 0 - 100
  timestamp: string;
  duration_sec: number;
  latitude: number | null;
  longitude: number | null;
  gps_status: 'ACTIVE' | 'UNAVAILABLE';
  camera_id: string;
  evidence_snapshot?: string;
  model_version: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED';
  metrics?: Partial<DriverSafetyMetrics>;
  notes?: string;
}

export interface DriverMonitoringSession {
  id: string;
  bus_number: string;
  driver_name?: string;
  driver_id?: string;
  camera_id: string;
  started_at: string;
  ended_at?: string;
  status: 'ACTIVE' | 'PAUSED' | 'ENDED';
  current_risk_level: DriverRiskLevel;
  current_risk_score: number;
  fps: number;
  total_events_count: number;
  critical_events_count: number;
  last_event?: DriverSafetyEvent;
  route_id?: string;
}

// ================= MODULE 2: BUS INFRASTRUCTURE INSPECTION =================
export type BusComponentCategory =
  | 'SEAT'
  | 'HANDRAIL'
  | 'WINDOW'
  | 'DOOR'
  | 'FLOOR'
  | 'CEILING'
  | 'LIGHTING'
  | 'EMERGENCY_EQUIPMENT'
  | 'SIGNAGE'
  | 'ACCESSIBILITY';

export type BusComponentCondition =
  | 'GOOD'
  | 'FAIR'
  | 'DAMAGED'
  | 'CRITICAL'
  | 'MISSING'
  | 'UNKNOWN';

export interface BusInfrastructureComponent {
  id: string;
  category: BusComponentCategory;
  name: string;
  condition: BusComponentCondition;
  confidence: number;
  bbox?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-100%
  location_in_bus?: string;
  defect_type?: string;
  recommended_action?: string;
  notes?: string;
}

export interface BusInfrastructureDefect {
  id: string;
  bus_number: string;
  bus_id?: string;
  component_category: BusComponentCategory;
  component_name: string;
  defect_description: string;
  condition: 'DAMAGED' | 'CRITICAL' | 'MISSING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  gps_status: 'ACTIVE' | 'UNAVAILABLE';
  camera_id: string;
  evidence_snapshot?: string;
  status: 'NEW' | 'UNDER_REVIEW' | 'MAINTENANCE_ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  assigned_crew?: string;
  work_order_id?: string;
  model_version: string;
  location_in_bus?: string;
  recommended_action?: string;
  bbox?: [number, number, number, number];
}

export interface BusInspectionReport {
  id: string;
  bus_number: string;
  bus_id?: string;
  route_id?: string;
  inspection_date: string;
  inspection_time: string;
  latitude: number | null;
  longitude: number | null;
  gps_status: 'ACTIVE' | 'UNAVAILABLE';
  camera_ids: string[];
  inspector_mode: 'LIVE_CV_STREAM' | 'CABIN_SCAN' | 'OFFLINE_AUDIT';
  driver_safety_summary: {
    total_events: number;
    drowsiness_events: number;
    yawning_events: number;
    eye_closure_events: number;
    attention_events: number;
    critical_drowsiness_count: number;
    avg_risk_score: number;
    overall_status: DriverRiskLevel;
  };
  infrastructure_health_score: number; // 0-100
  component_scores: {
    seats: number;
    windows: number;
    doors: number;
    handrails: number;
    floor: number;
    lighting: number;
    signage: number;
    emergency_equipment: number;
    accessibility?: number;
  };
  seat_inspection: {
    total_visible: number;
    occupied: number;
    empty: number;
    good: number;
    fair: number;
    damaged: number;
    critical: number;
    missing: number;
    unknown: number;
  };
  defects_count: number;
  critical_issues_count: number;
  defects_list: BusInfrastructureDefect[];
  recommended_maintenance: string[];
  generated_at: string;
  synced_with_government: boolean;
  model_version: string;
}

// ================= GOVERNMENT ALERTS & FLEET TELEMETRY =================
export interface GovernmentAlert {
  id: string;
  bus_number: string;
  module: 'DRIVER_SAFETY' | 'BUS_INFRASTRUCTURE' | 'ROAD_INFRASTRUCTURE' | 'LANE_SAFETY' | 'PEDESTRIAN_PROTECTION';
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  duration_sec?: number;
  latitude: number | null;
  longitude: number | null;
  gps_status: 'ACTIVE' | 'UNAVAILABLE';
  timestamp: string;
  camera_id: string;
  evidence_url?: string;
  status: 'NEW' | 'UNDER_REVIEW' | 'DISPATCHED' | 'RESOLVED' | 'DISMISSED';
  action_taken?: string;
  assigned_to?: string;
  work_order_id?: string;
}

// ================= MODULE 3: HIGHWAY LANE DETECTION =================
export type LaneMarkingType =
  | 'SOLID_WHITE'
  | 'DASHED_WHITE'
  | 'DOUBLE_YELLOW'
  | 'SOLID_YELLOW'
  | 'DASHED_YELLOW'
  | 'FADED'
  | 'BOTTS_DOTS'
  | 'UNKNOWN';

export type LaneCondition =
  | 'CLEAR_VISIBLE'
  | 'FADED'
  | 'SEVERELY_DEGRADED'
  | 'MISSING'
  | 'UNMARKED_SURFACE';

export type LaneDepartureStatus =
  | 'CENTERED'
  | 'DRIFTING_LEFT'
  | 'DRIFTING_RIGHT'
  | 'DEPARTURE_WARNING_LEFT'
  | 'DEPARTURE_WARNING_RIGHT';

export interface LaneBoundary {
  points: [number, number][]; // [x, y] normalized 0-100 coordinates
  marking_type: LaneMarkingType;
  condition: LaneCondition;
  confidence: number;
  degradation_score?: number; // 0-100
  color?: 'WHITE' | 'YELLOW' | 'UNKNOWN';
}

export interface LaneDetectionFrame {
  frame_number: number;
  timestamp_sec: number;
  confidence: number; // 0-1
  is_reliable: boolean; // if false: "Low confidence / lane markings not reliably detected"
  unreliable_reason?: string;
  left_boundary?: LaneBoundary;
  right_boundary?: LaneBoundary;
  center_line_points?: [number, number][]; // normalized 0-100
  vehicle_lateral_offset_meters: number; // e.g. -0.25 (left) to +0.30 (right)
  vehicle_lateral_offset_percent: number; // -100 to +100
  lane_width_meters_est: number; // standard ~3.5m
  departure_status: LaneDepartureStatus;
  curvature_radius_meters?: number;
  road_type?: 'HIGHWAY' | 'URBAN' | 'CURVED' | 'UNMARKED';
  latitude?: number | null;
  longitude?: number | null;
  camera_id?: string;
}

export interface LaneDepartureEvent {
  id: string;
  media_id: string;
  event_type: 'LANE_DEPARTURE' | 'LANE_DRIFT' | 'FADED_LANE_MARKING' | 'MISSING_LANE_MARKINGS';
  direction?: 'LEFT' | 'RIGHT';
  timestamp_sec: number;
  frame_number: number;
  camera_id: string;
  bus_id?: string;
  confidence: number;
  severity: DefectSeverity;
  offset_meters: number;
  description: string;
  latitude: number | null;
  longitude: number | null;
  gps_status: 'ACTIVE' | 'UNAVAILABLE';
  evidence_snapshot?: string;
}

export interface LaneAnalysisSummary {
  media_id: string;
  overall_confidence: number;
  dominant_marking_type: string;
  marking_quality_score: number; // 0-100
  lane_center_stability: number; // 0-100
  lane_departure_events_count: number;
  degraded_sections_count: number;
  unmarked_sections_count: number;
  departure_events: LaneDepartureEvent[];
  frames: LaneDetectionFrame[];
  status_summary: string;
  unreliable_warning?: string;
}

// ================= MODULE 4: SCHOOL CHILDREN & VULNERABLE PEDESTRIAN DETECTION =================
export type VulnerablePedestrianType =
  | 'SCHOOL_CHILD'
  | 'CHILD_WITH_ADULT'
  | 'VULNERABLE_PEDESTRIAN'
  | 'ELDERLY'
  | 'PEDESTRIAN';

export type PedestrianRiskSituation =
  | 'CROSSING_ROADWAY'
  | 'INSIDE_DRIVING_LANE'
  | 'DANGEROUS_TRAFFIC_PROXIMITY'
  | 'GROUP_NEAR_ROADWAY'
  | 'ENTERING_TRAFFIC_LANE'
  | 'WAITING_ON_SIDEWALK';

export interface VulnerablePedestrianEvent {
  id: string;
  media_id: string;
  track_id?: string;
  detection_type: 'VULNERABLE_PEDESTRIAN';
  pedestrian_type: VulnerablePedestrianType;
  risk_situation: PedestrianRiskSituation;
  timestamp_sec: number;
  frame_number: number;
  camera_id: string;
  confidence: number;
  severity: DefectSeverity;
  latitude: number | null;
  longitude: number | null;
  gps_status: 'ACTIVE' | 'UNAVAILABLE';
  bus_id?: string;
  vehicle_id?: string;
  distance_to_curb_m?: number;
  distance_to_vehicle_m?: number;
  height_ratio_relative_to_adult?: number;
  has_school_bag_indicator?: boolean;
  in_school_zone?: boolean;
  bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-100 scale
  bbox_end?: [number, number, number, number];
  evidence_snapshot?: string;
  description: string;
  alert_dispatched: boolean;
}

// ================= MODULE 5: MISSING & DAMAGED ROAD DIVIDER DETECTION =================
export type RoadDividerType =
  | 'CONCRETE_JERSEY_BARRIER'
  | 'STEEL_W_BEAM_GUARDRAIL'
  | 'CURB_MEDIAN_STRIP'
  | 'PLANTED_MEDIAN'
  | 'TEMPORARY_CONSTRUCTION_BARRIER';

export type RoadDividerCondition =
  | 'INTACT_NOMINAL'
  | 'DAMAGED_BARRIER'
  | 'BROKEN_SECTION'
  | 'MISSING_DIVIDER_SECTION'
  | 'DISPLACED_INTO_LANE'
  | 'INSUFFICIENT_EVIDENCE';

export interface RoadDividerDetection {
  id: string;
  media_id: string;
  divider_type: RoadDividerType;
  condition: RoadDividerCondition;
  confidence: number;
  is_sufficient_evidence: boolean;
  evidence_status_note?: string;
  severity: DefectSeverity;
  timestamp_sec: number;
  frame_number: number;
  camera_id: string;
  bus_id?: string;
  latitude: number | null;
  longitude: number | null;
  gps_status: 'ACTIVE' | 'UNAVAILABLE';
  bbox?: [number, number, number, number];
  bbox_end?: [number, number, number, number];
  barrier_length_meters_est?: number;
  gap_length_meters_est?: number;
  evidence_path?: string;
  description: string;
  recommended_action?: string;
  priority_score?: number;
}

// ================= MODULE 7: 2-PHOTO VEHICLE LANE TRANSITION DETECTION & CORRECTIVE TIPS =================
export type LaneTransitionType =
  | 'SAFE_LANE_CHANGE'
  | 'ABRUPT_CUT_IN'
  | 'SOLID_LINE_VIOLATION'
  | 'STRADDLE_WEAVING'
  | 'SLOW_DRIFT_DEPARTURE'
  | 'EMERGENCY_EVASION'
  | 'UNSIGNALED_MERGE';

export type TransitionDirection = 'LEFT_TO_RIGHT' | 'RIGHT_TO_LEFT' | 'CENTER_MAINTAINED';

export type CorrectiveTipCategory =
  | 'SIGNALING'
  | 'STEERING_ANGLE'
  | 'SPEED_HEADWAY'
  | 'MIRROR_BLIND_SPOT'
  | 'ROAD_MARKING'
  | 'HEAVY_VEHICLE_BUFFER';

export interface CorrectiveTipItem {
  id: string;
  category: CorrectiveTipCategory;
  urgency: 'MANDATORY' | 'RECOMMENDED' | 'ADVISORY';
  title: string;
  description: string;
  actionable_rule: string;
  irc_reference?: string;
}

export interface PhotoLaneSpatialState {
  image_url: string;
  label: string;
  timestamp_label: string;
  vehicle_type: string;
  vehicle_bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-100%
  lane_position: string;
  distance_to_left_boundary_m: number;
  distance_to_right_boundary_m: number;
  lane_center_offset_m: number;
  turn_indicator_active: boolean;
  surrounding_vehicles_count: number;
}

export interface LaneTransitionComparisonResult {
  id: string;
  analyzed_at: string;
  photo_1: PhotoLaneSpatialState;
  photo_2: PhotoLaneSpatialState;
  transition_type: LaneTransitionType;
  transition_direction: TransitionDirection;
  lateral_displacement_m: number;
  lateral_velocity_mps: number;
  transition_angle_deg: number;
  lane_straddling_pct: number;
  turn_indicator_detected: boolean;
  lane_marking_type: 'BROKEN_WHITE' | 'SOLID_WHITE' | 'DOUBLE_YELLOW' | 'FADED' | 'EDGE_LINE';
  is_violation: boolean;
  violation_code?: string;
  violation_reason?: string;
  safety_score: number; // 0-100
  hazard_severity: DefectSeverity | 'NONE';
  driver_coaching_summary: string;
  tts_spoken_tip: string;
  corrective_tips: CorrectiveTipItem[];
  model_name: string;
  confidence: number;
}

// ================= MODULE 8: POTENTIAL ZIG-ZAG / ERRATIC DRIVING DETECTION =================
export type ZigZagCameraType = 'FRONT' | 'REAR';
export type ZigZagSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type ZigZagAlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type ZigZagVehicleType = 'MOTORCYCLE' | 'AUTO_RICKSHAW' | 'CAR' | 'BUS' | 'TRUCK';

export interface ZigZagIncident {
  id: string;
  track_id: string;
  license_plate: string;
  vehicle_type: ZigZagVehicleType;
  severity: ZigZagSeverity;
  status: ZigZagAlertStatus;
  camera: ZigZagCameraType;
  camera_name: string;
  description: string;
  direction_sequence: ('LEFT' | 'RIGHT')[];
  direction_changes_count: number;
  time_str: string;
  bus_number: string;
  timestamp: string;
  time_window_sec: number;
  confidence: number;
  avg_lateral_velocity_mps?: number;
  max_lateral_displacement_pct?: number;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  road_speed_kmh?: number;
  trajectory_points?: {
    frame: number;
    t_sec: number;
    cx_pct: number;
    cy_pct: number;
    raw_cx_pct: number;
    delta_x_pct: number;
    direction: 'LEFT' | 'RIGHT' | 'CENTER';
  }[];
}

export interface ZigZagSensitivityConfig {
  temporal_window_sec: number; // default 4.5
  smoothing_k_frames: number; // default 3
  lateral_shift_threshold_pct: number; // default 3.5
  req_direction_changes: number; // default 3
  camera_vibration_damping: number; // 0-100%, default 85%
}

export interface ZigZagSimulationFrame {
  frame: number;
  time_sec: number;
  cx: number; // 0-100% center x
  cy: number; // 0-100% center y
  width: number;
  height: number;
  direction_shift: 'LEFT' | 'RIGHT' | null;
  shift_count: number;
  direction_sequence: ('LEFT' | 'RIGHT')[];
  is_flagged: boolean;
  status_text: string;
}

export interface ZigZagSimulationScenario {
  id: string;
  title: string;
  vehicle_type: ZigZagVehicleType;
  track_id: string;
  camera: ZigZagCameraType;
  camera_label: string;
  total_frames: number;
  context_description: string;
  license_plate?: string;
  bus_number?: string;
  frames: ZigZagSimulationFrame[];
}

export type ZigZagVerdictLevel = 'CRITICAL_ZIG_ZAG' | 'HIGH_ERRATIC_WEAVE' | 'MODERATE_SWAY' | 'NORMAL_SAFE_LANE';

export interface TwoPhotoVehicleSpatialState {
  image_url: string;
  label: string;
  timestamp_sec: number;
  bbox: { x: number; y: number; width: number; height: number }; // 0-100 percentage
  centroid: { cx: number; cy: number }; // 0-100 percentage
  lane_position: string;
  detected_class: string;
}

export interface TwoPhotoZigZagCalculation {
  id: string;
  calculated_at: string;
  bus_number: string;
  camera: ZigZagCameraType;
  vehicle_type: ZigZagVehicleType;
  license_plate: string;
  location_name: string;
  latitude: number;
  longitude: number;
  photo_1: TwoPhotoVehicleSpatialState;
  photo_2: TwoPhotoVehicleSpatialState;
  metrics: {
    delta_time_sec: number;
    delta_x_pct: number; // Lateral shift in % of frame width
    delta_y_pct: number; // Longitudinal forward shift %
    estimated_lateral_shift_m: number; // Estimated lateral displacement in meters
    lateral_velocity_mps: number; // Lateral velocity in m/s
    lateral_velocity_kmh: number; // Lateral velocity in km/h
    trajectory_angle_deg: number; // Angle relative to forward direction
    direction_of_swerve: 'SHARP_LEFT' | 'SHARP_RIGHT' | 'CENTER_DRIFT' | 'STABLE_FORWARD';
    lane_boundary_crossed: boolean;
    zigzag_risk_score: number; // 0-100 figure
    verdict_level: ZigZagVerdictLevel;
    verdict_title: string;
    confidence: number;
  };
  traffic_law_citation: {
    code: string;
    act: string;
    penalty_inr: number;
    points: number;
    description: string;
  };
  government_warning: {
    warn_recommended: boolean;
    urgency: 'CRITICAL' | 'HIGH' | 'ROUTINE';
    target_division: string;
    dispatch_recommended_unit: string;
    rationale: string;
  };
  government_alert_status?: {
    is_warned: boolean;
    alert_id?: string;
    warned_at?: string;
    status?: 'NEW' | 'DISPATCHED' | 'ACKNOWLEDGED';
    assigned_unit?: string;
    action_notes?: string;
  };
}

export interface TwoPhotoZigZagPreset {
  id: string;
  title: string;
  description: string;
  vehicle_type: ZigZagVehicleType;
  license_plate: string;
  camera: ZigZagCameraType;
  bus_number: string;
  location_name: string;
  photo_1: {
    image_url: string;
    label: string;
    timestamp_sec: number;
    bbox: { x: number; y: number; width: number; height: number };
    centroid: { cx: number; cy: number };
    lane_position: string;
    detected_class: string;
  };
  photo_2: {
    image_url: string;
    label: string;
    timestamp_sec: number;
    bbox: { x: number; y: number; width: number; height: number };
    centroid: { cx: number; cy: number };
    lane_position: string;
    detected_class: string;
  };
  expected_verdict: ZigZagVerdictLevel;
  context_note: string;
}
