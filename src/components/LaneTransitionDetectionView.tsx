import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeftRight,
  Car,
  Bus,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  VolumeX,
  Send,
  RefreshCw,
  Upload,
  Eye,
  Compass,
  Shield,
  ShieldAlert,
  FileText,
  Sparkles,
  Sliders,
  Download,
  Check,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  LaneTransitionComparisonResult,
  CorrectiveTipItem,
  LaneTransitionType,
} from '../types';

interface LaneTransitionDetectionViewProps {
  onNavigateToDriverSafety?: () => void;
  onNavigateToGovAlerts?: () => void;
}

export const LaneTransitionDetectionView: React.FC<LaneTransitionDetectionViewProps> = ({
  onNavigateToDriverSafety,
  onNavigateToGovAlerts,
}) => {
  // Preset list & selected preset
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-nh16-safe-bus');

  // Input photo states
  const [photo1Url, setPhoto1Url] = useState<string>('');
  const [photo2Url, setPhoto2Url] = useState<string>('');
  const [photo1File, setPhoto1File] = useState<File | null>(null);
  const [photo2File, setPhoto2File] = useState<File | null>(null);
  const [photo1Label, setPhoto1Label] = useState<string>('Frame T0: Initial Position');
  const [photo2Label, setPhoto2Label] = useState<string>('Frame T1: Transitioning Position');

  // Operational Context
  const [speedKmh, setSpeedKmh] = useState<number>(55);
  const [roadType, setRoadType] = useState<'HIGHWAY' | 'URBAN' | 'FLYOVER' | 'COASTAL'>('HIGHWAY');
  const [busNumber, setBusNumber] = useState<string>('AP 39 XX 1234 (Bus #842)');

  // Result & State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<LaneTransitionComparisonResult | null>(null);
  const [comparisonMode, setComparisonMode] = useState<'SIDE_BY_SIDE' | 'OVERLAY'>('SIDE_BY_SIDE');

  // Convey tip state
  const [isConveyingTip, setIsConveyingTip] = useState<boolean>(false);
  const [conveySuccessMessage, setConveySuccessMessage] = useState<string | null>(null);

  // Audio TTS State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechVolume, setSpeechVolume] = useState<number>(1.0);

  // Canvas Refs for visual overlay
  const canvas1Ref = useRef<HTMLCanvasElement | null>(null);
  const canvas2Ref = useRef<HTMLCanvasElement | null>(null);
  const file1InputRef = useRef<HTMLInputElement | null>(null);
  const file2InputRef = useRef<HTMLInputElement | null>(null);

  // Load presets on mount
  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const res = await fetch('/api/lane-transition/presets');
      if (res.ok) {
        const data = await res.json();
        setPresets(data);
        if (data.length > 0) {
          loadPreset(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching presets:', err);
    }
  };

  const loadPreset = (preset: any) => {
    setSelectedPresetId(preset.id);
    setPhoto1Url(preset.photo_1.image_url);
    setPhoto2Url(preset.photo_2.image_url);
    setPhoto1File(null);
    setPhoto2File(null);
    setPhoto1Label(preset.photo_1.label);
    setPhoto2Label(preset.photo_2.label);
    triggerPresetComparison(preset.id);
  };

  const triggerPresetComparison = async (presetId: string) => {
    setIsAnalyzing(true);
    setConveySuccessMessage(null);
    try {
      const res = await fetch('/api/lane-transition/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset_id: presetId,
          speed_kmh: speedKmh,
          road_type: roadType,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
      }
    } catch (err) {
      console.error('Failed to compare preset photos:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Photo 1 File Selection
  const handlePhoto1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto1File(file);
      const url = URL.createObjectURL(file);
      setPhoto1Url(url);
      setPhoto1Label(file.name);
      setSelectedPresetId('');
    }
  };

  // Handle Photo 2 File Selection
  const handlePhoto2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto2File(file);
      const url = URL.createObjectURL(file);
      setPhoto2Url(url);
      setPhoto2Label(file.name);
      setSelectedPresetId('');
    }
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Execute Comparison of the 2 photos
  const handleRunComparison = async () => {
    if (!photo1Url || !photo2Url) {
      alert('Please upload or select both Photo 1 and Photo 2 to compare vehicle lane transition.');
      return;
    }

    setIsAnalyzing(true);
    setConveySuccessMessage(null);

    try {
      let b64_1 = '';
      let b64_2 = '';
      if (photo1File) b64_1 = await fileToBase64(photo1File);
      if (photo2File) b64_2 = await fileToBase64(photo2File);

      const payload = {
        photo1_url: photo1Url,
        photo1_label: photo1Label,
        photo1_base64: b64_1,
        photo2_url: photo2Url,
        photo2_label: photo2Label,
        photo2_base64: b64_2,
        speed_kmh: speedKmh,
        road_type: roadType,
        preset_id: selectedPresetId || undefined,
      };

      const res = await fetch('/api/lane-transition/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
      } else {
        const err = await res.json();
        alert(`Analysis failed: ${err.error || 'Server error'}`);
      }
    } catch (err: any) {
      console.error('Error running transition analysis:', err);
      alert('Failed to execute lane transition detection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Convey Corrective Tip to Driver Cabin / Telematics
  const handleConveyTip = async (tip?: CorrectiveTipItem) => {
    if (!analysisResult) return;
    setIsConveyingTip(true);

    const title = tip ? tip.title : 'Lane Transition Safety Advisory';
    const message = tip ? tip.actionable_rule : analysisResult.driver_coaching_summary;

    try {
      const res = await fetch('/api/lane-transition/convey-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bus_number: busNumber,
          tip_title: title,
          tip_message: message,
          transition_type: analysisResult.transition_type,
          severity: analysisResult.hazard_severity,
          tts_spoken_tip: analysisResult.tts_spoken_tip,
        }),
      });

      if (res.ok) {
        setConveySuccessMessage(`Tip conveyed to ${busNumber} cabin console & logged to transit telemetry.`);
        // Play voice coaching automatically upon transmission
        playVoiceCoaching(analysisResult.tts_spoken_tip);
      }
    } catch (err) {
      console.error('Failed to convey tip:', err);
    } finally {
      setIsConveyingTip(false);
    }
  };

  // Voice Coaching Audio Playback via Web Speech API
  const playVoiceCoaching = (text?: string) => {
    const speakText = text || analysisResult?.tts_spoken_tip;
    if (!speakText) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel any active utterance
      const utterance = new SpeechSynthesisUtterance(speakText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = speechVolume;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } else {
      alert(`[Voice Coaching]: ${speakText}`);
    }
  };

  const stopVoiceCoaching = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Render Visual Canvas Overlays
  useEffect(() => {
    if (!analysisResult) return;

    // Draw Canvas 1
    const c1 = canvas1Ref.current;
    if (c1) {
      const ctx = c1.getContext('2d');
      if (ctx) {
        const w = c1.width;
        const h = c1.height;
        ctx.clearRect(0, 0, w, h);

        const bbox1 = analysisResult.photo_1.vehicle_bbox; // [ymin, xmin, ymax, xmax] %
        const [y1, x1, y2, x2] = bbox1;
        const vx = (x1 / 100) * w;
        const vy = (y1 / 100) * h;
        const vw = ((x2 - x1) / 100) * w;
        const vh = ((y2 - y1) / 100) * h;

        // Lane lines (Perspective guide)
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        // Left boundary
        ctx.beginPath();
        ctx.moveTo(w * 0.28, h * 0.95);
        ctx.lineTo(w * 0.42, h * 0.45);
        ctx.stroke();
        // Right boundary
        ctx.beginPath();
        ctx.moveTo(w * 0.72, h * 0.95);
        ctx.lineTo(w * 0.58, h * 0.45);
        ctx.stroke();
        ctx.setLineDash([]);

        // Vehicle Bounding Box
        ctx.strokeStyle = '#10B981'; // Emerald
        ctx.lineWidth = 3;
        ctx.strokeRect(vx, vy, vw, vh);

        // Fill tint
        ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
        ctx.fillRect(vx, vy, vw, vh);

        // Header label
        ctx.fillStyle = '#10B981';
        ctx.fillRect(vx, vy - 22, 140, 22);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`T0: ${analysisResult.photo_1.vehicle_type} (LANE 2)`, vx + 6, vy - 7);

        // Center line marker
        const centerX = vx + vw / 2;
        ctx.strokeStyle = '#34D399';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, vy);
        ctx.lineTo(centerX, vy + vh);
        ctx.stroke();
      }
    }

    // Draw Canvas 2
    const c2 = canvas2Ref.current;
    if (c2) {
      const ctx = c2.getContext('2d');
      if (ctx) {
        const w = c2.width;
        const h = c2.height;
        ctx.clearRect(0, 0, w, h);

        const bbox2 = analysisResult.photo_2.vehicle_bbox;
        const [y1, x1, y2, x2] = bbox2;
        const vx = (x1 / 100) * w;
        const vy = (y1 / 100) * h;
        const vw = ((x2 - x1) / 100) * w;
        const vh = ((y2 - y1) / 100) * h;

        const isViolation = analysisResult.is_violation;
        const boxColor = isViolation ? '#EF4444' : '#0EA5E9'; // Red if violation, Sky blue if safe

        // Lane lines
        ctx.strokeStyle = isViolation ? 'rgba(239, 68, 68, 0.6)' : 'rgba(14, 165, 233, 0.5)';
        ctx.lineWidth = 2.5;
        if (analysisResult.lane_marking_type === 'SOLID_WHITE') {
          ctx.setLineDash([]); // solid
        } else {
          ctx.setLineDash([8, 6]);
        }
        // Left boundary
        ctx.beginPath();
        ctx.moveTo(w * 0.28, h * 0.95);
        ctx.lineTo(w * 0.42, h * 0.45);
        ctx.stroke();
        // Right boundary
        ctx.beginPath();
        ctx.moveTo(w * 0.72, h * 0.95);
        ctx.lineTo(w * 0.58, h * 0.45);
        ctx.stroke();
        ctx.setLineDash([]);

        // Vehicle Bounding Box
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(vx, vy, vw, vh);

        // Fill tint
        ctx.fillStyle = isViolation ? 'rgba(239, 68, 68, 0.18)' : 'rgba(14, 165, 233, 0.12)';
        ctx.fillRect(vx, vy, vw, vh);

        // Label
        ctx.fillStyle = boxColor;
        ctx.fillRect(vx, vy - 22, 175, 22);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`T1: ${analysisResult.transition_type}`, vx + 6, vy - 7);

        // Trajectory Vector Arrow from T0 center to T1 center
        const bbox1 = analysisResult.photo_1.vehicle_bbox;
        const center1X = (((bbox1[1] + bbox1[3]) / 2) / 100) * w;
        const center1Y = (((bbox1[0] + bbox1[2]) / 2) / 100) * h;
        const center2X = vx + vw / 2;
        const center2Y = vy + vh / 2;

        ctx.strokeStyle = '#F59E0B'; // Amber vector
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(center1X, center1Y);
        ctx.lineTo(center2X, center2Y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow head
        const angle = Math.atan2(center2Y - center1Y, center2X - center1X);
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.moveTo(center2X, center2Y);
        ctx.lineTo(center2X - 12 * Math.cos(angle - Math.PI / 6), center2Y - 12 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(center2X - 12 * Math.cos(angle + Math.PI / 6), center2Y - 12 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        // Vector measurement annotation
        ctx.fillStyle = '#F59E0B';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`ΔX: ${analysisResult.lateral_displacement_m}m (${analysisResult.transition_angle_deg}°)`, (center1X + center2X) / 2 - 30, (center1Y + center2Y) / 2 - 10);
      }
    }
  }, [analysisResult]);

  const getTransitionBadge = (type: LaneTransitionType) => {
    switch (type) {
      case 'SAFE_LANE_CHANGE':
        return {
          label: 'Safe Lane Change (Compliant)',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: CheckCircle2,
        };
      case 'ABRUPT_CUT_IN':
        return {
          label: 'Abrupt Cut-In Hazard (Steep Angle)',
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: AlertTriangle,
        };
      case 'SOLID_LINE_VIOLATION':
        return {
          label: 'Solid Line Crossing Violation (MV Act Sec 177)',
          color: 'bg-red-500/25 text-red-300 border-red-500/50',
          icon: ShieldAlert,
        };
      case 'SLOW_DRIFT_DEPARTURE':
        return {
          label: 'Slow Unintentional Drift (Fatigue / Distraction)',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: Compass,
        };
      case 'EMERGENCY_EVASION':
        return {
          label: 'Emergency Hazard / Pothole Evasion',
          color: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          icon: Zap,
        };
      default:
        return {
          label: type,
          color: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          icon: ArrowLeftRight,
        };
    }
  };

  return (
    <div id="lane-transition-detection-view" className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#0B132B] to-slate-900 p-5 rounded-2xl border border-sky-900/40 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40">
              <ArrowLeftRight className="h-5 w-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              2-Photo Vehicle Lane Transition Detection & Driver Coaching
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
            Upload two vehicle photos (Frame T0 & Frame T1) or select benchmark highway scenarios to compare lateral displacement, detect hazardous cut-ins or solid-line violations, and convey actionable corrective tips directly to the vehicle console.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateToDriverSafety?.()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Eye className="h-4 w-4 text-emerald-400" />
            <span>Driver Attention Cabin</span>
          </button>

          <button
            onClick={() => onNavigateToGovAlerts?.()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border border-rose-800/50 transition-colors"
          >
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span>Gov Alert Logs</span>
          </button>
        </div>
      </div>

      {/* Preset Scenarios Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Pre-Loaded Benchmark Scenarios (1-Click Test Pairs)</span>
          </span>
          <span className="text-[11px] text-slate-400">IRC:35 & MV Act 1988 Reference Standard</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className={`text-left p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-950/60 border-sky-500 shadow-lg shadow-sky-950/50 ring-1 ring-sky-500/40'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {preset.vehicle_type}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        preset.is_violation
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {preset.is_violation ? 'VIOLATION' : 'COMPLIANT'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{preset.title.split(':')[0]}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{preset.description}</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Score: {preset.safety_score}/100</span>
                  <span className="text-sky-400 font-bold">{isSelected ? 'Active Selection' : 'Load Pair →'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-Photo Upload & Comparison Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Photo 1: Initial State (Frame T0) */}
        <div className="rounded-2xl border border-slate-800 bg-[#0C1220] p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs">
                A
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Photo 1: Initial Vehicle State (Frame T0)</h3>
                <p className="text-[11px] text-slate-400">Vehicle in origin lane prior to or initiating maneuver</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              ORIGIN LANE
            </span>
          </div>

          {/* Photo 1 Preview / Dropzone */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group">
            {photo1Url ? (
              <>
                <img
                  src={photo1Url}
                  alt="Photo 1 Vehicle Initial State"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {/* Canvas Overlay */}
                <canvas
                  ref={canvas1Ref}
                  width={640}
                  height={360}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4">
                <Upload className="h-8 w-8 mb-2 opacity-50" />
                <span className="text-xs font-semibold">No Image Selected</span>
                <span className="text-[10px]">Click below to upload vehicle photo 1</span>
              </div>
            )}
          </div>

          {/* Photo 1 Controls & File Picker */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={photo1Label}
                onChange={(e) => setPhoto1Label(e.target.value)}
                placeholder="Photo 1 description or timestamp label..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => file1InputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-sky-400" />
                <span>Upload Photo 1</span>
              </button>
              <input
                ref={file1InputRef}
                type="file"
                accept="image/*"
                onChange={handlePhoto1Change}
                className="hidden"
              />
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Supports JPG, PNG, WEBP, or Dashcam Keyframes</span>
              <span className="text-emerald-400 font-mono">Status: {photo1Url ? 'Loaded' : 'Empty'}</span>
            </div>
          </div>
        </div>

        {/* Photo 2: Secondary / Transitioning State (Frame T1) */}
        <div className="rounded-2xl border border-slate-800 bg-[#0C1220] p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 font-black text-xs">
                B
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Photo 2: Transitioning State (Frame T1)</h3>
                <p className="text-[11px] text-slate-400">Vehicle straddling or completed lane shift</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              TARGET / DELIMITER
            </span>
          </div>

          {/* Photo 2 Preview / Dropzone */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group">
            {photo2Url ? (
              <>
                <img
                  src={photo2Url}
                  alt="Photo 2 Vehicle Transition State"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {/* Canvas Overlay */}
                <canvas
                  ref={canvas2Ref}
                  width={640}
                  height={360}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4">
                <Upload className="h-8 w-8 mb-2 opacity-50" />
                <span className="text-xs font-semibold">No Image Selected</span>
                <span className="text-[10px]">Click below to upload vehicle photo 2</span>
              </div>
            )}
          </div>

          {/* Photo 2 Controls & File Picker */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={photo2Label}
                onChange={(e) => setPhoto2Label(e.target.value)}
                placeholder="Photo 2 description or timestamp label..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => file2InputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-sky-400" />
                <span>Upload Photo 2</span>
              </button>
              <input
                ref={file2InputRef}
                type="file"
                accept="image/*"
                onChange={handlePhoto2Change}
                className="hidden"
              />
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Supports JPG, PNG, WEBP, or Dashcam Keyframes</span>
              <span className="text-sky-400 font-mono">Status: {photo2Url ? 'Loaded' : 'Empty'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Parameters & Run Bar */}
      <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          {/* Speed slider */}
          <div className="flex flex-col gap-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800 min-w-[170px]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Vehicle Speed:</span>
              <span className="text-white font-mono font-bold">{speedKmh} km/h</span>
            </div>
            <input
              type="range"
              min={20}
              max={110}
              step={5}
              value={speedKmh}
              onChange={(e) => setSpeedKmh(Number(e.target.value))}
              className="accent-sky-500 h-1.5 cursor-pointer bg-slate-800 rounded-lg"
            />
          </div>

          {/* Road Type Selector */}
          <div className="flex flex-col gap-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800 min-w-[170px]">
            <span className="text-[11px] text-slate-400">Road Corridor:</span>
            <select
              value={roadType}
              onChange={(e) => setRoadType(e.target.value as any)}
              className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="HIGHWAY" className="bg-slate-900 text-white">NH-16 Dual Carriageway</option>
              <option value="URBAN" className="bg-slate-900 text-white">Urban Arterial (3 Lanes)</option>
              <option value="FLYOVER" className="bg-slate-900 text-white">Flyover Approach Ramp</option>
              <option value="COASTAL" className="bg-slate-900 text-white">Beach Road Coastal Route</option>
            </select>
          </div>

          {/* Bus / Vehicle Identifier */}
          <div className="flex flex-col gap-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800 min-w-[170px]">
            <span className="text-[11px] text-slate-400">Target Fleet Unit:</span>
            <input
              type="text"
              value={busNumber}
              onChange={(e) => setBusNumber(e.target.value)}
              className="bg-transparent text-xs text-white font-semibold focus:outline-none"
              placeholder="e.g. AP 39 XX 1234"
            />
          </div>
        </div>

        {/* Big Compare Button */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0 justify-end">
          <button
            onClick={handleRunComparison}
            disabled={isAnalyzing}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-sky-600/25 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Analyzing Dual Frames & Trajectory...</span>
              </>
            ) : (
              <>
                <ArrowLeftRight className="h-4 w-4" />
                <span>Compare Photos & Detect Transition</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Maneuver Status & Telemetry Strip */}
          {(() => {
            const badge = getTransitionBadge(analysisResult.transition_type);
            const BadgeIcon = badge.icon;
            return (
              <div className="bg-[#0D1527] rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <span className={`p-2 rounded-xl border ${badge.color}`}>
                      <BadgeIcon className="h-6 w-6" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>
                        {analysisResult.is_violation && (
                          <span className="text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded font-bold">
                            ⚠️ STATUTORY VIOLATION
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">
                          Model: {analysisResult.model_name} (Confidence: {(analysisResult.confidence * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-200 mt-1">
                        {analysisResult.driver_coaching_summary}
                      </p>
                    </div>
                  </div>

                  {/* Safety Score Meter */}
                  <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800 shrink-0">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Safety Rating</div>
                      <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
                        <span
                          className={
                            analysisResult.safety_score >= 80
                              ? 'text-emerald-400'
                              : analysisResult.safety_score >= 50
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }
                        >
                          {analysisResult.safety_score}
                        </span>
                        <span className="text-xs text-slate-500 font-normal">/100</span>
                      </div>
                    </div>
                    <div className="h-10 w-px bg-slate-800" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Hazard Class</div>
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                          analysisResult.hazard_severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400'
                            : analysisResult.hazard_severity === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-400'
                            : analysisResult.hazard_severity === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {analysisResult.hazard_severity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6 Key Spatial Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Lateral Shift</span>
                    <span className="text-base sm:text-lg font-black text-sky-400 font-mono">
                      {analysisResult.lateral_displacement_m} m
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{analysisResult.transition_direction}</span>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Transition Angle</span>
                    <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
                      {analysisResult.transition_angle_deg}°
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {analysisResult.transition_angle_deg > 12 ? '⚠️ Steep / Jerky' : '✓ Normal Steering'}
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Lateral Velocity</span>
                    <span className="text-base sm:text-lg font-black text-white font-mono">
                      {analysisResult.lateral_velocity_mps} m/s
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {analysisResult.lateral_velocity_mps > 0.8 ? 'Excessive rate' : 'Smooth merge'}
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Straddling Delimiter</span>
                    <span className="text-base sm:text-lg font-black text-indigo-400 font-mono">
                      {analysisResult.lane_straddling_pct}%
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Vehicle body overlap</span>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Turn Indicator</span>
                    <span
                      className={`text-sm sm:text-base font-black font-mono ${
                        analysisResult.turn_indicator_detected ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {analysisResult.turn_indicator_detected ? '🟢 SIGNAL ON' : '🔴 NO SIGNAL'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {analysisResult.turn_indicator_detected ? 'Signal verified' : 'Statutory penalty'}
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Pavement Marker</span>
                    <span className="text-sm font-bold text-slate-200 font-mono truncate block">
                      {analysisResult.lane_marking_type}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {analysisResult.lane_marking_type === 'SOLID_WHITE' ? '⚠️ Crossing illegal' : 'Permitted zone'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* CORRECT TIPS CONVEYING SECTION (CORE HIGHLIGHT) */}
          <div className="bg-gradient-to-br from-[#0F172A] via-[#091122] to-[#0A0F1D] rounded-2xl border border-sky-500/30 p-5 sm:p-6 shadow-2xl space-y-6">
            {/* Action Bar for Conveying Tips */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                    <Compass className="h-4 w-4" />
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Actionable Corrective Tips & Driver Coaching Advice
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Convey these tailored, IRC:35 & Motor Vehicles Act compliance tips directly to the driver cabin display or audio telematics.
                </p>
              </div>

              {/* Action Buttons: Voice Coaching & Convey to Cabin */}
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                {/* Voice Coaching Readout Button */}
                <button
                  type="button"
                  onClick={() => (isSpeaking ? stopVoiceCoaching() : playVoiceCoaching())}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    isSpeaking
                      ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                  }`}
                  title="Audible voice guidance for driver"
                >
                  {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  <span>{isSpeaking ? 'Stop Voice Coaching' : '🔊 Play Audio Tip'}</span>
                </button>

                {/* Transmit to Vehicle Telematics Console */}
                <button
                  type="button"
                  onClick={() => handleConveyTip()}
                  disabled={isConveyingTip}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isConveyingTip ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Convey Tip to Vehicle #{busNumber.split(' ')[0]}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Transmission Confirmation Alert Banner */}
            {conveySuccessMessage && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{conveySuccessMessage}</span>
              </div>
            )}

            {/* In-Cabin Live Broadcast Telematics Card */}
            <div className="p-4 rounded-xl bg-[#080D1A] border border-sky-800/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-sky-600/30 text-sky-300 font-mono text-[10px] font-bold rounded-bl-lg border-l border-b border-sky-500/30 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>IN-CABIN HEADS-UP DISPLAY (HUD) STREAM</span>
              </div>

              <div className="space-y-1 max-w-2xl">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Priority Directive:
                </span>
                <p className="text-base sm:text-lg font-black text-white italic leading-snug">
                  "{analysisResult.tts_spoken_tip}"
                </p>
                <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-3">
                  <span>Target Unit: <strong className="text-slate-200">{busNumber}</strong></span>
                  <span>•</span>
                  <span>Audio Coaching: <strong className="text-amber-400">Ready</strong></span>
                </div>
              </div>
            </div>

            {/* Categorized Coaching Cards */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Detailed Regulatory & Defensive Driving Recommendations:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {analysisResult.corrective_tips.map((tip, idx) => {
                  const urgencyStyle =
                    tip.urgency === 'MANDATORY'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : tip.urgency === 'RECOMMENDED'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/30';

                  return (
                    <div
                      key={tip.id || idx}
                      className="rounded-xl border border-slate-800/90 bg-[#0B1222] p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${urgencyStyle}`}>
                            {tip.urgency}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{tip.category}</span>
                        </div>

                        <h5 className="text-sm font-bold text-white leading-tight">{tip.title}</h5>
                        <p className="text-xs text-slate-300 leading-relaxed">{tip.description}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-200 font-medium">
                          <strong className="text-sky-400">Rule: </strong>
                          {tip.actionable_rule}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-mono text-slate-500">{tip.irc_reference || 'IRC:35-2015 Guideline'}</span>
                          <button
                            type="button"
                            onClick={() => handleConveyTip(tip)}
                            className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                          >
                            <span>Send Single Tip</span>
                            <Send className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
