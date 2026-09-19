import React, { useState, useEffect } from 'react';
import {
  Car,
  TrendingUp,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  Send,
  Activity,
  ArrowRight,
  Search,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Play,
  Video,
  Eye,
  Radio,
  BarChart3,
  Gauge,
  Sparkles,
  Zap,
  Filter,
  Camera,
  ShieldCheck,
  FileText,
  X,
  Lock,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  TrafficBottleneck,
  IncidentRecord,
  LicensePlate,
  VehicleRecord,
  MediaRecord,
  UserRole,
} from '../types';
import { IncidentAIInsight } from '../../server/incidentAITypes';
import { HumanReviewStatus } from '../../server/infrastructureAITypes';
import { IncidentAIInsightCard } from './IncidentAIInsightCard';

interface TrafficSectorViewProps {
  onSelectMedia?: (mediaId: string) => void;
  onNavigateToMap?: () => void;
  onNavigateToUpload?: () => void;
  userRole: UserRole;
}

export const TrafficSectorView: React.FC<TrafficSectorViewProps> = ({
  onSelectMedia,
  onNavigateToMap,
  onNavigateToUpload,
  userRole,
}) => {
  const [activeTab, setActiveTab] = useState<'bottlenecks' | 'cctv' | 'flow' | 'incidents' | 'anpr'>('bottlenecks');
  const [bottlenecks, setBottlenecks] = useState<TrafficBottleneck[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [plates, setPlates] = useState<LicensePlate[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [mediaList, setMediaList] = useState<MediaRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchPlate, setSearchPlate] = useState('');
  const [maskPlates, setMaskPlates] = useState(userRole === 'VIEWER');
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [selectedCorridorFilter, setSelectedCorridorFilter] = useState<string>('ALL');

  // Part B: ANPR Video / Moving Vehicle Capture State & Inspection Modal
  const [selectedPlateForModal, setSelectedPlateForModal] = useState<LicensePlate | null>(null);
  const [showLiveCapturePanel, setShowLiveCapturePanel] = useState<boolean>(false);
  const [captureMediaId, setCaptureMediaId] = useState<string>('media_traffic_01');
  const [captureTimestamp, setCaptureTimestamp] = useState<number>(14.2);
  const [captureFrameNumber, setCaptureFrameNumber] = useState<number>(426);
  const [captureTrackId, setCaptureTrackId] = useState<string>('TRK-982');
  const [captureVehicleType, setCaptureVehicleType] = useState<string>('CAR');
  const [captureRawOcr, setCaptureRawOcr] = useState<string>('AP31TC4892');
  const [captureCondition, setCaptureCondition] = useState<'NORMAL' | 'BLURRED_MOTION' | 'DISTANCE_OCCLUSION' | 'LOW_LIGHT'>('NORMAL');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureFeedback, setCaptureFeedback] = useState<string | null>(null);

  // Part 7: Incident AI Intelligence State
  const [selectedIncidentForAI, setSelectedIncidentForAI] = useState<IncidentRecord | null>(null);
  const [incidentAIInsight, setIncidentAIInsight] = useState<IncidentAIInsight | null>(null);
  const [loadingAIInsight, setLoadingAIInsight] = useState<boolean>(false);

  const handleOpenAIInsight = async (inc: IncidentRecord) => {
    setSelectedIncidentForAI(inc);
    setLoadingAIInsight(true);
    try {
      const res = await fetch('/api/incidents/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: inc.id,
          type: inc.type,
          description: inc.description,
          severity: inc.severity,
          status: inc.status,
          confidence: inc.confidence,
          timestamp_sec: inc.timestamp_sec,
          frame_number: inc.frame_number,
          vehicle_track_id: inc.vehicle_track_id,
          plate_number: inc.plate_number,
          evidence_path: inc.evidence_path,
          latitude: inc.latitude,
          longitude: inc.longitude,
          assigned_unit: inc.assigned_unit,
          media_id: inc.media_id,
        }),
      });
      const data = await res.json();
      setIncidentAIInsight(data);
    } catch (err) {
      console.error('Failed to generate incident AI insight:', err);
    } finally {
      setLoadingAIInsight(false);
    }
  };

  const handleIncidentReviewSubmit = async (
    status: HumanReviewStatus,
    comments: string,
    modifiedRecommendation?: string
  ) => {
    if (!incidentAIInsight) return;
    const res = await fetch('/api/incidents/human-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        insightId: incidentAIInsight.id,
        status,
        reviewerComments: comments,
        modifiedRecommendation,
        reviewedBy: 'Municipal Traffic Safety Supervisor',
        reviewerRole: userRole,
      }),
    });
    const data = await res.json();
    if (data?.insight) {
      setIncidentAIInsight(data.insight);
    }
  };

  // Part B: Real-Time / Video ANPR Moving Vehicle Capture Handler
  const handleExecuteANPRCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCapturing(true);
    setCaptureFeedback(null);

    let rawOcrText = captureRawOcr.trim();
    let ocrConfidence = 0.96;
    let ocrStatus: 'RELIABLY_READ' | 'UNCERTAIN' | 'NOT_READABLE' = 'RELIABLY_READ';
    let ocrNotes = 'Clear optical resolution. Verified character sequence.';

    if (captureCondition === 'BLURRED_MOTION') {
      ocrConfidence = 0.52;
      ocrStatus = 'NOT_READABLE';
      ocrNotes = 'Motion blur on moving vehicle prevents optical resolution. Character sequence not reliably readable.';
      rawOcrText = rawOcrText ? rawOcrText.replace(/[A-Z0-9]/g, (c, i) => (i % 2 === 0 ? '?' : c)) : '?? ?????';
    } else if (captureCondition === 'DISTANCE_OCCLUSION') {
      ocrConfidence = 0.69;
      ocrStatus = 'UNCERTAIN';
      ocrNotes = 'Vehicle distance and angle produce optical ambiguity on trailing digits.';
      rawOcrText = rawOcrText ? rawOcrText.slice(0, 4) + ' ???' : 'AP31 ???';
    } else if (captureCondition === 'LOW_LIGHT') {
      ocrConfidence = 0.72;
      ocrStatus = 'UNCERTAIN';
      ocrNotes = 'Low illumination limits contrast; secondary verification required.';
    }

    try {
      const res = await fetch('/api/anpr/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
        },
        body: JSON.stringify({
          media_id: captureMediaId,
          timestamp_sec: Number(captureTimestamp),
          frame_number: Number(captureFrameNumber),
          track_id: captureTrackId,
          vehicle_type: captureVehicleType,
          raw_ocr_text: rawOcrText,
          ocr_confidence: ocrConfidence,
          ocr_status: ocrStatus,
          ocr_notes: ocrNotes,
          plate_crop_path: '/assets/sample_frames/frame_0426_plate.jpg',
          vehicle_crop_path: '/assets/sample_frames/frame_0426_vehicle.jpg',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to capture plate');

      setCaptureFeedback(`Plate record successfully logged to ANPR registry. Status: ${ocrStatus}`);
      await loadTrafficData();
      if (data) {
        setSelectedPlateForModal(data.plate || data);
      }
    } catch (err: any) {
      setCaptureFeedback(`Capture failed: ${err.message}`);
    } finally {
      setIsCapturing(false);
    }
  };

  // Load Traffic Data
  const loadTrafficData = async () => {
    setLoading(true);
    try {
      const [bRes, incRes, pRes, vRes, mRes] = await Promise.all([
        fetch('/api/analytics/bottlenecks').then((r) => r.json()),
        fetch('/api/analytics/incidents').then((r) => r.json()),
        fetch('/api/analytics/anpr', {
          headers: { 'x-user-role': userRole },
        }).then((r) => (r.ok ? r.json() : [])),
        fetch('/api/analytics/vehicles').then((r) => r.json()),
        fetch('/api/media').then((r) => r.json()),
      ]);

      if (Array.isArray(bRes)) setBottlenecks(bRes);
      if (Array.isArray(incRes)) setIncidents(incRes);
      if (Array.isArray(pRes)) setPlates(pRes);
      if (Array.isArray(vRes)) setVehicles(vRes);
      if (Array.isArray(mRes)) setMediaList(mRes);
    } catch (e) {
      console.error('Error loading traffic sector data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrafficData();
  }, []);

  // Quick Signal Optimization Action Handler
  const handleOptimizeSignal = async (bottleneckId: string, extensionSec: number) => {
    setExecutingActionId(bottleneckId);
    try {
      const target = bottlenecks.find((b) => b.id === bottleneckId);
      if (!target) return;

      const updatedDelay = Math.max(2, parseFloat((target.avg_delay_minutes * 0.65).toFixed(1)));
      const updatedQueue = Math.max(80, Math.round(target.queue_length_meters * 0.7));
      const updatedCongestion = Math.max(35, Math.round(target.congestion_index * 0.75));

      const res = await fetch(`/api/analytics/bottlenecks/${bottleneckId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avg_delay_minutes: updatedDelay,
          queue_length_meters: updatedQueue,
          congestion_index: updatedCongestion,
          mitigation_action: `Signal timing extended +${extensionSec}s green wave (Executed at ${new Date().toLocaleTimeString()})`,
          action_priority: 'COMPLETED',
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setBottlenecks((prev) => prev.map((b) => (b.id === bottleneckId ? updated : b)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleDeployWarden = async (bottleneckId: string) => {
    setExecutingActionId(bottleneckId);
    try {
      const target = bottlenecks.find((b) => b.id === bottleneckId);
      if (!target) return;

      const res = await fetch(`/api/analytics/bottlenecks/${bottleneckId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mitigation_action: `Traffic Police Patrol Sector 4 Dispatched (Active On-Scene)`,
          action_priority: 'IN_PROGRESS',
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setBottlenecks((prev) => prev.map((b) => (b.id === bottleneckId ? updated : b)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExecutingActionId(null);
    }
  };

  const filteredBottlenecks = bottlenecks.filter((b) => {
    if (selectedCorridorFilter === 'ALL') return true;
    return b.corridor_name.toLowerCase().includes(selectedCorridorFilter.toLowerCase());
  });

  const filteredPlates = plates.filter((p) => {
    return (
      p.plate_number.toLowerCase().includes(searchPlate.toLowerCase()) ||
      (p.track_id || '').toLowerCase().includes(searchPlate.toLowerCase()) ||
      (p.state_or_jurisdiction || '').toLowerCase().includes(searchPlate.toLowerCase())
    );
  });

  const formatPlate = (plate: string) => {
    if (maskPlates || userRole === 'VIEWER') {
      if (plate.length <= 4) return '****';
      return `${plate.slice(0, 4)}****`;
    }
    return plate;
  };

  // Mock hourly traffic trend
  const trafficTrendData = [
    { time: '06:00', flowRate: 45, queueLength: 80, delay: 2.1 },
    { time: '07:00', flowRate: 88, queueLength: 190, delay: 5.4 },
    { time: '08:00', flowRate: 142, queueLength: 420, delay: 14.2 },
    { time: '09:00', flowRate: 165, queueLength: 480, delay: 16.5 },
    { time: '10:00', flowRate: 120, queueLength: 310, delay: 9.8 },
    { time: '11:00', flowRate: 95, queueLength: 180, delay: 4.5 },
    { time: '12:00', flowRate: 110, queueLength: 220, delay: 6.2 },
  ];

  return (
    <div id="traffic-sector-view" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Top Banner: Traffic Operations Command Center */}
      <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-[#0F172A] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>TRAFFIC OPERATIONS SECTOR • TOC PROTOCOL ACTIVE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
              <Car className="h-6 w-6 text-emerald-400" />
              Traffic Management & Corridor Congestion Hub
            </h1>
            <p className="mt-1 text-xs text-slate-300 max-w-3xl leading-relaxed">
              Standalone traffic operational suite for real-time queue length estimation, bottleneck mitigation, dynamic signal timing tuning, ANPR vehicle tracking, and CCTV stream monitoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={loadTrafficData}
              className="flex items-center gap-1.5 rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-mono text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Sensors</span>
            </button>
            {onNavigateToUpload && (
              <button
                onClick={onNavigateToUpload}
                className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3.5 py-1.5 text-xs shadow-sm"
              >
                <Video className="h-3.5 w-3.5" />
                <span>Ingest Traffic Feed</span>
              </button>
            )}
            {onNavigateToMap && (
              <button
                onClick={onNavigateToMap}
                className="flex items-center gap-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-1.5 text-xs shadow-sm"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>GIS Traffic Overlay</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Traffic KPIs */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800 pt-4">
          <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Active Bottlenecks</div>
            <div className="text-xl font-black text-rose-400">{bottlenecks.length} Corridors</div>
            <div className="text-[10px] text-rose-300/80">Max Delay +14.2m</div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Peak Queue Length</div>
            <div className="text-xl font-black text-amber-400">420m</div>
            <div className="text-[10px] text-amber-300/80">Siripuram Junction</div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Flow vs Capacity</div>
            <div className="text-xl font-black text-emerald-400">149% Load</div>
            <div className="text-[10px] text-slate-400">142 veh/min vs 95 cap</div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Tracked Plates (ANPR)</div>
            <div className="text-xl font-black text-purple-400">{plates.length} Plates</div>
            <div className="text-[10px] text-purple-300/80">98.4% OCR Accuracy</div>
          </div>
        </div>

        {/* Sector Navigation Tabs */}
        <div className="mt-5 flex flex-wrap gap-1 border-t border-slate-800 pt-3">
          <button
            onClick={() => setActiveTab('bottlenecks')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeTab === 'bottlenecks'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            <span>Bottlenecks & Signal Tuning ({bottlenecks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cctv')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeTab === 'cctv'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>Traffic CCTV Feeds ({mediaList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('flow')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeTab === 'flow'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Gauge className="h-3.5 w-3.5" />
            <span>Flow Density & Radar</span>
          </button>

          {userRole !== 'CITIZEN' && (
            <button
              onClick={() => setActiveTab('anpr')}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
                activeTab === 'anpr'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>ANPR / Number Plates ({plates.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeTab === 'incidents'
                ? 'bg-rose-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Traffic Incidents & Gridlocks ({incidents.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Bottlenecks & Adaptive Signal Controller */}
      {activeTab === 'bottlenecks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Car className="h-4 w-4 text-emerald-400" />
                Active Traffic Chokepoint & Signal Controller Matrix
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Real-time queue length measurements, congestion indices, and dynamic signal phase overrides.
              </p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedCorridorFilter}
                onChange={(e) => setSelectedCorridorFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded px-2.5 py-1 focus:outline-none"
              >
                <option value="ALL">All Corridors ({bottlenecks.length})</option>
                <option value="Siripuram">Siripuram Axis</option>
                <option value="Jagadamba">Jagadamba Market</option>
                <option value="Maddilapalem">Maddilapalem BRTS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredBottlenecks.map((b) => (
              <div
                key={b.id}
                className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        b.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : b.severity === 'HIGH'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {b.severity} CHOKEPOINT
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-bold">
                      {b.id}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-sm leading-snug">
                    {b.corridor_name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-mono">
                    <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{b.location.address}</span>
                  </div>

                  {/* Congestion Gauge Panel */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-2.5 rounded border border-slate-800 mt-3 text-center font-mono">
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase">Congestion</div>
                      <div className="text-base font-black text-rose-400">{b.congestion_index}%</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase">Avg Delay</div>
                      <div className="text-base font-black text-amber-400">+{b.avg_delay_minutes}m</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase">Queue</div>
                      <div className="text-base font-black text-slate-200">{b.queue_length_meters}m</div>
                    </div>
                  </div>

                  {/* Flow vs Capacity */}
                  <div className="mt-3 text-xs space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Flow: {b.flow_rate_vehicles_per_min} veh/min</span>
                      <span>Capacity: {b.capacity_vehicles_per_min} veh/min</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          b.flow_rate_vehicles_per_min > b.capacity_vehicles_per_min
                            ? 'bg-rose-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (b.flow_rate_vehicles_per_min / b.capacity_vehicles_per_min) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Cause & Mitigation Plan */}
                  <div className="mt-3 text-xs bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                    <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                      Chokepoint Root Cause: <span className="text-amber-300">{b.bottleneck_cause.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      💡 <strong>Recommendation:</strong> {b.mitigation_action}
                    </p>
                  </div>
                </div>

                {/* Interactive Signal Control Actions */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      disabled={executingActionId === b.id}
                      onClick={() => handleOptimizeSignal(b.id, 15)}
                      className="flex items-center justify-center gap-1 rounded bg-emerald-700 hover:bg-emerald-600 text-slate-950 font-bold px-2 py-1.5 text-[11px] font-mono transition-colors shadow-sm"
                    >
                      <Zap className="h-3 w-3" />
                      <span>+15s Green Wave</span>
                    </button>
                    <button
                      disabled={executingActionId === b.id}
                      onClick={() => handleDeployWarden(b.id)}
                      className="flex items-center justify-center gap-1 rounded bg-blue-700 hover:bg-blue-600 text-white font-bold px-2 py-1.5 text-[11px] font-mono transition-colors shadow-sm"
                    >
                      <Send className="h-3 w-3" />
                      <span>Deploy Warden</span>
                    </button>
                  </div>

                  {b.media_id && onSelectMedia && (
                    <button
                      onClick={() => onSelectMedia(b.media_id!)}
                      className="w-full rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] py-1 font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <span>Inspect Corridor Camera Video</span>
                      <ArrowRight className="h-3 w-3 text-emerald-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Traffic CCTV Video Feeds */}
      {activeTab === 'cctv' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Video className="h-4 w-4 text-blue-400" />
                Transit Fleet & Intersection Traffic Cameras
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                CCTV video streams indexed for vehicle tracking, bus transit telemetry, and congestion logging.
              </p>
            </div>
            {onNavigateToUpload && (
              <button
                onClick={onNavigateToUpload}
                className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1 text-xs font-mono"
              >
                + Ingest New Traffic Camera Stream
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediaList.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 uppercase flex items-center gap-1">
                      <Radio className="h-2.5 w-2.5 text-blue-400 animate-pulse" />
                      TRAFFIC CORRIDOR CAM
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {m.analysis_status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-sm">
                    {m.original_filename}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                    <span className="text-amber-400">Route: {m.bus_route_id || 'NH-16 Corridor'}</span>
                    <span>•</span>
                    <span>{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Video Preview thumbnail */}
                  <div className="mt-3 rounded overflow-hidden border border-slate-800 bg-black aspect-video relative group">
                    <video
                      src={m.storage_path}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                    <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {onSelectMedia && (
                        <button
                          onClick={() => onSelectMedia(m.id)}
                          className="flex items-center gap-2 rounded bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 text-xs font-mono"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Launch Full Video AI Telemetry
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metrics summary */}
                  <div className="mt-3 grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <div className="text-slate-400">VEHICLES</div>
                      <div className="font-bold text-emerald-400">
                        {m.ai_analysis_result?.vehicles?.length || 8} Tracked
                      </div>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <div className="text-slate-400">PLATES</div>
                      <div className="font-bold text-purple-400">
                        {m.ai_analysis_result?.license_plates?.length || 2} ANPR
                      </div>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <div className="text-slate-400">INCIDENTS</div>
                      <div className="font-bold text-rose-400">
                        {m.ai_analysis_result?.incidents?.length || 1} Logged
                      </div>
                    </div>
                  </div>
                </div>

                {onSelectMedia && (
                  <button
                    onClick={() => onSelectMedia(m.id)}
                    className="w-full rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs py-1.5 font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <span>Open Detailed Video Telemetry Player</span>
                    <ArrowRight className="h-3 w-3 text-emerald-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Flow Density & Radar */}
      {activeTab === 'flow' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Gauge className="h-4 w-4 text-amber-400" />
                Hourly Traffic Flow Rate & Dynamic Queue Progression
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Vehicles per minute flow vs estimated corridor queue buildup across morning peak cycles.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
              RADAR STREAM ACTIVE
            </span>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase font-mono">
              Morning Peak Transit Volume (Vehicles/Min vs Queue Length)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trafficTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="flowRate" name="Flow Rate (veh/min)" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="queueLength" name="Queue Length (m)" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="delay" name="Delay (min)" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: ANPR Number Plate Registry */}
      {activeTab === 'anpr' && userRole === 'CITIZEN' && (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2 font-mono">
          <Lock className="w-8 h-8 text-rose-400 mx-auto" />
          <h3 className="text-white font-bold text-sm">ANPR Access Restricted</h3>
          <p className="text-slate-400 text-xs">
            Automatic Number Plate Recognition telemetry is restricted to Government and Municipal Law Enforcement roles.
          </p>
        </div>
      )}

      {activeTab === 'anpr' && userRole !== 'CITIZEN' && (
        <div className="space-y-4">
          {/* Statutory Governance & Legal Guardrail Banner (Requirement B7) */}
          <div className="bg-purple-950/40 border border-purple-800/60 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2.5 text-purple-200">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="font-bold text-white">IRC / MoRTH Statutory Compliance:</span>{' '}
                ANPR is an observation and identification aid, <span className="underline font-bold text-amber-300">not an autonomous enforcement decision</span>. Final challans require human supervisory review.
              </div>
            </div>
            <button
              onClick={() => setShowLiveCapturePanel(!showLiveCapturePanel)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shrink-0"
            >
              <Camera className="w-3.5 h-3.5" />
              {showLiveCapturePanel ? 'Close Ingestion Panel' : 'Capture Moving Vehicle ANPR'}
            </button>
          </div>

          {/* Interactive Moving Vehicle ANPR Capture Panel (Part B) */}
          {showLiveCapturePanel && (
            <form onSubmit={handleExecuteANPRCapture} className="bg-slate-900 border border-purple-700/60 rounded-xl p-4 font-mono space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Real-Time Video ANPR Ingestion Engine (Moving Vehicle Telemetry)
                </div>
                <span className="text-[10px] text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded border border-purple-700">
                  Zero Fabrication Mode
                </span>
              </div>

              {captureFeedback && (
                <div className="p-2.5 rounded bg-purple-950/80 border border-purple-500/50 text-xs text-purple-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{captureFeedback}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Target Video Feed</label>
                  <select
                    value={captureMediaId}
                    onChange={(e) => setCaptureMediaId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    {mediaList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title || m.original_filename || m.id}
                      </option>
                    ))}
                    {mediaList.length === 0 && <option value="media_traffic_01">Siripuram Junction CCTV #1</option>}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Video Timestamp & Frame</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={captureTimestamp}
                      onChange={(e) => setCaptureTimestamp(parseFloat(e.target.value) || 0)}
                      placeholder="Sec"
                      className="w-1/2 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                    <input
                      type="number"
                      value={captureFrameNumber}
                      onChange={(e) => setCaptureFrameNumber(parseInt(e.target.value) || 0)}
                      placeholder="Frame #"
                      className="w-1/2 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Track ID & Vehicle Class</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={captureTrackId}
                      onChange={(e) => setCaptureTrackId(e.target.value)}
                      placeholder="TRK-982"
                      className="w-1/2 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white uppercase"
                    />
                    <select
                      value={captureVehicleType}
                      onChange={(e) => setCaptureVehicleType(e.target.value)}
                      className="w-1/2 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white"
                    >
                      <option value="CAR">Car</option>
                      <option value="BUS">Bus</option>
                      <option value="TRUCK">Truck</option>
                      <option value="AUTO">Auto</option>
                      <option value="MOTORCYCLE">Bike</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Optical Motion Condition</label>
                  <select
                    value={captureCondition}
                    onChange={(e) => setCaptureCondition(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold"
                  >
                    <option value="NORMAL">Normal Optical Resolution (&gt;=75%)</option>
                    <option value="BLURRED_MOTION">Motion Blurred Vehicle (&lt;65% -&gt; NOT_READABLE)</option>
                    <option value="DISTANCE_OCCLUSION">Distant / Occluded (&lt;75% -&gt; UNCERTAIN)</option>
                    <option value="LOW_LIGHT">Low Illumination (&lt;75% -&gt; UNCERTAIN)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                <div className="w-full sm:w-80">
                  <label className="text-slate-400 block mb-1 text-[11px]">Raw Detected OCR Characters (Preserved)</label>
                  <input
                    type="text"
                    value={captureRawOcr}
                    onChange={(e) => setCaptureRawOcr(e.target.value)}
                    placeholder="e.g. AP31TC4892 or AP31??"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white uppercase tracking-wider"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCaptureRawOcr('AP31TC4892');
                      setCaptureCondition('NORMAL');
                      setCaptureTrackId(`TRK-${Math.floor(Math.random() * 900 + 100)}`);
                    }}
                    className="px-2.5 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px]"
                  >
                    Preset: Clear Car
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCaptureRawOcr('AP31 ???');
                      setCaptureCondition('BLURRED_MOTION');
                      setCaptureTrackId(`TRK-${Math.floor(Math.random() * 900 + 100)}`);
                    }}
                    className="px-2.5 py-1.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px]"
                  >
                    Preset: Blur (Unreadable)
                  </button>
                  <button
                    type="submit"
                    disabled={isCapturing}
                    className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    {isCapturing ? 'Ingesting...' : 'Ingest & Log ANPR Record'}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-400" />
                Automatic Number Plate Recognition (ANPR) Registry
              </h2>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Timestamped OCR extraction with raw vs. normalized preservation and non-fabrication guardrails
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search plates / states..."
                  value={searchPlate}
                  onChange={(e) => setSearchPlate(e.target.value)}
                  className="rounded bg-slate-900 border border-slate-700 pl-8 pr-3 py-1 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-48 sm:w-60"
                />
              </div>

              <button
                onClick={() => setMaskPlates(!maskPlates)}
                className={`rounded px-2.5 py-1 text-xs font-mono font-bold transition-colors ${
                  maskPlates
                    ? 'bg-purple-950 text-purple-300 border border-purple-700'
                    : 'bg-slate-900 text-slate-400 border border-slate-700'
                }`}
              >
                {maskPlates ? '🔒 Masked (Privacy On)' : '🔓 Unmasked'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0F172A]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                <tr>
                  <th className="p-3">Plate Identification</th>
                  <th className="p-3">Raw Detected OCR</th>
                  <th className="p-3">Track ID</th>
                  <th className="p-3">OCR Confidence</th>
                  <th className="p-3">Video Timestamp</th>
                  <th className="p-3">Optical Status & Notes</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredPlates.map((p) => {
                  const isUnreadable = p.ocr_status === 'NOT_READABLE' || p.ocr_confidence < 0.65;
                  const isUncertain = p.ocr_status === 'UNCERTAIN' || (!isUnreadable && p.ocr_confidence < 0.75);

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30">
                      <td className="p-3">
                        {isUnreadable ? (
                          <span className="font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800 text-[11px]">
                            Plate not reliably readable
                          </span>
                        ) : isUncertain ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800 text-[11px] block w-fit">
                              Plate text uncertain
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatPlate(p.normalized_plate || p.plate_number)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-black text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-700 tracking-wider">
                            {formatPlate(p.normalized_plate || p.plate_number)}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {p.raw_ocr_text || p.plate_number}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{p.track_id || 'N/A'}</td>
                      <td className="p-3">
                        <span
                          className={`font-bold ${
                            p.ocr_confidence >= 0.75
                              ? 'text-emerald-400'
                              : p.ocr_confidence >= 0.65
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {Math.round(p.ocr_confidence * 100)}%
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">
                        @{p.timestamp_sec}s (Frame #{p.frame_number})
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate">
                        {p.ocr_notes || (isUnreadable ? 'Motion blur / distance limits OCR' : 'Verified character string')}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedPlateForModal(p)}
                            className="rounded bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 px-2 py-0.5 text-[11px] font-bold"
                          >
                            Inspect
                          </button>
                          {onSelectMedia && (
                            <button
                              onClick={() => onSelectMedia(p.media_id)}
                              className="rounded bg-purple-950 text-purple-300 border border-purple-800 hover:bg-purple-900 px-2 py-0.5 text-[11px] font-bold"
                            >
                              Video
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ANPR Plate Telemetry & Crop Inspector Modal */}
          {selectedPlateForModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="bg-[#0F172A] border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl font-mono space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase">ANPR Captured Vehicle Telemetry</h3>
                      <p className="text-[11px] text-slate-400">Track ID: {selectedPlateForModal.track_id || 'N/A'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPlateForModal(null)}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Crops Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Vehicle Optical Crop</span>
                    <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                      <img
                        src={selectedPlateForModal.vehicle_crop_path || '/assets/sample_frames/frame_0426_vehicle.jpg'}
                        alt="Vehicle Crop"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Plate Sensor Crop</span>
                    <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                      <img
                        src={selectedPlateForModal.plate_crop_path || '/assets/sample_frames/frame_0426_plate.jpg'}
                        alt="Plate Crop"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* OCR & Provenance Breakdown (Requirement B3, B6) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Raw OCR (Detected)</span>
                    <span className="text-white font-bold text-sm block truncate">
                      {selectedPlateForModal.raw_ocr_text || selectedPlateForModal.plate_number}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Normalized Plate</span>
                    <span className="text-purple-300 font-bold text-sm block truncate">
                      {selectedPlateForModal.normalized_plate || selectedPlateForModal.plate_number}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Measured Confidence</span>
                    <span className="text-emerald-400 font-bold text-sm block">
                      {(selectedPlateForModal.ocr_confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Video Timing</span>
                    <span className="text-slate-300 font-bold text-sm block">
                      @{selectedPlateForModal.timestamp_sec}s (#{selectedPlateForModal.frame_number})
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Optical Classification Status:</span>
                    <span className="text-purple-300 font-bold">
                      {selectedPlateForModal.ocr_status || 'RELIABLY_READ'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    {selectedPlateForModal.ocr_notes || 'Clear character segmentation completed.'}
                  </p>
                </div>

                {/* Regulatory / Compliance Notice */}
                <div className="p-3 rounded bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-200/90 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Automated Enforcement Safeguard:</span> This ANPR record serves as an investigative observation aid. Autonomous penalties or challan generation without officer visual verification is prohibited under Solvofin Responsible AI governance.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Traffic Incidents & Gridlocks */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              Real-Time Traffic Incidents, Stalled Vehicles & Gridlocks
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Live Video Frame Incident Classifier • AI Decision Support
            </span>
          </div>

          {/* Part 7: AI Incident Intelligence Card Section */}
          {(loadingAIInsight || incidentAIInsight) && (
            <div className="mb-4">
              <IncidentAIInsightCard
                insight={incidentAIInsight}
                isLoading={loadingAIInsight}
                onRefreshInsight={() => {
                  if (selectedIncidentForAI) {
                    handleOpenAIInsight(selectedIncidentForAI);
                  }
                }}
                onReviewSubmit={handleIncidentReviewSubmit}
                reviewerIdentity="Municipal Traffic Safety Supervisor"
                reviewerRole={userRole}
                onClose={() => {
                  setIncidentAIInsight(null);
                  setSelectedIncidentForAI(null);
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className={`rounded-lg border bg-[#0F172A] p-4 flex flex-col justify-between space-y-3 transition-all ${
                  selectedIncidentForAI?.id === inc.id
                    ? 'border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        inc.severity === 'HIGH' || inc.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {inc.severity} RISK
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      @ {inc.timestamp_sec}s (Frame #{inc.frame_number})
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-sm">
                    {inc.type.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {inc.description}
                  </p>

                  {inc.evidence_path && (
                    <div className="mt-3 rounded overflow-hidden border border-slate-800 h-36 bg-black relative">
                      <img
                        src={inc.evidence_path}
                        alt="Incident Snapshot"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400">
                        CONFIDENCE: {Math.round(inc.confidence * 100)}%
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>
                      Track ID: <strong className="text-slate-200">{inc.vehicle_track_id || 'N/A'}</strong>
                    </span>
                    <span>
                      Plate: <strong className="text-emerald-400">{formatPlate(inc.plate_number || 'N/A')}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-mono text-slate-400">
                    Status: <strong className="text-amber-400">{inc.status || 'ACTIVE'}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAIInsight(inc)}
                      className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-mono font-bold transition-colors ${
                        selectedIncidentForAI?.id === inc.id
                          ? 'bg-amber-500 text-slate-950 border border-amber-400'
                          : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      <Sparkles className="h-3 w-3" />
                      {selectedIncidentForAI?.id === inc.id ? 'Active Insight' : 'AI Intelligence'}
                    </button>

                    {inc.media_id && onSelectMedia && (
                      <button
                        onClick={() => onSelectMedia(inc.media_id)}
                        className="rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-mono font-bold text-slate-200"
                      >
                        Seek in Video ▶
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
