import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Upload,
  RefreshCw,
  Zap,
  Sliders,
  Compass,
  FileText,
  Radio,
  ExternalLink,
  ChevronRight,
  Car,
  Camera,
  Layers,
  Sparkles,
  Send,
  Eye,
  Crosshair,
  Volume2,
} from 'lucide-react';
import {
  TwoPhotoZigZagCalculation,
  TwoPhotoZigZagPreset,
  ZigZagCameraType,
  ZigZagVehicleType,
} from '../types';

interface TwoPhotoZigZagCalculatorProps {
  onNavigateToGovAlerts?: () => void;
}

export const TwoPhotoZigZagCalculator: React.FC<TwoPhotoZigZagCalculatorProps> = ({
  onNavigateToGovAlerts,
}) => {
  // Presets & Active selection
  const [presets, setPresets] = useState<TwoPhotoZigZagPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-zigzag-moto-aggressive');
  const [isLoadingPresets, setIsLoadingPresets] = useState<boolean>(true);

  // Photos State
  const [photo1Url, setPhoto1Url] = useState<string>('');
  const [photo2Url, setPhoto2Url] = useState<string>('');
  const [photo1Label, setPhoto1Label] = useState<string>('Frame T1: Initial Position');
  const [photo2Label, setPhoto2Label] = useState<string>('Frame T2: Shifted Position');
  const [photo1FileName, setPhoto1FileName] = useState<string | null>(null);
  const [photo2FileName, setPhoto2FileName] = useState<string | null>(null);

  // Custom Bounding Boxes / Centroids
  const [photo1Bbox, setPhoto1Bbox] = useState<{ x: number; y: number; width: number; height: number } | undefined>();
  const [photo2Bbox, setPhoto2Bbox] = useState<{ x: number; y: number; width: number; height: number } | undefined>();
  const [photo1Centroid, setPhoto1Centroid] = useState<{ cx: number; cy: number } | undefined>();
  const [photo2Centroid, setPhoto2Centroid] = useState<{ cx: number; cy: number } | undefined>();

  // Operational Context Parameters
  const [timeDeltaSec, setTimeDeltaSec] = useState<number>(1.4);
  const [vehicleType, setVehicleType] = useState<ZigZagVehicleType>('MOTORCYCLE');
  const [licensePlate, setLicensePlate] = useState<string>('AP 39 CG 4421');
  const [busNumber, setBusNumber] = useState<string>('AP 39 XX 1234');
  const [camera, setCamera] = useState<ZigZagCameraType>('FRONT');
  const [locationName, setLocationName] = useState<string>('NH-16 Madhurawada Express Corridor');

  // Calculation Results
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calculation, setCalculation] = useState<TwoPhotoZigZagCalculation | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Government Warning & Dispatch
  const [isWarningPortal, setIsWarningPortal] = useState<boolean>(false);
  const [dispatchUnit, setDispatchUnit] = useState<string>('Traffic Interceptor Patrol Unit #04');
  const [dispatchNotes, setDispatchNotes] = useState<string>(
    'Urgent intercept: Vehicle weaving erratic zig-zag path across transit corridor. Conduct immediate roadside safety sobriety check.'
  );
  const [governmentAlertSuccess, setGovernmentAlertSuccess] = useState<any | null>(null);

  // View Mode: SIDE_BY_SIDE vs TRAJECTORY_OVERLAY
  const [viewMode, setViewMode] = useState<'SIDE_BY_SIDE' | 'TRAJECTORY_OVERLAY'>('TRAJECTORY_OVERLAY');

  // Canvas Refs
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const file1InputRef = useRef<HTMLInputElement | null>(null);
  const file2InputRef = useRef<HTMLInputElement | null>(null);

  // Load Presets on Mount
  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    setIsLoadingPresets(true);
    try {
      const res = await fetch('/api/zigzag/two-photo-presets');
      if (res.ok) {
        const data = await res.json();
        setPresets(data);
        if (data.length > 0) {
          loadPreset(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching 2-photo presets:', err);
    } finally {
      setIsLoadingPresets(false);
    }
  };

  const loadPreset = (preset: TwoPhotoZigZagPreset) => {
    setSelectedPresetId(preset.id);
    setPhoto1Url(preset.photo_1.image_url);
    setPhoto2Url(preset.photo_2.image_url);
    setPhoto1Label(preset.photo_1.label);
    setPhoto2Label(preset.photo_2.label);
    setPhoto1FileName(null);
    setPhoto2FileName(null);
    setPhoto1Bbox(preset.photo_1.bbox);
    setPhoto2Bbox(preset.photo_2.bbox);
    setPhoto1Centroid(preset.photo_1.centroid);
    setPhoto2Centroid(preset.photo_2.centroid);
    setVehicleType(preset.vehicle_type);
    setLicensePlate(preset.license_plate);
    setCamera(preset.camera);
    setBusNumber(preset.bus_number);
    setLocationName(preset.location_name);
    setTimeDeltaSec(preset.photo_2.timestamp_sec || 1.4);
    setGovernmentAlertSuccess(null);

    // Auto calculate for the preset
    triggerCalculation({
      photo1_url: preset.photo_1.image_url,
      photo2_url: preset.photo_2.image_url,
      photo1_bbox: preset.photo_1.bbox,
      photo2_bbox: preset.photo_2.bbox,
      photo1_centroid: preset.photo_1.centroid,
      photo2_centroid: preset.photo_2.centroid,
      time_delta_sec: preset.photo_2.timestamp_sec || 1.4,
      bus_number: preset.bus_number,
      vehicle_type: preset.vehicle_type,
      license_plate: preset.license_plate,
      camera: preset.camera,
      location_name: preset.location_name,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, photoNum: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (photoNum === 1) {
        setPhoto1Url(dataUrl);
        setPhoto1FileName(file.name);
        setPhoto1Label(`Uploaded Frame T1: ${file.name}`);
        // Reset preset selection since custom image uploaded
        setSelectedPresetId('custom');
      } else {
        setPhoto2Url(dataUrl);
        setPhoto2FileName(file.name);
        setPhoto2Label(`Uploaded Frame T2: ${file.name}`);
        setSelectedPresetId('custom');
      }
      setGovernmentAlertSuccess(null);
    };
    reader.readAsDataURL(file);
  };

  const triggerCalculation = async (overrideParams?: any) => {
    setIsCalculating(true);
    setCalcError(null);
    try {
      const payload = overrideParams || {
        photo1_url: photo1Url,
        photo2_url: photo2Url,
        photo1_bbox: photo1Bbox,
        photo2_bbox: photo2Bbox,
        photo1_centroid: photo1Centroid,
        photo2_centroid: photo2Centroid,
        time_delta_sec: timeDeltaSec,
        bus_number: busNumber,
        vehicle_type: vehicleType,
        license_plate: licensePlate,
        camera: camera,
        location_name: locationName,
      };

      const res = await fetch('/api/zigzag/two-photo-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to analyze zig-zag trajectory.');
      }

      const data: TwoPhotoZigZagCalculation = await res.json();
      setCalculation(data);
    } catch (err: any) {
      console.error('ZigZag analysis error:', err);
      setCalcError(err.message || 'Error executing zig-zag calculation.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Warn Government Portal
  const handleWarnGovernmentPortal = async () => {
    if (!calculation) return;
    setIsWarningPortal(true);
    try {
      const res = await fetch('/api/zigzag/warn-government-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculation: calculation,
          dispatch_notes: dispatchNotes,
          assigned_unit: dispatchUnit,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to warn government portal.');
      }

      const result = await res.json();
      setGovernmentAlertSuccess(result);

      // Update calculation state to show warned status
      setCalculation((prev) =>
        prev
          ? {
              ...prev,
              government_alert_status: {
                is_warned: true,
                alert_id: result.alert_id,
                warned_at: result.warned_at,
                status: 'DISPATCHED',
                assigned_unit: dispatchUnit,
              },
            }
          : null
      );
    } catch (err: any) {
      alert(`Warning Government Portal Failed: ${err.message}`);
    } finally {
      setIsWarningPortal(false);
    }
  };

  // Draw Trajectory Vector Canvas Overlay
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !calculation) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Load background image (Photo 2 or combined)
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photo2Url || photo1Url;
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw background image
      ctx.drawImage(img, 0, 0, width, height);

      // Dark translucent vignette for HUD clarity
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
      grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.25)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw highway lane guides
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);

      // Left lane divider
      ctx.beginPath();
      ctx.moveTo(width * 0.35, height * 0.4);
      ctx.lineTo(width * 0.22, height);
      ctx.stroke();

      // Right lane divider
      ctx.beginPath();
      ctx.moveTo(width * 0.65, height * 0.4);
      ctx.lineTo(width * 0.78, height);
      ctx.stroke();

      // Road center dashed line
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
      ctx.beginPath();
      ctx.moveTo(width * 0.5, height * 0.4);
      ctx.lineTo(width * 0.5, height);
      ctx.stroke();

      ctx.setLineDash([]); // reset line dash

      const p1 = calculation.photo_1;
      const p2 = calculation.photo_2;

      const p1X = (p1.centroid.cx / 100) * width;
      const p1Y = (p1.centroid.cy / 100) * height;
      const p2X = (p2.centroid.cx / 100) * width;
      const p2Y = (p2.centroid.cy / 100) * height;

      // Draw Bounding Box 1 (Frame T1 - Cyan)
      const b1X = (p1.bbox.x / 100) * width;
      const b1Y = (p1.bbox.y / 100) * height;
      const b1W = (p1.bbox.width / 100) * width;
      const b1H = (p1.bbox.height / 100) * height;

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
      ctx.lineWidth = 2;
      ctx.strokeRect(b1X, b1Y, b1W, b1H);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.fillRect(b1X, b1Y, b1W, b1H);

      // Bounding box 1 Label
      ctx.fillStyle = 'rgba(6, 182, 212, 0.95)';
      ctx.fillRect(b1X, b1Y - 20, Math.min(140, b1W + 40), 20);
      ctx.fillStyle = '#082f49';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('FRAME T1: INITIAL (0.0s)', b1X + 4, b1Y - 6);

      // Draw Bounding Box 2 (Frame T2 - Rose/Amber)
      const b2X = (p2.bbox.x / 100) * width;
      const b2Y = (p2.bbox.y / 100) * height;
      const b2W = (p2.bbox.width / 100) * width;
      const b2H = (p2.bbox.height / 100) * height;

      const isCritical = calculation.metrics.verdict_level === 'CRITICAL_ZIG_ZAG';
      const p2Color = isCritical ? 'rgba(244, 63, 94, 0.95)' : 'rgba(245, 158, 11, 0.95)';
      const p2Fill = isCritical ? 'rgba(244, 63, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)';

      ctx.strokeStyle = p2Color;
      ctx.lineWidth = 3;
      ctx.strokeRect(b2X, b2Y, b2W, b2H);
      ctx.fillStyle = p2Fill;
      ctx.fillRect(b2X, b2Y, b2W, b2H);

      // Bounding box 2 Label
      ctx.fillStyle = p2Color;
      ctx.fillRect(b2X, b2Y - 22, Math.min(160, b2W + 45), 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`FRAME T2 (+${calculation.metrics.delta_time_sec}s)`, b2X + 4, b2Y - 7);

      // Draw Centroid 1 & 2 circles
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(p1X, p1Y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = isCritical ? '#f43f5e' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(p2X, p2Y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Trajectory Vector Line connecting P1 to P2
      ctx.strokeStyle = isCritical ? '#f43f5e' : '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p1X, p1Y);
      ctx.lineTo(p2X, p2Y);
      ctx.stroke();

      // Arrow head at P2
      const angle = Math.atan2(p2Y - p1Y, p2X - p1X);
      const arrowSize = 16;
      ctx.fillStyle = isCritical ? '#f43f5e' : '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(p2X, p2Y);
      ctx.lineTo(
        p2X - arrowSize * Math.cos(angle - Math.PI / 6),
        p2Y - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        p2X - arrowSize * Math.cos(angle + Math.PI / 6),
        p2Y - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();

      // Draw Lateral Delta Ruler / Projection
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      // Horizontal lateral ruler across Y1
      ctx.beginPath();
      ctx.moveTo(p1X, p1Y);
      ctx.lineTo(p2X, p1Y);
      ctx.stroke();

      // Vertical forward projection from ruler to P2
      ctx.beginPath();
      ctx.moveTo(p2X, p1Y);
      ctx.lineTo(p2X, p2Y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Lateral ruler text badge
      const rulerMidX = (p1X + p2X) / 2;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(rulerMidX - 60, p1Y - 26, 120, 22);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.strokeRect(rulerMidX - 60, p1Y - 26, 120, 22);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `ΔX: ${Math.abs(calculation.metrics.delta_x_pct)}% (${calculation.metrics.estimated_lateral_shift_m}m)`,
        rulerMidX,
        p1Y - 11
      );
      ctx.textAlign = 'start';

      // Angle indicator arc
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p1X, p1Y, 35, Math.PI / 2, Math.PI / 2 + (angle - Math.PI / 2), angle < Math.PI / 2);
      ctx.stroke();

      // Angle label
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`θ: ${calculation.metrics.trajectory_angle_deg}°`, p1X + (p2X > p1X ? 40 : -75), p1Y + 30);

      // Bottom HUD Info Bar
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(15, height - 55, width - 30, 42);
      ctx.strokeStyle = isCritical ? 'rgba(244, 63, 94, 0.8)' : 'rgba(245, 158, 11, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(15, height - 55, width - 30, 42);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(
        `TRACK: ${calculation.license_plate} (${calculation.vehicle_type}) | SWERVE: ${calculation.metrics.direction_of_swerve} | V_LAT: ${calculation.metrics.lateral_velocity_mps} m/s`,
        28,
        height - 35
      );

      ctx.fillStyle = isCritical ? '#f43f5e' : '#f59e0b';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(
        `ZIG-ZAG INDEX: ${calculation.metrics.zigzag_risk_score}% [${calculation.metrics.verdict_level}]`,
        28,
        height - 18
      );
    };
  }, [calculation, photo1Url, photo2Url]);

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
              <Activity className="h-4 w-4 text-amber-400 animate-pulse" />
              <span>2-PHOTO COMPUTER VISION LATERAL TRAJECTORY ENGINE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Vehicle Zig-Zag &amp; Erratic Driving Calculator
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Upload 2 sequential road images (Initial Frame T1 &amp; Shifted Frame T2) to compute vehicle bounding box
              displacements, trajectory vector angles, and lateral velocity. Generates instant official warnings for the
              Government Transit Safety Command Portal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {calculation && (
              <button
                type="button"
                onClick={handleWarnGovernmentPortal}
                disabled={isWarningPortal || calculation.government_alert_status?.is_warned}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-black uppercase tracking-wider shadow-lg transition-all ${
                  calculation.government_alert_status?.is_warned
                    ? 'bg-emerald-600 text-white border border-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 shadow-rose-950/60 animate-pulse'
                }`}
              >
                {isWarningPortal ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Dispatching Warning...</span>
                  </>
                ) : calculation.government_alert_status?.is_warned ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Government Portal Warned ({calculation.government_alert_status.alert_id})</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4" />
                    <span>Warn Government Portal Now</span>
                  </>
                )}
              </button>
            )}

            {onNavigateToGovAlerts && (
              <button
                type="button"
                onClick={onNavigateToGovAlerts}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <span>Gov Alerts Hub</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preset Selector Carousel */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Select Benchmark Preset Pair or Upload Custom Images</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {presets.length} Presets Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            const isCritical = preset.expected_verdict === 'CRITICAL_ZIG_ZAG';
            return (
              <div
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className={`cursor-pointer rounded-lg border p-3 transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-950/30 shadow-md ring-1 ring-amber-500/50'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : preset.expected_verdict === 'HIGH_ERRATIC_WEAVE'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {preset.expected_verdict.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {preset.vehicle_type}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-100 line-clamp-1">{preset.title}</div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{preset.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Image Upload / Dropzone Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Photo 1 Dropzone */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold font-mono">
                1
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Image 1: Initial Frame (T1)</h3>
                <p className="text-[11px] text-slate-400">Reference position at t = 0.0s</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => file1InputRef.current?.click()}
              className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-750 px-2.5 py-1.5 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <Upload className="h-3.5 w-3.5 text-sky-400" />
              <span>Upload Photo 1</span>
            </button>
            <input
              ref={file1InputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 1)}
            />
          </div>

          {/* Photo 1 Preview Box */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-800 bg-black/60 flex items-center justify-center">
            {photo1Url ? (
              <>
                <img
                  src={photo1Url}
                  alt="Frame T1"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 left-2 rounded bg-slate-950/80 border border-sky-500/40 px-2 py-1 text-[10px] font-mono font-bold text-sky-300 backdrop-blur-sm">
                  FRAME T1 • INITIAL POSITION (t=0.0s)
                </div>
                {photo1Centroid && (
                  <div
                    className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-500 shadow-lg shadow-sky-500/50 flex items-center justify-center"
                    style={{ left: `${photo1Centroid.cx}%`, top: `${photo1Centroid.cy}%` }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                )}
                {photo1Bbox && (
                  <div
                    className="absolute border-2 border-sky-400 bg-sky-400/20 pointer-events-none"
                    style={{
                      left: `${photo1Bbox.x}%`,
                      top: `${photo1Bbox.y}%`,
                      width: `${photo1Bbox.width}%`,
                      height: `${photo1Bbox.height}%`,
                    }}
                  />
                )}
              </>
            ) : (
              <div className="text-center p-4">
                <Camera className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Click &quot;Upload Photo 1&quot; to browse</p>
                <p className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP</p>
              </div>
            )}
          </div>
          <div className="text-[11px] font-mono text-slate-400 truncate">
            {photo1FileName ? `File: ${photo1FileName}` : photo1Label}
          </div>
        </div>

        {/* Photo 2 Dropzone */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold font-mono">
                2
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Image 2: Transitioned Frame (T2)</h3>
                <p className="text-[11px] text-slate-400">Displaced / Slalom position at t = +{timeDeltaSec}s</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => file2InputRef.current?.click()}
              className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-750 px-2.5 py-1.5 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <Upload className="h-3.5 w-3.5 text-amber-400" />
              <span>Upload Photo 2</span>
            </button>
            <input
              ref={file2InputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 2)}
            />
          </div>

          {/* Photo 2 Preview Box */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-800 bg-black/60 flex items-center justify-center">
            {photo2Url ? (
              <>
                <img
                  src={photo2Url}
                  alt="Frame T2"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 left-2 rounded bg-slate-950/80 border border-amber-500/40 px-2 py-1 text-[10px] font-mono font-bold text-amber-300 backdrop-blur-sm">
                  FRAME T2 • SHIFTED POSITION (+{timeDeltaSec}s)
                </div>
                {photo2Centroid && (
                  <div
                    className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-rose-500 shadow-lg shadow-rose-500/50 flex items-center justify-center"
                    style={{ left: `${photo2Centroid.cx}%`, top: `${photo2Centroid.cy}%` }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                )}
                {photo2Bbox && (
                  <div
                    className="absolute border-2 border-rose-400 bg-rose-400/25 pointer-events-none"
                    style={{
                      left: `${photo2Bbox.x}%`,
                      top: `${photo2Bbox.y}%`,
                      width: `${photo2Bbox.width}%`,
                      height: `${photo2Bbox.height}%`,
                    }}
                  />
                )}
              </>
            ) : (
              <div className="text-center p-4">
                <Camera className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Click &quot;Upload Photo 2&quot; to browse</p>
                <p className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP</p>
              </div>
            )}
          </div>
          <div className="text-[11px] font-mono text-slate-400 truncate">
            {photo2FileName ? `File: ${photo2FileName}` : photo2Label}
          </div>
        </div>
      </div>

      {/* Trajectory Calculation Trigger & Parameters Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-mono font-semibold uppercase text-slate-400 mb-1">
              Time Delta Δt (Seconds)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.4"
              max="5.0"
              value={timeDeltaSec}
              onChange={(e) => setTimeDeltaSec(parseFloat(e.target.value) || 1.4)}
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-semibold uppercase text-slate-400 mb-1">
              Vehicle Type
            </label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as ZigZagVehicleType)}
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="MOTORCYCLE">Motorcycle / Two-Wheeler</option>
              <option value="AUTO_RICKSHAW">Auto-Rickshaw</option>
              <option value="CAR">Sedan / Hatchback</option>
              <option value="BUS">Heavy Bus</option>
              <option value="TRUCK">Heavy Truck</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-semibold uppercase text-slate-400 mb-1">
              License Plate ID
            </label>
            <input
              type="text"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
              placeholder="AP 39 CG 4421"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-semibold uppercase text-slate-400 mb-1">
              Transit Bus Camera
            </label>
            <select
              value={camera}
              onChange={(e) => setCamera(e.target.value as ZigZagCameraType)}
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="FRONT">FRONT-ROOFTOP (Facing Ahead)</option>
              <option value="REAR">REAR-BUMPER (Facing Trailing)</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={() => triggerCalculation()}
              disabled={isCalculating || !photo1Url || !photo2Url}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-colors shadow-md disabled:opacity-50"
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Computing CV...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 fill-current" />
                  <span>Calculate Zig-Zag Figure</span>
                </>
              )}
            </button>
          </div>
        </div>

        {calcError && (
          <div className="mt-3 rounded-lg border border-rose-800/60 bg-rose-950/40 p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{calcError}</span>
          </div>
        )}
      </div>

      {/* Main Calculated Results Board */}
      {calculation && (
        <div className="space-y-5">
          {/* Government Warning Success Toast Banner */}
          {governmentAlertSuccess && (
            <div className="rounded-xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/40 p-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      OFFICIAL GOVERNMENT TRANSIT SAFETY WARNING DISPATCHED
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      Alert ID: {governmentAlertSuccess.alert_id} • Status: ACTIVE / DISPATCHED
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                      Escalated to State Transport Dept &amp; Traffic Interceptor Patrol for vehicle{' '}
                      <span className="font-mono text-amber-300 font-bold">{calculation.license_plate}</span>.
                    </div>
                  </div>
                </div>

                {onNavigateToGovAlerts && (
                  <button
                    type="button"
                    onClick={onNavigateToGovAlerts}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white transition-colors shrink-0 shadow"
                  >
                    <span>View in Gov Alerts Hub</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Verdict Banner */}
          <div
            className={`rounded-xl border p-5 ${
              calculation.metrics.verdict_level === 'CRITICAL_ZIG_ZAG'
                ? 'border-rose-600/70 bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/40 shadow-rose-950/50'
                : calculation.metrics.verdict_level === 'HIGH_ERRATIC_WEAVE'
                ? 'border-amber-600/70 bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/40 shadow-amber-950/50'
                : calculation.metrics.verdict_level === 'MODERATE_SWAY'
                ? 'border-yellow-600/70 bg-gradient-to-r from-yellow-950/60 via-slate-900 to-yellow-950/40'
                : 'border-emerald-600/70 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/40'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-lg p-2.5 ${
                    calculation.metrics.verdict_level === 'CRITICAL_ZIG_ZAG'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                      : calculation.metrics.verdict_level === 'HIGH_ERRATIC_WEAVE'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
                      VERDICT &amp; CLASSIFICATION
                    </span>
                    <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/30">
                      CV CONFIDENCE: {(calculation.metrics.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                    {calculation.metrics.verdict_title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                    Vehicle {calculation.license_plate} exhibited a{' '}
                    <strong className="text-white">
                      {calculation.metrics.estimated_lateral_shift_m}m lateral displacement
                    </strong>{' '}
                    (ΔX: {Math.abs(calculation.metrics.delta_x_pct)}% of frame) at an angle of{' '}
                    <strong className="text-white">{calculation.metrics.trajectory_angle_deg}°</strong> within{' '}
                    {calculation.metrics.delta_time_sec}s.
                  </p>
                </div>
              </div>

              {/* Calculated Zig-Zag Risk Figure Gauge */}
              <div className="flex items-center gap-4 bg-slate-950/60 rounded-lg p-3 border border-slate-800 shrink-0">
                <div className="text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Zig-Zag Figure</div>
                  <div
                    className={`text-3xl font-black font-mono ${
                      calculation.metrics.zigzag_risk_score >= 75
                        ? 'text-rose-400'
                        : calculation.metrics.zigzag_risk_score >= 50
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {calculation.metrics.zigzag_risk_score}%
                  </div>
                  <div className="text-[10px] font-bold text-slate-400">Risk Score</div>
                </div>
              </div>
            </div>
          </div>

          {/* 5 Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                Lateral Shift (ΔX)
              </div>
              <div className="text-xl font-black font-mono text-amber-300 mt-1">
                {Math.abs(calculation.metrics.delta_x_pct)}%
              </div>
              <div className="text-[11px] text-slate-400">
                ≈ {calculation.metrics.estimated_lateral_shift_m} meters
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                Trajectory Angle (θ)
              </div>
              <div className="text-xl font-black font-mono text-sky-400 mt-1">
                {calculation.metrics.trajectory_angle_deg}°
              </div>
              <div className="text-[11px] text-slate-400">
                Deviation from axis
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                Lateral Velocity
              </div>
              <div className="text-xl font-black font-mono text-rose-400 mt-1">
                {calculation.metrics.lateral_velocity_mps} m/s
              </div>
              <div className="text-[11px] text-slate-400">
                {calculation.metrics.lateral_velocity_kmh} km/h swerve
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                Swerve Direction
              </div>
              <div className="text-base font-black font-mono text-emerald-400 mt-1">
                {calculation.metrics.direction_of_swerve.replace(/_/g, ' ')}
              </div>
              <div className="text-[11px] text-slate-400">
                {calculation.metrics.lane_boundary_crossed ? 'Lane crossed' : 'Lane kept'}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                Gov Portal Warning
              </div>
              <div
                className={`text-base font-black font-mono mt-1 ${
                  calculation.government_alert_status?.is_warned
                    ? 'text-emerald-400'
                    : calculation.government_warning.warn_recommended
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {calculation.government_alert_status?.is_warned
                  ? 'WARNED ✓'
                  : calculation.government_warning.warn_recommended
                  ? 'RECOMMENDED 🚨'
                  : 'PASSIVE LOG'}
              </div>
              <div className="text-[11px] text-slate-400">
                {calculation.government_alert_status?.is_warned
                  ? calculation.government_alert_status.alert_id
                  : calculation.government_warning.urgency}
              </div>
            </div>
          </div>

          {/* Interactive Trajectory Vector Overlay Canvas */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  CV Trajectory Vector &amp; Lateral Deviation Overlay
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-mono text-sky-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> Frame T1 (0.0s)
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-mono text-rose-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Frame T2 (+{calculation.metrics.delta_time_sec}s)
                </span>
              </div>
            </div>

            {/* Canvas Container with dynamic resize */}
            <div className="relative w-full overflow-hidden rounded-lg border border-slate-800 bg-black flex items-center justify-center">
              <canvas
                ref={overlayCanvasRef}
                width={850}
                height={480}
                className="w-full max-h-[480px] object-contain rounded-lg"
              />
            </div>
          </div>

          {/* Legal Citation & Government Enforcement Action Box */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Traffic Law Citation */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                <FileText className="h-4 w-4" />
                <span>Traffic Enforcement Legal Infraction</span>
              </div>
              <div className="text-sm font-bold text-white">
                {calculation.traffic_law_citation.act}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {calculation.traffic_law_citation.description}
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
                <div className="text-xs font-mono text-slate-400">
                  Offense Code:{' '}
                  <span className="text-amber-300 font-bold">
                    {calculation.traffic_law_citation.code}
                  </span>
                </div>
                {calculation.traffic_law_citation.penalty_inr > 0 && (
                  <div className="text-xs font-mono text-slate-400">
                    Statutory Fine:{' '}
                    <span className="text-rose-400 font-bold">
                      ₹{calculation.traffic_law_citation.penalty_inr.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Government Dispatch & Warning Console */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Government Transit Safety Warning Action</span>
                </div>
                <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-mono text-rose-300 border border-rose-500/30">
                  {calculation.government_warning.urgency} URGENCY
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Target Enforcement Division
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={calculation.government_warning.target_division}
                    className="w-full rounded bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 border border-slate-700/80 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Dispatch Unit
                  </label>
                  <input
                    type="text"
                    value={dispatchUnit}
                    onChange={(e) => setDispatchUnit(e.target.value)}
                    className="w-full rounded bg-slate-800 px-2.5 py-1.5 text-xs text-white border border-slate-700 font-mono focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Dispatcher Notes &amp; Official Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                    className="w-full rounded bg-slate-800 px-2.5 py-1.5 text-xs text-white border border-slate-700 font-sans focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleWarnGovernmentPortal}
                  disabled={isWarningPortal || calculation.government_alert_status?.is_warned}
                  className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                    calculation.government_alert_status?.is_warned
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/60'
                  }`}
                >
                  {isWarningPortal ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Transmitting Warning to Government Portal...</span>
                    </>
                  ) : calculation.government_alert_status?.is_warned ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Warning Confirmed &amp; Dispatched ({calculation.government_alert_status.alert_id})</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Warn Government Portal &amp; Dispatch Interceptor</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
