import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  MapPin,
  ArrowRight,
  AlertOctagon,
  Sparkles,
  RefreshCw,
  Bus,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { OriginDestinationPattern, RouteDelayEstimate } from '../types';

export const TrafficODAndDelaysView: React.FC = () => {
  const [odPatterns, setOdPatterns] = useState<OriginDestinationPattern[]>([]);
  const [routeDelays, setRouteDelays] = useState<RouteDelayEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'delays' | 'od'>('delays');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [odRes, delaysRes] = await Promise.all([
        fetch('/api/analytics/od-patterns'),
        fetch('/api/analytics/route-delays'),
      ]);
      const odData = await odRes.json();
      const delaysData = await delaysRes.json();

      setOdPatterns(Array.isArray(odData) ? odData : []);
      setRouteDelays(Array.isArray(delaysData) ? delaysData : []);
    } catch (err) {
      console.error('Failed to load OD & delay data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalDelaysMinutes = routeDelays.reduce((sum, r) => sum + r.delay_minutes, 0);
  const avgCongestionIndex = Math.round(
    routeDelays.reduce((sum, r) => sum + r.congestion_index, 0) / (routeDelays.length || 1)
  );

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
            <Activity className="w-3.5 h-3.5" />
            Transit Flow & Fleet Telemetry Engine
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Origin-Destination (OD) Matrix & Route Delay Intelligence
          </h1>
          <p className="text-slate-400 text-sm">
            Leverage public bus movement sensors to aggregate corridor passenger patterns, isolate chokepoints, and forecast route delays.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('delays')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'delays'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            Route Delays ({routeDelays.length})
          </button>
          <button
            onClick={() => setActiveSubTab('od')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'od'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            OD Corridor Flows ({odPatterns.length})
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
            title="Refresh Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400">Total Corridor Delay</span>
          <div className="text-2xl font-black text-amber-400">+{totalDelaysMinutes.toFixed(1)} mins</div>
          <span className="text-[11px] text-slate-500">Across 3 monitored arterial bus lines</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400">Avg Fleet Congestion</span>
          <div className="text-2xl font-black text-rose-400">{avgCongestionIndex}% Index</div>
          <span className="text-[11px] text-slate-500">Peak hour signal chokepoints</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400">Active OD Corridors</span>
          <div className="text-2xl font-black text-indigo-400">{odPatterns.length} Flows</div>
          <span className="text-[11px] text-slate-500">Daily transit commuter matrix</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400">AI Mitigation Ready</span>
          <div className="text-2xl font-black text-emerald-400">100% Active</div>
          <span className="text-[11px] text-slate-500">Dynamic signal re-timing recommendations</span>
        </div>
      </div>

      {/* SUB-TAB 1: ROUTE DELAYS & CHOKEPOINTS */}
      {activeSubTab === 'delays' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {routeDelays.map((route) => (
              <div
                key={route.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                      {route.route_id}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        route.delay_minutes > 5
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      +{route.delay_minutes} min delay
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{route.route_name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Primary Corridor: {route.corridor}</p>
                  </div>

                  {/* Timing comparisons */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Scheduled Time</span>
                      <span className="font-semibold text-slate-300">{route.scheduled_duration_minutes} mins</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Current Real-Time</span>
                      <span className="font-bold text-amber-400">{route.actual_duration_minutes} mins</span>
                    </div>
                  </div>

                  {/* Congestion Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Congestion Severity:</span>
                      <span className="font-bold text-rose-400">{route.congestion_index}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full"
                        style={{ width: `${route.congestion_index}%` }}
                      />
                    </div>
                  </div>

                  {/* Chokepoint & Cause */}
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs space-y-1">
                    <div className="text-rose-300 font-semibold flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                      Chokepoint: {route.chokepoint_cause}
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs space-y-1">
                    <div className="text-indigo-300 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      AI Dynamic Advisory:
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{route.recommended_mitigation}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Assigned Fleet: {route.bus_count} Buses</span>
                  <span className="text-indigo-400 font-medium">Auto-Synced</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: OD MATRIX CORRIDOR FLOWS */}
      {activeSubTab === 'od' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Origin-Destination (OD) Transit Passenger Distribution
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregated from public bus smart ticketing & onboard passenger load sensing units
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
              Corridor Density Analysis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {odPatterns.map((od) => (
              <div
                key={od.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Origin -> Destination Banner */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Origin</span>
                      <span className="text-slate-400 font-medium">Destination</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white text-xs line-clamp-1">{od.origin}</span>
                      <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-bold text-white text-xs line-clamp-1">{od.destination}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-400">Peak Hour Window:</span>
                      <span className="font-bold text-amber-300">{od.peak_hours}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-400">Hourly Commuter Volume:</span>
                      <span className="font-bold text-emerald-400">{od.hourly_passenger_flow.toLocaleString('en-IN')} Passengers</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-400">Daily Total Volume:</span>
                      <span className="font-bold text-white">{od.daily_total_volume.toLocaleString('en-IN')} / day</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-400">Average Corridor Trip:</span>
                      <span className="font-bold text-indigo-300">{od.avg_trip_duration_minutes} minutes</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Corridor: {od.corridor_name}</span>
                  <span className="text-emerald-400 font-medium">High Demand</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
