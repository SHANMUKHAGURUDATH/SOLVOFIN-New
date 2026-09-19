import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Eye,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Camera,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Play,
  Square,
  Activity,
  UserCheck,
  UserX,
  Compass,
  MapPin,
  Clock,
  RefreshCw,
  Send,
  Video,
  Download,
  Flame,
  CheckCircle2,
  Info,
  Sparkles,
  Scan,
} from 'lucide-react';
import {
  DriverSafetyEvent,
  DriverSafetyMetrics,
  DriverRiskLevel,
  DriverAttentionDirection,
} from '../types';
import {
  faceCvEngine,
  DetectedFace,
  DEFAULT_CONFIG,
  DrowsinessEngineConfig,
} from '../utils/faceCvEngine';
import { DriverSafetyAIInsightCard } from './DriverSafetyAIInsightCard';
import { DriverSafetyAIInsight } from '../../server/driverSafetyAITypes';
import { HumanReviewStatus } from '../../server/infrastructureAITypes';

interface DriverSafetyViewProps {
  onNavigateToGovAlerts?: () => void;
}

const SAMPLE_BUSES = [
  { id: 'BUS-01', number: 'AP 39 XX 1234', route: 'BUS-18-NORTH (Visakhapatnam Corridor)', driver: 'K. Ramana Murthy (Badge #842)' },
  { id: 'BUS-02', number: 'AP 31 Z 9884', route: 'BUS-07-EXPRESS (Madhurawada Express)', driver: 'V. Srinivasa Rao (Badge #619)' },
  { id: 'BUS-03', number: 'AP 39 TG 2041', route: 'BUS-22-COASTAL (Beach Road Corridor)', driver: 'P. Venkat Reddy (Badge #904)' },
  { id: 'BUS-04', number: 'AP 31 TV 9204', route: 'BUS-12-FEEDER (Gajuwaka Industrial)', driver: 'B. Jagadeesh (Badge #455)' },
];

export const DriverSafetyView: React.FC<DriverSafetyViewProps> = ({ onNavigateToGovAlerts }) => {
  // Video & Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Stream & Camera State
  const [cameraSource, setCameraSource] = useState<'WEBCAM' | 'SIMULATION' | 'CABIN_IP'>('WEBCAM');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Selected Bus & Fleet Context
  const [selectedBusNumber, setSelectedBusNumber] = useState<string>('AP 39 XX 1234');
  const [selectedCameraId, setSelectedCameraId] = useState<string>('CAM-DRIVER-CABIN-01');
  const [currentGps, setCurrentGps] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: 17.7342,
    longitude: 83.3248,
  });

  // Real-time Metrics & HUD State
  const [metrics, setMetrics] = useState<DriverSafetyMetrics>({
    ear_left: 0.32,
    ear_right: 0.32,
    ear_avg: 0.32,
    mar: 0.22,
    perclos: 8,
    blink_count: 0,
    blink_rate_bpm: 16,
    head_yaw: 0,
    head_pitch: 0,
    head_roll: 0,
    attention_direction: 'FORWARD',
    face_detected: false,
    face_visibility_score: 0,
    lighting_quality: 'GOOD',
    fps: 0,
    risk_score: 12,
    risk_level: 'NORMAL',
  });

  // Recent Triggered Events Log
  const [events, setEvents] = useState<DriverSafetyEvent[]>([]);
  const [selectedEventSnapshot, setSelectedEventSnapshot] = useState<DriverSafetyEvent | null>(null);

  // Engine Configuration & Sensitivity Controls
  const [config, setConfig] = useState<DrowsinessEngineConfig>(DEFAULT_CONFIG);
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);

  // Camera & Visual Landmark Overlays
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [showDenseMesh, setShowDenseMesh] = useState<boolean>(false);
  const [showEyeZoom, setShowEyeZoom] = useState<boolean>(true);
  const [activeModelName, setActiveModelName] = useState<string>(faceCvEngine.getActiveDetectorName());

  // Audio & Alert State
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(85);
  const [lastAlertMessage, setLastAlertMessage] = useState<string | null>(null);

  // Sync status
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Part 6: Driver Safety AI Intelligence & RAG Grounded Insight
  const [aiInsight, setAiInsight] = useState<DriverSafetyAIInsight | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Acquire Geolocation
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentGps({
            latitude: Math.round(pos.coords.latitude * 10000) / 10000,
            longitude: Math.round(pos.coords.longitude * 10000) / 10000,
          });
        },
        () => {
          // Default to Visakhapatnam central corridor
          setCurrentGps({ latitude: 17.7342, longitude: 83.3248 });
        }
      );
    }
  }, []);

  // Fetch past driver events and latest AI insights on bus selection
  useEffect(() => {
    fetchDriverEvents();
    fetchLatestAiInsight();
  }, [selectedBusNumber]);

  const fetchDriverEvents = async () => {
    try {
      const res = await fetch(`/api/driver-safety/events?bus_number=${selectedBusNumber}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Error fetching driver events:', err);
    }
  };

  const fetchLatestAiInsight = async () => {
    try {
      const res = await fetch('/api/driver-safety/ai-insights');
      if (res.ok) {
        const list: DriverSafetyAIInsight[] = await res.json();
        if (list && list.length > 0) {
          const matching = list.find((i) => i.inputSummary?.busNumberText === selectedBusNumber) || list[0];
          setAiInsight(matching);
          return;
        }
      }
      // Generate initial baseline insight for current bus & route
      generateAiInsightForCurrentStream(false);
    } catch (err) {
      console.warn('Could not fetch existing AI insights:', err);
    }
  };

  const generateAiInsightForEvent = async (evt: Partial<DriverSafetyEvent>) => {
    try {
      setIsAiLoading(true);
      const payload = {
        eventId: evt.id,
        eventType: evt.event_type || 'PROLONGED_DROWSINESS',
        severity: evt.severity || 'WARNING',
        confidence: evt.confidence ?? null,
        riskScore: evt.risk_score ?? null,
        durationSec: evt.duration_sec ?? 1.8,
        metrics: evt.metrics,
        busNumber: evt.bus_number || selectedBusNumber,
        cameraId: evt.camera_id || selectedCameraId,
        location: {
          latitude: evt.latitude ?? currentGps.latitude,
          longitude: evt.longitude ?? currentGps.longitude,
        },
        timestamp: evt.timestamp || new Date().toISOString(),
        notes: evt.notes,
        sourceModule: 'FACE_DROWSINESS_CV',
      };

      const res = await fetch('/api/driver-safety/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data: DriverSafetyAIInsight = await res.json();
        setAiInsight(data);
        const el = document.getElementById('driver-safety-ai-intelligence-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } catch (err) {
      console.error('Error generating driver safety AI insight:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const generateAiInsightForCurrentStream = async (scrollIntoView: boolean = true) => {
    try {
      setIsAiLoading(true);
      const isNominal = metrics.risk_level === 'NORMAL' || metrics.risk_level === 'LOW';
      const eventType = isNominal ? 'GENERAL_ATTENTION_VARIATION' : (metrics.mar > 0.6 ? 'YAWN' : 'PROLONGED_DROWSINESS');
      const payload = {
        eventType,
        severity: metrics.risk_level,
        confidence: metrics.face_detected ? 0.94 : null,
        riskScore: metrics.risk_score,
        durationSec: 1.5,
        metrics: {
          ear_avg: metrics.ear_avg,
          ear_left: metrics.ear_left,
          ear_right: metrics.ear_right,
          mar: metrics.mar,
          perclos: metrics.perclos,
          head_pitch: metrics.head_pitch,
          head_yaw: metrics.head_yaw,
          head_roll: metrics.head_roll,
          blink_rate_bpm: metrics.blink_rate_bpm,
          attention_direction: metrics.attention_direction,
          lighting_quality: metrics.lighting_quality,
        },
        busNumber: selectedBusNumber,
        cameraId: selectedCameraId,
        location: {
          latitude: currentGps.latitude,
          longitude: currentGps.longitude,
        },
        timestamp: new Date().toISOString(),
        notes: `Cabin visual stream analysis (${metrics.attention_direction}, PERCLOS ${metrics.perclos}%)`,
        sourceModule: 'FACE_DROWSINESS_CV',
      };

      const res = await fetch('/api/driver-safety/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data: DriverSafetyAIInsight = await res.json();
        setAiInsight(data);
        if (scrollIntoView) {
          const el = document.getElementById('driver-safety-ai-intelligence-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    } catch (err) {
      console.error('Error generating AI insight for stream:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleHumanReviewSubmit = async (
    status: HumanReviewStatus,
    comments: string,
    modifiedRecommendation?: string
  ) => {
    if (!aiInsight) return;
    const res = await fetch('/api/driver-safety/human-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        insightId: aiInsight.id,
        status,
        reviewerComments: comments,
        modifiedRecommendation,
        reviewedBy: 'Senior Transit Safety Supervisor',
        reviewerRole: 'AUTHORITY',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.insight) {
        setAiInsight(data.insight);
      }
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    faceCvEngine.initAudioContext();
    await faceCvEngine.initMediaPipe();
    setActiveModelName(faceCvEngine.getActiveDetectorName());

    try {
      if (cameraSource === 'WEBCAM') {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 }, facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsStreaming(true);
        }
      } else {
        // Simulation or Simulated IP feed
        setIsStreaming(true);
      }
    } catch (err: any) {
      console.error('Error accessing webcam:', err);
      setCameraError('Unable to access webcam. Please check browser permissions or switch to demo simulation.');
      setIsStreaming(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    setIsStreaming(false);
  };

  // Capture Snapshot Frame for Evidence
  const captureSnapshot = (): string => {
    if (!canvasRef.current) return '';
    return canvasRef.current.toDataURL('image/jpeg', 0.85);
  };

  // Process Video Frame Loop
  const processFrame = useCallback(() => {
    if (!isStreaming) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (canvas && (video || cameraSource !== 'WEBCAM')) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let inputElement: HTMLVideoElement | HTMLCanvasElement = video!;
        if (cameraSource === 'WEBCAM' && video && video.readyState >= 2) {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }
          }
          const width = canvas.width || 640;
          const height = canvas.height || 480;

          // Clear canvas
          ctx.clearRect(0, 0, width, height);

          // Render live webcam video onto canvas with mirror selection
          if (isMirrored) {
            ctx.save();
            ctx.translate(width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, width, height);
            ctx.restore();
          } else {
            ctx.drawImage(video, 0, 0, width, height);
          }
          inputElement = canvas;
        } else if (cameraSource !== 'WEBCAM' || !video || video.readyState < 2) {
          const width = canvas.width || 640;
          const height = canvas.height || 480;
          ctx.clearRect(0, 0, width, height);

          // Draw simulated driver cabin gradient on canvas
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, width, height);

          // Draw simulated cabin windshield & steering wheel outline
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 3;
          ctx.strokeRect(width * 0.15, height * 0.1, width * 0.7, height * 0.6);
          ctx.beginPath();
          ctx.arc(width * 0.5, height * 0.85, width * 0.22, 0, Math.PI, true);
          ctx.stroke();

          inputElement = canvas;
        }

        // Run CV Engine
        const result = faceCvEngine.processVideoFrame(inputElement);
        setMetrics(result.metrics);
        setActiveModelName(faceCvEngine.getActiveDetectorName());

        // Draw facial landmarks overlay if face detected
        if (result.face) {
          faceCvEngine.drawLandmarks(
            ctx,
            result.face.landmarks,
            result.face.box,
            result.metrics.risk_level,
            result.metrics.ear_avg,
            result.metrics.mar,
            { showDenseMesh, showEyeZoom }
          );
        }

        // Handle Triggered Safety Event
        if (result.triggeredEvent) {
          const snapshot = captureSnapshot();
          const newEvent: DriverSafetyEvent = {
            id: `EVT-DS-${Date.now().toString().slice(-6)}`,
            bus_number: selectedBusNumber,
            event_type: result.triggeredEvent.type,
            severity: result.triggeredEvent.severity,
            confidence: result.triggeredEvent.confidence,
            risk_score: result.triggeredEvent.risk_score,
            timestamp: new Date().toISOString(),
            duration_sec: result.triggeredEvent.duration_sec,
            latitude: currentGps.latitude,
            longitude: currentGps.longitude,
            gps_status: currentGps.latitude ? 'ACTIVE' : 'UNAVAILABLE',
            camera_id: selectedCameraId,
            evidence_snapshot: snapshot,
            model_version: 'SOLVOFIN-FaceAttention-v3.4',
            status: result.triggeredEvent.severity === 'CRITICAL' ? 'ACTIVE' : 'ACKNOWLEDGED',
            metrics: result.metrics,
            notes: result.triggeredEvent.notes,
          };

          setLastAlertMessage(`[${newEvent.severity}] ${newEvent.event_type.replace(/_/g, ' ')}: ${newEvent.notes}`);

          // Post event to backend API
          fetch('/api/driver-safety/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEvent),
          })
            .then((res) => res.json())
            .then(() => {
              setEvents((prev) => [newEvent, ...prev]);
              if (newEvent.severity === 'WARNING' || newEvent.severity === 'CRITICAL') {
                generateAiInsightForEvent(newEvent);
              }
            })
            .catch((err) => console.error('Error logging safety event:', err));
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(processFrame);
  }, [isStreaming, cameraSource, selectedBusNumber, selectedCameraId, currentGps, isMirrored, showDenseMesh, showEyeZoom]);

  useEffect(() => {
    if (isStreaming) {
      animFrameIdRef.current = requestAnimationFrame(processFrame);
    } else if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isStreaming, processFrame]);

  // Update Config Helper
  const handleConfigChange = (key: keyof DrowsinessEngineConfig, value: any) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    faceCvEngine.updateConfig(updated);
  };

  // Test Alert Trigger Button
  const handleTestAlert = (severity: 'WARNING' | 'CRITICAL') => {
    const testMsg =
      severity === 'CRITICAL'
        ? 'CRITICAL DRIVER ALERT. Driver drowsiness detected. Pull over safely.'
        : 'Driver drowsiness detected. Please stay alert.';
    faceCvEngine.playAudioAlert(severity, testMsg);
    setLastAlertMessage(`[TEST ${severity}] ${testMsg}`);
  };

  // Status color styles
  const getRiskColor = (level: DriverRiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
      case 'WARNING':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'LOW':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'NORMAL':
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  return (
    <div id="driver-safety-monitoring-page" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Radio className="h-4 w-4 animate-pulse" />
            <span>CONTINUOUS CABIN TELEMETRY • DRIVER SAFETY SYSTEM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            Driver Safety & Drowsiness Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
            Real-time multi-signal computer vision pipeline: EAR eye aspect ratio, MAR yawn temporal analysis, 3D head pose estimation, and automated Government dispatcher alert synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigateToGovAlerts && (
            <button
              onClick={onNavigateToGovAlerts}
              className="bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-700/50 px-3.5 py-2 rounded text-xs font-bold transition-colors flex items-center shadow-sm"
            >
              <ShieldAlert className="h-4 w-4 mr-1.5 text-rose-400" /> Government Alerts Hub
            </button>
          )}
          <button
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded text-xs font-semibold transition-colors flex items-center"
          >
            <Sliders className="h-4 w-4 mr-1.5 text-cyan-400" /> Sensitivity Parameters
          </button>
          <button
            onClick={() => handleTestAlert('WARNING')}
            className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 px-3 py-2 rounded text-xs font-medium transition-colors flex items-center"
          >
            <Volume2 className="h-3.5 w-3.5 mr-1" /> Test Audio Alert
          </button>
        </div>
      </div>

      {/* Camera & Bus Control Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0F172A] p-4 rounded-lg border border-slate-800">
        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">MONITORED BUS NUMBER</label>
          <select
            value={selectedBusNumber}
            onChange={(e) => setSelectedBusNumber(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
          >
            {SAMPLE_BUSES.map((b) => (
              <option key={b.id} value={b.number}>
                {b.number} — {b.route.split(' ')[0]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">CAMERA SOURCE</label>
          <select
            value={cameraSource}
            onChange={(e) => {
              if (isStreaming) stopCamera();
              setCameraSource(e.target.value as any);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
          >
            <option value="WEBCAM">DEMO CAMERA (Browser Webcam / USB)</option>
            <option value="SIMULATION">SIMULATED CABIN STREAM (Edge AI Demo)</option>
            <option value="CABIN_IP">RTSP / IP DRIVER CABIN (CAM-DRIVER-01)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">GPS TELEMETRY</label>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-300 font-mono">
            <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              {currentGps.latitude ? `${currentGps.latitude.toFixed(4)}° N, ${currentGps.longitude?.toFixed(4)}° E` : 'GPS UNAVAILABLE'}
            </span>
          </div>
        </div>

        <div className="flex items-end gap-2">
          {!isStreaming ? (
            <button
              onClick={startCamera}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded text-xs transition-colors flex items-center justify-center shadow-md shadow-emerald-500/20"
            >
              <Play className="h-4 w-4 mr-1.5 fill-current" /> START MONITORING
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded text-xs transition-colors flex items-center justify-center shadow-md shadow-rose-500/20"
            >
              <Square className="h-4 w-4 mr-1.5 fill-current" /> STOP MONITORING
            </button>
          )}
        </div>
      </div>

      {cameraError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{cameraError}</span>
          </div>
          <button
            onClick={() => {
              setCameraSource('SIMULATION');
              setCameraError(null);
            }}
            className="underline font-mono text-[11px] hover:text-white"
          >
            Switch to Simulation
          </button>
        </div>
      )}

      {/* Computer Vision Model Status & Overlay Precision Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0F172A] border border-slate-800 rounded-lg text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">CV Model:</span>
          <span className="text-cyan-300 font-bold flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            {activeModelName}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors select-none">
            <input
              type="checkbox"
              checked={isMirrored}
              onChange={(e) => setIsMirrored(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span>Mirror (Selfie Mode)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors select-none">
            <input
              type="checkbox"
              checked={showEyeZoom}
              onChange={(e) => setShowEyeZoom(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span>Pupil & Iris HUD</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors select-none">
            <input
              type="checkbox"
              checked={showDenseMesh}
              onChange={(e) => setShowDenseMesh(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span>Dense 478 Mesh</span>
          </label>
        </div>
      </div>

      {/* Main Grid: Video Stream Panel + Real-time Risk Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Camera Feed & Landmark HUD */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3] flex items-center justify-center shadow-xl">
            {/* Hidden Raw Video Source */}
            <video ref={videoRef} playsInline muted className="hidden" />

            {/* Overlaid HUD Canvas */}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full h-full object-contain"
            />

            {/* Live Indicator Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded border border-slate-800">
              <div className={`w-2.5 h-2.5 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-[11px] font-mono font-bold text-white uppercase">
                {isStreaming ? (cameraSource === 'WEBCAM' ? 'LIVE DEMO CAMERA' : 'SIMULATED CABIN FEED') : 'FEED STANDBY'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 border-l border-slate-700 pl-2">
                {selectedCameraId}
              </span>
            </div>

            {/* Center Engine Indicator */}
            <div className="hidden sm:flex absolute top-3 left-1/2 -translate-x-1/2 items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded border border-cyan-900/60 font-mono text-[10px] text-cyan-300">
              <Scan className="h-3 w-3 text-cyan-400" />
              <span>{activeModelName}</span>
            </div>

            {/* Top Right Live FPS & Face Confidence */}
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded border border-slate-800 font-mono text-[11px]">
              <span className="text-slate-400">FPS:</span>
              <span className="text-emerald-400 font-bold">{metrics.fps || (isStreaming ? 30 : 0)}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">FACE:</span>
              <span className={metrics.face_detected ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {metrics.face_detected ? 'TRACKED (96%)' : 'NO DRIVER'}
              </span>
            </div>

            {/* Bottom HUD: Real-time Telemetry Bar */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur-md p-2.5 rounded border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">EYE ASPECT (EAR)</span>
                <span className={`font-bold ${metrics.ear_avg < config.earClosureThreshold ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {metrics.ear_avg.toFixed(2)} {metrics.ear_avg < config.earClosureThreshold ? '⚠️ CLOSED' : 'OPEN'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">MOUTH (MAR)</span>
                <span className={`font-bold ${metrics.mar > config.marYawnThreshold ? 'text-amber-400' : 'text-sky-400'}`}>
                  {metrics.mar.toFixed(2)} {metrics.mar > config.marYawnThreshold ? '🥱 YAWNING' : 'NORMAL'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">ATTENTION / YAW</span>
                <span className="font-bold text-cyan-300">
                  {metrics.attention_direction} ({metrics.head_yaw > 0 ? `+${metrics.head_yaw}°` : `${metrics.head_yaw}°`})
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">PERCLOS INDEX</span>
                <span className={`font-bold ${metrics.perclos > 25 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {metrics.perclos}% {metrics.perclos > 25 ? 'FATIGUED' : 'NOMINAL'}
                </span>
              </div>
            </div>
          </div>

          {/* Alert Broadcast Banner */}
          {lastAlertMessage && (
            <div className="p-3.5 bg-amber-950/30 border border-amber-600/40 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
                <span>{lastAlertMessage}</span>
              </div>
              <button
                onClick={() => setLastAlertMessage(null)}
                className="text-[11px] font-mono text-slate-400 hover:text-white"
              >
                DISMISS
              </button>
            </div>
          )}
        </div>

        {/* Real-time Multi-Signal Risk Engine HUD */}
        <div className="lg:col-span-4 space-y-4">
          {/* Main Drowsiness Risk Gauge Card */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase">DROWSINESS RISK INDEX</span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${getRiskColor(metrics.risk_level)}`}>
                {metrics.risk_level} RISK
              </span>
            </div>

            {/* Score Number & Dynamic Bar */}
            <div className="flex items-end justify-between">
              <div>
                <span className="text-4xl font-black text-white tracking-tight">{metrics.risk_score}</span>
                <span className="text-sm font-mono text-slate-400 ml-1">/ 100</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {metrics.risk_level === 'CRITICAL' ? 'EMERGENCY COOLDOWN' : metrics.risk_level === 'WARNING' ? 'ELEVATED FATIGUE' : 'ACTIVE OBSERVATION'}
              </span>
            </div>

            {/* Progress Bar with Color Thresholds */}
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden relative">
              <div
                className={`h-full transition-all duration-300 ${
                  metrics.risk_score >= 81
                    ? 'bg-rose-500 shadow-lg shadow-rose-500/50'
                    : metrics.risk_score >= 61
                    ? 'bg-amber-500'
                    : metrics.risk_score >= 31
                    ? 'bg-yellow-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(metrics.risk_score, 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
              <span>0 (NORMAL)</span>
              <span>30 (LOW)</span>
              <span>60 (WARNING)</span>
              <span>80+ (CRITICAL)</span>
            </div>
          </div>

          {/* Individual CV Signals Breakdown */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 space-y-3">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase block border-b border-slate-800 pb-2">
              MULTI-SIGNAL CV SENSOR READOUTS
            </span>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-slate-400" /> Prolonged Eye Closure:
                </span>
                <span className="font-mono font-bold text-white">
                  {metrics.ear_avg < config.earClosureThreshold ? 'DETECTED' : 'NONE'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-slate-400" /> Blinking Cadence:
                </span>
                <span className="font-mono text-slate-200">{metrics.blink_rate_bpm} BPM ({metrics.blink_count} total)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-slate-400" /> Head Pitch (Nodding):
                </span>
                <span className={`font-mono font-bold ${metrics.head_pitch < config.headPitchNodThresholdDeg ? 'text-amber-400' : 'text-slate-200'}`}>
                  {metrics.head_pitch}° {metrics.head_pitch < config.headPitchNodThresholdDeg ? '(NOD DOWN)' : ''}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-slate-400" /> Ambient Light Quality:
                </span>
                <span className="font-mono text-emerald-400 font-bold">{metrics.lighting_quality}</span>
              </div>
            </div>
          </div>

          {/* Quick Audio Controls */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newMuted = !audioMuted;
                  setAudioMuted(newMuted);
                  handleConfigChange('audioAlertsEnabled', !newMuted);
                }}
                className={`p-2 rounded border ${audioMuted ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'}`}
              >
                {audioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <div>
                <span className="text-xs font-bold text-white block">Audible Alarms</span>
                <span className="text-[10px] font-mono text-slate-400">{audioMuted ? 'MUTED' : `ENABLED (${audioVolume}%)`}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min="10"
                max="100"
                value={audioVolume}
                disabled={audioMuted}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setAudioVolume(val);
                  handleConfigChange('audioVolume', val / 100);
                }}
                className="w-20 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sensitivity Parameters Drawer / Modal */}
      {showConfigDrawer && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">Computer Vision Engine Parameters</h3>
            </div>
            <button
              onClick={() => setShowConfigDrawer(false)}
              className="text-xs font-mono text-slate-400 hover:text-white"
            >
              CLOSE
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">EAR Closure Threshold: {config.earClosureThreshold}</label>
              <input
                type="range"
                min="0.15"
                max="0.30"
                step="0.01"
                value={config.earClosureThreshold}
                onChange={(e) => handleConfigChange('earClosureThreshold', parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">EAR Warning Duration: {config.earWarningDurationSec}s</label>
              <input
                type="range"
                min="0.8"
                max="3.0"
                step="0.1"
                value={config.earWarningDurationSec}
                onChange={(e) => handleConfigChange('earWarningDurationSec', parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">MAR Yawn Threshold: {config.marYawnThreshold}</label>
              <input
                type="range"
                min="0.45"
                max="0.80"
                step="0.02"
                value={config.marYawnThreshold}
                onChange={(e) => handleConfigChange('marYawnThreshold', parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Alert Cooldown: {config.alertCooldownSec}s</label>
              <input
                type="range"
                min="2.0"
                max="10.0"
                step="0.5"
                value={config.alertCooldownSec}
                onChange={(e) => handleConfigChange('alertCooldownSec', parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= PART 6: DRIVER SAFETY AI INTELLIGENCE & RAG ================= */}
      <div id="driver-safety-ai-intelligence-section" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-tight font-mono">
                Driver Safety AI Intelligence & Decision Support
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Grounds computer vision signals in Solvofin fleet telemetry and authoritative CIRT / MoRTH / NHTSA standards
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-generate-ai-insight-stream"
            onClick={() => generateAiInsightForCurrentStream(false)}
            disabled={isAiLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
            Synthesize Current Stream with AI
          </button>
        </div>

        <DriverSafetyAIInsightCard
          insight={aiInsight}
          isLoading={isAiLoading}
          onRefreshInsight={() => generateAiInsightForCurrentStream(false)}
          onReviewSubmit={handleHumanReviewSubmit}
          reviewerIdentity="Senior Transit Safety Supervisor"
          reviewerRole="AUTHORITY"
        />
      </div>

      {/* Driver Safety Events Timeline & Audit History */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-tight">
              Driver Safety Event Audit Log ({events.length} Events)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified multi-frame events recorded with timestamp, GPS coordinates, camera ID, and AI confidence.
            </p>
          </div>

          <button
            onClick={fetchDriverEvents}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh events"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Bus Number</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">GPS Geotag</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">AI Reasoning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No safety infractions detected for {selectedBusNumber}. Stream is nominal.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-emerald-400">{evt.id}</td>
                    <td className="py-3 px-4 font-semibold text-white">{evt.bus_number}</td>
                    <td className="py-3 px-4">
                      <span className="text-slate-300 font-semibold">{evt.event_type.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskColor(evt.severity)}`}>
                        {evt.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">{evt.duration_sec}s</td>
                    <td className="py-3 px-4 text-slate-400">
                      {evt.latitude ? `${evt.latitude.toFixed(4)}, ${evt.longitude?.toFixed(4)}` : 'UNAVAILABLE'}
                    </td>
                    <td className="py-3 px-4 text-cyan-400 font-bold">{Math.round(evt.confidence * 100)}%</td>
                    <td className="py-3 px-4 text-slate-400">{new Date(evt.timestamp).toLocaleTimeString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {evt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => generateAiInsightForEvent(evt)}
                        title="Synthesize this event with RAG & fleet operational context"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-semibold transition-colors"
                      >
                        <Sparkles className="h-3 w-3" />
                        Inspect AI
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
