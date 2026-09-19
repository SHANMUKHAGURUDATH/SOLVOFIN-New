import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Video,
  Image as ImageIcon,
  MapPin,
  Clock,
  Car,
  AlertOctagon,
  FileText,
  Flame,
  Building2,
  Users,
  AlertTriangle,
  Download,
  CheckCircle2,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Activity,
  Play,
  Pause,
  RotateCw,
  FastForward,
  Navigation,
  Compass,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { CompleteAnalysisResponse, UserRole } from '../types';
import { formatDate, formatBytes, getHealthBadgeColor, getSeverityBadgeColor } from '../utils';
import { VehicleFrameGallery } from './VehicleFrameGallery';
import { CVInspectionTabs } from './CVInspectionTabs';
import { NinePointRoadAuditCard } from './NinePointRoadAuditCard';
import { buildNinePointAuditFromData } from '../utils/ninePointAudit';

interface MediaDetailViewProps {
  mediaId: string;
  onBack: () => void;
  userRole: UserRole;
}

export const MediaDetailView: React.FC<MediaDetailViewProps> = ({ mediaId, onBack, userRole }) => {
  const [data, setData] = useState<CompleteAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'ninepoint' | 'road' | 'vehicles' | 'anpr' | 'smoke' | 'buildings' | 'incidents' | 'lanes' | 'pedestrians' | 'dividers' | 'report'
  >('ninepoint');

  // Video Playback Synchronized Tracking State
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const [mediaAspect, setMediaAspect] = useState<number | null>(null);
  const [renderedBox, setRenderedBox] = useState<{ top: number; left: number; width: number; height: number }>({
    top: 0,
    left: 0,
    width: 100,
    height: 100,
  });

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [syncWithVideoTime, setSyncWithVideoTime] = useState<boolean>(true);
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const [selectedVehId, setSelectedVehId] = useState<string | null>(null);
  const [selectedPlateId, setSelectedPlateId] = useState<string | null>(null);
  const [selectedSmokeId, setSelectedSmokeId] = useState<string | null>(null);
  const [selectedPedId, setSelectedPedId] = useState<string | null>(null);
  const [selectedDividerId, setSelectedDividerId] = useState<string | null>(null);
  const [selectedLaneEventId, setSelectedLaneEventId] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<'ALL' | 'DEFECTS' | 'VEHICLES' | 'PLATES' | 'SMOKE' | 'LANES' | 'PEDESTRIANS' | 'DIVIDERS'>('ALL');

  // Annotation Layer Toggles
  const [showVehicles, setShowVehicles] = useState(false);
  const [showDefects, setShowDefects] = useState(false);
  const [showPlates, setShowPlates] = useState(false);
  const [showSmoke, setShowSmoke] = useState(false);
  const [showBuildings, setShowBuildings] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const [showLanes, setShowLanes] = useState(true);
  const [showVulnerablePedestrians, setShowVulnerablePedestrians] = useState(true);
  const [showDividers, setShowDividers] = useState(true);
  const [isScanningFleet, setIsScanningFleet] = useState(false);

  // Geolocation Calibration State
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [calibLat, setCalibLat] = useState<number>(17.7342);
  const [calibLng, setCalibLng] = useState<number>(83.3248);
  const [calibAddress, setCalibAddress] = useState<string>('NH-16 Tagarapuvalasa Corridor');
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  // Compute exact rendered video rectangle inside object-contain to perfectly map bounding boxes
  useEffect(() => {
    const updateRenderedBox = () => {
      if (!mediaContainerRef.current) return;
      const containerW = mediaContainerRef.current.clientWidth;
      const containerH = mediaContainerRef.current.clientHeight;
      if (containerW === 0 || containerH === 0) return;

      if (!mediaAspect || mediaAspect <= 0) {
        setRenderedBox({ top: 0, left: 0, width: 100, height: 100 });
        return;
      }

      const containerAspect = containerW / containerH;
      let w = containerW;
      let h = containerH;
      let left = 0;
      let top = 0;

      if (mediaAspect > containerAspect) {
        // Wider than container: letterboxed top & bottom
        w = containerW;
        h = containerW / mediaAspect;
        top = (containerH - h) / 2;
        left = 0;
      } else {
        // Taller than container: pillarboxed left & right (e.g. 9:16 vertical shorts video)
        h = containerH;
        w = containerH * mediaAspect;
        left = (containerW - w) / 2;
        top = 0;
      }

      setRenderedBox({
        top: (top / containerH) * 100,
        left: (left / containerW) * 100,
        width: (w / containerW) * 100,
        height: (h / containerH) * 100,
      });
    };

    updateRenderedBox();
    window.addEventListener('resize', updateRenderedBox);
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mediaContainerRef.current) {
      observer = new ResizeObserver(updateRenderedBox);
      observer.observe(mediaContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateRenderedBox);
      if (observer) observer.disconnect();
    };
  }, [mediaAspect]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/media/${mediaId}/analysis`);
      if (!res.ok) throw new Error('Analysis record not found');
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Non-JSON analysis payload received');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Error loading analysis:', err);
      setError(err.message || 'Failed to load analysis details.');
    } finally {
      setLoading(false);
    }
  };

  const handleReScanFleet = async () => {
    try {
      setIsScanningFleet(true);
      const res = await fetch(`/api/media/${mediaId}/analyze`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to trigger deep fleet scan');

      const pollStartTime = Date.now();
      const pollInterval = setInterval(async () => {
        try {
          const checkRes = await fetch(`/api/media/${mediaId}/analysis`);
          if (checkRes.ok) {
            const updatedJson = await checkRes.json();
            if (updatedJson.media.analysis_status === 'COMPLETED' && Date.now() - pollStartTime > 3000) {
              setData(updatedJson);
              setIsScanningFleet(false);
              clearInterval(pollInterval);
            }
          }
        } catch (e) {
          // ignore interim poll error
        }
      }, 1500);

      setTimeout(() => {
        clearInterval(pollInterval);
        setIsScanningFleet(false);
        fetchAnalysis();
      }, 30000);
    } catch (err: any) {
      console.error('Re-scan error:', err);
      setIsScanningFleet(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [mediaId]);

  const handleSeekToTime = (
    timestampSec: number,
    options?: {
      defectId?: string;
      vehId?: string;
      plateId?: string;
      smokeId?: string;
      pedId?: string;
      dividerId?: string;
      laneEventId?: string;
    }
  ) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, timestampSec);
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    if (options?.defectId) setSelectedDefectId(options.defectId);
    if (options?.vehId) setSelectedVehId(options.vehId);
    if (options?.plateId) setSelectedPlateId(options.plateId);
    if (options?.smokeId) setSelectedSmokeId(options.smokeId);
    if (options?.pedId) setSelectedPedId(options.pedId);
    if (options?.dividerId) setSelectedDividerId(options.dividerId);
    if (options?.laneEventId) setSelectedLaneEventId(options.laneEventId);

    const playerEl = document.getElementById('media-player-container');
    if (playerEl) {
      playerEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleTogglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="text-xs font-mono text-slate-400">Loading AI Urban Intelligence Telemetry...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-rose-500 mb-2" />
        <h2 className="text-sm font-bold text-white uppercase">Unable to Load Media Telemetry</h2>
        <p className="mt-1 text-xs font-mono text-slate-400">{error || 'Record does not exist in persistent database.'}</p>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Catalog
        </button>
      </div>
    );
  }

  const {
    media,
    road_condition,
    road_defects,
    vehicles,
    license_plates,
    people_analytics,
    traffic_metrics,
    smoke_events,
    buildings,
    incidents,
    lane_analysis,
    vulnerable_pedestrians = [],
    road_dividers = [],
    report,
  } = data;

  const ninePointAuditResult = data.nine_point_audit || buildNinePointAuditFromData({
    roadDefects: road_defects,
    roadDividers: road_dividers,
    laneAnalysis: lane_analysis,
    filename: media.original_filename,
  });

  const isCompleted = media.analysis_status === 'COMPLETED';
  const healthBadge = getHealthBadgeColor(road_condition?.rating);

  return (
    <div id="media-detail-container" className="mx-auto max-w-7xl px-4 py-5 sm:px-6 space-y-4">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white truncate max-w-md font-mono">
                {media.original_filename}
              </h1>
              <span className="rounded bg-slate-900 border border-slate-700 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                {media.id}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              CAPTURED: {formatDate(media.upload_time)} • ROUTE: <strong className="text-emerald-400">{media.bus_route_id || 'N/A'}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isCompleted && (
            <a
              href={`/api/reports/${media.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-950 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>PDF Report</span>
            </a>
          )}
          <button
            onClick={fetchAnalysis}
            className="flex items-center gap-1.5 rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RotateCw className="h-3 w-3 text-slate-400" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Main Visual Player & Annotation Canvas Container */}
      <div id="media-player-container" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visual Media & AI Overlays Stage */}
        <div className="lg:col-span-2 space-y-2.5">
          <div
            ref={mediaContainerRef}
            className="relative w-full h-[380px] sm:h-[480px] md:h-[540px] max-h-[75vh] overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-xl flex items-center justify-center"
          >
            {/* Visual Canvas / Frame */}
            {media.media_type === 'VIDEO' ? (
              <video
                ref={videoRef}
                src={media.storage_path}
                controls
                playsInline
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => {
                  setDuration(e.currentTarget.duration || media.duration_sec || 0);
                  if (e.currentTarget.videoWidth && e.currentTarget.videoHeight) {
                    setMediaAspect(e.currentTarget.videoWidth / e.currentTarget.videoHeight);
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="h-full w-full object-contain bg-black"
              />
            ) : (
              <img
                src={media.storage_path || media.thumbnail_path}
                alt={media.original_filename}
                referrerPolicy="no-referrer"
                onLoad={(e) => {
                  if (e.currentTarget.naturalWidth && e.currentTarget.naturalHeight) {
                    setMediaAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight);
                  }
                }}
                className="h-full w-full object-contain bg-black"
              />
            )}

            {/* AI Computer Vision Bounding Box Overlay Layer (Strictly mapped to visible video frame bounds) */}
            <div
              className="absolute pointer-events-none transition-all duration-75"
              style={{
                top: `${renderedBox.top}%`,
                left: `${renderedBox.left}%`,
                width: `${renderedBox.width}%`,
                height: `${renderedBox.height}%`,
              }}
            >
              {/* Road Defect Overlays with Dynamic Time-Synchronized Perspective Tracking */}
              {showDefects &&
                road_defects.map((defect) => {
                  const isVideo = media.media_type === 'VIDEO';
                  const startTime = defect.timestamp_sec || 0;
                  const dur = defect.duration_sec || 2.5;
                  const endTime = startTime + dur;

                  // If synchronized mode is ON for video, filter and interpolate position
                  if (isVideo && syncWithVideoTime) {
                    // Defect is visible only when video playhead is near its occurrence
                    const isVisible = currentTime >= startTime - 0.4 && currentTime <= endTime + 0.4;
                    if (!isVisible) return null;
                  }

                  // Perspective Interpolation: As vehicle travels forward, defect approaches from mid-ground to near-ground
                  const t = isVideo && syncWithVideoTime
                    ? Math.max(0, Math.min(1, (currentTime - startTime) / dur))
                    : 0;

                  const [y0, x0, y1, x1] = defect.bbox && defect.bbox.length === 4 ? defect.bbox : [58, 30, 76, 52];
                  const [ey0, ex0, ey1, ex1] = defect.bbox_end && defect.bbox_end.length === 4
                    ? defect.bbox_end
                    : [Math.min(95, y0 + 16), Math.max(5, x0 - 6), Math.min(99, y1 + 18), Math.min(96, x1 + 6)];

                  const dynamicTop = y0 + (ey0 - y0) * t;
                  const dynamicLeft = x0 + (ex0 - x0) * t;
                  const dynamicHeight = (y1 - y0) + ((ey1 - ey0) - (y1 - y0)) * t;
                  const dynamicWidth = (x1 - x0) + ((ex1 - ex0) - (x1 - x0)) * t;

                  const top = Math.max(0, Math.min(95, dynamicTop));
                  const left = Math.max(0, Math.min(95, dynamicLeft));
                  const width = Math.max(4, Math.min(100 - left, dynamicWidth));
                  const height = Math.max(3, Math.min(100 - top, dynamicHeight));

                  const isSelected = selectedDefectId === defect.id;

                  return (
                    <div
                      key={defect.id}
                      className={`absolute border-2 border-dashed rounded pointer-events-auto font-mono transition-all duration-75 ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-500/25 ring-2 ring-yellow-400 ring-offset-1 ring-offset-slate-950 scale-105'
                          : 'border-rose-500 bg-rose-500/15 hover:bg-rose-500/30'
                      }`}
                      style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                      }}
                      title={`${defect.type} (${defect.severity}) @ ${defect.timestamp_sec.toFixed(1)}s - Confidence ${(defect.confidence * 100).toFixed(0)}%`}
                    >
                      <div className="absolute -top-5 left-0 flex items-center gap-1 rounded bg-rose-600 px-1.5 py-0.5 text-[8px] font-bold text-white whitespace-nowrap shadow-md">
                        <span>⚠️ {defect.type}</span>
                        <span className="opacity-90 font-mono">@{(defect.timestamp_sec).toFixed(1)}s</span>
                      </div>
                      {/* Approaching Proximity Indicator for Active Frame */}
                      {isVideo && syncWithVideoTime && (
                        <div className="absolute -bottom-4 right-0 rounded bg-black/80 px-1 py-0.2 text-[7px] font-mono text-emerald-300 border border-slate-700">
                          {t < 0.3 ? 'APPROACHING' : t < 0.7 ? 'IN SIGHT' : 'PASSING'}
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Vehicle Bounding Boxes & Trajectory Tracks */}
              {showVehicles &&
                vehicles.map((veh, idx) => {
                  const isVideo = media.media_type === 'VIDEO';
                  const startSec = typeof veh.timestamp_sec === 'number' ? veh.timestamp_sec : idx * 2.0;
                  const dur = veh.duration_sec || 6.0;
                  const endSec = startSec + dur;

                  if (isVideo && syncWithVideoTime) {
                    const isVisible = currentTime >= startSec - 0.3 && currentTime <= endSec + 0.3;
                    if (!isVisible) return null;
                  }

                  const t = isVideo && syncWithVideoTime
                    ? Math.max(0, Math.min(1, (currentTime - startSec) / dur))
                    : 0;

                  const [y0, x0, y1, x1] = veh.bbox && veh.bbox.length === 4 ? veh.bbox : [35, 20, 70, 45];
                  const [ey0, ex0, ey1, ex1] = veh.bbox_end && veh.bbox_end.length === 4
                    ? veh.bbox_end
                    : [Math.min(92, y0 + 18), Math.max(2, x0 - 6), Math.min(98, y1 + 20), Math.min(96, x1 + 10)];

                  const dynamicTop = y0 + (ey0 - y0) * t;
                  const dynamicLeft = x0 + (ex0 - x0) * t;
                  const dynamicHeight = (y1 - y0) + ((ey1 - ey0) - (y1 - y0)) * t;
                  const dynamicWidth = (x1 - x0) + ((ex1 - ex0) - (x1 - x0)) * t;

                  const top = Math.max(0, Math.min(95, dynamicTop));
                  const left = Math.max(0, Math.min(95, dynamicLeft));
                  const width = Math.max(4, Math.min(100 - left, dynamicWidth));
                  const height = Math.max(4, Math.min(100 - top, dynamicHeight));

                  const isSelected = selectedVehId === veh.id;
                  const vehEmoji = veh.vehicle_type === 'BUS' ? '🚌' : veh.vehicle_type === 'TRUCK' ? '🚚' : veh.vehicle_type === 'AUTO_RICKSHAW' ? '🛺' : veh.vehicle_type === 'MOTORCYCLE' ? '🏍️' : '🚗';

                  return (
                    <div
                      key={veh.id}
                      className={`absolute border-2 rounded pointer-events-auto font-mono transition-all duration-75 ${
                        isSelected
                          ? 'border-emerald-300 bg-emerald-400/25 ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-950 scale-102 z-20'
                          : 'border-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 z-10'
                      }`}
                      style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                      }}
                      title={`${veh.vehicle_type} (${veh.track_id}) - ${veh.speed_kmh_est || 35} km/h @ ${startSec.toFixed(1)}s`}
                    >
                      <div className="absolute -top-5 left-0 flex items-center gap-1 rounded bg-emerald-700 px-1.5 py-0.5 text-[8px] font-bold text-white whitespace-nowrap shadow-md">
                        <span>{vehEmoji} {veh.track_id}</span>
                        <span className="opacity-90">• {veh.vehicle_type}</span>
                        {veh.speed_kmh_est && <span className="opacity-80 font-mono">({veh.speed_kmh_est}km/h)</span>}
                      </div>
                    </div>
                  );
                })}

              {/* License Plate Overlays with High-Contrast ANPR Box */}
              {showPlates &&
                license_plates.map((lp, idx) => {
                  const isVideo = media.media_type === 'VIDEO';
                  const startSec = typeof lp.timestamp_sec === 'number' ? lp.timestamp_sec : idx * 2.0;
                  const dur = lp.duration_sec || 6.0;
                  const endSec = startSec + dur;

                  if (isVideo && syncWithVideoTime) {
                    const isVisible = currentTime >= startSec - 0.3 && currentTime <= endSec + 0.3;
                    if (!isVisible) return null;
                  }

                  const t = isVideo && syncWithVideoTime
                    ? Math.max(0, Math.min(1, (currentTime - startSec) / dur))
                    : 0;

                  const [y0, x0, y1, x1] = lp.bbox && lp.bbox.length === 4 ? lp.bbox : [58, 24, 66, 38];
                  const [ey0, ex0, ey1, ex1] = lp.bbox_end && lp.bbox_end.length === 4
                    ? lp.bbox_end
                    : [Math.min(96, y0 + 18), Math.max(2, x0 - 6), Math.min(99, y1 + 18), Math.min(96, x1 + 10)];

                  const dynamicTop = y0 + (ey0 - y0) * t;
                  const dynamicLeft = x0 + (ex0 - x0) * t;
                  const dynamicHeight = (y1 - y0) + ((ey1 - ey0) - (y1 - y0)) * t;
                  const dynamicWidth = (x1 - x0) + ((ex1 - ex0) - (x1 - x0)) * t;

                  const top = Math.max(0, Math.min(96, dynamicTop));
                  const left = Math.max(0, Math.min(96, dynamicLeft));
                  const width = Math.max(4, Math.min(100 - left, dynamicWidth));
                  const height = Math.max(3, Math.min(100 - top, dynamicHeight));

                  const isSelected = selectedPlateId === lp.id;
                  const displayPlate = userRole === 'VIEWER' ? lp.plate_number.replace(/\d{4}$/, '****') : lp.plate_number;

                  return (
                    <div
                      key={lp.id}
                      className={`absolute border-2 rounded pointer-events-auto font-mono transition-all duration-75 ${
                        isSelected
                          ? 'border-cyan-300 bg-blue-500/35 ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-950 scale-105 z-30'
                          : 'border-blue-400 bg-blue-500/20 hover:bg-blue-500/35 z-20'
                      }`}
                      style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                      }}
                    >
                      <div className="absolute -bottom-5 left-0 flex items-center gap-1 rounded bg-blue-700 px-1.5 py-0.5 text-[8px] font-mono font-bold text-white whitespace-nowrap shadow-md">
                        <span>🪪 {displayPlate}</span>
                        <span className="opacity-85 text-[7px]">({(lp.ocr_confidence * 100).toFixed(0)}%)</span>
                      </div>
                    </div>
                  );
                })}

              {/* Visible Smoke Plume Overlay with Dynamic Pulsing Emission Tracking */}
              {showSmoke &&
                smoke_events.map((smk, idx) => {
                  const isVideo = media.media_type === 'VIDEO';
                  const startSec = typeof smk.timestamp_sec === 'number' ? smk.timestamp_sec : idx * 2.5;
                  const dur = smk.duration_sec || 5.0;
                  const endSec = startSec + dur;

                  if (isVideo && syncWithVideoTime) {
                    const isVisible = currentTime >= startSec - 0.4 && currentTime <= endSec + 0.4;
                    if (!isVisible) return null;
                  }

                  const t = isVideo && syncWithVideoTime
                    ? Math.max(0, Math.min(1, (currentTime - startSec) / dur))
                    : 0;

                  const [y0, x0, y1, x1] = smk.bbox && smk.bbox.length === 4 ? smk.bbox : [48, 14, 72, 34];
                  const [ey0, ex0, ey1, ex1] = smk.bbox_end && smk.bbox_end.length === 4
                    ? smk.bbox_end
                    : [Math.min(95, y0 + 16), Math.max(0, x0 - 12), Math.min(100, y1 + 18), Math.min(100, x1 + 18)];

                  const dynamicTop = y0 + (ey0 - y0) * t;
                  const dynamicLeft = x0 + (ex0 - x0) * t;
                  const dynamicHeight = (y1 - y0) + ((ey1 - ey0) - (y1 - y0)) * t;
                  const dynamicWidth = (x1 - x0) + ((ex1 - ex0) - (x1 - x0)) * t;

                  const top = Math.max(0, Math.min(95, dynamicTop));
                  const left = Math.max(0, Math.min(95, dynamicLeft));
                  const width = Math.max(6, Math.min(100 - left, dynamicWidth));
                  const height = Math.max(6, Math.min(100 - top, dynamicHeight));

                  const isSelected = selectedSmokeId === smk.id;

                  return (
                    <div
                      key={smk.id}
                      className={`absolute border-2 border-dashed border-amber-400 bg-amber-500/25 rounded-xl animate-pulse pointer-events-auto font-mono transition-all duration-75 ${
                        isSelected ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 scale-105 z-30' : 'z-20'
                      }`}
                      style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                      }}
                    >
                      <div className="absolute -top-5 left-0 flex items-center gap-1 rounded bg-amber-600 px-1.5 py-0.5 text-[8px] font-bold text-white whitespace-nowrap shadow-md">
                        <span>💨 SMOKE ({smk.severity})</span>
                        <span className="opacity-90 font-mono">@{(smk.timestamp_sec).toFixed(1)}s</span>
                      </div>
                    </div>
                  );
                })}

              {/* Highway Lane Detection, Lane-Center & Lateral Departure Overlay */}
              {showLanes && lane_analysis && (
                <div className="absolute inset-0 pointer-events-none font-mono">
                  {(() => {
                    const activeFrame =
                      lane_analysis.frames?.find((f) => Math.abs(f.timestamp_sec - currentTime) < 0.8) ||
                      lane_analysis.frames?.[0];

                    const activeDeparture = lane_analysis.departure_events?.find(
                      (d) => Math.abs(d.timestamp_sec - currentTime) < 1.2
                    );

                    const offsetMeters = activeFrame?.vehicle_lateral_offset_meters ?? 0;
                    const offsetNormalized = Math.max(-0.4, Math.min(0.4, offsetMeters / 1.5));
                    const isSevereDeparture = activeDeparture && (activeDeparture.severity === 'CRITICAL' || activeDeparture.severity === 'HIGH');

                    // Perspective lane coordinates mapped to 0-100 scale
                    const leftX0 = Math.max(10, Math.min(45, 28 - offsetNormalized * 15));
                    const leftX1 = Math.max(30, Math.min(48, 44 - offsetNormalized * 8));
                    const rightX1 = Math.max(52, Math.min(70, 56 - offsetNormalized * 8));
                    const rightX0 = Math.max(55, Math.min(90, 72 - offsetNormalized * 15));
                    const horizonY = 54;
                    const bottomY = 96;

                    const centerX0 = (leftX0 + rightX0) / 2;
                    const centerX1 = (leftX1 + rightX1) / 2;
                    const vehicleMarkerX = 50 + offsetNormalized * 18;

                    return (
                      <div className="relative w-full h-full">
                        {/* SVG Lane Geometry Projection */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="laneCorridorGrad" x1="0" y1="1" x2="0" y2="0">
                              <stop offset="0%" stopColor={isSevereDeparture ? '#ef4444' : '#10b981'} stopOpacity="0.22" />
                              <stop offset="100%" stopColor={isSevereDeparture ? '#ef4444' : '#10b981'} stopOpacity="0.04" />
                            </linearGradient>
                          </defs>

                          {/* Lane Travel Corridor Polygon */}
                          <polygon
                            points={`${leftX0},${bottomY} ${leftX1},${horizonY} ${rightX1},${horizonY} ${rightX0},${bottomY}`}
                            fill="url(#laneCorridorGrad)"
                          />

                          {/* Left Lane Boundary Line */}
                          <line
                            x1={leftX0}
                            y1={bottomY}
                            x2={leftX1}
                            y2={horizonY}
                            stroke={lane_analysis.degraded_sections_count > 0 ? '#f59e0b' : '#10b981'}
                            strokeWidth="1.2"
                            strokeDasharray={activeFrame?.left_boundary?.condition !== 'CLEAR_VISIBLE' ? '3,2' : undefined}
                          />

                          {/* Right Lane Boundary Line */}
                          <line
                            x1={rightX0}
                            y1={bottomY}
                            x2={rightX1}
                            y2={horizonY}
                            stroke={lane_analysis.degraded_sections_count > 0 ? '#f59e0b' : '#10b981'}
                            strokeWidth="1.2"
                            strokeDasharray={activeFrame?.right_boundary?.condition !== 'CLEAR_VISIBLE' ? '3,2' : undefined}
                          />

                          {/* Estimated Lane Center Line */}
                          <line
                            x1={centerX0}
                            y1={bottomY}
                            x2={centerX1}
                            y2={horizonY}
                            stroke="#06b6d4"
                            strokeWidth="0.8"
                            strokeDasharray="2,2"
                          />

                          {/* Vehicle Center / Camera Position Needle */}
                          <line
                            x1={vehicleMarkerX}
                            y1={bottomY - 4}
                            x2={vehicleMarkerX}
                            y2={bottomY + 2}
                            stroke={isSevereDeparture ? '#ef4444' : '#38bdf8'}
                            strokeWidth="1.6"
                          />
                        </svg>

                        {/* Active Lane Departure Warning Banner */}
                        {activeDeparture && (
                          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full bg-rose-600/90 border border-rose-300 px-3 py-0.5 text-[10px] font-bold text-white shadow-xl animate-pulse">
                            <AlertTriangle className="h-3.5 w-3.5 text-white" />
                            <span>LANE DEPARTURE DETECTED: {activeDeparture.direction} ({activeDeparture.offset_meters.toFixed(2)}m)</span>
                          </div>
                        )}

                        {/* Vehicle Position HUD relative to Lane Center */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/85 border border-slate-700 px-2.5 py-1 text-[9px] text-slate-200 flex items-center gap-2 shadow-lg backdrop-blur-sm">
                          <span className="text-teal-400 font-bold flex items-center gap-1">
                            <Compass className="h-3 w-3" />
                            LANE HUD
                          </span>
                          <span>
                            OFFSET: <strong className={Math.abs(offsetMeters) > 0.35 ? 'text-rose-400' : 'text-emerald-400'}>{offsetMeters > 0 ? '+' : ''}{offsetMeters.toFixed(2)}m ({activeFrame?.departure_status || (Math.abs(offsetMeters) < 0.1 ? 'CENTERED' : offsetMeters > 0 ? 'DRIFTING_RIGHT' : 'DRIFTING_LEFT')})</strong>
                          </span>
                          <span>•</span>
                          <span>QUALITY: <strong className="text-teal-300">{lane_analysis.marking_quality_score}/100</strong></span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Vulnerable Pedestrian & School Child Overlays */}
              {showVulnerablePedestrians &&
                vulnerable_pedestrians.map((ped) => {
                  const isVideo = media.media_type === 'VIDEO';
                  const startTime = ped.timestamp_sec || 0;
                  const dur = 3.0;
                  const endTime = startTime + dur;

                  if (isVideo && syncWithVideoTime) {
                    const isVisible = currentTime >= startTime - 0.4 && currentTime <= endTime + 0.4;
                    if (!isVisible) return null;
                  }

                  const t = isVideo && syncWithVideoTime
                    ? Math.max(0, Math.min(1, (currentTime - startTime) / dur))
                    : 0;

                  const [y0, x0, y1, x1] = ped.bbox && ped.bbox.length === 4 ? ped.bbox : [50, 70, 78, 85];
                  const [ey0, ex0, ey1, ex1] = ped.bbox_end && ped.bbox_end.length === 4
                    ? ped.bbox_end
                    : [Math.min(95, y0 + 12), Math.max(10, x0 - 4), Math.min(99, y1 + 14), Math.min(95, x1 + 4)];

                  const dynamicTop = y0 + (ey0 - y0) * t;
                  const dynamicLeft = x0 + (ex0 - x0) * t;
                  const dynamicHeight = (y1 - y0) + ((ey1 - ey0) - (y1 - y0)) * t;
                  const dynamicWidth = (x1 - x0) + ((ex1 - ex0) - (x1 - x0)) * t;

                  const top = Math.max(0, Math.min(95, dynamicTop));
                  const left = Math.max(0, Math.min(95, dynamicLeft));
                  const width = Math.max(5, Math.min(100 - left, dynamicWidth));
                  const height = Math.max(5, Math.min(100 - top, dynamicHeight));

                  const isSelected = selectedPedId === ped.id;
                  const isSchool = ped.pedestrian_type === 'SCHOOL_CHILD' || ped.has_school_bag_indicator;

                  return (
                    <div
                      key={ped.id}
                      className={`absolute border-2 rounded pointer-events-auto font-mono transition-all duration-75 ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/30 ring-2 ring-amber-300 ring-offset-1 ring-offset-slate-950 scale-105 z-30'
                          : 'border-amber-400 bg-amber-500/15 hover:bg-amber-500/25 z-20'
                      }`}
                      style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                      }}
                      title={`${ped.pedestrian_type} (${ped.severity}) @ ${ped.timestamp_sec.toFixed(1)}s`}
                    >
                      <div className="absolute -top-5 left-0 flex items-center gap-1 rounded bg-amber-600 px-1.5 py-0.5 text-[8px] font-bold text-white whitespace-nowrap shadow-md">
                        <span>{isSchool ? '🎒 SCHOOL CHILD' : '🚸 VULNERABLE PED'}</span>
                        <span className="opacity-90 font-mono">@{(ped.timestamp_sec).toFixed(1)}s</span>
                      </div>
                      <div className="absolute -bottom-4 left-0 rounded bg-black/80 px-1 py-0.2 text-[7px] font-mono text-amber-300 border border-slate-700 whitespace-nowrap">
                        Curb: {ped.distance_to_curb_m ? `${ped.distance_to_curb_m.toFixed(1)}m` : 'Road'} | Veh: {ped.distance_to_vehicle_m ? `${ped.distance_to_vehicle_m.toFixed(1)}m` : 'Near'}
                      </div>
                    </div>
                  );
                })}

              {/* Road Divider & Median Barrier Overlays */}
              {showDividers &&
                road_dividers.map((div) => {
                  const isVideo = media.media_type === 'VIDEO';
                  const startTime = div.timestamp_sec || 0;
                  const dur = 3.5;
                  const endTime = startTime + dur;

                  if (isVideo && syncWithVideoTime) {
                    const isVisible = currentTime >= startTime - 0.5 && currentTime <= endTime + 0.5;
                    if (!isVisible) return null;
                  }

                  const t = isVideo && syncWithVideoTime
                    ? Math.max(0, Math.min(1, (currentTime - startTime) / dur))
                    : 0;

                  const [y0, x0, y1, x1] = div.bbox && div.bbox.length === 4 ? div.bbox : [58, 2, 85, 24];
                  const [ey0, ex0, ey1, ex1] = div.bbox_end && div.bbox_end.length === 4
                    ? div.bbox_end
                    : [Math.min(95, y0 + 10), Math.max(0, x0 - 2), Math.min(99, y1 + 12), Math.min(90, x1 + 6)];

                  const dynamicTop = y0 + (ey0 - y0) * t;
                  const dynamicLeft = x0 + (ex0 - x0) * t;
                  const dynamicHeight = (y1 - y0) + ((ey1 - ey0) - (y1 - y0)) * t;
                  const dynamicWidth = (x1 - x0) + ((ex1 - ex0) - (x1 - x0)) * t;

                  const top = Math.max(0, Math.min(95, dynamicTop));
                  const left = Math.max(0, Math.min(95, dynamicLeft));
                  const width = Math.max(6, Math.min(100 - left, dynamicWidth));
                  const height = Math.max(4, Math.min(100 - top, dynamicHeight));

                  const isSelected = selectedDividerId === div.id;
                  const isDamaged =
                    div.condition === 'DAMAGED_BARRIER' ||
                    div.condition === 'BROKEN_SECTION' ||
                    div.condition === 'MISSING_DIVIDER_SECTION' ||
                    div.condition === 'DISPLACED_INTO_LANE';

                  return (
                    <div
                      key={div.id}
                      className={`absolute border-2 rounded pointer-events-auto font-mono transition-all duration-75 ${
                        isDamaged
                          ? 'border-dashed border-rose-500 bg-rose-500/20 animate-pulse z-25'
                          : 'border-indigo-400 bg-indigo-500/15 hover:bg-indigo-500/25 z-20'
                      } ${isSelected ? 'ring-2 ring-indigo-300 ring-offset-1 ring-offset-slate-950 scale-102' : ''}`}
                      style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                      }}
                      title={`${div.divider_type} (${div.condition}) @ ${div.timestamp_sec.toFixed(1)}s`}
                    >
                      <div
                        className={`absolute -top-5 left-0 flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-bold text-white whitespace-nowrap shadow-md ${
                          isDamaged ? 'bg-rose-600' : 'bg-indigo-600'
                        }`}
                      >
                        <span>{isDamaged ? '⚠️' : '🚧'} {div.condition.replace(/_/g, ' ')}</span>
                        <span className="opacity-90 font-mono">@{(div.timestamp_sec).toFixed(1)}s</span>
                      </div>
                      {div.gap_length_meters_est && (
                        <div className="absolute -bottom-4 left-0 rounded bg-black/80 px-1 py-0.2 text-[7px] font-mono text-rose-300 border border-slate-700 whitespace-nowrap">
                          GAP: {div.gap_length_meters_est.toFixed(1)}m
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Top Overlay Status Pill */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded bg-black/80 border border-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                Dynamic Spatial Telemetry
              </span>
              {media.media_type === 'VIDEO' && (
                <span className="rounded bg-black/80 border border-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300 backdrop-blur-md">
                  ⏱️ {currentTime.toFixed(1)}s / {duration ? `${duration.toFixed(1)}s` : `${media.duration_sec || 0}s`}
                </span>
              )}
            </div>
          </div>

          {/* Interactive Multi-Channel Timeline Scrubber with Potholes, Vehicles, Plates & Smoke Markers */}
          {media.media_type === 'VIDEO' && (duration > 0 || (media.duration_sec && media.duration_sec > 0)) && (
            <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-3 space-y-2.5 font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePlayPause}
                    className="flex h-6 w-6 items-center justify-center rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  >
                    {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
                  </button>
                  <span className="font-bold text-slate-200">
                    Video Detection Timeline Navigator
                  </span>
                </div>

                {/* Filter chips for markers */}
                <div className="flex items-center gap-1 text-[9px]">
                  <span className="text-slate-500 mr-1">Filter Pins:</span>
                  {(['ALL', 'DEFECTS', 'LANES', 'PEDESTRIANS', 'DIVIDERS', 'VEHICLES', 'PLATES', 'SMOKE'] as const).map((filterType) => (
                    <button
                      key={filterType}
                      onClick={() => setTimelineFilter(filterType)}
                      className={`rounded px-1.5 py-0.5 font-bold transition-colors ${
                        timelineFilter === filterType
                          ? 'bg-slate-700 text-white border border-slate-600'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {filterType === 'ALL' && 'All Events'}
                      {filterType === 'DEFECTS' && `⚠️ Potholes (${road_defects.length})`}
                      {filterType === 'LANES' && `🛣️ Lanes (${lane_analysis?.departure_events?.length || 0})`}
                      {filterType === 'PEDESTRIANS' && `🚸 Pedestrians (${vulnerable_pedestrians.length})`}
                      {filterType === 'DIVIDERS' && `🚧 Dividers (${road_dividers.length})`}
                      {filterType === 'VEHICLES' && `🚗 Vehicles (${vehicles.length})`}
                      {filterType === 'PLATES' && `🪪 Plates (${license_plates.length})`}
                      {filterType === 'SMOKE' && `💨 Smoke (${smoke_events.length})`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-slate-400">
                    {currentTime.toFixed(1)}s / {(duration || media.duration_sec || 0).toFixed(1)}s
                  </span>
                  <button
                    onClick={() => setSyncWithVideoTime(!syncWithVideoTime)}
                    className={`rounded px-2 py-0.5 font-bold transition-colors ${
                      syncWithVideoTime
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/50'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {syncWithVideoTime ? '⏱️ Time-Synced (Active)' : 'Show All (Static)'}
                  </button>
                </div>
              </div>

              {/* Timeline Track with Multi-Category Pins */}
              <div className="relative h-7 w-full rounded bg-slate-900 border border-slate-800 overflow-hidden flex items-center px-1">
                {/* Playhead Progress Fill */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-emerald-500/20 border-r-2 border-emerald-400 pointer-events-none"
                  style={{
                    width: `${Math.min(100, (currentTime / (duration || media.duration_sec || 1)) * 100)}%`,
                  }}
                />

                {/* Clickable Seek Track */}
                <input
                  type="range"
                  min="0"
                  max={duration || media.duration_sec || 10}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => {
                    const targetSec = parseFloat(e.target.value);
                    setCurrentTime(targetSec);
                    if (videoRef.current) {
                      videoRef.current.currentTime = targetSec;
                    }
                  }}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                />

                {/* Road Defect Pins */}
                {(timelineFilter === 'ALL' || timelineFilter === 'DEFECTS') &&
                  road_defects.map((defect) => {
                    const maxDur = duration || media.duration_sec || 30;
                    const posPct = Math.min(98, Math.max(2, (defect.timestamp_sec / maxDur) * 100));
                    const isNear = Math.abs(currentTime - defect.timestamp_sec) < 0.8;

                    return (
                      <button
                        key={defect.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeekToTime(defect.timestamp_sec, { defectId: defect.id });
                        }}
                        style={{ left: `${posPct}%` }}
                        className={`absolute z-20 -translate-x-1/2 flex items-center justify-center transition-all ${
                          isNear ? 'scale-125 ring-2 ring-white z-30' : 'hover:scale-110'
                        }`}
                        title={`Seek to ${defect.type} (${defect.severity}) at ${defect.timestamp_sec.toFixed(1)}s`}
                      >
                        <span
                          className={`rounded-full px-1 py-0.2 text-[8px] font-bold uppercase shadow flex items-center gap-0.5 ${
                            defect.severity === 'CRITICAL' || defect.severity === 'HIGH'
                              ? 'bg-rose-600 text-white'
                              : defect.severity === 'MEDIUM'
                              ? 'bg-amber-600 text-white'
                              : 'bg-yellow-500 text-black'
                          }`}
                        >
                          ⚠️ {defect.timestamp_sec.toFixed(0)}s
                        </span>
                      </button>
                    );
                  })}

                {/* Vehicle Pins */}
                {(timelineFilter === 'ALL' || timelineFilter === 'VEHICLES') &&
                  vehicles.map((veh, idx) => {
                    const maxDur = duration || media.duration_sec || 30;
                    const startSec = typeof veh.timestamp_sec === 'number' ? veh.timestamp_sec : idx * 2.0;
                    const posPct = Math.min(98, Math.max(2, (startSec / maxDur) * 100));
                    const isNear = Math.abs(currentTime - startSec) < 0.8;

                    return (
                      <button
                        key={veh.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeekToTime(startSec, { vehId: veh.id });
                        }}
                        style={{ left: `${posPct}%` }}
                        className={`absolute z-20 -translate-x-1/2 flex items-center justify-center transition-all ${
                          isNear ? 'scale-125 ring-2 ring-white z-30' : 'hover:scale-110'
                        }`}
                        title={`Seek to ${veh.vehicle_type} (${veh.track_id}) at ${startSec.toFixed(1)}s`}
                      >
                        <span className="rounded-full bg-emerald-600 px-1 py-0.2 text-[8px] font-bold text-white shadow">
                          🚗 {startSec.toFixed(0)}s
                        </span>
                      </button>
                    );
                  })}

                {/* License Plate Pins */}
                {(timelineFilter === 'ALL' || timelineFilter === 'PLATES') &&
                  license_plates.map((lp, idx) => {
                    const maxDur = duration || media.duration_sec || 30;
                    const startSec = typeof lp.timestamp_sec === 'number' ? lp.timestamp_sec : idx * 2.0;
                    const posPct = Math.min(98, Math.max(2, (startSec / maxDur) * 100));
                    const isNear = Math.abs(currentTime - startSec) < 0.8;

                    return (
                      <button
                        key={lp.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeekToTime(startSec, { plateId: lp.id });
                        }}
                        style={{ left: `${posPct}%` }}
                        className={`absolute z-20 -translate-x-1/2 flex items-center justify-center transition-all ${
                          isNear ? 'scale-125 ring-2 ring-white z-30' : 'hover:scale-110'
                        }`}
                        title={`Seek to ANPR ${lp.plate_number} at ${startSec.toFixed(1)}s`}
                      >
                        <span className="rounded-full bg-blue-600 px-1 py-0.2 text-[8px] font-bold text-white shadow">
                          🪪 {startSec.toFixed(0)}s
                        </span>
                      </button>
                    );
                  })}

                {/* Smoke Event Pins */}
                {(timelineFilter === 'ALL' || timelineFilter === 'SMOKE') &&
                  smoke_events.map((smk, idx) => {
                    const maxDur = duration || media.duration_sec || 30;
                    const startSec = typeof smk.timestamp_sec === 'number' ? smk.timestamp_sec : idx * 2.5;
                    const posPct = Math.min(98, Math.max(2, (startSec / maxDur) * 100));
                    const isNear = Math.abs(currentTime - startSec) < 0.8;

                    return (
                      <button
                        key={smk.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeekToTime(startSec, { smokeId: smk.id });
                        }}
                        style={{ left: `${posPct}%` }}
                        className={`absolute z-20 -translate-x-1/2 flex items-center justify-center transition-all ${
                          isNear ? 'scale-125 ring-2 ring-white z-30' : 'hover:scale-110'
                        }`}
                        title={`Seek to Smoke Plume (${smk.severity}) at ${startSec.toFixed(1)}s`}
                      >
                        <span className="rounded-full bg-amber-600 px-1 py-0.2 text-[8px] font-bold text-white shadow">
                          💨 {startSec.toFixed(0)}s
                        </span>
                      </button>
                    );
                  })}

                {/* Highway Lane Departure Pins */}
                {(timelineFilter === 'ALL' || timelineFilter === 'LANES') &&
                  lane_analysis?.departure_events?.map((evt) => {
                    const maxDur = duration || media.duration_sec || 30;
                    const posPct = Math.min(98, Math.max(2, (evt.timestamp_sec / maxDur) * 100));
                    const isNear = Math.abs(currentTime - evt.timestamp_sec) < 0.8;

                    return (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeekToTime(evt.timestamp_sec, { laneEventId: evt.id });
                        }}
                        style={{ left: `${posPct}%` }}
                        className={`absolute z-20 -translate-x-1/2 flex items-center justify-center transition-all ${
                          isNear ? 'scale-125 ring-2 ring-white z-30' : 'hover:scale-110'
                        }`}
                        title={`Seek to Lane Deviation (${evt.direction}, ${evt.offset_meters.toFixed(2)}m) at ${evt.timestamp_sec.toFixed(1)}s`}
                      >
                        <span className="rounded-full bg-teal-600 px-1 py-0.2 text-[8px] font-bold text-white shadow">
                          🛣️ {evt.timestamp_sec.toFixed(0)}s
                        </span>
                      </button>
                    );
                  })}

                {/* Vulnerable Pedestrian Pins */}
                {(timelineFilter === 'ALL' || timelineFilter === 'PEDESTRIANS') &&
                  vulnerable_pedestrians.map((ped) => {
                    const maxDur = duration || media.duration_sec || 30;
                    const posPct = Math.min(98, Math.max(2, (ped.timestamp_sec / maxDur) * 100));
                    const isNear = Math.abs(currentTime - ped.timestamp_sec) < 0.8;

                    return (
                      <button
                        key={ped.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeekToTime(ped.timestamp_sec, { pedId: ped.id });
                        }}
                        style={{ left: `${posPct}%` }}
                        className={`absolute z-20 -translate-x-1/2 flex items-center justify-center transition-all ${
                          isNear ? 'scale-125 ring-2 ring-white z-30' : 'hover:scale-110'
                        }`}
                        title={`Seek to ${ped.pedestrian_type} (${ped.severity}) at ${ped.timestamp_sec.toFixed(1)}s`}
                      >
                        <span className="rounded-full bg-amber-600 px-1 py-0.2 text-[8px] font-bold text-white shadow">
                          🚸 {ped.timestamp_sec.toFixed(0)}s
                        </span>
                      </button>
                    );
                  })}

                {/* Road Divider Pins */}
                {(timelineFilter === 'ALL' || timelineFilter === 'DIVIDERS') &&
                  road_dividers.map((div) => {
                    const maxDur = duration || media.duration_sec || 30;
                    const posPct = Math.min(98, Math.max(2, (div.timestamp_sec / maxDur) * 100));
                    const isNear = Math.abs(currentTime - div.timestamp_sec) < 0.8;

                    return (
                      <button
                        key={div.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeekToTime(div.timestamp_sec, { dividerId: div.id });
                        }}
                        style={{ left: `${posPct}%` }}
                        className={`absolute z-20 -translate-x-1/2 flex items-center justify-center transition-all ${
                          isNear ? 'scale-125 ring-2 ring-white z-30' : 'hover:scale-110'
                        }`}
                        title={`Seek to Divider (${div.condition}) at ${div.timestamp_sec.toFixed(1)}s`}
                      >
                        <span className="rounded-full bg-indigo-600 px-1 py-0.2 text-[8px] font-bold text-white shadow">
                          🚧 {div.timestamp_sec.toFixed(0)}s
                        </span>
                      </button>
                    );
                  })}
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
                <span>00:00.0s (Start)</span>
                <span className="text-slate-400">Click any marker pin to seek video directly to that detection frame</span>
                <span>{(duration || media.duration_sec || 0).toFixed(1)}s (End)</span>
              </div>
            </div>
          )}

          {/* Annotation Layer Filter Switches */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#0F172A] p-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] font-bold uppercase">
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              <span>Overlays:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              <button
                onClick={() => setShowLanes(!showLanes)}
                className={`flex items-center gap-1 rounded px-2 py-0.5 font-semibold transition-colors ${
                  showLanes ? 'bg-teal-950/80 text-teal-300 border border-teal-500/40' : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {showLanes ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Lanes ({lane_analysis ? 'Active' : '0'})
              </button>

              <button
                onClick={() => setShowVulnerablePedestrians(!showVulnerablePedestrians)}
                className={`flex items-center gap-1 rounded px-2 py-0.5 font-semibold transition-colors ${
                  showVulnerablePedestrians ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {showVulnerablePedestrians ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Pedestrians ({vulnerable_pedestrians.length})
              </button>

              <button
                onClick={() => setShowDividers(!showDividers)}
                className={`flex items-center gap-1 rounded px-2 py-0.5 font-semibold transition-colors ${
                  showDividers ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/40' : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {showDividers ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Dividers ({road_dividers.length})
              </button>

              <button
                onClick={() => setShowDefects(!showDefects)}
                className={`flex items-center gap-1 rounded px-2 py-0.5 font-semibold transition-colors ${
                  showDefects ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40' : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {showDefects ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Defects ({road_defects.length})
              </button>

              <button
                onClick={() => setShowVehicles(!showVehicles)}
                className={`flex items-center gap-1 rounded px-2 py-0.5 font-semibold transition-colors ${
                  showVehicles ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {showVehicles ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Vehicles ({vehicles.length})
              </button>

              <button
                onClick={() => setShowPlates(!showPlates)}
                className={`flex items-center gap-1 rounded px-2 py-0.5 font-semibold transition-colors ${
                  showPlates ? 'bg-blue-950/80 text-blue-300 border border-blue-500/40' : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {showPlates ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Plates ({license_plates.length})
              </button>

              <button
                onClick={() => setShowSmoke(!showSmoke)}
                className={`flex items-center gap-1 rounded px-2 py-0.5 font-semibold transition-colors ${
                  showSmoke ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {showSmoke ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Smoke ({smoke_events.length})
              </button>
            </div>
          </div>
        </div>

        {/* Location & Metadata Panel */}
        <div className="space-y-3">
          {/* Dual-Source Geolocation Card */}
          <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                Geospatial & GPS Telemetry
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCalibLat(media.scene_location?.latitude || media.upload_location?.latitude || 17.7342);
                  setCalibLng(media.scene_location?.longitude || media.upload_location?.longitude || 83.3248);
                  setCalibAddress(media.scene_location?.address_or_name || media.bus_route_id || 'NH-16 Tagarapuvalasa Corridor');
                  setIsEditingLocation(!isEditingLocation);
                }}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline"
              >
                {isEditingLocation ? 'Close' : 'Calibrate GPS'}
              </button>
            </div>

            {/* Calibration Form Drawer */}
            {isEditingLocation && (
              <div className="mb-3 rounded border border-cyan-500/40 bg-cyan-950/20 p-2.5 space-y-2 text-xs font-mono">
                <div className="font-bold text-cyan-300 text-[11px] flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  Calibrate Media Coordinates
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400">LATITUDE (°N)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={calibLat}
                      onChange={(e) => setCalibLat(parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">LONGITUDE (°E)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={calibLng}
                      onChange={(e) => setCalibLng(parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-slate-400">CORRIDOR / ADDRESS</label>
                  <input
                    type="text"
                    value={calibAddress}
                    onChange={(e) => setCalibAddress(e.target.value)}
                    placeholder="e.g. NH-16 Tagarapuvalasa Sector 4"
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingLocation(false)}
                    className="px-2.5 py-1 rounded bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingLocation}
                    onClick={async () => {
                      try {
                        setIsSavingLocation(true);
                        const res = await fetch(`/api/media/${mediaId}/location`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            latitude: calibLat,
                            longitude: calibLng,
                            address: calibAddress,
                          }),
                        });
                        if (!res.ok) throw new Error('Failed to update GPS location');
                        const updated = await res.json();
                        setData((prev) => (prev ? { ...prev, media: updated } : null));
                        setIsEditingLocation(false);
                      } catch (err: any) {
                        alert('Error updating GPS: ' + err.message);
                      } finally {
                        setIsSavingLocation(false);
                      }
                    }}
                    className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-[10px] font-bold text-white transition-colors"
                  >
                    {isSavingLocation ? 'Saving...' : 'Save Coordinates'}
                  </button>
                </div>
              </div>
            )}

            {/* 1. Upload Location */}
            <div className="rounded border border-slate-800 bg-slate-900 p-2.5 mb-2 font-mono">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-emerald-400">1. Ingest Sensor GPS</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 uppercase">
                  {media.upload_location?.latitude ? 'Live Telemetry' : 'Corridor Default'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div>
                  <span className="text-slate-500 text-[9px]">LAT</span>
                  <div className="font-bold text-slate-200">
                    {media.upload_location?.latitude !== null && media.upload_location?.latitude !== undefined
                      ? `${media.upload_location.latitude}° N`
                      : (media.scene_location?.latitude ? `${media.scene_location.latitude}° N` : '17.7342° N')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px]">LNG</span>
                  <div className="font-bold text-slate-200">
                    {media.upload_location?.longitude !== null && media.upload_location?.longitude !== undefined
                      ? `${media.upload_location.longitude}° E`
                      : (media.scene_location?.longitude ? `${media.scene_location.longitude}° E` : '83.3248° E')}
                  </div>
                </div>
              </div>
              <div className="mt-1 text-[9px] text-slate-500">
                ±{media.upload_location?.accuracy || 5}m • Transmitted by {media.uploaded_by || 'Transit Unit'}
              </div>
            </div>

            {/* 2. Scene Detection Location */}
            <div className="rounded border border-slate-800 bg-slate-900 p-2.5 font-mono">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-cyan-400">2. Scene Transit Corridor</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 uppercase">
                  GIS Mapped
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div>
                  <span className="text-slate-500 text-[9px]">LAT</span>
                  <div className="font-bold text-slate-200">
                    {media.scene_location?.latitude !== null && media.scene_location?.latitude !== undefined
                      ? `${media.scene_location.latitude}° N`
                      : '17.7342° N'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px]">LNG</span>
                  <div className="font-bold text-slate-200">
                    {media.scene_location?.longitude !== null && media.scene_location?.longitude !== undefined
                      ? `${media.scene_location.longitude}° E`
                      : '83.3248° E'}
                  </div>
                </div>
              </div>
              <div className="mt-1 text-[9px] text-slate-400 truncate">
                Sector: {media.scene_location?.address_or_name || media.bus_route_id || 'NH-16 Coastal Corridor'}
              </div>
            </div>
          </div>

          {/* Quick Road Health Index Card */}
          <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Road Health Index</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border ${healthBadge.bg} ${healthBadge.text} ${healthBadge.border}`}>
                {road_condition?.rating || 'MODERATE'}
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-3">
              <div className="text-3xl font-mono font-black text-white">
                {road_condition?.health_score || 0}
                <span className="text-xs font-normal text-slate-500">/100</span>
              </div>
              <div className="flex-1 text-[11px] text-slate-400">
                AI road index: {road_defects.length} detected hazards & surface distress factors.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex overflow-x-auto gap-1 border-b border-slate-800 pb-1 custom-scrollbar text-xs font-mono">
        {[
          {
            id: 'ninepoint',
            label: `9-Point Road Audit (${ninePointAuditResult.items_present_count}/9 Hazards)`,
            icon: ShieldCheck,
            highlight: true,
          },
          { id: 'overview', label: 'Executive Summary', icon: Sparkles },
          { id: 'road', label: `Road Hazards (${road_defects.length})`, icon: AlertOctagon },
          { id: 'lanes', label: `Highway Lanes (${lane_analysis ? 'Active' : '0'})`, icon: Compass },
          { id: 'pedestrians', label: `Vulnerable Pedestrians (${vulnerable_pedestrians.length})`, icon: UserCheck },
          { id: 'dividers', label: `Road Dividers (${road_dividers.length})`, icon: ShieldAlert },
          { id: 'vehicles', label: `Vehicles (${vehicles.length})`, icon: Car },
          { id: 'anpr', label: `ANPR (${license_plates.length})`, icon: ShieldCheck },
          { id: 'smoke', label: `Smoke (${smoke_events.length})`, icon: Flame },
          { id: 'buildings', label: `Buildings (${buildings.length})`, icon: Building2 },
          { id: 'incidents', label: `Incidents (${incidents.length})`, icon: AlertTriangle },
          { id: 'report', label: 'PDF Report', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold uppercase whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : (tab as any).highlight
                  ? 'text-emerald-400/90 hover:text-emerald-300 bg-emerald-950/20 border border-emerald-500/20 hover:bg-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panes */}

      {/* TAB: 9-POINT MANDATORY ROAD DEFECT & INFRASTRUCTURE AUDIT */}
      {activeTab === 'ninepoint' && (
        <div className="space-y-4">
          <NinePointRoadAuditCard
            auditResult={ninePointAuditResult}
            onDownloadPDF={() => window.open(`/api/reports/${media.id}/pdf`, '_blank')}
            mediaTitle={media.original_filename}
          />
        </div>
      )}

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Quick summary 9-point card */}
          <NinePointRoadAuditCard
            auditResult={ninePointAuditResult}
            onDownloadPDF={() => window.open(`/api/reports/${media.id}/pdf`, '_blank')}
            mediaTitle={media.original_filename}
          />

          <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-5">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              AI Executive Briefing
            </h3>
            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-mono">
              {report?.summary_text || 'Automated multi-modal perception report completed.'}
            </div>

            {/* Demographics Disclaimer Notice */}
            <div className="mt-4 rounded border border-blue-500/20 bg-slate-900 p-3 text-xs text-slate-300 font-mono">
              <div className="font-bold text-blue-400 flex items-center gap-1.5 mb-1 text-[11px] uppercase">
                <Users className="h-3.5 w-3.5" />
                Pedestrian Flow Estimation
              </div>
              <p className="text-[11px]">
                Estimated <strong>{people_analytics?.total_unique_people || 0} unique individuals</strong> in camera frame (~{people_analytics?.apparent_male_est || 0} male, ~{people_analytics?.apparent_female_est || 0} female).
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500 italic">
                * Note: Demographics are aggregate AI computational estimates for pedestrian safety planning and never individual biometric identification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ROAD DEFECTS */}
      {activeTab === 'road' && (
        <div className="space-y-4">
          <NinePointRoadAuditCard
            auditResult={ninePointAuditResult}
            onDownloadPDF={() => window.open(`/api/reports/${media.id}/pdf`, '_blank')}
            mediaTitle={media.original_filename}
          />
          <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-mono font-bold text-white uppercase">Road Defects & Hazards Telemetry</h3>
                <p className="text-[10px] text-slate-400 font-mono">Classified by computer vision hazard classifier</p>
              </div>
              <span className="rounded bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-400">
                {road_defects.length} HAZARDS
              </span>
            </div>

            {road_defects.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-slate-400">No defects detected in this footage.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-slate-800 bg-slate-900 text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Defect ID</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Severity</th>
                      <th className="p-2.5">Confidence</th>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-right">Video Frame Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {road_defects.map((defect) => {
                      const sevBadge = getSeverityBadgeColor(defect.severity);
                      const isNear = Math.abs(currentTime - defect.timestamp_sec) < 1.0;
                      const isSelected = selectedDefectId === defect.id;

                      return (
                        <tr
                          key={defect.id}
                          className={`transition-colors ${
                            isNear || isSelected
                              ? 'bg-rose-950/40 border-l-2 border-rose-500'
                              : 'hover:bg-slate-900/60'
                          }`}
                        >
                          <td className="p-2.5 font-bold text-emerald-400">
                            <div className="flex items-center gap-1.5">
                              {isNear && <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />}
                              <span>{defect.id}</span>
                            </div>
                          </td>
                          <td className="p-2.5 font-semibold text-white">{defect.type}</td>
                          <td className="p-2.5">
                            <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold border ${sevBadge.bg} ${sevBadge.text} ${sevBadge.border}`}>
                              {defect.severity}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-300">{(defect.confidence * 100).toFixed(1)}%</td>
                          <td className="p-2.5 text-slate-400">@{defect.timestamp_sec.toFixed(1)}s</td>
                          <td className="p-2.5 text-slate-300 max-w-xs truncate">{defect.description}</td>
                          <td className="p-2.5 text-right">
                            {media.media_type === 'VIDEO' ? (
                              <button
                                type="button"
                                onClick={() => handleSeekToTime(defect.timestamp_sec, { defectId: defect.id })}
                                className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-bold transition-colors ${
                                  isNear
                                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-900'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                }`}
                              >
                                <Play className="h-2.5 w-2.5 fill-current" />
                                <span>{isNear ? 'In View' : `Seek to ${(defect.timestamp_sec).toFixed(1)}s`}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedDefectId(defect.id)}
                                className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300"
                              >
                                <Eye className="h-2.5 w-2.5" />
                                <span>Focus</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: VEHICLES & TRAFFIC - FULL VISUAL FRAME GALLERY & TELEMETRY */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono">
            <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-3">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Total Unique Vehicles</span>
              <div className="text-xl font-black text-white mt-0.5">{vehicles.length}</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-3">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Traffic Flow Rate</span>
              <div className="text-xl font-black text-emerald-400 mt-0.5">
                {traffic_metrics?.flow_rate_per_min ? `${traffic_metrics.flow_rate_per_min} /min` : 'N/A'}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-3">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Congestion Index</span>
              <div className="text-xl font-black text-amber-400 mt-0.5">
                {traffic_metrics?.congestion_score || 0}/100 ({traffic_metrics?.congestion_level || 'LOW'})
              </div>
            </div>
          </div>

          <VehicleFrameGallery
            media={media}
            vehicles={vehicles}
            licensePlates={license_plates}
            smokeEvents={smoke_events}
            currentTime={currentTime}
            onSeekToTime={handleSeekToTime}
            onReScanFleet={handleReScanFleet}
            isScanningFleet={isScanningFleet}
          />
        </div>
      )}

      {/* TAB: ANPR LICENSE PLATES */}
      {activeTab === 'anpr' && (
        <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 font-mono">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase">Automated Number Plate Recognition (ANPR)</h3>
              <p className="text-[10px] text-slate-400">
                {userRole === 'VIEWER' ? 'Plate numbers partially masked for privacy under VIEWER role.' : 'Full audit access enabled.'}
              </p>
            </div>
            <span className="rounded bg-blue-950/80 border border-blue-500/40 px-2 py-0.5 text-[10px] font-bold text-blue-400">
              {license_plates.length} PLATES
            </span>
          </div>

          {license_plates.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No license plates identified in this media.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-slate-800 bg-slate-900 text-slate-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Track</th>
                    <th className="p-2.5">Plate Number</th>
                    <th className="p-2.5">OCR Confidence</th>
                    <th className="p-2.5">Jurisdiction</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Timestamp</th>
                    <th className="p-2.5 text-right">Video Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {license_plates.map((plate, idx) => {
                    const displayPlate = userRole === 'VIEWER'
                      ? plate.plate_number.replace(/\d{4}$/, '****')
                      : plate.plate_number;
                    const startSec = typeof plate.timestamp_sec === 'number' ? plate.timestamp_sec : idx * 2.0;
                    const isNear = Math.abs(currentTime - startSec) < 1.0;
                    const isSelected = selectedPlateId === plate.id;

                    return (
                      <tr
                        key={plate.id}
                        className={`transition-colors ${
                          isNear || isSelected
                            ? 'bg-blue-950/40 border-l-2 border-blue-400'
                            : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <td className="p-2.5 font-bold text-emerald-400">
                          <div className="flex items-center gap-1.5">
                            {isNear && <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />}
                            <span>{plate.track_id || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-2.5 font-bold text-white bg-slate-900/80 tracking-wider">{displayPlate}</td>
                        <td className="p-2.5 text-slate-300">{(plate.ocr_confidence * 100).toFixed(1)}%</td>
                        <td className="p-2.5 text-slate-400">{plate.state_or_jurisdiction || 'MUNICIPAL-STATE'}</td>
                        <td className="p-2.5">
                          <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                            plate.is_low_confidence ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          }`}>
                            {plate.is_low_confidence ? 'Low Conf' : 'Verified'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-400">@{startSec.toFixed(1)}s</td>
                        <td className="p-2.5 text-right">
                          {media.media_type === 'VIDEO' ? (
                            <button
                              type="button"
                              onClick={() => handleSeekToTime(startSec, { plateId: plate.id })}
                              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-bold transition-colors ${
                                isNear
                                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-900'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                              }`}
                            >
                              <Play className="h-2.5 w-2.5 fill-current" />
                              <span>{isNear ? 'In View' : `Seek to ${startSec.toFixed(1)}s`}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedPlateId(plate.id)}
                              className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300"
                            >
                              <Eye className="h-2.5 w-2.5" />
                              <span>Focus</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: VISIBLE SMOKE */}
      {activeTab === 'smoke' && (
        <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase mb-1">Visible Exhaust & Smoke Plume Analysis</h3>
          <p className="text-[10px] text-slate-400 mb-3">
            Optical environmental monitoring from transit footage.
          </p>

          {smoke_events.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No abnormal smoke events detected.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-slate-800 bg-slate-900 text-slate-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Event ID</th>
                    <th className="p-2.5">Track ID</th>
                    <th className="p-2.5">Severity</th>
                    <th className="p-2.5">Confidence</th>
                    <th className="p-2.5">Timestamp</th>
                    <th className="p-2.5">Notes</th>
                    <th className="p-2.5 text-right">Video Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {smoke_events.map((smk, idx) => {
                    const startSec = typeof smk.timestamp_sec === 'number' ? smk.timestamp_sec : idx * 2.5;
                    const dur = smk.duration_sec || 5.0;
                    const isNear = currentTime >= startSec - 0.5 && currentTime <= startSec + dur + 0.5;
                    const isSelected = selectedSmokeId === smk.id;

                    return (
                      <tr
                        key={smk.id}
                        className={`transition-colors ${
                          isNear || isSelected
                            ? 'bg-amber-950/40 border-l-2 border-amber-500'
                            : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <td className="p-2.5 font-bold text-amber-400">
                          <div className="flex items-center gap-1.5">
                            {isNear && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />}
                            <span>{smk.id}</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-white">{smk.track_id || 'N/A'}</td>
                        <td className="p-2.5">
                          <span className="rounded bg-amber-950 border border-amber-600 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                            {smk.severity}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-300">{(smk.confidence * 100).toFixed(1)}%</td>
                        <td className="p-2.5 text-slate-400">@{startSec.toFixed(1)}s ({dur.toFixed(1)}s)</td>
                        <td className="p-2.5 text-slate-300 max-w-xs truncate">{smk.notes}</td>
                        <td className="p-2.5 text-right">
                          {media.media_type === 'VIDEO' ? (
                            <button
                              type="button"
                              onClick={() => handleSeekToTime(startSec, { smokeId: smk.id })}
                              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-bold transition-colors ${
                                isNear
                                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-900'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                              }`}
                            >
                              <Play className="h-2.5 w-2.5 fill-current" />
                              <span>{isNear ? 'In View' : `Seek to ${startSec.toFixed(1)}s`}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedSmokeId(smk.id)}
                              className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300"
                            >
                              <Eye className="h-2.5 w-2.5" />
                              <span>Focus</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: BUILDINGS */}
      {activeTab === 'buildings' && (
        <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 font-mono">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase">Visible Building Tallies</h3>
              <p className="text-[10px] text-slate-400">
                Structures detected within the transit camera field of view.
              </p>
            </div>
            <span className="rounded bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              {buildings.length} STRUCTURES
            </span>
          </div>

          {buildings.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No building structures detected in this field of view.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {buildings.map((b) => (
                <div key={b.id} className="rounded border border-slate-800 bg-slate-900 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400">{b.building_type}</span>
                    <span className="text-[10px] text-slate-500">{b.track_id}</span>
                  </div>
                  <div className="mt-1.5 text-[10px] text-slate-400">
                    Confidence: <strong className="text-slate-200">{(b.confidence * 100).toFixed(0)}%</strong>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    Track: {typeof b.first_seen === 'number' ? `${b.first_seen.toFixed(1)}s` : b.first_seen} - {typeof b.last_seen === 'number' ? `${b.last_seen.toFixed(1)}s` : b.last_seen}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: INCIDENTS */}
      {activeTab === 'incidents' && (
        <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase mb-1">Transit Safety & Incident Detections</h3>
          <p className="text-[10px] text-slate-400 mb-3">
            Potential pedestrian hazards, close-proximity events, or traffic infractions.
          </p>

          {incidents.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No safety incidents flagged in footage.</div>
          ) : (
            <div className="space-y-2">
              {incidents.map((inc) => (
                <div key={inc.id} className="rounded border border-rose-500/30 bg-rose-950/20 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-400 flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {inc.type} ({inc.severity})
                    </span>
                    <span className="text-[10px] text-slate-400">@{inc.timestamp_sec.toFixed(1)}s</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-200">{inc.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TABS: LANES, PEDESTRIANS, DIVIDERS */}
      {(activeTab === 'lanes' || activeTab === 'pedestrians' || activeTab === 'dividers') && (
        <CVInspectionTabs
          activeTab={activeTab}
          laneAnalysis={lane_analysis}
          vulnerablePedestrians={vulnerable_pedestrians}
          roadDividers={road_dividers}
          currentTime={currentTime}
          onSeekToTime={handleSeekToTime}
        />
      )}

      {/* TAB: REPORT */}
      {activeTab === 'report' && (
        <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-5 space-y-4 font-mono">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase">Municipal Audit Report</h3>
              <p className="text-[10px] text-slate-400">Persisted in SQLite/PostgreSQL storage</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/api/reports/${media.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold px-3 py-1.5 text-xs transition-colors"
                title="Download standard municipal report"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                Standard PDF
              </a>
              <a
                href={`/api/reports/${media.id}/pdf?includeAI=true`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold px-3 py-1.5 text-xs shadow-sm transition-colors"
                title="Download official PDF report with AI Decision Support & Audit Appendix"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Download + AI Audit
              </a>
            </div>
          </div>

          <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-slate-300 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">AI-Assisted Decision Support & Audit Appendix (Part 8):</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                The report can optionally append grounded RAG evidence citations (MoRTH/IRC), human-in-the-loop verification status, append-only audit trail, Responsible AI disclosures, and SDG 11.2 mobility notes.
              </p>
            </div>
          </div>

          <div className="rounded border border-slate-800 bg-slate-900 p-4 text-xs text-slate-300 leading-relaxed space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <div className="text-xs font-bold text-white">SOLVOFIN MUNICIPAL AUDIT REPORT #{report?.id || 'REP-N/A'}</div>
              <div className="text-[10px] text-slate-500">Model: {report?.model_version || 'GEMINI-3.7-FLASH'}</div>
            </div>
            <div className="whitespace-pre-line text-[11px]">{report?.summary_text}</div>
          </div>
        </div>
      )}
    </div>
  );
};
