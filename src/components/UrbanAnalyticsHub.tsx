import React, { useState, useEffect } from 'react';
import {
  Flame,
  AlertTriangle,
  Car,
  Users,
  ShieldAlert,
  Lightbulb,
  Clock,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Send,
  Thermometer,
  Sun,
  Activity,
  Layers,
  ArrowRight,
  Filter,
  Search,
  Eye,
  Sliders,
  AlertOctagon,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Download,
} from 'lucide-react';
import {
  TrafficBottleneck,
  HeatwaveAnalytics,
  ActionableInsight,
  IncidentRecord,
  LicensePlate,
  PeopleAnalytics,
  VehicleRecord,
  UserRole,
} from '../types';
import { IncidentAIInsight } from '../../server/incidentAITypes';
import { HumanReviewStatus } from '../../server/infrastructureAITypes';
import { IncidentAIInsightCard } from './IncidentAIInsightCard';

interface UrbanAnalyticsHubProps {
  onSelectMedia?: (mediaId: string) => void;
  onNavigateToMap?: () => void;
  userRole: UserRole;
}

export const UrbanAnalyticsHub: React.FC<UrbanAnalyticsHubProps> = ({
  onSelectMedia,
  onNavigateToMap,
  userRole,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'bottlenecks' | 'heatwaves' | 'insights' | 'incidents' | 'anpr' | 'pedestrians'
  >('bottlenecks');

  const [bottlenecks, setBottlenecks] = useState<TrafficBottleneck[]>([]);
  const [heatwaves, setHeatwaves] = useState<HeatwaveAnalytics[]>([]);
  const [insights, setInsights] = useState<ActionableInsight[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [plates, setPlates] = useState<LicensePlate[]>([]);
  const [pedestrians, setPedestrians] = useState<PeopleAnalytics[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [plateSearch, setPlateSearch] = useState('');
  const [maskPlates, setMaskPlates] = useState(userRole === 'VIEWER');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [bRes, hRes, iRes, incRes, pRes, pedRes, vRes] = await Promise.all([
        fetch('/api/analytics/bottlenecks').then((r) => r.json()),
        fetch('/api/analytics/heatwaves').then((r) => r.json()),
        fetch('/api/analytics/insights').then((r) => r.json()),
        fetch('/api/analytics/incidents').then((r) => r.json()),
        fetch('/api/analytics/anpr').then((r) => r.json()),
        fetch('/api/analytics/pedestrians').then((r) => r.json()),
        fetch('/api/analytics/vehicles').then((r) => r.json()),
      ]);

      if (Array.isArray(bRes)) setBottlenecks(bRes);
      if (Array.isArray(hRes)) setHeatwaves(hRes);
      if (Array.isArray(iRes)) setInsights(iRes);
      if (Array.isArray(incRes)) setIncidents(incRes);
      if (Array.isArray(pRes)) setPlates(pRes);
      if (Array.isArray(pedRes)) setPedestrians(pedRes);
      if (Array.isArray(vRes)) setVehicles(vRes);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const handleUpdateInsightStatus = async (
    id: string,
    status: 'PENDING' | 'DISPATCHED' | 'IN_PROGRESS' | 'RESOLVED'
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/analytics/insights/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setInsights((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateIncidentStatus = async (
    id: string,
    status: 'ACTIVE' | 'DISPATCHED' | 'UNDER_INVESTIGATION' | 'RESOLVED'
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/analytics/incidents/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, assigned_unit: 'Traffic Patrol Unit 4' }),
      });
      if (res.ok) {
        setIncidents((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredPlates = plates.filter(
    (p) =>
      p.plate_number.toLowerCase().includes(plateSearch.toLowerCase()) ||
      (p.state_or_jurisdiction || '').toLowerCase().includes(plateSearch.toLowerCase()) ||
      (p.track_id || '').toLowerCase().includes(plateSearch.toLowerCase())
  );

  const formatPlate = (plate: string) => {
    if (maskPlates || userRole === 'VIEWER') {
      if (plate.length <= 4) return '****';
      return `${plate.slice(0, 4)}****`;
    }
    return plate;
  };

  return (
    <div id="urban-analytics-hub" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>CENTRAL MUNICIPAL INTELLIGENCE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              Urban Transit & Environmental Analytics Suite
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Corridor bottleneck detection, urban heatwave thermal index, pedestrian safety telemetry, and AI-prioritized municipal action items.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchAllAnalytics}
              className="flex items-center gap-1.5 rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-mono text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {onNavigateToMap && (
              <button
                onClick={onNavigateToMap}
                className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold px-3 py-1.5 text-xs shadow-sm"
              >
                <MapPin className="h-3 w-3" />
                View On GIS Map
              </button>
            )}
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="mt-5 flex flex-wrap gap-1 border-t border-slate-800 pt-3">
          <button
            onClick={() => setActiveSubTab('bottlenecks')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeSubTab === 'bottlenecks'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            <span>Traffic Bottlenecks ({bottlenecks.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('heatwaves')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeSubTab === 'heatwaves'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            <span>Heatwaves & Thermal ({heatwaves.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('insights')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeSubTab === 'insights'
                ? 'bg-blue-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Actionable Insights ({insights.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('incidents')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeSubTab === 'incidents'
                ? 'bg-rose-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Incident Detection ({incidents.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('anpr')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeSubTab === 'anpr'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>ANPR / Number Plates ({plates.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pedestrians')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeSubTab === 'pedestrians'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Pedestrian Safety</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Traffic Bottlenecks */}
      {activeSubTab === 'bottlenecks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Car className="h-4 w-4 text-emerald-400" />
              Active Traffic Chokepoints & Corridor Bottlenecks
            </h2>
            <span className="text-xs font-mono text-slate-400">
              AI Chokepoint Queue & Capacity Model
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bottlenecks.map((b) => (
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
                      {b.severity} BOTTLENECK
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {b.id}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-sm leading-snug">
                    {b.corridor_name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-mono">
                    <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{b.location.address}</span>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2 rounded border border-slate-800/80 mt-3 font-mono text-center">
                    <div>
                      <div className="text-[10px] text-slate-400">CONGESTION</div>
                      <div className="text-sm font-black text-rose-400">{b.congestion_index}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">DELAY</div>
                      <div className="text-sm font-black text-amber-400">+{b.avg_delay_minutes}m</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">QUEUE</div>
                      <div className="text-sm font-black text-slate-200">{b.queue_length_meters}m</div>
                    </div>
                  </div>

                  {/* Flow vs Capacity */}
                  <div className="mt-3 text-xs space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>Flow: {b.flow_rate_vehicles_per_min} veh/min</span>
                      <span>Cap: {b.capacity_vehicles_per_min} veh/min</span>
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

                  {/* Cause & Mitigation */}
                  <div className="mt-3 text-xs bg-slate-950 p-2.5 rounded border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                      Cause: <span className="text-amber-300">{b.bottleneck_cause.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                      💡 <strong>Mitigation:</strong> {b.mitigation_action}
                    </p>
                  </div>
                </div>

                {b.media_id && onSelectMedia && (
                  <button
                    onClick={() => onSelectMedia(b.media_id!)}
                    className="w-full mt-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs py-1.5 font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <span>Inspect Media Telemetry</span>
                    <ArrowRight className="h-3 w-3 text-emerald-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Heatwaves & Thermal Analytics */}
      {activeSubTab === 'heatwaves' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-400" />
              Urban Heat Island (UHI) & Surface Thermal Radiation
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Thermal Microclimate Hazard Index
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {heatwaves.map((h) => (
              <div
                key={h.id}
                className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        h.alert_level === 'RED_SEVERE'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                          : h.alert_level === 'ORANGE_ALERT'
                          ? 'bg-orange-950 text-orange-300 border border-orange-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {h.alert_level.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      UHI Delta: +{h.thermal_anomaly_delta}°C
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-sm leading-snug">
                    {h.zone_name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-mono">
                    <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                    <span className="truncate">{h.location.address}</span>
                  </div>

                  {/* Surface vs Ambient Temperatures */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-2.5 rounded border border-slate-800 mt-3 font-mono">
                    <div>
                      <div className="text-[10px] text-slate-400">SURFACE ASPHALT</div>
                      <div className="text-base font-black text-rose-400">
                        {h.surface_temperature_c}°C
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">AMBIENT AIR</div>
                      <div className="text-base font-black text-amber-300">
                        {h.ambient_temperature_c}°C
                      </div>
                    </div>
                  </div>

                  {/* Environmental Factors */}
                  <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <div className="text-slate-500">CANOPY</div>
                      <div className="font-bold text-emerald-400">{h.tree_canopy_percentage}%</div>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <div className="text-slate-500">ALBEDO</div>
                      <div className="font-bold text-slate-300">{h.asphalt_albedo_index}</div>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <div className="text-slate-500">EXPOSURE</div>
                      <div
                        className={`font-bold ${
                          h.pedestrian_heat_exposure_risk === 'EXTREME'
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {h.pedestrian_heat_exposure_risk}
                      </div>
                    </div>
                  </div>

                  {/* Interventions */}
                  <div className="mt-3 bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                      Urban Cooling Interventions:
                    </div>
                    <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                      {h.urban_cooling_interventions.map((action, idx) => (
                        <li key={idx} className="leading-tight">
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Actionable Insights */}
      {activeSubTab === 'insights' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-400" />
              Prioritized Municipal Remediation Work Orders
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Live Dispatch & Resolution Tracker
            </span>
          </div>

          <div className="space-y-3">
            {insights.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          item.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : item.severity === 'HIGH'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {item.severity} PRIORITY
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 uppercase">
                        DEPT: {item.department.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {item.id} • Est. Time: {item.estimated_timeline_hours}h
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 text-xs">
                      <strong className="text-emerald-400 font-mono">
                        🔧 Recommended Action:
                      </strong>{' '}
                      <span className="text-slate-200">{item.recommended_action}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                      <span>
                        Budget: <strong className="text-slate-200">{item.estimated_cost_inr}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Impact: <strong className="text-emerald-400">{item.roi_or_impact}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Status Controller */}
                  <div className="flex flex-col sm:items-end gap-2.5 min-w-[200px]">
                    <div className="text-xs font-mono">
                      <span className="text-slate-400">Status: </span>
                      <span
                        className={`font-bold ${
                          item.status === 'RESOLVED'
                            ? 'text-emerald-400'
                            : item.status === 'IN_PROGRESS'
                            ? 'text-blue-400'
                            : item.status === 'DISPATCHED'
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.status !== 'DISPATCHED' && item.status !== 'IN_PROGRESS' && item.status !== 'RESOLVED' && (
                        <button
                          disabled={updatingId === item.id}
                          onClick={() => handleUpdateInsightStatus(item.id, 'DISPATCHED')}
                          className="flex items-center gap-1 rounded bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold px-2.5 py-1 text-xs font-mono"
                        >
                          <Send className="h-3 w-3" />
                          Dispatch Crew
                        </button>
                      )}

                      {item.status === 'DISPATCHED' && (
                        <button
                          disabled={updatingId === item.id}
                          onClick={() => handleUpdateInsightStatus(item.id, 'IN_PROGRESS')}
                          className="flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 text-xs font-mono"
                        >
                          <Activity className="h-3 w-3" />
                          Mark Active
                        </button>
                      )}

                      {item.status !== 'RESOLVED' && (
                        <button
                          disabled={updatingId === item.id}
                          onClick={() => handleUpdateInsightStatus(item.id, 'RESOLVED')}
                          className="flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold px-2.5 py-1 text-xs font-mono"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Resolve
                        </button>
                      )}
                    </div>

                    {item.media_id && onSelectMedia && (
                      <button
                        onClick={() => onSelectMedia(item.media_id!)}
                        className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        View Source Evidence <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Incidents */}
      {activeSubTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              Automated Incident & Collision Risk Detections
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Video Frame Timestamp Extraction • AI Decision Support
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
                    <a
                      href={`/api/reports/incident/${inc.id}/pdf?includeAI=true`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 px-2 py-1 text-xs font-mono font-bold transition-colors"
                      title="Download Official Incident Report PDF (with AI Decision Support & Audit Appendix)"
                    >
                      <Download className="h-3 w-3 text-emerald-400" />
                      PDF Report
                    </a>

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

      {/* Tab 5: ANPR Number Plate Registry */}
      {activeSubTab === 'anpr' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-400" />
                Automatic Number Plate Recognition (ANPR) Registry
              </h2>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Timestamped OCR extraction with jurisdiction parsing and privacy masking
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search plates / states..."
                  value={plateSearch}
                  onChange={(e) => setPlateSearch(e.target.value)}
                  className="rounded bg-slate-900 border border-slate-700 pl-8 pr-3 py-1 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-48 sm:w-60"
                />
              </div>

              {/* Privacy Mask Toggle */}
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
                  <th className="p-3">Plate Number</th>
                  <th className="p-3">Track ID</th>
                  <th className="p-3">OCR Confidence</th>
                  <th className="p-3">Video Timestamp</th>
                  <th className="p-3">Jurisdiction</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredPlates.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="p-3">
                      <span className="font-black text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-700 tracking-wider">
                        {formatPlate(p.plate_number)}
                      </span>
                      {p.is_low_confidence && (
                        <span className="ml-2 text-[10px] text-amber-400 font-bold">
                          [LOW OCR]
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400">{p.track_id || 'N/A'}</td>
                    <td className="p-3">
                      <span
                        className={`font-bold ${
                          p.ocr_confidence >= 0.9
                            ? 'text-emerald-400'
                            : p.ocr_confidence >= 0.75
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
                    <td className="p-3 text-slate-400">
                      {p.state_or_jurisdiction || 'Indian State Transit'}
                    </td>
                    <td className="p-3">
                      {onSelectMedia && (
                        <button
                          onClick={() => onSelectMedia(p.media_id)}
                          className="rounded bg-purple-950 text-purple-300 border border-purple-800 hover:bg-purple-900 px-2 py-0.5 text-[11px] font-bold"
                        >
                          View Video
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Pedestrian Safety */}
      {activeSubTab === 'pedestrians' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-400" />
              Pedestrian Safety & Crowd Density Analytics
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Vulnerable Road User (VRU) Index
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 space-y-3">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                CROWD DENSITY LEVEL
              </div>
              <div className="text-2xl font-black text-teal-400 font-mono">
                MODERATE
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Aggregated pedestrian crossings along urban bus routes show 450+ pedestrians/hr with peak density near commercial junctions.
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 space-y-3">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                CROSSWALK COMPLIANCE
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                64% COMPLIANT
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Degraded or missing zebra striping at 3 major corridor intersections correlates with 78% of observed pedestrian near-miss risks.
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 space-y-3">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                SAFETY INTERVENTIONS
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                3 RECOMMENDED
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Installation of raised pedestrian refuge islands and high-contrast retroreflective paint scheduled on Route 18.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
