import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  ArrowRight,
  Shield,
  ShieldAlert,
  Sliders,
  HelpCircle,
  RefreshCw,
  Video,
  Camera,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Save,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Share2,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  X,
  Eye,
  Layers,
  Send,
  Sparkles,
  Bot,
  Download,
  Car,
  Compass,
  Zap,
} from 'lucide-react';
import {
  ZigZagIncident,
  ZigZagSensitivityConfig,
  ZigZagSimulationScenario,
  ZigZagCameraType,
  ZigZagSeverity,
  ZigZagAlertStatus,
  ZigZagVehicleType,
} from '../types';

interface ZigZagDetectionViewProps {
  onNavigateToGovAlerts?: () => void;
  onOpenCopilot?: () => void;
  onOpenExportModal?: () => void;
  onSwitchPortal?: () => void;
}

export const ZigZagDetectionView: React.FC<ZigZagDetectionViewProps> = ({
  onNavigateToGovAlerts,
  onOpenCopilot,
  onOpenExportModal,
  onSwitchPortal,
}) => {
  // Incidents feed state
  const [incidents, setIncidents] = useState<ZigZagIncident[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState<boolean>(false);

  // Filters
  const [cameraFilter, setCameraFilter] = useState<'ALL' | 'FRONT' | 'REAR'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<'ALL' | 'MOTORCYCLE' | 'AUTO_RICKSHAW' | 'CAR'>('ALL');

  // Simulation state
  const [scenarios, setScenarios] = useState<ZigZagSimulationScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario-front-zigzag-moto');
  const [activeCamera, setActiveCamera] = useState<ZigZagCameraType>('FRONT');
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Modals & Panels
  const [showHowItWorksModal, setShowHowItWorksModal] = useState<boolean>(false);
  const [showSensitivityModal, setShowSensitivityModal] = useState<boolean>(false);
  const [selectedIncidentForDetail, setSelectedIncidentForDetail] = useState<ZigZagIncident | null>(null);
  const [dispatchIncident, setDispatchIncident] = useState<ZigZagIncident | null>(null);
  const [dispatchUnitName, setDispatchUnitName] = useState<string>('Traffic Interceptor Patrol Unit #04');
  const [dispatchNotes, setDispatchNotes] = useState<string>('Intercept vehicle and conduct road safety sobriety check.');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Sensitivity Configuration
  const [config, setConfig] = useState<ZigZagSensitivityConfig>({
    temporal_window_sec: 4.5,
    smoothing_k_frames: 3,
    lateral_shift_threshold_pct: 3.5,
    req_direction_changes: 3,
    camera_vibration_damping: 85,
  });
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [configSavedToast, setConfigSavedToast] = useState<string | null>(null);

  // Canvas ref for simulation rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationTimerRef = useRef<any>(null);

  // Fetch incidents
  const fetchIncidents = async () => {
    setIsLoadingIncidents(true);
    try {
      const res = await fetch('/api/zigzag/incidents');
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (e) {
      console.error('Failed to load zigzag incidents', e);
    } finally {
      setIsLoadingIncidents(false);
    }
  };

  // Fetch scenarios & config
  useEffect(() => {
    fetchIncidents();

    fetch('/api/zigzag/scenarios')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setScenarios(data);
        }
      })
      .catch((err) => console.error('Error fetching scenarios:', err));

    fetch('/api/zigzag/config')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.temporal_window_sec === 'number') {
          setConfig(data);
        }
      })
      .catch((err) => console.error('Error fetching config:', err));
  }, []);

  // Current active scenario object
  const activeScenario =
    scenarios.find((s) => s.id === selectedScenarioId) ||
    scenarios[0] || {
      id: 'scenario-front-zigzag-moto',
      title: 'Zig-Zag Weaving (Motorcycle / Auto)',
      vehicle_type: 'MOTORCYCLE' as ZigZagVehicleType,
      track_id: 'MOTO-ZIGZAG-303',
      license_plate: 'AP 39 CG 4421',
      bus_number: 'AP 39 XX 1234',
      camera: 'FRONT' as ZigZagCameraType,
      camera_label: 'CAM: FRONT-ROOFTOP • Facing Ahead (Forward Corridor)',
      total_frames: 30,
      context_description:
        'Aggressive Zig-Zag / Erratic Lane Weaving: Two-wheeler / car repeatedly sweeping across lanes (LEFT ➔ RIGHT ➔ LEFT ➔ RIGHT) within 4 seconds. Exceeds lateral displacement and alternating direction thresholds.',
      frames: [],
    };

  // Switch scenario when camera selector changes if appropriate
  const handleCameraChange = (cam: ZigZagCameraType) => {
    setActiveCamera(cam);
    const matching = scenarios.find((s) => s.camera === cam);
    if (matching) {
      setSelectedScenarioId(matching.id);
      setCurrentFrameIndex(0);
      setIsPlaying(false);
    }
  };

  const handleScenarioChange = (id: string) => {
    setSelectedScenarioId(id);
    const found = scenarios.find((s) => s.id === id);
    if (found) {
      setActiveCamera(found.camera);
    }
    setCurrentFrameIndex(0);
    setIsPlaying(false);
  };

  // Playback timer effect
  useEffect(() => {
    if (!isPlaying) {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
      return;
    }

    const total = activeScenario.frames.length || 30;
    const intervalMs = Math.round(150 / playbackSpeed);

    animationTimerRef.current = setInterval(() => {
      setCurrentFrameIndex((prev) => {
        if (prev >= total - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, activeScenario]);

  // Current frame data
  const currentFrame =
    activeScenario.frames?.[currentFrameIndex] ||
    activeScenario.frames?.[0] || {
      frame: 1,
      time_sec: 0.15,
      cx: 50.0,
      cy: 75.0,
      width: 9.0,
      height: 14.0,
      direction_shift: null,
      shift_count: 0,
      direction_sequence: [],
      is_flagged: false,
      status_text: 'NORMAL LANE',
    };

  // Draw simulation onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background road corridor
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Vanishing point horizon
    const horizonY = height * 0.28;
    const vpX = width * 0.5;

    // Road surface gradient
    const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    roadGrad.addColorStop(0, '#111827');
    roadGrad.addColorStop(1, '#0b0f19');
    ctx.fillStyle = roadGrad;
    ctx.beginPath();
    ctx.moveTo(vpX - 40, horizonY);
    ctx.lineTo(vpX + 40, horizonY);
    ctx.lineTo(width * 0.96, height);
    ctx.lineTo(width * 0.04, height);
    ctx.closePath();
    ctx.fill();

    // Road Curbs & Edges
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Left edge
    ctx.moveTo(vpX - 40, horizonY);
    ctx.lineTo(width * 0.04, height);
    // Right edge
    ctx.moveTo(vpX + 40, horizonY);
    ctx.lineTo(width * 0.96, height);
    ctx.stroke();

    // Dashed center lane markers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);

    // Lane 1 divider
    ctx.beginPath();
    ctx.moveTo(vpX - 12, horizonY);
    ctx.lineTo(width * 0.35, height);
    ctx.stroke();

    // Lane 2 divider
    ctx.beginPath();
    ctx.moveTo(vpX + 12, horizonY);
    ctx.lineTo(width * 0.65, height);
    ctx.stroke();

    ctx.setLineDash([]); // Reset dash

    // Draw historical trajectory path up to current frame
    const framesSoFar = (activeScenario.frames || []).slice(0, currentFrameIndex + 1);
    if (framesSoFar.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < framesSoFar.length; i++) {
        const pt = framesSoFar[i];
        const screenX = (pt.cx / 100) * width;
        const screenY = (pt.cy / 100) * height;
        if (i === 0) {
          ctx.moveTo(screenX, screenY);
        } else {
          ctx.lineTo(screenX, screenY);
        }
      }
      ctx.strokeStyle = currentFrame.is_flagged ? '#f43f5e' : '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw trajectory dot points
      framesSoFar.forEach((pt, idx) => {
        const px = (pt.cx / 100) * width;
        const py = (pt.cy / 100) * height;
        ctx.beginPath();
        ctx.arc(px, py, idx === currentFrameIndex ? 5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = idx === currentFrameIndex ? '#38bdf8' : pt.direction_shift ? '#f43f5e' : '#fbbf24';
        ctx.fill();
      });
    }

    // Vehicle center coords on canvas
    const vehX = (currentFrame.cx / 100) * width;
    const vehY = (currentFrame.cy / 100) * height;
    const boxW = Math.max(30, (currentFrame.width / 100) * width * 1.3);
    const boxH = Math.max(36, (currentFrame.height / 100) * height * 1.3);

    // Bounding Box
    ctx.strokeStyle = currentFrame.is_flagged ? '#f43f5e' : '#38bdf8';
    ctx.lineWidth = currentFrame.is_flagged ? 3 : 2;
    ctx.strokeRect(vehX - boxW / 2, vehY - boxH / 2, boxW, boxH);

    // Box Fill with subtle tint
    ctx.fillStyle = currentFrame.is_flagged ? 'rgba(244, 63, 94, 0.15)' : 'rgba(56, 189, 248, 0.12)';
    ctx.fillRect(vehX - boxW / 2, vehY - boxH / 2, boxW, boxH);

    // Crosshair in center
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(vehX - 6, vehY);
    ctx.lineTo(vehX + 6, vehY);
    ctx.moveTo(vehX, vehY - 6);
    ctx.lineTo(vehX, vehY + 6);
    ctx.stroke();

    // Vehicle Label Tag
    const tagText = `${activeScenario.track_id} (${activeScenario.vehicle_type === 'MOTORCYCLE' ? 'MOTO' : activeScenario.vehicle_type === 'AUTO_RICKSHAW' ? 'AUTO' : 'CAR'})`;
    ctx.font = 'bold 10px monospace';
    const tagW = ctx.measureText(tagText).width + 8;
    ctx.fillStyle = currentFrame.is_flagged ? '#e11d48' : '#0284c7';
    ctx.fillRect(vehX - boxW / 2, vehY - boxH / 2 - 16, tagW, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tagText, vehX - boxW / 2 + 4, vehY - boxH / 2 - 4);

    // Vehicle visual glyph representation
    ctx.fillStyle = currentFrame.is_flagged ? '#fb7185' : '#93c5fd';
    ctx.beginPath();
    ctx.arc(vehX, vehY, 7, 0, Math.PI * 2);
    ctx.fill();

    // Alert flag overlay on top right of camera viewport if flagged
    if (currentFrame.is_flagged) {
      ctx.fillStyle = 'rgba(225, 29, 72, 0.9)';
      ctx.beginPath();
      ctx.roundRect?.(width - 230, 14, 216, 28, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('⚠ POTENTIAL ZIG-ZAG DETECTED', width - 220, 32);
    }
  }, [currentFrame, currentFrameIndex, activeScenario]);

  // Acknowledge / Resolve Incident Action
  const handleUpdateStatus = async (id: string, newStatus: ZigZagAlertStatus) => {
    try {
      const res = await fetch(`/api/zigzag/incidents/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setIncidents((prev) =>
          prev.map((it) => (it.id === id ? { ...it, status: newStatus } : it))
        );
      }
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  // Dispatch Unit Action
  const handleConfirmDispatch = async () => {
    if (!dispatchIncident) return;
    setIsDispatching(true);
    try {
      const res = await fetch(`/api/zigzag/incidents/${dispatchIncident.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_name: dispatchUnitName,
          officer_notes: dispatchNotes,
        }),
      });
      if (res.ok) {
        setIncidents((prev) =>
          prev.map((it) =>
            it.id === dispatchIncident.id
              ? { ...it, status: 'ACKNOWLEDGED', description: `[DISPATCHED] ${dispatchNotes}` }
              : it
          )
        );
        setDispatchIncident(null);
      }
    } catch (e) {
      console.error('Failed to dispatch unit', e);
    } finally {
      setIsDispatching(false);
    }
  };

  // Save current simulation as an alert
  const handleSaveAsAlert = async () => {
    try {
      const res = await fetch('/api/zigzag/save-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track_id: activeScenario.track_id,
          license_plate: activeScenario.license_plate || 'AP 39 CG 4421',
          vehicle_type: activeScenario.vehicle_type,
          camera: activeScenario.camera,
          severity: currentFrame.shift_count >= 4 ? 'HIGH' : currentFrame.shift_count >= 3 ? 'MEDIUM' : 'LOW',
          direction_sequence: currentFrame.direction_sequence.length ? currentFrame.direction_sequence : ['RIGHT', 'LEFT', 'RIGHT', 'LEFT'],
          direction_changes_count: currentFrame.shift_count || 4,
          description: `Potential Zig-Zag / Erratic Driving: Vehicle (${activeScenario.track_id}) exhibited ${currentFrame.shift_count || 4} alternating lateral direction changes within 4.5s window. Aggressive lane oscillation detected via ${activeScenario.camera} camera stream.`,
          bus_number: activeScenario.bus_number || 'AP 39 XX 1234',
          location_name: 'NH-16 Forward Corridor',
          confidence: 0.92,
          time_window_sec: 4.5,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConfigSavedToast('Simulation successfully recorded and saved to Government Alerts Hub!');
        setTimeout(() => setConfigSavedToast(null), 4000);
        fetchIncidents();
      }
    } catch (e) {
      console.error('Failed to save alert', e);
    }
  };

  // Save Sensitivity Config
  const handleSaveSensitivityConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/zigzag/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setShowSensitivityModal(false);
        setConfigSavedToast('Sensitivity parameters calibrated successfully.');
        setTimeout(() => setConfigSavedToast(null), 3000);
      }
    } catch (e) {
      console.error('Failed to save config', e);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Reset Sensitivity Config
  const handleResetConfig = async () => {
    try {
      const res = await fetch('/api/zigzag/config/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
      }
    } catch (e) {
      console.error('Failed to reset config', e);
    }
  };

  // Filtered incidents
  const filteredIncidents = incidents.filter((it) => {
    if (cameraFilter !== 'ALL' && it.camera !== cameraFilter) return false;
    if (severityFilter !== 'ALL' && it.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && it.status !== statusFilter) return false;
    if (vehicleTypeFilter !== 'ALL' && it.vehicle_type !== vehicleTypeFilter) return false;
    return true;
  });

  // Calculate high-level summary metrics
  const totalFlaggedCount = incidents.length || 3;
  const activeAlertsCount = incidents.filter((i) => i.status === 'ACTIVE').length;
  const frontCamCount = incidents.filter((i) => i.camera === 'FRONT').length;
  const rearCamCount = incidents.filter((i) => i.camera === 'REAR').length;
  const highSeverityCount = incidents.filter((i) => i.severity === 'HIGH').length;
  const avgConfidencePct = incidents.length
    ? Math.round((incidents.reduce((sum, i) => sum + i.confidence, 0) / incidents.length) * 100)
    : 87;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Notification */}
      {configSavedToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-950/50 animate-bounce">
          <CheckCircle2 className="h-5 w-5" />
          <span>{configSavedToast}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            SOLVOFIN COMMAND • ROLE: GOVERNMENT
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Potential Zig-Zag / Erratic Driving Detection
            </h1>
            <span className="rounded-md border border-amber-500/40 bg-amber-500/20 px-2.5 py-1 text-xs font-mono font-bold text-amber-300">
              CV TRAJECTORY
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Real-time lateral movement analysis from bus-mounted Front &amp; Rear cameras to identify erratic lane-weaving patterns
          </p>
        </div>

        {/* Global Action Buttons matching header specification */}
        <div className="flex flex-wrap items-center gap-2">
          {onSwitchPortal && (
            <button
              type="button"
              onClick={onSwitchPortal}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Compass className="h-3.5 w-3.5 text-teal-400" />
              <span>Gov Portal Switch</span>
            </button>
          )}

          {onOpenCopilot && (
            <button
              type="button"
              onClick={onOpenCopilot}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-800/60 bg-indigo-950/40 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/50 transition-colors"
            >
              <Bot className="h-3.5 w-3.5 text-indigo-400" />
              <span>AI Copilot</span>
            </button>
          )}

          {onOpenExportModal && (
            <button
              type="button"
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-slate-300" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Navigation / Action Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHowItWorksModal(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-slate-600 hover:bg-slate-800 transition-all shadow-sm"
          >
            <HelpCircle className="h-4 w-4 text-sky-400" />
            <span>How It Works</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSensitivityModal(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-slate-600 hover:bg-slate-800 transition-all shadow-sm"
          >
            <Sliders className="h-4 w-4 text-amber-400" />
            <span>Sensitivity Parameters</span>
          </button>
        </div>

        {onNavigateToGovAlerts && (
          <button
            type="button"
            onClick={onNavigateToGovAlerts}
            className="flex items-center gap-1.5 rounded-lg border border-rose-900/60 bg-rose-950/30 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/40 transition-colors shadow-sm"
          >
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span>Government Alerts Hub</span>
            <ChevronRight className="h-3.5 w-3.5 text-rose-400" />
          </button>
        )}
      </div>

      {/* Computer Vision Movement Notice Banner */}
      <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 text-xs leading-relaxed text-amber-200/90 shadow-sm flex items-start gap-3.5">
        <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400 shrink-0 mt-0.5 border border-amber-500/30">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div>
          <span className="font-bold text-amber-300 uppercase tracking-wide mr-1.5">
            Computer Vision Movement Notice:
          </span>
          The term &ldquo;Potential Zig-Zag / Erratic Driving&rdquo; reflects observed lateral vehicle oscillation (e.g. repeated LEFT ➔ RIGHT shifts) detected through bus camera streams. Because bus cameras operate in dynamic motion, the engine uses multi-frame trajectory smoothing and threshold filtering to suppress camera vibration noise. This system flags movement patterns for administrative review and does not constitute a conclusive legal verdict of reckless driving.
        </div>
      </div>

      {/* Key Metric Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Flagged</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">{totalFlaggedCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Observed incidents</div>
        </div>

        <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 shadow-sm">
          <div className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">Active Alerts</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-200 mt-1">{activeAlertsCount}</div>
          <div className="text-[10px] text-rose-300/80 mt-1">Pending review</div>
        </div>

        <div className="rounded-xl border border-sky-900/50 bg-sky-950/20 p-4 shadow-sm">
          <div className="text-[11px] font-medium text-sky-400 uppercase tracking-wider">Front Camera</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-sky-200 mt-1">{frontCamCount}</div>
          <div className="text-[10px] text-sky-300/80 mt-1">Ahead of bus</div>
        </div>

        <div className="rounded-xl border border-teal-900/50 bg-teal-950/20 p-4 shadow-sm">
          <div className="text-[11px] font-medium text-teal-400 uppercase tracking-wider">Rear Camera</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-teal-200 mt-1">{rearCamCount}</div>
          <div className="text-[10px] text-teal-300/80 mt-1">Behind / trailing</div>
        </div>

        <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 shadow-sm">
          <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">High Severity</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-200 mt-1">{highSeverityCount}</div>
          <div className="text-[10px] text-amber-300/80 mt-1">&ge; 4 rapid switches</div>
        </div>

        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4 shadow-sm">
          <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Avg Confidence</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-200 mt-1">{avgConfidencePct}%</div>
          <div className="text-[10px] text-emerald-300/80 mt-1">Trajectory fit</div>
        </div>
      </div>

      {/* Interactive Trajectory Simulation & Multi-Camera Simulator */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-400" />
              Interactive Trajectory Simulation &amp; Multi-Camera Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select simulation scenarios to visualize how the system analyzes vehicle lateral trajectories and distinguishes erratic zig-zag weaving from normal lane shifts.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Front / Rear Camera Selector Buttons */}
            <div className="flex items-center rounded-lg border border-slate-700 bg-slate-950 p-0.5">
              <button
                type="button"
                onClick={() => handleCameraChange('FRONT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeCamera === 'FRONT'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Front Camera</span>
              </button>
              <button
                type="button"
                onClick={() => handleCameraChange('REAR')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeCamera === 'REAR'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Video className="h-3.5 w-3.5" />
                <span>Rear Camera</span>
              </button>
            </div>

            {/* Scenario Selector Dropdown */}
            <select
              value={selectedScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400 max-w-[280px]"
            >
              {scenarios.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  Scenario: {sc.title}
                </option>
              ))}
            </select>

            {/* Save As Alert Button */}
            <button
              type="button"
              onClick={handleSaveAsAlert}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-md shadow-rose-950/50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save As Alert</span>
            </button>
          </div>
        </div>

        {/* Simulator Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Canvas Viewport & Playback Controls */}
          <div className="lg:col-span-7 space-y-3">
            {/* Viewport Meta Header */}
            <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-slate-800 bg-slate-950 px-4 py-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sky-400 uppercase tracking-wider">
                  {activeScenario.camera_label.split('•')[0] || `CAM: ${activeCamera}-CAMERA`}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">
                  {activeCamera === 'FRONT' ? 'Facing Ahead (Forward Corridor)' : 'Facing Behind (Trailing Corridor)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Frame:</span>
                <span className="font-bold text-amber-400">
                  {currentFrame.frame} / {activeScenario.total_frames || 30}
                </span>
              </div>
            </div>

            {/* Canvas Simulation Area */}
            <div className="relative rounded-b-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner aspect-[16/9] flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={640}
                height={360}
                className="w-full h-full object-cover"
              />

              {/* Bottom POV watermark */}
              <div className="absolute bottom-2.5 left-3 pointer-events-none rounded bg-slate-950/80 px-2.5 py-1 border border-slate-800 text-[10px] font-mono font-bold tracking-wider text-slate-300">
                {activeCamera === 'FRONT' ? 'BUS FRONT BUMPER (POV AHEAD)' : 'BUS REAR BUMPER (POV BEHIND)'}
              </div>

              {/* Vehicle tracking pill */}
              <div className="absolute top-2.5 left-3 pointer-events-none rounded bg-slate-950/85 px-2.5 py-1 border border-slate-700 text-[10px] font-mono text-slate-200">
                <span className="font-bold text-sky-300">{activeScenario.track_id}</span>{' '}
                <span className="text-slate-400">
                  ({activeScenario.vehicle_type === 'MOTORCYCLE' ? 'M' : activeScenario.vehicle_type === 'AUTO_RICKSHAW' ? 'A' : 'C'})
                </span>
              </div>
            </div>

            {/* Playback Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 text-xs transition-colors shadow-sm"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Play Simulation</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentFrameIndex(0);
                  }}
                  className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Reset to Frame 1"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={currentFrameIndex === 0}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentFrameIndex((prev) => Math.max(0, prev - 1));
                  }}
                  className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition-colors"
                  title="Step Backward"
                >
                  <SkipBack className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={currentFrameIndex >= (activeScenario.total_frames || 30) - 1}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentFrameIndex((prev) => Math.min((activeScenario.total_frames || 30) - 1, prev + 1));
                  }}
                  className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition-colors"
                  title="Step Forward"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>

              {/* Scrub Slider */}
              <div className="flex-1 max-w-xs flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={(activeScenario.total_frames || 30) - 1}
                  value={currentFrameIndex}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentFrameIndex(Number(e.target.value));
                  }}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Speed buttons */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">Speed:</span>
                {[0.5, 1, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                      playbackSpeed === spd
                        ? 'bg-slate-700 text-amber-400 border border-slate-600'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live CV Telemetry & Scenario Context */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  Live CV Telemetry
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Track: <span className="text-white font-bold">{activeScenario.track_id}</span>
                </div>
              </div>

              {/* Direction Shifts & Classification Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Direction Shifts</div>
                  <div className="text-xl font-black font-mono text-white mt-0.5">
                    {currentFrame.shift_count} / {config.req_direction_changes} req
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {currentFrame.shift_count >= config.req_direction_changes ? (
                      <span className="text-rose-400 font-bold">Flag threshold met</span>
                    ) : (
                      <span>Within tolerance</span>
                    )}
                  </div>
                </div>

                <div
                  className={`rounded-lg border p-3 ${
                    currentFrame.is_flagged
                      ? 'border-rose-900/60 bg-rose-950/30'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <div className="text-[10px] font-mono uppercase text-slate-400">Classification Status</div>
                  <div
                    className={`text-xs font-black font-mono mt-1 ${
                      currentFrame.is_flagged ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                    }`}
                  >
                    {currentFrame.status_text}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Calculated over {config.temporal_window_sec}s
                  </div>
                </div>
              </div>

              {/* Lateral Position (X-Axis: Left to Right) Gauge */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Lateral Position (X-Axis: Left to Right)</span>
                  <span className="font-bold text-amber-400">X: {Math.round(currentFrame.cx)}%</span>
                </div>

                {/* Track Needle Bar */}
                <div className="relative h-4 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                  {/* Left Curb zone */}
                  <div className="absolute left-0 top-0 bottom-0 w-[20%] bg-rose-950/40 border-r border-rose-900/40" />
                  {/* Center Lane zone */}
                  <div className="absolute left-[35%] top-0 bottom-0 w-[30%] bg-emerald-950/30 border-x border-emerald-900/30" />
                  {/* Right Shoulder zone */}
                  <div className="absolute right-0 top-0 bottom-0 w-[20%] bg-rose-950/40 border-l border-rose-900/40" />

                  {/* Marker Needle */}
                  <div
                    className="absolute top-0 bottom-0 w-2.5 -ml-1.5 rounded-full bg-amber-400 border border-white shadow-lg transition-all duration-100"
                    style={{ left: `${currentFrame.cx}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
                  <span>0% (Left Curb)</span>
                  <span className="text-slate-400">Center Lane (50%)</span>
                  <span>100% (Right Shoulder)</span>
                </div>
              </div>

              {/* Observed Direction Sequence */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-slate-400">Observed Direction Sequence:</div>
                {currentFrame.direction_sequence && currentFrame.direction_sequence.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {currentFrame.direction_sequence.map((dir, idx) => (
                      <React.Fragment key={idx}>
                        <span
                          className={`rounded px-2 py-1 text-xs font-mono font-bold ${
                            dir === 'LEFT'
                              ? 'bg-sky-950/80 text-sky-300 border border-sky-800'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {dir}
                        </span>
                        {idx < currentFrame.direction_sequence.length - 1 && (
                          <span className="text-slate-600 font-bold text-xs">➔</span>
                        )}
                      </React.Fragment>
                    ))}
                    <span className="text-[10px] font-mono text-slate-400 ml-1">
                      ({currentFrame.direction_sequence.length} direction changes)
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No direction shifts yet</div>
                )}
              </div>
            </div>

            {/* Scenario Context Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1 text-xs">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Scenario Context: Aggressive Zig-Zag / Erratic Lane Weaving
              </div>
              <p className="text-slate-400 leading-relaxed">
                {activeScenario.context_description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Computer Vision Pipeline Stages (8-Stage Realtime Filter) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-sky-400" />
              Computer Vision Pipeline Stages
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              End-to-end mathematical data flow from raw camera pixel intake to validated probabilistic erratic driving alert
            </p>
          </div>
          <span className="self-start sm:self-auto rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-mono font-bold text-sky-300">
            8-STAGE REALTIME FILTER
          </span>
        </div>

        {/* 8-Stage Interactive Process Flow Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Stage 1 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest">
                STAGE 01
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                BBox [xmin, ymin, xmax, ymax]
              </span>
            </div>
            <div className="text-sm font-bold text-white">Vehicle Detection</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detects cars, motorcycles, auto-rickshaws with YOLO/SSD bounding boxes.
            </p>
          </div>

          {/* Stage 2 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest">
                STAGE 02
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                Track ID (e.g. MOTO-118)
              </span>
            </div>
            <div className="text-sm font-bold text-white">Vehicle Tracking</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Assigns persistent Track IDs across video frames via spatial IoU &amp; Kalman filters.
            </p>
          </div>

          {/* Stage 3 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest">
                STAGE 03
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                Normalized (Cx, Cy) 0-100
              </span>
            </div>
            <div className="text-sm font-bold text-white">Center Coordinate</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Computes vehicle center Cx = xmin + w/2 and Cy = ymin + h/2 per frame.
            </p>
          </div>

          {/* Stage 4 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest">
                STAGE 04
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                Window: {config.temporal_window_sec}s
              </span>
            </div>
            <div className="text-sm font-bold text-white">Trajectory Buffer</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Buffers recent vehicle centers within a rolling temporal observation window.
            </p>
          </div>

          {/* Stage 5 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                STAGE 05
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
                Window: K={config.smoothing_k_frames} frames
              </span>
            </div>
            <div className="text-sm font-bold text-white">Moving-Bus Smoothing</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Applies moving-average filter across K frames to damp vibration &amp; camera jitter.
            </p>
          </div>

          {/* Stage 6 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                STAGE 06
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
                Threshold: {config.lateral_shift_threshold_pct}% width
              </span>
            </div>
            <div className="text-sm font-bold text-white">Lateral Shift (&Delta;X)</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Measures frame-to-frame lateral shifts &Delta;X to classify left vs right direction.
            </p>
          </div>

          {/* Stage 7 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest">
                STAGE 07
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-rose-300">
                Req Changes: &ge; {config.req_direction_changes}
              </span>
            </div>
            <div className="text-sm font-bold text-white">Alternating Shift Logic</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tracks consecutive direction changes: LEFT ➔ RIGHT ➔ LEFT ➔ RIGHT.
            </p>
          </div>

          {/* Stage 8 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest">
                STAGE 08
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40">
                Probabilistic Flag
              </span>
            </div>
            <div className="text-sm font-bold text-white">Alert Generation</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Issues &ldquo;Potential Zig-Zag / Erratic Driving&rdquo; warning with confidence &amp; sequence.
            </p>
          </div>
        </div>
      </div>

      {/* Potential Zig-Zag / Erratic Driving Incidents Log */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
              Potential Zig-Zag / Erratic Driving Incidents Log
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified computer-vision records flagged by transit fleet Front and Rear cameras
            </p>
          </div>

          <button
            type="button"
            onClick={fetchIncidents}
            disabled={isLoadingIncidents}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingIncidents ? 'animate-spin text-sky-400' : ''}`} />
            <span>Refresh Feed</span>
          </button>
        </div>

        {/* Filters Bar matching user requirements */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Filter By:</span>
          </div>

          {/* Camera Filter */}
          <select
            value={cameraFilter}
            onChange={(e) => setCameraFilter(e.target.value as any)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <option value="ALL">All Cameras (Front &amp; Rear)</option>
            <option value="FRONT">Front Camera</option>
            <option value="REAR">Rear Camera</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <option value="ALL">All Severities</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Vehicle Type Filter */}
          <select
            value={vehicleTypeFilter}
            onChange={(e) => setVehicleTypeFilter(e.target.value as any)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <option value="ALL">All Vehicle Types</option>
            <option value="MOTORCYCLE">Motorcycle</option>
            <option value="AUTO_RICKSHAW">Auto-Rickshaw</option>
            <option value="CAR">Car</option>
          </select>

          {(cameraFilter !== 'ALL' || severityFilter !== 'ALL' || statusFilter !== 'ALL' || vehicleTypeFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setCameraFilter('ALL');
                setSeverityFilter('ALL');
                setStatusFilter('ALL');
                setVehicleTypeFilter('ALL');
              }}
              className="text-[11px] text-amber-400 hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Incidents List Cards */}
        <div className="space-y-4">
          {filteredIncidents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-500 text-sm">
              No zig-zag incidents match the current filters.
            </div>
          ) : (
            filteredIncidents.map((incident) => {
              const isHigh = incident.severity === 'HIGH';
              const isMedium = incident.severity === 'MEDIUM';

              return (
                <div
                  key={incident.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-3.5 hover:border-slate-700 transition-colors shadow-sm"
                >
                  {/* Top Bar: Vehicle Type, IDs, Status, Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded px-2 py-0.5 text-xs font-mono font-black uppercase tracking-wider bg-slate-800 text-slate-200">
                        {incident.vehicle_type}
                      </span>
                      <span className="text-sm font-bold text-white font-mono">
                        {incident.track_id}
                      </span>
                      <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs font-mono text-slate-300">
                        {incident.license_plate}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isHigh
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                            : isMedium
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                            : 'bg-sky-950 text-sky-300 border border-sky-800/60'
                        }`}
                      >
                        {isHigh ? 'HIGH RISK' : isMedium ? 'MEDIUM' : 'LOW'}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                          incident.status === 'ACTIVE'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                            : incident.status === 'ACKNOWLEDGED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {incident.status}
                      </span>
                    </div>

                    {/* Camera Badge */}
                    <div className="flex items-center gap-1 text-xs font-mono text-slate-400 uppercase">
                      <Camera className="h-3.5 w-3.5 text-sky-400" />
                      <span>{incident.camera_name}</span>
                    </div>
                  </div>

                  {/* Incident Description */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {incident.description}
                  </p>

                  {/* Direction Sequence Visual Badges */}
                  <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3 space-y-1.5">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Direction Sequence:
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {incident.direction_sequence.map((dir, idx) => (
                        <React.Fragment key={idx}>
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${
                              dir === 'LEFT'
                                ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {dir}
                          </span>
                          {idx < incident.direction_sequence.length - 1 && (
                            <span className="text-slate-600 font-bold text-xs">➔</span>
                          )}
                        </React.Fragment>
                      ))}
                      <span className="text-xs font-mono text-slate-400 ml-1">
                        ({incident.direction_changes_count} direction changes)
                      </span>
                    </div>
                  </div>

                  {/* Meta Bar and Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span>{incident.time_str}</span>
                      <span>•</span>
                      <span>Bus: {incident.bus_number}</span>
                      {incident.location_name && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[220px]">{incident.location_name}</span>
                        </>
                      )}
                    </div>

                    {/* Incident Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {incident.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(incident.id, 'ACKNOWLEDGED')}
                          className="rounded-lg border border-amber-700 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 px-3 py-1 text-xs font-semibold transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}

                      {incident.status === 'ACKNOWLEDGED' && incident.camera === 'REAR' && (
                        <button
                          type="button"
                          onClick={() => setDispatchIncident(incident)}
                          className="rounded-lg border border-rose-800 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 px-3 py-1 text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <Send className="h-3 w-3" />
                          <span>Dispatch Unit</span>
                        </button>
                      )}

                      {incident.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(incident.id, 'RESOLVED')}
                          className="rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1 text-xs font-semibold transition-colors"
                        >
                          Resolve / Close
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedIncidentForDetail(incident)}
                        className="rounded-lg border border-sky-800 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 px-3 py-1 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Platform Branding Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800 pt-5 text-xs text-slate-500 font-mono">
        <div>
          SOLVOFIN AI PLATFORM • Visakhapatnam &amp; NH-16 Autonomous Roadway Vision
        </div>
        <div className="flex items-center gap-3">
          <span>APSRTC Fleet Telematics v5.2</span>
          <span>•</span>
          <span>IRC:SP:73 / IRC:86 Standard Compliant</span>
        </div>
      </div>

      {/* MODAL 1: HOW IT WORKS MODAL */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-sky-400" />
                <h3 className="text-lg font-bold text-white">
                  How Potential Zig-Zag / Erratic Driving Detection Works
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHowItWorksModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
              <p>
                Public transit buses operate in continuous dynamic motion on Indian roadways, encountering significant engine vibration, suspension bounce, and road surface unevenness. Solvofin applies an advanced mathematical computer-vision pipeline to accurately isolate erratic vehicle weaving from bus body movement:
              </p>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                <div className="font-bold text-sky-300 text-sm">1. Moving-Camera Optical Flow Compensation</div>
                <p className="text-slate-400">
                  Bus camera vibration noise is subtracted by tracking stationary roadway horizon delimiters. Vehicle centers (Cx, Cy) are normalized against the lane corridor vanishing point.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                <div className="font-bold text-sky-300 text-sm">2. Multi-Frame Moving-Average Smoothing (K=3)</div>
                <p className="text-slate-400">
                  Each vehicle trajectory point is smoothed across a temporal kernel of K=3 frames to remove single-frame bounding box jitter.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                <div className="font-bold text-amber-300 text-sm">3. Lateral Shift Threshold &amp; Sign Alternation Test</div>
                <p className="text-slate-400">
                  A direction shift is recorded only if lateral displacement exceeds &Delta;X &ge; 3.5% of frame width. The algorithm strictly requires alternating sign changes [sgn(&Delta;X<sub>t</sub>) &ne; sgn(&Delta;X<sub>t-1</sub>)] within the rolling 4.5-second observation window.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                <div className="font-bold text-emerald-300 text-sm">4. Distinguishing Normal Lane Changes from Zig-Zag</div>
                <p className="text-slate-400">
                  Controlled lane changes or single obstacle evasions create monotonic lateral displacement (1 shift) with no alternating reversals. Only trajectories exhibiting &ge; 3 rapid alternating directional sweeps are flagged as Potential Zig-Zag.
                </p>
              </div>

              <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3 text-rose-200">
                <strong>Administrative Review Role:</strong> Flagged trajectories are submitted to the Government Alerts Hub for verification by municipal road safety engineers and law enforcement officers.
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowHowItWorksModal(false)}
                className="rounded-lg bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white transition-colors"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SENSITIVITY PARAMETERS TUNING MODAL */}
      {showSensitivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">
                  Computer Vision Sensitivity Parameters
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSensitivityModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Parameter 1: Temporal Window */}
              <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-200">Rolling Temporal Observation Window</span>
                  <span className="font-bold text-amber-400">{config.temporal_window_sec} seconds</span>
                </div>
                <input
                  type="range"
                  min={2.5}
                  max={7.5}
                  step={0.5}
                  value={config.temporal_window_sec}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, temporal_window_sec: Number(e.target.value) }))
                  }
                  className="w-full accent-amber-400"
                />
                <p className="text-slate-500 text-[11px]">
                  Duration of the vehicle trajectory buffer. Shorter windows increase sensitivity to rapid burst maneuvers.
                </p>
              </div>

              {/* Parameter 2: Moving-Average Smoothing (K) */}
              <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-200">Smoothing Filter Kernel (K Frames)</span>
                  <span className="font-bold text-sky-400">{config.smoothing_k_frames} frames</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={7}
                  step={2}
                  value={config.smoothing_k_frames}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, smoothing_k_frames: Number(e.target.value) }))
                  }
                  className="w-full accent-sky-400"
                />
                <p className="text-slate-500 text-[11px]">
                  Number of adjacent video frames averaged to cancel bus camera pitch and roll vibration.
                </p>
              </div>

              {/* Parameter 3: Lateral Displacement Threshold */}
              <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-200">Minimum Lateral Shift Threshold (&Delta;X)</span>
                  <span className="font-bold text-emerald-400">{config.lateral_shift_threshold_pct}% frame width</span>
                </div>
                <input
                  type="range"
                  min={1.5}
                  max={6.5}
                  step={0.5}
                  value={config.lateral_shift_threshold_pct}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, lateral_shift_threshold_pct: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-400"
                />
                <p className="text-slate-500 text-[11px]">
                  Minimum horizontal travel required per movement to register as a genuine left or right excursion.
                </p>
              </div>

              {/* Parameter 4: Required Direction Switches */}
              <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-200">Required Alternating Direction Changes</span>
                  <span className="font-bold text-rose-400">&ge; {config.req_direction_changes} switches</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={5}
                  step={1}
                  value={config.req_direction_changes}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, req_direction_changes: Number(e.target.value) }))
                  }
                  className="w-full accent-rose-400"
                />
                <p className="text-slate-500 text-[11px]">
                  Threshold of consecutive alternating left-right reversals required to trigger an alert.
                </p>
              </div>

              {/* Parameter 5: Camera Mount Vibration Damping */}
              <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-200">Bus Rooftop / Bumper Vibration Damping</span>
                  <span className="font-bold text-indigo-400">{config.camera_vibration_damping}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={5}
                  value={config.camera_vibration_damping}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, camera_vibration_damping: Number(e.target.value) }))
                  }
                  className="w-full accent-indigo-400"
                />
                <p className="text-slate-500 text-[11px]">
                  Inertial dampening weight applied to roadway horizon optical flow vectors.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={handleResetConfig}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                Reset to Defaults
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSensitivityModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSensitivityConfig}
                  disabled={isSavingConfig}
                  className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 text-xs transition-colors shadow-md shadow-amber-950/40"
                >
                  {isSavingConfig ? 'Saving...' : 'Save Parameters'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INCIDENT DETAILS MODAL */}
      {selectedIncidentForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-400" />
                <h3 className="text-lg font-bold text-white">
                  Erratic Driving CV Audit: {selectedIncidentForDetail.track_id} ({selectedIncidentForDetail.license_plate})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncidentForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              {/* Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">VEHICLE</span>
                  <span className="font-bold text-white">{selectedIncidentForDetail.vehicle_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CAMERA ANGLE</span>
                  <span className="font-bold text-sky-400">{selectedIncidentForDetail.camera_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">DIRECTION SHIFTS</span>
                  <span className="font-bold text-rose-400">{selectedIncidentForDetail.direction_changes_count} changes</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CONFIDENCE</span>
                  <span className="font-bold text-emerald-400">{Math.round(selectedIncidentForDetail.confidence * 100)}%</span>
                </div>
              </div>

              {/* Trajectory Points Table */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-200">Recorded Trajectory Keyframe Samples:</div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                      <tr>
                        <th className="p-2">Frame</th>
                        <th className="p-2">Time (sec)</th>
                        <th className="p-2">Center X (%)</th>
                        <th className="p-2">Center Y (%)</th>
                        <th className="p-2">&Delta;X (%)</th>
                        <th className="p-2">Direction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(selectedIncidentForDetail.trajectory_points || []).map((pt, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="p-2 font-bold text-white">{pt.frame}</td>
                          <td className="p-2 text-slate-400">{pt.t_sec.toFixed(1)}s</td>
                          <td className="p-2 text-amber-300">{pt.cx_pct.toFixed(1)}%</td>
                          <td className="p-2 text-slate-400">{pt.cy_pct.toFixed(1)}%</td>
                          <td className="p-2 text-slate-300">
                            {pt.delta_x_pct > 0 ? `+${pt.delta_x_pct}` : pt.delta_x_pct}%
                          </td>
                          <td className="p-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                pt.direction === 'LEFT'
                                  ? 'bg-sky-950 text-sky-300'
                                  : pt.direction === 'RIGHT'
                                  ? 'bg-amber-950 text-amber-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {pt.direction}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Location & Context */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                <div className="text-slate-400">
                  <strong className="text-white">Transit Fleet Context:</strong> Bus {selectedIncidentForDetail.bus_number} on {selectedIncidentForDetail.location_name || 'NH-16 Expressway'}
                </div>
                <div className="text-slate-400">
                  <strong className="text-white">GPS Coordinates:</strong> {selectedIncidentForDetail.latitude?.toFixed(4)}, {selectedIncidentForDetail.longitude?.toFixed(4)}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-800 pt-3">
              <span className="text-[11px] text-slate-500">
                Log ID: {selectedIncidentForDetail.id}
              </span>
              <button
                type="button"
                onClick={() => setSelectedIncidentForDetail(null)}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-1.5 text-xs font-semibold text-white"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DISPATCH UNIT MODAL */}
      {dispatchIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-rose-900/60 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">
                  Dispatch Road Safety Unit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDispatchIncident(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Deploy traffic interceptor patrol for observed zig-zag lane weaving by vehicle{' '}
                <strong className="text-rose-300">{dispatchIncident.track_id}</strong> ({dispatchIncident.license_plate}).
              </p>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Target Interceptor Patrol Unit</label>
                <input
                  type="text"
                  value={dispatchUnitName}
                  onChange={(e) => setDispatchUnitName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Interception / Enforcement Orders</label>
                <textarea
                  rows={3}
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setDispatchIncident(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={isDispatching}
                className="rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-1.5 text-xs font-bold text-white shadow-md transition-colors"
              >
                {isDispatching ? 'Dispatching...' : 'Confirm Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
