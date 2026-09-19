import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Eye,
  Wrench,
  Bus,
  MapPin,
  Clock,
  CheckCircle2,
  Filter,
  RefreshCw,
  Send,
  Sliders,
  PhoneCall,
  UserCheck,
  Layers,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import { GovernmentAlert, DriverSafetyEvent, BusInfrastructureDefect } from '../types';

interface GovernmentAlertsHubViewProps {
  onNavigateToDriverSafety?: () => void;
  onNavigateToBusInfra?: () => void;
  onNavigateToZigZag?: () => void;
}

export const GovernmentAlertsHubView: React.FC<GovernmentAlertsHubViewProps> = ({
  onNavigateToDriverSafety,
  onNavigateToBusInfra,
  onNavigateToZigZag,
}) => {
  const [alerts, setAlerts] = useState<GovernmentAlert[]>([]);
  const [safetyStats, setSafetyStats] = useState<any>({
    active_driver_sessions_count: 3,
    total_driver_events: 4,
    critical_driver_alerts_count: 1,
    warning_driver_alerts_count: 2,
    total_infra_defects: 4,
    critical_infra_defects_count: 1,
    open_infra_defects_count: 3,
    buses_requiring_maintenance_count: 2,
    buses_requiring_maintenance_list: ['AP 39 XX 1234', 'AP 31 Z 9884'],
    total_inspection_reports_count: 2,
    active_government_alerts_count: 3,
  });

  // Filters
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterBus, setFilterBus] = useState<string>('ALL');

  // Selected Alert for Action Modal
  const [selectedAlert, setSelectedAlert] = useState<GovernmentAlert | null>(null);
  const [actionInput, setActionInput] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch alerts and stats
  useEffect(() => {
    fetchAlerts();
    fetchStats();

    // Setup real-time SSE listener
    const eventSource = new EventSource('/api/realtime/stream');
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log('[SSE EVENT]', data);
      } catch (err) {
        // ignore
      }
    };

    eventSource.addEventListener('driver_safety_event', (e: any) => {
      try {
        const newEvt: DriverSafetyEvent = JSON.parse(e.data);
        if (newEvt.severity === 'WARNING' || newEvt.severity === 'CRITICAL') {
          fetchAlerts();
          fetchStats();
        }
      } catch {}
    });

    eventSource.addEventListener('infrastructure_defect', (e: any) => {
      try {
        fetchAlerts();
        fetchStats();
      } catch {}
    });

    return () => {
      eventSource.close();
    };
  }, [filterModule, filterSeverity, filterStatus, filterBus]);

  const fetchAlerts = async () => {
    try {
      const url = new URL('/api/government/alerts', window.location.origin);
      if (filterModule !== 'ALL') url.searchParams.set('module', filterModule);
      if (filterSeverity !== 'ALL') url.searchParams.set('severity', filterSeverity);
      if (filterStatus !== 'ALL') url.searchParams.set('status', filterStatus);
      if (filterBus !== 'ALL') url.searchParams.set('bus_number', filterBus);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error('Error fetching government alerts:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/government/safety-stats');
      if (res.ok) {
        const data = await res.json();
        setSafetyStats(data);
      }
    } catch (err) {
      console.error('Error fetching safety stats:', err);
    }
  };

  const handleUpdateAlertStatus = async (alertId: string, newStatus: string, action?: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/government/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          action_taken: action || actionInput || undefined,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        setSelectedAlert(null);
        setActionInput('');
        setNotification(`Alert ${alertId} updated to ${newStatus}.`);
        fetchStats();
      }
    } catch (err) {
      console.error('Error updating alert:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'HIGH':
      case 'WARNING':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'MEDIUM':
        return 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  return (
    <div id="government-alerts-hub-page" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Radio className="h-4 w-4 animate-pulse" />
            <span>CENTRAL GOVERNMENT DISPATCH • FLEET SAFETY & INFRASTRUCTURE COMMAND</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            Government Transit Safety Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
            Central real-time dispatch dashboard receiving instant telemetry from onboard Computer Vision cameras: Driver Drowsiness/Fatigue alarms and Cabin Infrastructure Defect work orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigateToDriverSafety && (
            <button
              onClick={onNavigateToDriverSafety}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-3.5 py-2 rounded text-xs font-bold transition-colors flex items-center shadow-sm"
            >
              <Eye className="h-4 w-4 mr-1.5" /> Driver Monitoring Feed
            </button>
          )}
          {onNavigateToZigZag && (
            <button
              onClick={onNavigateToZigZag}
              className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-3.5 py-2 rounded text-xs font-bold transition-colors flex items-center shadow-sm"
            >
              <Activity className="h-4 w-4 mr-1.5" /> Zig-Zag Detection Feed
            </button>
          )}
          {onNavigateToBusInfra && (
            <button
              onClick={onNavigateToBusInfra}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 px-3.5 py-2 rounded text-xs font-bold transition-colors flex items-center shadow-sm"
            >
              <Wrench className="h-4 w-4 mr-1.5" /> Cabin Inspection Feed
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-700 text-emerald-300 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-[11px] font-mono hover:text-white">
            DISMISS
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>ACTIVE DRIVER FEEDS</span>
            <Eye className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{safetyStats.active_driver_sessions_count} Buses</div>
          <div className="text-[11px] text-emerald-400 font-mono">Continuous facial telemetry online</div>
        </div>

        <div className="bg-[#0F172A] border border-rose-900/40 rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between text-rose-400 text-xs font-mono font-bold">
            <span>CRITICAL DROWSINESS</span>
            <AlertTriangle className="h-4 w-4 text-rose-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-rose-400">{safetyStats.critical_driver_alerts_count} Active</div>
          <div className="text-[11px] text-rose-300/80 font-mono">Immediate dispatcher action required</div>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>CABIN DEFECTS LOGGED</span>
            <Wrench className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300">{safetyStats.open_infra_defects_count} Open</div>
          <div className="text-[11px] text-slate-400 font-mono">Seats, windows, doors, stanchions</div>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>BUSES NEEDING DEPOT REPAIR</span>
            <Bus className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{safetyStats.buses_requiring_maintenance_count} Vehicles</div>
          <div className="text-[11px] text-slate-400 font-mono truncate">
            {safetyStats.buses_requiring_maintenance_list?.join(', ')}
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">MODULE</label>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none"
            >
              <option value="ALL">All Modules</option>
              <option value="DRIVER_SAFETY">Driver Safety & Drowsiness</option>
              <option value="BUS_INFRASTRUCTURE">Bus Infrastructure</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">SEVERITY</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">DISPATCH STATUS</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New (Unreviewed)</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            fetchAlerts();
            fetchStats();
          }}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Dispatch Feed
        </button>
      </div>

      {/* Alerts Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800">
          <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-tight">
            Active Government Dispatch Alerts ({alerts.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time queue of high and critical severity infractions reported directly by edge AI cameras across the municipal bus fleet.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Bus Number</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">GPS Location</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No active government dispatch alerts found. All buses operate nominally.
                  </td>
                </tr>
              ) : (
                alerts.map((alt) => (
                  <tr key={alt.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-rose-400">{alt.id}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {alt.module.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{alt.bus_number}</td>
                    <td className="py-3 px-4">
                      <span className="text-slate-300 font-semibold">{alt.event_type}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityStyle(alt.severity)}`}>
                        {alt.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {alt.latitude ? `${alt.latitude.toFixed(4)}, ${alt.longitude?.toFixed(4)}` : 'UNAVAILABLE'}
                    </td>
                    <td className="py-3 px-4 text-cyan-400 font-bold">{Math.round(alt.confidence * 100)}%</td>
                    <td className="py-3 px-4 text-slate-400">{new Date(alt.timestamp).toLocaleTimeString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {alt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedAlert(alt)}
                        className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                      >
                        Dispatch / Resolve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action / Dispatch Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-700 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-400" />
                  Government Dispatch Protocol: {selectedAlert.id}
                </h3>
                <span className="text-xs font-mono text-slate-400">{selectedAlert.bus_number} • {selectedAlert.event_type}</span>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-white font-mono text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono text-slate-300">
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-3 rounded border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">MODULE</span>
                  <span className="font-bold text-white">{selectedAlert.module}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">SEVERITY</span>
                  <span className="font-bold text-rose-400">{selectedAlert.severity}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">TIMESTAMP</span>
                  <span>{new Date(selectedAlert.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">GPS LOCATION</span>
                  <span>{selectedAlert.latitude?.toFixed(4)}, {selectedAlert.longitude?.toFixed(4)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">DISPATCHER ACTION LOG / CREW INSTRUCTIONS</label>
                <textarea
                  rows={3}
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  placeholder="Enter dispatcher notes or maintenance crew assignment..."
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-800 pt-4">
              <button
                onClick={() => handleUpdateAlertStatus(selectedAlert.id, 'DISPATCHED')}
                disabled={isUpdating}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3.5 py-1.5 rounded text-xs transition-colors"
              >
                Dispatch Repair Crew / Contact Driver
              </button>
              <button
                onClick={() => handleUpdateAlertStatus(selectedAlert.id, 'RESOLVED')}
                disabled={isUpdating}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3.5 py-1.5 rounded text-xs transition-colors"
              >
                Mark as Resolved
              </button>
              <button
                onClick={() => setSelectedAlert(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
