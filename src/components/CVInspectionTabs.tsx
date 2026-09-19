import React from 'react';
import {
  Compass,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  Route,
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Info,
  Footprints,
  Eye,
  AlertOctagon,
} from 'lucide-react';
import {
  LaneAnalysisSummary,
  VulnerablePedestrianEvent,
  RoadDividerDetection,
  LaneDepartureEvent,
} from '../types';

interface CVInspectionTabsProps {
  activeTab: 'lanes' | 'pedestrians' | 'dividers';
  laneAnalysis?: LaneAnalysisSummary;
  vulnerablePedestrians?: VulnerablePedestrianEvent[];
  roadDividers?: RoadDividerDetection[];
  currentTime: number;
  onSeekToTime: (timestampSec: number, options?: any) => void;
}

export const CVInspectionTabs: React.FC<CVInspectionTabsProps> = ({
  activeTab,
  laneAnalysis,
  vulnerablePedestrians = [],
  roadDividers = [],
  currentTime,
  onSeekToTime,
}) => {
  const currentLaneFrame =
    laneAnalysis?.frames?.find((f) => Math.abs(f.timestamp_sec - currentTime) < 0.8) ||
    laneAnalysis?.frames?.[0];
  const currentOffset = currentLaneFrame?.vehicle_lateral_offset_meters ?? 0;

  if (activeTab === 'lanes') {
    return (
      <div id="tab-lanes-container" className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 font-mono space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white uppercase">Highway Lane Detection & Lateral Deviation</h3>
              <span className="rounded bg-teal-950/80 border border-teal-500/40 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                SOLVOFIN-HighwayLaneVision-v4.2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Real-time lane boundary detection, lane-center estimation, vehicle lateral deviation, and marking wear audit.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[10px]">CURRENT OFFSET:</span>
            <span className="font-bold text-teal-300 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-xs">
              {laneAnalysis ? `${currentOffset > 0 ? '+' : ''}${currentOffset.toFixed(2)}m` : '0.00m'}
            </span>
          </div>
        </div>

        {!laneAnalysis ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded">
            No lane detection analysis available for this media. Click "Sync" or re-run analysis to evaluate highway lanes.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded border border-slate-800 bg-slate-900/80 p-2.5">
                <div className="text-[10px] text-slate-400 uppercase">Marking Quality</div>
                <div className="text-lg font-bold text-teal-400 mt-0.5">
                  {laneAnalysis.marking_quality_score}/100
                </div>
                <div className="text-[9px] text-slate-500 truncate">
                  Type: {laneAnalysis.dominant_marking_type.replace(/_/g, ' ')}
                </div>
              </div>

              <div className="rounded border border-slate-800 bg-slate-900/80 p-2.5">
                <div className="text-[10px] text-slate-400 uppercase">Center Stability</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">
                  {laneAnalysis.lane_center_stability}
                </div>
                <div className="text-[9px] text-slate-500 truncate">
                  Tracking: {laneAnalysis.frames?.length || 0} Frames Analyzed
                </div>
              </div>

              <div className="rounded border border-slate-800 bg-slate-900/80 p-2.5">
                <div className="text-[10px] text-slate-400 uppercase">Lane Deviations</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">
                  {laneAnalysis.lane_departure_events_count} Events
                </div>
                <div className="text-[9px] text-slate-500">
                  Threshold: &gt;0.35m drift
                </div>
              </div>

              <div className="rounded border border-slate-800 bg-slate-900/80 p-2.5">
                <div className="text-[10px] text-slate-400 uppercase">Degraded Sections</div>
                <div className="text-lg font-bold text-rose-400 mt-0.5">
                  {laneAnalysis.degraded_sections_count} Faded / Missing
                </div>
                <div className="text-[9px] text-slate-500">
                  Unmarked: {laneAnalysis.unmarked_sections_count}
                </div>
              </div>
            </div>

            {/* Summary Banner */}
            <div className="rounded border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300">
              <div className="text-white font-bold text-[11px] mb-1 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-teal-400" />
                Pipeline Analysis Summary
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {laneAnalysis.status_summary}
              </p>
            </div>

            {/* Lane Departure Events Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  Lane Departure / Deviation Events ({laneAnalysis.departure_events?.length || 0})
                </h4>
                <span className="text-[10px] text-slate-400">Click to seek video</span>
              </div>

              {(!laneAnalysis.departure_events || laneAnalysis.departure_events.length === 0) ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/50 rounded border border-slate-800">
                  Vehicle remained strictly centered within lane bounds. Zero departure deviations detected.
                </div>
              ) : (
                <div className="space-y-2">
                  {laneAnalysis.departure_events.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => onSeekToTime(evt.timestamp_sec, { laneEventId: evt.id })}
                      className="cursor-pointer rounded border border-amber-500/30 hover:border-amber-400 bg-amber-950/20 hover:bg-amber-950/30 p-2.5 transition-all text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-300">
                            {evt.event_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-900/80 text-amber-200 border border-amber-700">
                            {evt.severity}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            @{evt.timestamp_sec.toFixed(1)}s (Frame #{evt.frame_number})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">{evt.description}</p>
                        <div className="text-[9px] text-slate-500 flex items-center gap-2">
                          <span>Offset: <strong className="text-teal-300">{evt.offset_meters.toFixed(2)}m</strong> ({evt.direction})</span>
                          <span>•</span>
                          <span>Confidence: <strong>{(evt.confidence * 100).toFixed(0)}%</strong></span>
                          <span>•</span>
                          <span>GPS: {evt.latitude ? `${evt.latitude.toFixed(4)}°N, ${evt.longitude?.toFixed(4)}°E` : 'GPS Telemetry Synced'}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="self-start sm:self-center shrink-0 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold px-2.5 py-1 text-[10px] flex items-center gap-1 shadow"
                      >
                        <Clock className="h-3 w-3" />
                        Seek to {evt.timestamp_sec.toFixed(1)}s
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Degraded Lane Marking Frame Records */}
            {laneAnalysis.frames &&
              laneAnalysis.frames.some(
                (f) =>
                  f.left_boundary?.condition !== 'CLEAR_VISIBLE' ||
                  f.right_boundary?.condition !== 'CLEAR_VISIBLE'
              ) && (
                <div>
                  <h4 className="text-xs font-bold text-white uppercase mb-2 flex items-center gap-1.5">
                    <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
                    Marking Wear & Degradation Audit
                  </h4>
                  <div className="space-y-1.5">
                    {laneAnalysis.frames
                      .filter(
                        (f) =>
                          f.left_boundary?.condition !== 'CLEAR_VISIBLE' ||
                          f.right_boundary?.condition !== 'CLEAR_VISIBLE'
                      )
                      .slice(0, 6)
                      .map((f, idx) => (
                        <div
                          key={idx}
                          onClick={() => onSeekToTime(f.timestamp_sec)}
                          className="cursor-pointer rounded border border-slate-800 bg-slate-900 hover:bg-slate-850 p-2 text-xs flex items-center justify-between transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-rose-400 text-[11px]">
                                {f.left_boundary?.condition !== 'CLEAR_VISIBLE'
                                  ? `LEFT MARKING: ${f.left_boundary?.condition}`
                                  : `RIGHT MARKING: ${f.right_boundary?.condition}`}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                @{f.timestamp_sec.toFixed(1)}s (Frame #{f.frame_number})
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-300">
                              Marking degradation detected. Repainting and reflectivity renewal recommended.
                            </p>
                          </div>
                          <span className="text-[10px] text-teal-400 underline">Seek</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'pedestrians') {
    return (
      <div id="tab-pedestrians-container" className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 font-mono space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase">Vulnerable Pedestrian & School Child Safety AI</h3>
              <span className="rounded bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                SOLVOFIN-PedestrianVulnerabilityAI-v4.2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Perspective-scaled bounding box metrics, school-zone context cues, backpack detection, and roadway curb proximity.
            </p>
          </div>
          <span className="rounded bg-slate-900 border border-slate-700 px-2.5 py-1 text-xs font-bold text-amber-400">
            {vulnerablePedestrians.length} Vulnerable Road Users
          </span>
        </div>

        {vulnerablePedestrians.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded">
            No vulnerable pedestrians or school children detected in this corridor.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pedestrian Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vulnerablePedestrians.map((ped) => {
                const isSchool = ped.pedestrian_type === 'SCHOOL_CHILD' || ped.has_school_bag_indicator;
                return (
                  <div
                    key={ped.id}
                    onClick={() => onSeekToTime(ped.timestamp_sec, { pedId: ped.id })}
                    className="cursor-pointer rounded border border-amber-500/30 hover:border-amber-400 bg-amber-950/15 hover:bg-amber-950/25 p-3 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{isSchool ? '🎒' : '🚸'}</span>
                        <span className="font-bold text-white text-xs">
                          {isSchool ? 'School Child Risk' : 'Vulnerable Pedestrian'}
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-900/80 text-amber-200 border border-amber-700">
                        {ped.severity}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300">{ped.description}</p>

                    {/* Proximity and contextual stats */}
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-900/80 p-2 rounded text-[10px]">
                      <div>
                        <span className="text-slate-500">Risk Situation:</span>
                        <div className="font-bold text-amber-300">{ped.risk_situation.replace(/_/g, ' ')}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Distance to Vehicle:</span>
                        <div className="font-bold text-slate-200">
                          {ped.distance_to_vehicle_m ? `${ped.distance_to_vehicle_m.toFixed(1)}m` : 'In Travel Lane'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Distance to Curb:</span>
                        <div className="font-bold text-slate-200">
                          {ped.distance_to_curb_m ? `${ped.distance_to_curb_m.toFixed(1)}m` : 'Roadway Center'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Height Ratio:</span>
                        <div className="font-bold text-slate-200">
                          {ped.height_ratio_relative_to_adult ? `${(ped.height_ratio_relative_to_adult * 100).toFixed(0)}% of adult` : 'Sub-adult'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-400" />
                        @{ped.timestamp_sec.toFixed(1)}s (Frame #{ped.frame_number})
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {ped.latitude ? `${ped.latitude.toFixed(4)}°N, ${ped.longitude?.toFixed(4)}°E` : 'GPS Synced'}
                      </span>
                      <button
                        type="button"
                        className="rounded bg-amber-600 hover:bg-amber-500 text-white font-bold px-2 py-0.5 text-[9px]"
                      >
                        Seek Frame
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'dividers') {
    return (
      <div id="tab-dividers-container" className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 font-mono space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase">Road Divider & Median Barrier Structural Inspection</h3>
              <span className="rounded bg-indigo-950/80 border border-indigo-500/40 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                SOLVOFIN-RoadDividerInspection-v4.2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Continuity analysis, barrier displacement, concrete Jersey barrier breakages, and false-positive suppression.
            </p>
          </div>
          <span className="rounded bg-slate-900 border border-slate-700 px-2.5 py-1 text-xs font-bold text-indigo-400">
            {roadDividers.length} Inspected Segments
          </span>
        </div>

        {roadDividers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded">
            No median divider defects or barrier issues detected in this roadway section.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Divider Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roadDividers.map((div) => {
                const isDamaged =
                  div.condition === 'DAMAGED_BARRIER' ||
                  div.condition === 'BROKEN_SECTION' ||
                  div.condition === 'MISSING_DIVIDER_SECTION' ||
                  div.condition === 'DISPLACED_INTO_LANE';

                return (
                  <div
                    key={div.id}
                    onClick={() => onSeekToTime(div.timestamp_sec, { dividerId: div.id })}
                    className={`cursor-pointer rounded border p-3 transition-all space-y-2 ${
                      isDamaged
                        ? 'border-rose-500/40 hover:border-rose-400 bg-rose-950/15 hover:bg-rose-950/25'
                        : 'border-indigo-500/30 hover:border-indigo-400 bg-indigo-950/15 hover:bg-indigo-950/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{isDamaged ? '⚠️' : '🚧'}</span>
                        <span className="font-bold text-white text-xs">
                          {div.divider_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                          isDamaged
                            ? 'bg-rose-900/80 text-rose-200 border-rose-700'
                            : 'bg-indigo-900/80 text-indigo-200 border-indigo-700'
                        }`}
                      >
                        {div.condition.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300">{div.description}</p>

                    {/* Technical stats */}
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-900/80 p-2 rounded text-[10px]">
                      <div>
                        <span className="text-slate-500">Visual Evidence:</span>
                        <div className="font-bold text-emerald-400">
                          {div.is_sufficient_evidence ? 'SUFFICIENT EVIDENCE' : 'SUPPRESSED / LOW'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Confidence:</span>
                        <div className="font-bold text-slate-200">{(div.confidence * 100).toFixed(0)}%</div>
                      </div>
                      {div.gap_length_meters_est && (
                        <div>
                          <span className="text-slate-500">Gap Length Est:</span>
                          <div className="font-bold text-rose-400">{div.gap_length_meters_est.toFixed(1)} meters</div>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500">Action:</span>
                        <div className="font-bold text-amber-300">{div.recommended_action || 'Inspect'}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-indigo-400" />
                        @{div.timestamp_sec.toFixed(1)}s (Frame #{div.frame_number})
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {div.latitude ? `${div.latitude.toFixed(4)}°N, ${div.longitude?.toFixed(4)}°E` : 'Corridor GPS'}
                      </span>
                      <button
                        type="button"
                        className="rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-0.5 text-[9px]"
                      >
                        Seek Frame
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
