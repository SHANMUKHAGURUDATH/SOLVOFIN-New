import React, { useState } from 'react';
import {
  X,
  Play,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Shield,
  Gauge,
  Compass,
  FileText,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Maximize2,
  ZoomIn,
  Car,
  Camera,
  ArrowLeftRight,
} from 'lucide-react';
import { VehicleRecord, MediaRecord, LicensePlate, SmokeEvent } from '../types';

interface VehicleKeyframeInspectorProps {
  vehicle: VehicleRecord | null;
  media: MediaRecord;
  frameSnapshotUrl?: string | null;
  licensePlate?: LicensePlate | null;
  smokeEvent?: SmokeEvent | null;
  allVehicles: VehicleRecord[];
  onClose: () => void;
  onSelectVehicle: (veh: VehicleRecord) => void;
  onSeekToVideoTime: (timeSec: number) => void;
  onCompareLaneTransition?: (veh: VehicleRecord, snapshotUrl?: string | null) => void;
}

export const VehicleKeyframeInspector: React.FC<VehicleKeyframeInspectorProps> = ({
  vehicle,
  media,
  frameSnapshotUrl,
  licensePlate,
  smokeEvent,
  allVehicles,
  onClose,
  onSelectVehicle,
  onSeekToVideoTime,
  onCompareLaneTransition,
}) => {
  const [showBoundingBox, setShowBoundingBox] = useState(true);
  const [showPlateCrop, setShowPlateCrop] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!vehicle) return null;

  const currentIndex = allVehicles.findIndex((v) => v.id === vehicle.id);
  const prevVehicle = currentIndex > 0 ? allVehicles[currentIndex - 1] : null;
  const nextVehicle = currentIndex < allVehicles.length - 1 ? allVehicles[currentIndex + 1] : null;

  const startSec = typeof vehicle.timestamp_sec === 'number' ? vehicle.timestamp_sec : 0;
  const durSec = vehicle.duration_sec || 5.0;
  const frameNum = Math.round(startSec * (media.fps || 30));

  const bbox = vehicle.bbox || [30, 25, 70, 75];
  const [ymin, xmin, ymax, xmax] = bbox;
  const bboxWidth = Math.max(5, xmax - xmin);
  const bboxHeight = Math.max(5, ymax - ymin);

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

  const handleDownloadSnapshot = () => {
    if (!frameSnapshotUrl) return;
    const a = document.createElement('a');
    a.href = frameSnapshotUrl;
    a.download = `frame_snapshot_${vehicle.track_id}_${startSec.toFixed(1)}s.png`;
    a.click();
  };

  return (
    <div
      id="vehicle-keyframe-inspector-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-5xl rounded-2xl border border-slate-700/80 bg-[#090D16] text-white shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0E1526] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-lg">
              {getVehicleIcon(vehicle.vehicle_type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold text-white tracking-wide">
                  DETECTION FRAME INSPECTOR: <span className="text-emerald-400">{vehicle.track_id}</span>
                </h3>
                <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                  {vehicle.vehicle_type}
                </span>
                <span className="rounded bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                  {(vehicle.confidence * 100).toFixed(1)}% CONFIDENCE
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Timestamp: @{startSec.toFixed(2)}s | Frame #{frameNum} | Video: {media.original_filename}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Prev / Next navigation */}
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5">
              <button
                type="button"
                disabled={!prevVehicle}
                onClick={() => prevVehicle && onSelectVehicle(prevVehicle)}
                className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                title="Previous Detected Vehicle"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-[10px] font-mono text-slate-400">
                {currentIndex + 1} / {allVehicles.length}
              </span>
              <button
                type="button"
                disabled={!nextVehicle}
                onClick={() => nextVehicle && onSelectVehicle(nextVehicle)}
                className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                title="Next Detected Vehicle"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Main Visual Frame Canvas Area (Col 1-8) */}
          <div className="lg:col-span-8 p-4 sm:p-5 flex flex-col items-center justify-center bg-black/60 border-b lg:border-b-0 lg:border-r border-slate-800/80">
            {/* Visual Frame Container */}
            <div className="relative w-full min-h-[340px] max-h-[500px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center p-2 group">
              {frameSnapshotUrl ? (
                <div
                  className="relative inline-block max-h-[460px] max-w-full transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={frameSnapshotUrl}
                    alt={`Keyframe at ${startSec}s`}
                    className="max-h-[440px] w-auto max-w-full rounded-lg object-contain block mx-auto shadow-md"
                  />

                  {/* Overlaid Bounding Box */}
                  {showBoundingBox && (
                    <div
                      className="absolute pointer-events-none border-2 border-emerald-400 bg-emerald-500/15 rounded shadow-lg shadow-emerald-950/60 transition-all"
                      style={{
                        top: `${ymin}%`,
                        left: `${xmin}%`,
                        width: `${bboxWidth}%`,
                        height: `${bboxHeight}%`,
                      }}
                    >
                      <div className="absolute -top-6 left-0 flex items-center gap-1.5 rounded-t bg-emerald-600/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-mono font-bold text-white shadow-xs whitespace-nowrap">
                        <span>{vehicle.track_id}</span>
                        <span>•</span>
                        <span>{vehicle.vehicle_type}</span>
                        <span>•</span>
                        <span>{(vehicle.confidence * 100).toFixed(0)}%</span>
                      </div>

                      {/* Crosshairs at center */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-emerald-400/80 ring-2 ring-emerald-300" />
                      </div>
                    </div>
                  )}

                  {/* License Plate Overlaid Tag */}
                  {showPlateCrop && licensePlate && (
                    <div
                      className="absolute pointer-events-none border border-blue-400 bg-blue-500/30 rounded px-1 text-[9px] font-mono font-bold text-white shadow-xs"
                      style={{
                        top: `${Math.min(92, ymax - 8)}%`,
                        left: `${xmin + 2}%`,
                      }}
                    >
                      OCR: {licensePlate.plate_number}
                    </div>
                  )}

                  {/* Smoke Event Overlay */}
                  {smokeEvent && (
                    <div
                      className="absolute pointer-events-none border border-amber-500/80 bg-amber-500/20 rounded px-1 text-[9px] font-mono font-bold text-amber-300"
                      style={{
                        top: `${Math.max(0, ymin - 10)}%`,
                        left: `${Math.max(0, xmin - 5)}%`,
                      }}
                    >
                      💨 Smoke Plume Flagged
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Camera className="h-10 w-10 text-slate-600 mb-2 animate-pulse" />
                  <span className="text-xs font-mono text-slate-400 font-semibold">
                    Visual Keyframe Snapshot @ {startSec.toFixed(1)}s
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 mt-1">
                    Frame #{frameNum} | Coordinates [{ymin}, {xmin}, {ymax}, {xmax}]
                  </span>
                </div>
              )}

              {/* HUD Status Overlay in Frame */}
              <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded bg-black/70 backdrop-blur-xs px-2 py-1 text-[9px] font-mono text-slate-300 border border-slate-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>FRAME TIME: {startSec.toFixed(2)}s / {media.duration_sec || 30}s</span>
              </div>
            </div>

            {/* Frame Toolbar Controls */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 mt-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBoundingBox(!showBoundingBox)}
                  className={`rounded px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
                    showBoundingBox
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Bounding Box: {showBoundingBox ? 'ON' : 'OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPlateCrop(!showPlateCrop)}
                  className={`rounded px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
                    showPlateCrop
                      ? 'bg-blue-950/80 text-blue-300 border-blue-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  ANPR Tag: {showPlateCrop ? 'ON' : 'OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => (prev === 1 ? 1.4 : prev === 1.4 ? 2 : 1))}
                  className="inline-flex items-center gap-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2.5 py-1 text-[11px] font-semibold transition-colors"
                >
                  <ZoomIn className="h-3 w-3" />
                  <span>Zoom: {zoomLevel}x</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSeekToVideoTime(startSec)}
                  className="inline-flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm shadow-emerald-950 transition-colors"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Play Video at {startSec.toFixed(1)}s</span>
                </button>

                {frameSnapshotUrl && (
                  <button
                    type="button"
                    onClick={handleDownloadSnapshot}
                    className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] text-slate-300 border border-slate-700 transition-colors"
                    title="Download Frame Image"
                  >
                    <Download className="h-3 w-3" />
                    <span>Save Image</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar Details & Telemetry (Col 9-12) */}
          <div className="lg:col-span-4 p-4 sm:p-5 flex flex-col justify-between bg-[#0B101E] font-mono text-xs space-y-4">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Telemetry & Optical Metadata
                </span>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5">
                    <span className="text-slate-400">Track ID</span>
                    <span className="font-bold text-emerald-400">{vehicle.track_id}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5">
                    <span className="text-slate-400">Vehicle Classification</span>
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span>{getVehicleIcon(vehicle.vehicle_type)}</span>
                      <span>{vehicle.vehicle_type}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5">
                    <span className="text-slate-400">Estimated Velocity</span>
                    <span className="font-bold text-amber-300">{vehicle.speed_kmh_est || 36} km/h</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5">
                    <span className="text-slate-400">Heading / Direction</span>
                    <span className="font-bold text-slate-200">{vehicle.direction || 'NORTHBOUND'}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5">
                    <span className="text-slate-400">Visibility Window</span>
                    <span className="font-bold text-slate-300">
                      @{startSec.toFixed(1)}s → {(startSec + durSec).toFixed(1)}s ({durSec.toFixed(1)}s)
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5">
                    <span className="text-slate-400">BBox Coordinates (0-100)</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      [{ymin}, {xmin}, {ymax}, {xmax}]
                    </span>
                  </div>
                </div>
              </div>

              {/* ANPR Plate Card */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  ANPR Plate Recognition
                </span>
                <div className="mt-2 rounded-lg border border-blue-900/60 bg-blue-950/30 p-3">
                  {licensePlate ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Plate Identification</span>
                        {licensePlate.ocr_status === 'NOT_READABLE' || licensePlate.ocr_confidence < 0.65 ? (
                          <span className="rounded bg-rose-950 border border-rose-600/50 px-2 py-0.5 font-bold text-rose-300 text-[11px]">
                            Plate not reliably readable
                          </span>
                        ) : licensePlate.ocr_status === 'UNCERTAIN' || licensePlate.ocr_confidence < 0.75 ? (
                          <span className="rounded bg-amber-950 border border-amber-600/50 px-2 py-0.5 font-bold text-amber-300 text-[11px]">
                            Plate text uncertain
                          </span>
                        ) : (
                          <span className="rounded bg-blue-900/80 border border-blue-400/40 px-2 py-0.5 font-bold tracking-widest text-white text-xs">
                            {licensePlate.normalized_plate || licensePlate.plate_number}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-blue-900/40">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Raw OCR</span>
                          <span className="text-white font-mono">{licensePlate.raw_ocr_text || licensePlate.plate_number}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Normalized</span>
                          <span className="text-purple-300 font-mono">{licensePlate.normalized_plate || licensePlate.plate_number}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">OCR Confidence</span>
                        <span
                          className={`font-bold ${
                            licensePlate.ocr_confidence >= 0.75
                              ? 'text-emerald-400'
                              : licensePlate.ocr_confidence >= 0.65
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {(licensePlate.ocr_confidence * 100).toFixed(1)}%
                        </span>
                      </div>

                      {licensePlate.ocr_notes && (
                        <div className="text-[10px] text-slate-400 italic">
                          {licensePlate.ocr_notes}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Jurisdiction</span>
                        <span className="text-slate-300">{licensePlate.state_or_jurisdiction || 'Andhra Pradesh'}</span>
                      </div>

                      <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-800">
                        * Observation/identification aid only. Autonomous penalties prohibited.
                      </div>
                    </div>
                  ) : vehicle.license_plate_id ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Associated Plate</span>
                      <span className="font-bold text-white">{vehicle.license_plate_id}</span>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-[11px] italic text-center py-1">
                      No distinct license plate resolved at this angle/distance.
                    </div>
                  )}
                </div>
              </div>

              {/* Optical Smoke Plume Card */}
              {vehicle.has_smoke && (
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5" />
                    Visible Exhaust Emission
                  </span>
                  <div className="mt-2 rounded-lg border border-amber-900/60 bg-amber-950/30 p-3 text-[11px] text-amber-200">
                    <p>Optical exhaust density flagged for potential municipal emission inspection.</p>
                  </div>
                </div>
              )}

              {/* 2-Photo Lane Transition Comparison Action */}
              <div className="rounded-xl border border-sky-800/60 bg-sky-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    Lane Transition & Coaching
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-900/40 text-sky-300 border border-sky-700/40">
                    2-Photo CV
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Compare this vehicle keyframe against a sequential frame to detect lane shift angles, straddling, and broadcast corrective tips.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (onCompareLaneTransition) {
                      onCompareLaneTransition(vehicle, frameSnapshotUrl);
                    } else {
                      window.dispatchEvent(
                        new CustomEvent('nav-lane-transition', {
                          detail: { vehicle, frameSnapshotUrl },
                        })
                      );
                      onClose();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold p-2 text-xs transition-colors shadow-md shadow-sky-950/40"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  <span>Launch 2-Photo Transition Comparison</span>
                </button>
              </div>
            </div>

            {/* Quick Step Buttons */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
              <button
                type="button"
                disabled={!prevVehicle}
                onClick={() => prevVehicle && onSelectVehicle(prevVehicle)}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 p-2 text-[11px] text-slate-300 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev Frame</span>
              </button>

              <button
                type="button"
                disabled={!nextVehicle}
                onClick={() => nextVehicle && onSelectVehicle(nextVehicle)}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 p-2 text-[11px] text-slate-300 disabled:opacity-30 transition-colors"
              >
                <span>Next Frame</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
