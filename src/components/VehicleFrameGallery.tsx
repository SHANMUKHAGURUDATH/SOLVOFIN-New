import React, { useState, useEffect, useRef } from 'react';
import {
  Car,
  Play,
  Eye,
  Search,
  Filter,
  Grid,
  List,
  Film,
  Sparkles,
  Download,
  Flame,
  CheckCircle2,
  Clock,
  Gauge,
  Compass,
  RefreshCw,
  Maximize2,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { VehicleRecord, MediaRecord, LicensePlate, SmokeEvent } from '../types';
import { VehicleKeyframeInspector } from './VehicleKeyframeInspector';

interface VehicleFrameGalleryProps {
  media: MediaRecord;
  vehicles: VehicleRecord[];
  licensePlates: LicensePlate[];
  smokeEvents: SmokeEvent[];
  currentTime: number;
  onSeekToTime: (timeSec: number, target?: any) => void;
  onReScanFleet?: () => void;
  isScanningFleet?: boolean;
}

export const VehicleFrameGallery: React.FC<VehicleFrameGalleryProps> = ({
  media,
  vehicles,
  licensePlates,
  smokeEvents,
  currentTime,
  onSeekToTime,
  onReScanFleet,
  isScanningFleet = false,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'filmstrip' | 'table'>('cards');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [smokeOnly, setSmokeOnly] = useState<boolean>(false);
  const [plateOnly, setPlateOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'time' | 'confidence' | 'speed'>('time');

  // Keyframe snapshot cache: vehicleId -> DataURL
  const [frameSnapshots, setFrameSnapshots] = useState<Record<string, string>>({});
  const [isExtractingFrames, setIsExtractingFrames] = useState(false);
  const [inspectingVehicle, setInspectingVehicle] = useState<VehicleRecord | null>(null);

  // Extract keyframe snapshots from the video via hidden canvas
  useEffect(() => {
    if (media.media_type !== 'VIDEO' || vehicles.length === 0) return;

    let isMounted = true;
    const videoUrl = media.storage_path;

    const extractSnapshots = async () => {
      setIsExtractingFrames(true);
      const hiddenVideo = document.createElement('video');
      hiddenVideo.crossOrigin = 'anonymous';
      hiddenVideo.muted = true;
      hiddenVideo.playsInline = true;
      hiddenVideo.src = videoUrl;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const waitForVideoEvent = (element: HTMLVideoElement, event: string) => {
        return new Promise((resolve) => {
          const handler = () => {
            element.removeEventListener(event, handler);
            resolve(true);
          };
          element.addEventListener(event, handler);
        });
      };

      try {
        // Wait for metadata
        await new Promise((resolve, reject) => {
          hiddenVideo.onloadedmetadata = resolve;
          hiddenVideo.onerror = reject;
          setTimeout(resolve, 3000); // timeout safeguard
        });

        const vW = hiddenVideo.videoWidth || 480;
        const vH = hiddenVideo.videoHeight || 270;
        canvas.width = Math.min(640, vW);
        canvas.height = Math.round(canvas.width * (vH / vW));

        const snapshots: Record<string, string> = {};

        // Extract keyframe for each unique timestamp
        for (const veh of vehicles) {
          if (!isMounted) break;
          const targetSec = Math.max(0.1, typeof veh.timestamp_sec === 'number' ? veh.timestamp_sec : 1.0);

          try {
            hiddenVideo.currentTime = targetSec;
            await waitForVideoEvent(hiddenVideo, 'seeked');

            if (ctx) {
              ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);
              snapshots[veh.id] = canvas.toDataURL('image/jpeg', 0.85);
            }
          } catch {
            // Ignore single frame extraction error
          }
        }

        if (isMounted) {
          setFrameSnapshots((prev) => ({ ...prev, ...snapshots }));
        }
      } catch (err) {
        console.warn('Frame extraction notice:', err);
      } finally {
        if (isMounted) setIsExtractingFrames(false);
        hiddenVideo.remove();
        canvas.remove();
      }
    };

    extractSnapshots();

    return () => {
      isMounted = false;
    };
  }, [media.storage_path, media.media_type, vehicles]);

  // Vehicle Filtering & Sorting
  const filteredVehicles = vehicles
    .filter((v) => {
      if (typeFilter !== 'ALL' && v.vehicle_type !== typeFilter) return false;
      if (smokeOnly && !v.has_smoke) return false;
      if (plateOnly && !v.license_plate_id) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTrack = v.track_id.toLowerCase().includes(q);
        const matchesType = v.vehicle_type.toLowerCase().includes(q);
        const matchesPlate = v.license_plate_id?.toLowerCase().includes(q);
        if (!matchesTrack && !matchesType && !matchesPlate) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'speed') return (b.speed_kmh_est || 0) - (a.speed_kmh_est || 0);
      const timeA = typeof a.timestamp_sec === 'number' ? a.timestamp_sec : 0;
      const timeB = typeof b.timestamp_sec === 'number' ? b.timestamp_sec : 0;
      return timeA - timeB;
    });

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'BUS': return '🚌';
      case 'TRUCK': return '🚚';
      case 'AUTO_RICKSHAW': return '🛺';
      case 'MOTORCYCLE': return '🏍️';
      case 'SCOOTER': return '🛵';
      case 'BICYCLE': return '🚲';
      case 'VAN': return '🚐';
      case 'EMERGENCY_VEHICLE': return '🚑';
      default: return '🚗';
    }
  };

  const getVehicleBadgeStyle = (type: string) => {
    switch (type) {
      case 'BUS': return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'TRUCK': return 'bg-orange-950/80 text-orange-300 border-orange-500/40';
      case 'AUTO_RICKSHAW': return 'bg-yellow-950/80 text-yellow-300 border-yellow-500/40';
      case 'MOTORCYCLE':
      case 'SCOOTER': return 'bg-purple-950/80 text-purple-300 border-purple-500/40';
      case 'BICYCLE': return 'bg-teal-950/80 text-teal-300 border-teal-500/40';
      case 'VAN': return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
      default: return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
    }
  };

  const uniqueClasses: string[] = Array.from(new Set(vehicles.map((v) => v.vehicle_type)));

  return (
    <div id="vehicle-frame-gallery-container" className="space-y-4 font-mono">
      {/* Top Header & Fleet Stats Ribbon */}
      <div className="rounded-xl border border-slate-800 bg-[#0B101E] p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Car className="h-4 w-4 text-emerald-400" />
                Detected Vehicles & Visual Frame Gallery
              </h3>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                {vehicles.length} VEHICLES DETECTED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Inspect visual keyframe captures, telemetry vectors, and temporal timestamps for every detected vehicle across the footage.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {onReScanFleet && (
              <button
                type="button"
                onClick={onReScanFleet}
                disabled={isScanningFleet}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-950 transition-all"
                title="Re-run AI pipeline with high-sensitivity full-fleet detection"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isScanningFleet ? 'animate-spin' : ''}`} />
                <span>{isScanningFleet ? 'Scanning Fleet...' : 'Deep Fleet Scan'}</span>
              </button>
            )}

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`rounded p-1.5 transition-colors ${
                  viewMode === 'cards' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Visual Frame Cards Grid"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('filmstrip')}
                className={`rounded p-1.5 transition-colors ${
                  viewMode === 'filmstrip' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Timeline Filmstrip View"
              >
                <Film className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`rounded p-1.5 transition-colors ${
                  viewMode === 'table' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Data Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-2.5">
          {/* Vehicle Class Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-colors ${
                typeFilter === 'ALL'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              All Types ({vehicles.length})
            </button>
            {uniqueClasses.map((cls) => {
              const count = vehicles.filter((v) => v.vehicle_type === cls).length;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setTypeFilter(cls)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-colors ${
                    typeFilter === cls
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  <span>{getVehicleIcon(cls)}</span>
                  <span>{cls} ({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search, Toggle Filters & Sort */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search Track ID / Plate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 sm:w-52 rounded-lg border border-slate-800 bg-slate-900/90 pl-8 pr-2.5 py-1 text-[11px] text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <button
              type="button"
              onClick={() => setSmokeOnly(!smokeOnly)}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] border transition-colors ${
                smokeOnly
                  ? 'bg-amber-950 text-amber-300 border-amber-600 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Flame className="h-3 w-3" />
              <span>Smoke</span>
            </button>

            <button
              type="button"
              onClick={() => setPlateOnly(!plateOnly)}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] border transition-colors ${
                plateOnly
                  ? 'bg-blue-950 text-blue-300 border-blue-600 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span>ANPR</span>
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-300 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="time">Sort by Timestamp</option>
              <option value="confidence">Sort by Confidence</option>
              <option value="speed">Sort by Speed</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: VISUAL KEYFRAME CARDS GRID */}
      {viewMode === 'cards' && (
        <div>
          {filteredVehicles.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-8 text-center text-xs text-slate-400">
              No vehicles match the selected filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredVehicles.map((veh, idx) => {
                const startSec = typeof veh.timestamp_sec === 'number' ? veh.timestamp_sec : idx * 2.0;
                const dur = veh.duration_sec || 5.0;
                const isNear = currentTime >= startSec - 0.4 && currentTime <= startSec + dur + 0.4;
                const snapshot = frameSnapshots[veh.id];
                const plate = licensePlates.find((p) => p.track_id === veh.track_id || p.vehicle_id === veh.id);
                const smoke = smokeEvents.find((s) => s.track_id === veh.track_id || s.vehicle_id === veh.id);
                const bbox = veh.bbox || [30, 20, 70, 80];

                return (
                  <div
                    key={veh.id}
                    className={`group relative rounded-xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                      isNear
                        ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500'
                        : 'border-slate-800 bg-[#0F172A] hover:border-slate-700 hover:bg-[#131E35]'
                    }`}
                  >
                    {/* Visual Keyframe Image Header */}
                    <div className="relative aspect-video w-full bg-slate-950 overflow-hidden border-b border-slate-800">
                      {snapshot ? (
                        <img
                          src={snapshot}
                          alt={`${veh.track_id} at ${startSec}s`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-slate-500 bg-slate-900/60">
                          <span className="text-2xl mb-1">{getVehicleIcon(veh.vehicle_type)}</span>
                          <span className="text-[10px] font-mono">Frame Snapshot @ {startSec.toFixed(1)}s</span>
                        </div>
                      )}

                      {/* Optical Bounding Box Preview on thumbnail */}
                      <div
                        className="absolute pointer-events-none border border-emerald-400/80 bg-emerald-400/10 rounded-xs"
                        style={{
                          top: `${bbox[0]}%`,
                          left: `${bbox[1]}%`,
                          width: `${Math.max(8, bbox[3] - bbox[1])}%`,
                          height: `${Math.max(8, bbox[2] - bbox[0])}%`,
                        }}
                      />

                      {/* Timestamp & Near Badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="rounded bg-black/80 backdrop-blur-xs border border-slate-700/80 px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5 text-emerald-400" />
                          <span>@{startSec.toFixed(1)}s</span>
                        </span>
                        {isNear && (
                          <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-black animate-pulse">
                            IN VIEW
                          </span>
                        )}
                      </div>

                      {/* Vehicle Class Badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${getVehicleBadgeStyle(veh.vehicle_type)}`}>
                          {veh.vehicle_type}
                        </span>
                      </div>

                      {/* Inspect Frame Button (Hover overlay) */}
                      <button
                        type="button"
                        onClick={() => setInspectingVehicle(veh)}
                        className="absolute bottom-2 right-2 rounded-lg bg-black/80 hover:bg-emerald-600 text-white border border-slate-700 hover:border-emerald-500 px-2 py-1 text-[10px] font-bold flex items-center gap-1 shadow-sm transition-colors"
                        title="Inspect Full Frame Snapshot"
                      >
                        <Maximize2 className="h-3 w-3" />
                        <span>Inspect Frame</span>
                      </button>
                    </div>

                    {/* Card Content Details */}
                    <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Track ID & Confidence */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{getVehicleIcon(veh.vehicle_type)}</span>
                            <span className="font-bold text-emerald-400 text-xs">{veh.track_id}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {(veh.confidence * 100).toFixed(1)}% conf
                          </span>
                        </div>

                        {/* Telemetry row */}
                        <div className="grid grid-cols-2 gap-1.5 mt-2 text-[11px] text-slate-300">
                          <div className="flex items-center gap-1">
                            <Gauge className="h-3 w-3 text-slate-500" />
                            <span>{veh.speed_kmh_est || 35} km/h</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Compass className="h-3 w-3 text-slate-500" />
                            <span className="truncate">{veh.direction || 'NORTHBOUND'}</span>
                          </div>
                        </div>

                        {/* ANPR Plate Pill if exists */}
                        {veh.license_plate_id && (
                          <div className="mt-2 flex items-center justify-between rounded bg-slate-900/90 border border-slate-800 px-2 py-1 text-[10px]">
                            <span className="text-slate-400">ANPR Plate:</span>
                            <span className="font-bold text-blue-400">{veh.license_plate_id}</span>
                          </div>
                        )}

                        {/* Smoke plume indicator */}
                        {veh.has_smoke && (
                          <div className="mt-1.5 flex items-center gap-1 rounded bg-amber-950/60 border border-amber-600/40 px-2 py-0.5 text-[10px] text-amber-300">
                            <Flame className="h-3 w-3" />
                            <span>Exhaust plume flagged</span>
                          </div>
                        )}
                      </div>

                      {/* Action Button: Jump & Seek Video */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSeekToTime(startSec, { vehId: veh.id })}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-colors ${
                            isNear
                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          }`}
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>{isNear ? 'Currently In View' : `Play @ ${startSec.toFixed(1)}s`}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: TIMELINE FILMSTRIP VIEW */}
      {viewMode === 'filmstrip' && (
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2">
              <Film className="h-4 w-4 text-emerald-400" />
              Chronological Frame Filmstrip (0.0s to {media.duration_sec || 30}s)
            </h4>
            <span className="text-[10px] text-slate-400">Click any keyframe card to jump video</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-700">
            {filteredVehicles.map((veh, idx) => {
              const startSec = typeof veh.timestamp_sec === 'number' ? veh.timestamp_sec : idx * 2.0;
              const isNear = Math.abs(currentTime - startSec) < 1.0;
              const snapshot = frameSnapshots[veh.id];

              return (
                <div
                  key={veh.id}
                  onClick={() => onSeekToTime(startSec, { vehId: veh.id })}
                  className={`shrink-0 w-44 rounded-xl border p-2 cursor-pointer transition-all ${
                    isNear
                      ? 'border-emerald-500 bg-emerald-950/40 shadow-md ring-1 ring-emerald-400'
                      : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-800 mb-2">
                    {snapshot ? (
                      <img src={snapshot} alt={veh.track_id} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl text-slate-600">
                        {getVehicleIcon(veh.vehicle_type)}
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 rounded bg-black/80 px-1.5 py-0.2 text-[9px] font-bold text-white">
                      @{startSec.toFixed(1)}s
                    </span>
                  </div>

                  <div className="text-[11px] space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400">{veh.track_id}</span>
                      <span className="text-[10px] text-slate-400">{veh.vehicle_type}</span>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      {veh.speed_kmh_est || 35} km/h • {veh.direction || 'NB'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: HIGH-DENSITY AUDIT TABLE */}
      {viewMode === 'table' && (
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-slate-800 bg-slate-900 text-slate-400 text-[10px] uppercase">
              <tr>
                <th className="p-2.5">Keyframe</th>
                <th className="p-2.5">Track ID</th>
                <th className="p-2.5">Vehicle Class</th>
                <th className="p-2.5">Confidence</th>
                <th className="p-2.5">Est. Speed</th>
                <th className="p-2.5">Direction</th>
                <th className="p-2.5">ANPR Plate</th>
                <th className="p-2.5">Timestamp</th>
                <th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredVehicles.map((veh, idx) => {
                const startSec = typeof veh.timestamp_sec === 'number' ? veh.timestamp_sec : idx * 2.0;
                const dur = veh.duration_sec || 5.0;
                const isNear = currentTime >= startSec - 0.4 && currentTime <= startSec + dur + 0.4;
                const snapshot = frameSnapshots[veh.id];

                return (
                  <tr
                    key={veh.id}
                    className={`transition-colors ${
                      isNear ? 'bg-emerald-950/40 border-l-2 border-emerald-400' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <td className="p-2.5">
                      <div
                        onClick={() => setInspectingVehicle(veh)}
                        className="h-9 w-16 rounded overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer hover:border-emerald-500 transition-colors"
                      >
                        {snapshot ? (
                          <img src={snapshot} alt={veh.track_id} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs">
                            {getVehicleIcon(veh.vehicle_type)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2.5 font-bold text-emerald-400">
                      <div className="flex items-center gap-1.5">
                        {isNear && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />}
                        <span>{veh.track_id}</span>
                      </div>
                    </td>
                    <td className="p-2.5 font-semibold text-white">
                      <span className="flex items-center gap-1">
                        <span>{getVehicleIcon(veh.vehicle_type)}</span>
                        <span>{veh.vehicle_type}</span>
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-300">{(veh.confidence * 100).toFixed(1)}%</td>
                    <td className="p-2.5 text-slate-300">{veh.speed_kmh_est || 35} km/h</td>
                    <td className="p-2.5 text-slate-400">{veh.direction || 'NORTHBOUND'}</td>
                    <td className="p-2.5 font-bold text-blue-400">{veh.license_plate_id || 'N/A'}</td>
                    <td className="p-2.5 text-slate-400">@{startSec.toFixed(1)}s ({dur.toFixed(1)}s)</td>
                    <td className="p-2.5 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setInspectingVehicle(veh)}
                        className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] text-slate-300 border border-slate-700"
                        title="Inspect Frame Snapshot"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSeekToTime(startSec, { vehId: veh.id })}
                        className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-bold ${
                          isNear
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        <Play className="h-2.5 w-2.5 fill-current" />
                        <span>{isNear ? 'In View' : 'Seek'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Frame Snapshot Inspector Modal */}
      {inspectingVehicle && (
        <VehicleKeyframeInspector
          vehicle={inspectingVehicle}
          media={media}
          frameSnapshotUrl={frameSnapshots[inspectingVehicle.id]}
          licensePlate={licensePlates.find((p) => p.track_id === inspectingVehicle.track_id || p.vehicle_id === inspectingVehicle.id)}
          smokeEvent={smokeEvents.find((s) => s.track_id === inspectingVehicle.track_id || s.vehicle_id === inspectingVehicle.id)}
          allVehicles={filteredVehicles}
          onClose={() => setInspectingVehicle(null)}
          onSelectVehicle={(veh) => setInspectingVehicle(veh)}
          onSeekToVideoTime={(time) => {
            onSeekToTime(time, { vehId: inspectingVehicle.id });
            setInspectingVehicle(null);
          }}
        />
      )}
    </div>
  );
};
