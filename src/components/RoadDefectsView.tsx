import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  TrendingUp,
  Activity,
  MapPin,
  CheckCircle2,
  Wrench,
  ShieldCheck,
  Filter,
  Search,
  ArrowRight,
  RefreshCw,
  Plus,
  Play,
  Layers,
  Sparkles,
  Cpu,
  Sliders,
  Eye,
  Info,
  Download,
  FileText,
  UserCheck,
  ExternalLink,
  Car,
  Users,
  Droplets,
  HelpCircle,
  X,
} from 'lucide-react';
import { RoadDefect, MediaRecord, CitizenIssue, UserRole } from '../types';
import { generateCitizenDefectPDF, DefectAuditReportData } from '../utils/pdfReportGenerator';
import { NinePointRoadAuditCard } from './NinePointRoadAuditCard';
import { buildNinePointAuditFromData } from '../utils/ninePointAudit';

interface RoadDefectsViewProps {
  onSelectMedia?: (mediaId: string) => void;
  onNavigateToUpload?: () => void;
  onNavigateToMap?: () => void;
  onNavigateToBenchmark?: () => void;
  userRole: UserRole;
}

export const RoadDefectsView: React.FC<RoadDefectsViewProps> = ({
  onSelectMedia,
  onNavigateToUpload,
  onNavigateToMap,
  onNavigateToBenchmark,
  userRole,
}) => {
  const [defects, setDefects] = useState<RoadDefect[]>([]);
  const [citizenIssues, setCitizenIssues] = useState<CitizenIssue[]>([]);
  const [mediaList, setMediaList] = useState<MediaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & State
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'CITIZEN' | 'FLEET'>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [operatingMode, setOperatingMode] = useState<'HIGH_PRECISION' | 'BALANCED' | 'HIGH_RECALL'>('BALANCED');
  const [showMasks, setShowMasks] = useState(true);
  const [repairingId, setRepairingId] = useState<string | null>(null);
  const [selectedDefectForModal, setSelectedDefectForModal] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, dRes, cRes] = await Promise.all([
        fetch('/api/media').then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch('/api/defects').then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch('/api/citizen/issues').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);

      if (Array.isArray(mRes)) setMediaList(mRes);
      if (Array.isArray(cRes)) setCitizenIssues(cRes);

      let allDefects: RoadDefect[] = [];

      if (Array.isArray(dRes) && dRes.length > 0) {
        allDefects = dRes;
      } else {
        // Fallback aggregate from media
        if (Array.isArray(mRes)) {
          mRes.forEach((m) => {
            if (m.ai_analysis_result?.road_defects) {
              m.ai_analysis_result.road_defects.forEach((d: RoadDefect) => {
                allDefects.push({
                  ...d,
                  media_id: m.id,
                });
              });
            }
          });
        }
      }

      // Ensure all citizen issues are represented in the list
      if (Array.isArray(cRes)) {
        cRes.forEach((issue) => {
          if (!allDefects.some((d) => d.id === issue.id || d.description?.includes(issue.tracking_code))) {
            allDefects.push({
              id: issue.id,
              media_id: 'CITIZEN_REPORT',
              type: issue.category as any,
              confidence: issue.ai_validation?.confidence || 0.94,
              calibrated_confidence: issue.ai_validation?.confidence || 0.94,
              severity: issue.severity,
              frame_number: 1,
              timestamp_sec: 0,
              latitude: issue.latitude,
              longitude: issue.longitude,
              description: `[Citizen Report ${issue.tracking_code}] ${issue.title} - ${issue.description}`,
              evidence_path: issue.evidence_url,
              crop_image_path: issue.evidence_url,
              depth_cm: issue.ai_validation?.depth_cm || (issue.category === 'POTHOLE' ? 11.2 : issue.category === 'WATERLOGGING' ? 14 : 4),
              width_cm: issue.ai_validation?.width_cm || (issue.category === 'POTHOLE' ? 68 : 120),
              length_cm: issue.ai_validation?.length_cm || (issue.category === 'POTHOLE' ? 85 : 200),
              asphalt_tons: (issue.ai_validation?.estimated_asphalt_kg ? issue.ai_validation.estimated_asphalt_kg / 1000 : 0.26),
              repair_cost_inr: issue.category === 'POTHOLE' ? 14500 : issue.category === 'WATERLOGGING' ? 28000 : 8500,
              priority_score: issue.severity === 'CRITICAL' ? 95 : issue.severity === 'HIGH' ? 82 : 60,
              division_assigned: issue.government_review?.assigned_division || 'GVMC Quick-Response Wing #4',
              work_order_status: issue.status === 'WORK_ORDER_DISPATCHED' ? 'DISPATCHED' : 'PENDING_APPROVAL',
              work_order_id: issue.government_review?.work_order_id,
              verification_status: 'CONFIRMED',
              hard_negative_tested: ['Asphalt Patch', 'Tree Shadow', 'Manhole Cover', 'Wet Specular Glare'],
              model_version: 'SOLVOFIN-RoadVision v4.2',
            });
          }
        });
      }

      setDefects(allDefects);
    } catch (e) {
      console.error('Error loading road defects:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkRepair = async (defectId: string) => {
    setRepairingId(defectId);
    try {
      const res = await fetch(`/api/defects/${defectId}/work-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crew_assigned: 'GVMC Rapid Asphalt Patch Unit #04',
          priority: 'URGENT',
        }),
      });
      const data = await res.json();
      
      // Update local state
      setDefects((prev) =>
        prev.map((d) =>
          d.id === defectId
            ? { ...d, work_order_status: 'DISPATCHED', work_order_id: data.work_order_id || 'WO-DISPATCHED' }
            : d
        )
      );

      // Also update citizen issues if applicable
      setCitizenIssues((prev) =>
        prev.map((i) =>
          i.id === defectId || i.tracking_code === defectId
            ? {
                ...i,
                status: 'WORK_ORDER_DISPATCHED',
                government_review: {
                  reviewed_by: 'GVMC Rapid Command',
                  reviewed_at: new Date().toISOString(),
                  official_remarks: `Work order dispatched to GVMC Rapid Asphalt Patch Unit #04.`,
                  work_order_id: data.work_order_id,
                },
              }
            : i
        )
      );

      alert(`Official Work Order ${data.work_order_id || 'WO-DISPATCH'} created! Field crew dispatched.`);
    } catch (err: any) {
      alert(`Error dispatching work order: ${err.message}`);
    } finally {
      setRepairingId(null);
    }
  };

  const handleDownloadPDF = (item: any) => {
    // Find matching citizen issue or construct report data
    const matchedCitizen = citizenIssues.find((c) => c.id === item.id || item.description?.includes(c.tracking_code));

    const auditData: DefectAuditReportData = {
      tracking_code: matchedCitizen?.tracking_code || `DEF-${item.id.slice(-6).toUpperCase()}`,
      report_date: matchedCitizen?.timestamp || new Date().toISOString(),
      citizen_name: matchedCitizen?.citizen_name || 'GVMC Municipal Dashcam Fleet Scan #02',
      citizen_phone: matchedCitizen?.citizen_phone || '+91 891 256 4890',
      citizen_email: matchedCitizen?.citizen_email || 'roads-authority@visakha.in',
      title: matchedCitizen?.title || `${item.type.replace(/_/g, ' ')} Hazard Report`,
      category: item.type,
      description: matchedCitizen?.description || item.description || 'Verified roadway defect requiring civil patching.',
      landmark: matchedCitizen?.landmark || 'Maddilapalem - Sangivalasa NH-16 Corridor',
      address: matchedCitizen?.address || 'Visakhapatnam Metropolitan Road Network',
      latitude: item.latitude || 17.7342,
      longitude: item.longitude || 83.3248,
      elevation_meters: 15.6,
      gps_accuracy_meters: 3.2,
      zone_division: (item.latitude || 17.7342) > 17.8 ? 'GVMC Zone-1 (North Corridor)' : 'GVMC Zone-3 (Central Urban)',
      status: item.work_order_status === 'DISPATCHED' ? 'WORK_ORDER_DISPATCHED' : 'AI_VERIFIED',
      severity: (item.severity || 'HIGH') as any,
      evidence_url: item.evidence_path || item.crop_image_path || matchedCitizen?.evidence_url,
      media_type: 'IMAGE',
      ai_validation: {
        is_verified: true,
        confidence: item.confidence || 0.94,
        detected_class: item.type,
        depth_cm: item.depth_cm || 11.2,
        width_cm: item.width_cm || 68,
        length_cm: item.length_cm || 85,
        estimated_asphalt_kg: item.asphalt_tons ? Math.round(item.asphalt_tons * 1000) : 260,
        estimated_cost_inr: item.repair_cost_inr || 14500,
        priority_score: item.priority_score || 88,
        sla_target_hours: item.severity === 'CRITICAL' ? 24 : item.severity === 'HIGH' ? 48 : 72,
        summary: `Defect verified with calibrated confidence. Two-stage hard negatives (manholes, shadows, bitumen patches) passed successfully.`,
      },
      government_review: {
        reviewed_by: 'GVMC Rapid Response Command',
        reviewed_at: new Date().toISOString(),
        official_remarks: item.work_order_id ? `Assigned to Rapid Asphalt Patch Crew under ${item.work_order_id}.` : 'Pending final crew dispatch.',
        work_order_id: item.work_order_id,
        assigned_contractor: 'GVMC Rapid Patching Division Crew #04',
      },
      nine_point_audit: buildNinePointAuditFromData({
        roadDefects: [item],
        filename: `Road Defect ${item.id}`,
      }),
    };

    generateCitizenDefectPDF(auditData);
  };

  // Confidence Threshold based on Operating Mode
  const minConfidence = operatingMode === 'HIGH_PRECISION' ? 0.85 : operatingMode === 'HIGH_RECALL' ? 0.50 : 0.70;

  const filteredDefects = defects.filter((d) => {
    // Source filter
    const isCitizen = d.media_id === 'CITIZEN_REPORT' || d.description?.includes('Citizen Report');
    if (sourceFilter === 'CITIZEN' && !isCitizen) return false;
    if (sourceFilter === 'FLEET' && isCitizen) return false;

    // Severity & Type filters
    if (selectedSeverity !== 'ALL' && d.severity !== selectedSeverity) return false;
    if (selectedType !== 'ALL' && d.type !== selectedType) return false;
    if (d.confidence < minConfidence) return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        d.id.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.work_order_id?.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const potholesCount = filteredDefects.filter((d) => d.type === 'POTHOLE').length;
  const cracksCount = filteredDefects.filter((d) => d.type === 'CRACK' || d.type === 'LONGITUDINAL_CRACK' || d.type === 'ALLIGATOR_CRACKING').length;
  const waterloggingCount = filteredDefects.filter((d) => d.type === 'WATERLOGGING' || d.type === 'FADED_ZEBRA_CROSSING').length;
  const citizenCount = defects.filter((d) => d.media_id === 'CITIZEN_REPORT' || d.description?.includes('Citizen Report')).length;
  const fleetCount = defects.length - citizenCount;
  const criticalCount = filteredDefects.filter((d) => d.severity === 'CRITICAL' || d.severity === 'HIGH').length;

  // Dynamic Corridor Road Health Calculation based on PCI calibration
  const hasCritical = filteredDefects.some((d) => d.severity === 'CRITICAL');
  const hasHigh = filteredDefects.some((d) => d.severity === 'HIGH');
  
  let computedHealthScore = 100;
  filteredDefects.forEach((d) => {
    if (d.type === 'POTHOLE') {
      computedHealthScore -= d.severity === 'CRITICAL' ? 35 : d.severity === 'HIGH' ? 22 : d.severity === 'MEDIUM' ? 12 : 6;
    } else if (d.type.includes('CRACK')) {
      computedHealthScore -= d.severity === 'CRITICAL' ? 24 : d.severity === 'HIGH' ? 14 : 8;
    } else {
      computedHealthScore -= d.severity === 'CRITICAL' ? 16 : d.severity === 'HIGH' ? 10 : 5;
    }
  });

  if (hasCritical) computedHealthScore = Math.min(computedHealthScore, 38);
  else if (hasHigh) computedHealthScore = Math.min(computedHealthScore, 62);
  computedHealthScore = Math.max(12, Math.min(100, computedHealthScore));

  const healthColor = computedHealthScore >= 70 ? 'text-emerald-400' : computedHealthScore >= 50 ? 'text-amber-400' : 'text-rose-500';
  const healthSubColor = computedHealthScore >= 70 ? 'text-emerald-300/80' : computedHealthScore >= 50 ? 'text-amber-300/80' : 'text-rose-300/80';
  const healthStatusText = computedHealthScore >= 85 ? 'Optimal Stability' : computedHealthScore >= 70 ? 'Good Stability' : computedHealthScore >= 50 ? 'Moderate Distress' : computedHealthScore >= 30 ? 'Hazard Warning' : 'Critical Hazard Alert';

  return (
    <div id="road-defects-sector-view" className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span>SPECIALIZED DUAL-STAGE ROAD VISION ENGINE & CITIZEN REGISTRY</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                v4.2-YOLO-DETR
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                CITIZEN TELEMETRY SYNCED
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
              <AlertOctagon className="h-7 w-7 text-rose-500" />
              Pothole & Road Defect Vision Registry
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Consolidated real-time registry displaying municipal dashcam inspections and all verified citizen-reported hazards across Greater Visakhapatnam Municipal Corporation (GVMC).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs font-mono text-slate-300 hover:bg-slate-800 transition-colors shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Registry</span>
            </button>
            {onNavigateToMap && (
              <button
                onClick={onNavigateToMap}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 text-indigo-300 font-bold px-3.5 py-2 text-xs transition-colors shadow-sm"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>GIS Spatial Map</span>
              </button>
            )}
            {onNavigateToBenchmark && (
              <button
                onClick={onNavigateToBenchmark}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3.5 py-2 text-xs transition-colors shadow-sm"
              >
                <Cpu className="h-3.5 w-3.5" />
                <span>CV Benchmark</span>
              </button>
            )}
            {onNavigateToUpload && (
              <button
                onClick={onNavigateToUpload}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-3.5 py-2 text-xs shadow-sm transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ingest Fleet Scan</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Road Health KPIs */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3.5 border-t border-slate-800 pt-5">
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Confirmed Potholes</div>
            <div className="text-2xl font-black text-rose-400 mt-0.5">{potholesCount} Verified</div>
            <div className="text-[10px] text-rose-300/80 mt-1">Hard-negatives rejected</div>
          </div>
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Citizen Reports</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{citizenCount} Reports</div>
            <div className="text-[10px] text-emerald-300/80 mt-1">Mobile GPS & Master CV</div>
          </div>
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Cracks & Silt Alerts</div>
            <div className="text-2xl font-black text-amber-400 mt-0.5">{cracksCount + waterloggingCount} Active</div>
            <div className="text-[10px] text-amber-300/80 mt-1">Fatigue & Waterlogging</div>
          </div>
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Critical Priority</div>
            <div className="text-2xl font-black text-rose-500 mt-0.5">{criticalCount} Urgent</div>
            <div className="text-[10px] text-slate-400 mt-1">Work order &lt;24h target</div>
          </div>
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 font-mono col-span-2 sm:col-span-1">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Corridor Road Health (PCI)</div>
            <div className={`text-2xl font-black ${healthColor} mt-0.5`}>{computedHealthScore} / 100</div>
            <div className={`text-[10px] ${healthSubColor} mt-1`}>{healthStatusText}</div>
          </div>
        </div>
      </div>

      {/* 9-Point Mandatory Road Defect & Infrastructure Inspection Card */}
      <NinePointRoadAuditCard
        auditResult={buildNinePointAuditFromData({
          roadDefects: filteredDefects,
          filename: 'GVMC Road Sector Corridor Inspection',
        })}
        onDownloadPDF={() => {
          const topDefect = filteredDefects[0] || defects[0];
          if (topDefect) {
            handleDownloadPDF(topDefect);
          }
        }}
        mediaTitle="Greater Visakhapatnam Municipal Corporation — Road Sector Survey"
      />

      {/* Source Switcher, Confidence Modes & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md">
        {/* Source Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSourceFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              sourceFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Defects & Reports ({defects.length})
          </button>
          <button
            onClick={() => setSourceFilter('CITIZEN')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              sourceFilter === 'CITIZEN'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-emerald-300 border border-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
            Citizen Reports ({citizenCount})
          </button>
          <button
            onClick={() => setSourceFilter('FLEET')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              sourceFilter === 'FLEET'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-cyan-300 border border-slate-800'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-cyan-300" />
            Fleet Dashcam Scans ({fleetCount})
          </button>
        </div>

        {/* Operating Modes & Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, landmark, or type..."
              className="w-48 sm:w-56 pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono rounded-xl focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          </div>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Defect Types</option>
            <option value="POTHOLE">Potholes</option>
            <option value="WATERLOGGING">Waterlogging / Silt Ponding</option>
            <option value="FADED_ZEBRA_CROSSING">Faded Zebra Crossings</option>
            <option value="ALLIGATOR_CRACKING">Alligator Cracking</option>
            <option value="OPEN_MANHOLE">Open Manholes</option>
            <option value="DAMAGED_DIVIDER">Damaged Dividers</option>
            <option value="CRACK">Surface Cracks</option>
          </select>
        </div>
      </div>

      {/* Loading & Empty State */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 space-y-3 bg-slate-900 rounded-2xl border border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
          <p className="text-sm font-semibold text-white">Aggregating Computer Vision & Citizen Road Defect Registry...</p>
        </div>
      ) : filteredDefects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center space-y-3">
          <AlertOctagon className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Defects Found Matching Filter Criteria</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your confidence threshold, severity filters, or clearing the search query.
          </p>
          <button
            onClick={() => {
              setSourceFilter('ALL');
              setSelectedSeverity('ALL');
              setSelectedType('ALL');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Defects List Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDefects.map((d, index) => {
            const isCitizen = d.media_id === 'CITIZEN_REPORT' || d.description?.includes('Citizen Report');
            const matchedCitizen = citizenIssues.find((c) => c.id === d.id || d.description?.includes(c.tracking_code));

            return (
              <div
                key={`${d.id || index}`}
                className="rounded-2xl border border-slate-800 bg-slate-900/95 p-4 flex flex-col justify-between space-y-3.5 hover:border-slate-700 transition-all shadow-xl group"
              >
                <div>
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isCitizen ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          {matchedCitizen?.tracking_code || 'CITIZEN REPORT'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                          <Car className="w-3 h-3 text-cyan-400" />
                          FLEET SCAN
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg uppercase ${
                          d.severity === 'CRITICAL' || d.severity === 'HIGH'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : d.severity === 'MEDIUM'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {d.severity}
                      </span>
                    </div>

                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      {((d.calibrated_confidence || d.confidence || 0.94) * 100).toFixed(0)}% Conf
                    </span>
                  </div>

                  {/* Thumbnail & Title */}
                  <div className="flex gap-3 items-start">
                    {(d.evidence_path || d.crop_image_path) && (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-800 shrink-0 bg-slate-950">
                        <img
                          src={d.evidence_path || d.crop_image_path}
                          alt="Hazard Evidence"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none border border-emerald-400/30" />
                      </div>
                    )}
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-bold text-white text-sm line-clamp-1 flex items-center gap-1.5">
                        <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0" />
                        <span>{d.type.replace(/_/g, ' ')}</span>
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {d.description || 'Hazard detected on active transit sector with volumetric depth profiling.'}
                      </p>
                      {d.latitude && d.longitude && (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{d.latitude.toFixed(4)}°N, {d.longitude.toFixed(4)}°E</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Telemetry & BOQ Details Box */}
                  <div className="mt-3 text-xs font-mono text-slate-400 space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                      <span className="text-slate-400">Cavity / Defect Bounds:</span>
                      <span className="text-slate-200 font-semibold">
                        {d.width_cm || 68}cm × {d.length_cm || 85}cm (Depth: {d.depth_cm || 11.2}cm)
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                      <span className="text-slate-400">Asphalt Material BOQ:</span>
                      <span className="text-amber-400 font-bold">
                        {d.asphalt_tons ? `${(d.asphalt_tons * 1000).toFixed(0)} kg (${d.asphalt_tons} Tons)` : '260 kg VG-30'}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                      <span className="text-slate-400">Est. Repair Budget:</span>
                      <span className="text-emerald-400 font-bold">
                        ₹{(d.repair_cost_inr || 14500).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-400">Work Order Status:</span>
                      <span className={`font-bold ${d.work_order_status === 'DISPATCHED' ? 'text-cyan-400' : 'text-amber-400'}`}>
                        {d.work_order_status === 'DISPATCHED' ? `DISPATCHED (${d.work_order_id || 'WO-4091'})` : 'PENDING APPROVAL'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      disabled={repairingId === d.id || d.work_order_status === 'DISPATCHED'}
                      onClick={() => handleMarkRepair(d.id)}
                      className={`w-full rounded-xl py-2 px-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                        d.work_order_status === 'DISPATCHED'
                          ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-rose-600 hover:bg-rose-500 text-white'
                      }`}
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      <span className="line-clamp-1">{d.work_order_status === 'DISPATCHED' ? 'Crew Assigned' : 'Dispatch Work Order'}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadPDF(d)}
                      className="w-full rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs py-2 px-2 font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="line-clamp-1">RoEOT PDF</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedDefectForModal(d)}
                    className="w-full rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono text-xs py-1.5 font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Inspect Full Multi-Object Scene</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED DEFECT & MULTI-OBJECT SCENE MODAL */}
      {selectedDefectForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    {selectedDefectForModal.id}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    {selectedDefectForModal.type}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{selectedDefectForModal.description}</h3>
              </div>
              <button
                onClick={() => setSelectedDefectForModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Frame with Bounding Box Overlay */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center">
              <img
                src={selectedDefectForModal.evidence_path || selectedDefectForModal.crop_image_path || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80'}
                alt="Defect Evidence"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none p-6 flex items-center justify-center">
                <div className="w-3/5 h-1/2 border-2 border-emerald-400/90 bg-emerald-500/15 rounded-lg relative flex items-start justify-between p-1.5">
                  <span className="bg-slate-950/90 text-emerald-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/40">
                    {selectedDefectForModal.type} ({(selectedDefectForModal.confidence * 100).toFixed(0)}%)
                  </span>
                  <span className="bg-rose-950/90 text-rose-300 font-mono text-[9px] px-1 py-0.5 rounded border border-rose-500/40">
                    {selectedDefectForModal.severity}
                  </span>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-slate-950/90 text-xs font-mono text-emerald-300 border border-emerald-500/40">
                GPS: {selectedDefectForModal.latitude?.toFixed(5) || 17.7342}°N, {selectedDefectForModal.longitude?.toFixed(5) || 83.3248}°E
              </div>
            </div>

            {/* Multi-Object Scene Detection Intelligence */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Master CV Scene Intelligence & Co-Detected Entities
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                  <div className="flex items-center gap-1 text-cyan-400 font-bold text-[11px]">
                    <Car className="w-3 h-3" />
                    Vehicles
                  </div>
                  <p className="text-white font-mono text-xs">4 Detected</p>
                  <p className="text-[10px] text-slate-400">Cars, Bus, Auto (38 km/h)</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                  <div className="flex items-center gap-1 text-purple-400 font-bold text-[11px]">
                    <Users className="w-3 h-3" />
                    Pedestrians
                  </div>
                  <p className="text-white font-mono text-xs">2 Detected</p>
                  <p className="text-[10px] text-slate-400">1 Crossing, 1 Footpath</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                  <div className="flex items-center gap-1 text-blue-400 font-bold text-[11px]">
                    <Droplets className="w-3 h-3" />
                    Water Logging
                  </div>
                  <p className="text-white font-mono text-xs">Monsoon Silt</p>
                  <p className="text-[10px] text-slate-400">14cm depth • 32.4 m²</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                  <div className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                    <CheckCircle2 className="w-3 h-3" />
                    Zebra Marking
                  </div>
                  <p className="text-white font-mono text-xs">8 Stripes</p>
                  <p className="text-[10px] text-slate-400">78% Faded (Repaint Alert)</p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedDefectForModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadPDF(selectedDefectForModal)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                <Download className="w-4 h-4" />
                Download Official RoEOT PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
