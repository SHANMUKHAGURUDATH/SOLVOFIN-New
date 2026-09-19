import React, { useState, useEffect } from 'react';
import {
  Bus,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Users,
  Gauge,
  Phone,
  Radio,
  Clock,
  Sparkles,
  CheckCircle2,
  Navigation,
  FileSpreadsheet,
} from 'lucide-react';
import { CampusBus, UserRole } from '../types';

interface CampusFleetViewProps {
  currentRole: UserRole;
  onNavigateToMap?: (lat: number, lng: number) => void;
}

export const CampusFleetView: React.FC<CampusFleetViewProps> = ({
  currentRole,
  onNavigateToMap,
}) => {
  const [buses, setBuses] = useState<CampusBus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBus, setSelectedBus] = useState<CampusBus | null>(null);
  const [sosLoadingId, setSosLoadingId] = useState<string | null>(null);

  const fetchBuses = async () => {
    try {
      const res = await fetch('/api/campus-buses');
      if (res.ok) {
        const data = await res.json();
        setBuses(data);
        if (!selectedBus && data.length > 0) {
          setSelectedBus(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch campus buses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
    const interval = setInterval(fetchBuses, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSos = async (busId: string, currentSos: boolean) => {
    setSosLoadingId(busId);
    try {
      const res = await fetch(`/api/campus-buses/${busId}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_sos: !currentSos }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBuses((prev) => prev.map((b) => (b.id === busId ? updated : b)));
        if (selectedBus?.id === busId) setSelectedBus(updated);
      }
    } catch (err) {
      console.error('Failed to toggle SOS:', err);
    } finally {
      setSosLoadingId(null);
    }
  };

  const totalOccupancy = buses.reduce((sum, b) => sum + b.occupied_seats, 0);
  const totalCapacity = buses.reduce((sum, b) => sum + b.capacity, 0);
  const activeBuses = buses.filter((b) => b.status === 'ON_ROUTE').length;
  const emergencyBuses = buses.filter((b) => b.status === 'EMERGENCY_SOS').length;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0B0F19] to-slate-900 p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-xs font-mono font-semibold text-blue-400">
                <Bus className="h-3.5 w-3.5" />
                ANIL NEERUKONDA INSTITUTE OF TECHNOLOGY & SCIENCES (ANITS)
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono font-semibold text-emerald-400">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                LIVE GPS TELEMETRY
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
              Campus Transit Fleet Management & Route Safety Network
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Real-time monitoring of college transit buses operating across Sangivalasa, Tagarapuvalasa, and Visakhapatnam corridors with intelligent road hazard collision warnings and SOS emergency broadcast triggers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/export/csv/campus_buses"
              download="anits_campus_buses.csv"
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export Fleet CSV</span>
            </a>
          </div>
        </div>

        {/* Fleet KPI Strip */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Active Transit Buses</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{buses.length}</p>
            <p className="text-[10px] text-emerald-400 font-mono mt-0.5">{activeBuses} En-Route to Campus</p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Student Commuters Onboard</p>
            <p className="text-xl sm:text-2xl font-black text-cyan-400 mt-0.5">
              {totalOccupancy} <span className="text-xs font-normal text-slate-400">/ {totalCapacity}</span>
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              {Math.round((totalOccupancy / (totalCapacity || 1)) * 100)}% Fleet Load
            </p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Hazard Alerts Ahead</p>
            <p className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
              {buses.reduce((sum, b) => sum + (b.hazard_alerts_ahead?.length || 0), 0)}
            </p>
            <p className="text-[10px] text-amber-400 font-mono mt-0.5">NH-16 & Bheemli Corridors</p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Emergency SOS Alerts</p>
            <p className={`text-xl sm:text-2xl font-black mt-0.5 ${emergencyBuses > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
              {emergencyBuses}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Command Broadcast Status</p>
          </div>
        </div>
      </div>

      {/* Main Buses Grid */}
      {loading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-3 text-xs font-mono text-slate-400">Connecting to ANITS Fleet GPS & Sensor Bus...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Buses List */}
          <div className="lg:col-span-2 space-y-4">
            {buses.map((bus) => {
              const isSelected = selectedBus?.id === bus.id;
              const isSos = bus.status === 'EMERGENCY_SOS';
              const occupancyPct = Math.round((bus.occupied_seats / bus.capacity) * 100);

              return (
                <div
                  key={bus.id}
                  onClick={() => setSelectedBus(bus)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSos
                      ? 'border-rose-500 bg-rose-950/30 animate-pulse'
                      : isSelected
                      ? 'border-blue-500 bg-slate-800/80 shadow-md shadow-blue-500/10'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                          {bus.bus_number}
                        </span>
                        <span className="font-mono text-xs text-blue-400 font-semibold">{bus.route_name}</span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                            isSos
                              ? 'bg-rose-500 text-white'
                              : bus.status === 'ON_ROUTE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {bus.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Navigation className="h-3 w-3 text-emerald-400" />
                        <span>Next Stop: <strong className="text-slate-200">{bus.next_stop}</strong> (ETA: {bus.eta_minutes} mins)</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 text-[10px] block">SPEED</span>
                        <span className="text-white font-bold">{bus.current_location.speed_kmh} km/h</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">OCCUPANCY</span>
                        <span className="text-cyan-400 font-bold">{bus.occupied_seats}/{bus.capacity} ({occupancyPct}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="mt-3 w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        occupancyPct > 90
                          ? 'bg-rose-500'
                          : occupancyPct > 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${occupancyPct}%` }}
                    ></div>
                  </div>

                  {/* Forward Hazards Alert Strip */}
                  {bus.hazard_alerts_ahead && bus.hazard_alerts_ahead.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {bus.hazard_alerts_ahead.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-xs text-amber-300"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                          <span className="font-mono text-[11px] font-bold">HAZARD AHEAD ({h.distance_meters}m):</span>
                          <span className="truncate">{h.warning_text || h.hazard_type.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Bus Telemetry & SOS Controls */}
          <div className="lg:col-span-1">
            {selectedBus ? (
              <div className="sticky top-20 rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="font-mono text-xs text-slate-400">BUS TELEMETRY INSPECTOR</span>
                    <h3 className="text-base font-black text-white">{selectedBus.bus_number}</h3>
                  </div>
                  <span className="text-xs font-mono text-blue-400 font-bold">{selectedBus.route_name}</span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Driver Contact Info */}
                  <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 space-y-2">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">Assigned Transit Driver</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold">{selectedBus.driver_name}</p>
                        <p className="text-slate-400 font-mono text-[11px]">{selectedBus.driver_phone}</p>
                      </div>
                      <a
                        href={`tel:${selectedBus.driver_phone}`}
                        className="rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 p-2 hover:bg-emerald-600/30 transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Location & Speed */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">CURRENT SPEED</span>
                      <span className="text-white font-bold text-sm">{selectedBus.current_location.speed_kmh} km/h</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">ETA TO CAMPUS</span>
                      <span className="text-emerald-400 font-bold text-sm">{selectedBus.eta_minutes} Mins</span>
                    </div>
                  </div>

                  {/* SOS Emergency Controls */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Emergency Protocol</label>
                    <button
                      disabled={sosLoadingId === selectedBus.id}
                      onClick={() => handleToggleSos(selectedBus.id, selectedBus.status === 'EMERGENCY_SOS')}
                      className={`w-full rounded-lg px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        selectedBus.status === 'EMERGENCY_SOS'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                      }`}
                    >
                      <ShieldAlert className="h-4 w-4" />
                      <span>
                        {selectedBus.status === 'EMERGENCY_SOS'
                          ? 'Clear SOS Emergency Status'
                          : 'Trigger SOS Emergency Broadcast'}
                      </span>
                    </button>

                    {onNavigateToMap && (
                      <button
                        onClick={() =>
                          onNavigateToMap(
                            selectedBus.current_location.latitude,
                            selectedBus.current_location.longitude
                          )
                        }
                        className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <MapPin className="h-3.5 w-3.5 text-blue-400" />
                        <span>Locate Bus on Central GIS</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500">
                <Bus className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                <p className="text-xs font-mono">Select any transit bus to inspect live telematics, driver dispatch, and forward hazard alerts.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
