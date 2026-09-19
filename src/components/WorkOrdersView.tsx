import React, { useState, useEffect } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  ArrowUpRight,
  ShieldAlert,
  HardHat,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { WorkOrder, RoadDefect, UserRole } from '../types';

interface WorkOrdersViewProps {
  currentRole: UserRole;
  onNavigateToMap?: (lat: number, lng: number) => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  currentRole,
  onNavigateToMap,
}) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [defects, setDefects] = useState<RoadDefect[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchWorkOrders = async () => {
    try {
      const [resOrders, resDefects] = await Promise.all([
        fetch('/api/work-orders'),
        fetch('/api/road-defects'),
      ]);
      if (resOrders.ok) {
        const data = await resOrders.json();
        setWorkOrders(data);
      }
      if (resDefects.ok) {
        const dataDefects = await resDefects.json();
        setDefects(dataDefects);
      }
    } catch (err) {
      console.error('Error fetching work orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: WorkOrder['status'], crew?: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/work-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          assigned_crew: crew || 'Rapid Infill Squad #2',
        }),
      });
      if (res.ok) {
        await fetchWorkOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => prev ? { ...prev, status: newStatus, assigned_crew: crew || prev.assigned_crew } : null);
        }
      }
    } catch (err) {
      console.error('Failed to update work order status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered orders
  const filteredOrders = workOrders.filter((wo) => {
    if (statusFilter !== 'ALL' && wo.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && wo.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        wo.id.toLowerCase().includes(q) ||
        wo.title.toLowerCase().includes(q) ||
        wo.location.address.toLowerCase().includes(q) ||
        wo.division_assigned.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate totals
  const totalCost = workOrders.reduce((sum, w) => sum + (w.material_estimate?.total_cost_inr || 0), 0);
  const totalAsphalt = workOrders.reduce((sum, w) => sum + (w.material_estimate?.asphalt_tons || 0), 0);
  const dispatchedCount = workOrders.filter((w) => w.status === 'DISPATCHED' || w.status === 'IN_PROGRESS').length;
  const pendingCount = workOrders.filter((w) => w.status === 'PENDING_APPROVAL').length;
  const completedCount = workOrders.filter((w) => w.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header & Mission Banner */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0B0F19] to-slate-900 p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 text-xs font-mono font-semibold text-rose-400">
                <HardHat className="h-3.5 w-3.5" />
                GVMC PUBLIC WORKS DISPATCH
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono font-semibold text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                ZERO MANUAL ENTRY AUTOMATION
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
              Autonomous Municipal Work Orders & Bill of Quantities (BOQ)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Vision-detected potholes are automatically calculated for cavity volume (Length × Width × Depth), VG-30/40 bitumen tonnage, cold milling hours, and estimated municipal restoration costs in INR, ready for instant field crew dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/export/csv/work_orders"
              download="solvofin_work_orders.csv"
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Aggregated KPI Metrics Strip */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Work Orders</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{workOrders.length}</p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{pendingCount} Pending Approval</p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Active Crews Dispatched</p>
            <p className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">{dispatchedCount}</p>
            <p className="text-[10px] text-emerald-400 font-mono mt-0.5">{completedCount} Fixed & Verified</p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Asphalt Required (VG-30/40)</p>
            <p className="text-xl sm:text-2xl font-black text-cyan-400 mt-0.5">{totalAsphalt.toFixed(2)} <span className="text-xs font-normal text-slate-400">Tons</span></p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Volumetric Hot-Mix Density 2.4 t/m³</p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Est. Municipal Budget</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">₹{totalCost.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">GVMC Infrastructure Fund</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400 font-mono">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Statuses ({workOrders.length})</option>
              <option value="PENDING_APPROVAL" className="bg-slate-900 text-amber-400">Pending Approval</option>
              <option value="DISPATCHED" className="bg-slate-900 text-blue-400">Dispatched</option>
              <option value="IN_PROGRESS" className="bg-slate-900 text-purple-400">In Progress</option>
              <option value="COMPLETED" className="bg-slate-900 text-emerald-400">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-400 font-mono">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Severities</option>
              <option value="CRITICAL" className="bg-slate-900 text-rose-400">Critical Priority</option>
              <option value="HIGH" className="bg-slate-900 text-amber-400">High Priority</option>
              <option value="MEDIUM" className="bg-slate-900 text-blue-400">Medium</option>
              <option value="LOW" className="bg-slate-900 text-slate-300">Low</option>
            </select>
          </div>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, corridor, division..."
            className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Work Orders Grid / Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="mt-3 text-xs font-mono text-slate-400">Syncing Municipal Work Orders & Cavity Metrics...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
          <p className="mt-3 text-sm font-semibold text-white">No Matching Work Orders Found</p>
          <p className="mt-1 text-xs text-slate-400">Adjust your filter criteria or analyze more road footage to generate automated work orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of Orders (2 Columns on large screens) */}
          <div className="lg:col-span-2 space-y-3">
            {filteredOrders.map((order) => {
              const isSelected = selectedOrder?.id === order.id;
              const isCritical = order.severity === 'CRITICAL';
              const isHigh = order.severity === 'HIGH';

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-slate-800/80 shadow-md shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                          {order.id}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                            isCritical
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : isHigh
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {order.severity} PRIORITY ({order.priority_score}/100)
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                            order.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : order.status === 'DISPATCHED'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : order.status === 'IN_PROGRESS'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-100">{order.title}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                        <span>{order.location.address}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono text-slate-400">Est. Repair Cost</p>
                      <p className="text-base font-black text-emerald-400">₹{order.material_estimate.total_cost_inr.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Volumetric Metrics Pills */}
                  <div className="mt-3 grid grid-cols-3 gap-2 bg-slate-950/60 rounded-lg p-2 border border-slate-800/80 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">CAVITY (LxWxD)</span>
                      <span className="text-slate-200 font-semibold">
                        {order.cavity_dimensions.length_cm}×{order.cavity_dimensions.width_cm}×{order.cavity_dimensions.depth_cm} cm
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">ASPHALT REQUIRED</span>
                      <span className="text-cyan-400 font-semibold">{order.material_estimate.asphalt_tons} Tons</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">CREW ASSIGNED</span>
                      <span className="text-slate-300 font-semibold truncate block">
                        {order.assigned_crew || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Order Inspector (Right Column) */}
          <div className="lg:col-span-1">
            {selectedOrder ? (
              <div className="sticky top-20 rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="font-mono text-xs text-slate-400">WORK ORDER INSPECTOR</span>
                    <h3 className="text-base font-black text-white">{selectedOrder.id}</h3>
                  </div>
                  <span
                    className={`rounded px-2.5 py-1 text-xs font-mono font-bold ${
                      selectedOrder.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : selectedOrder.status === 'DISPATCHED'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {selectedOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Hazard Location</label>
                    <p className="text-slate-200 font-semibold mt-0.5">{selectedOrder.location.address}</p>
                    <p className="text-[11px] font-mono text-slate-400">
                      GPS: {selectedOrder.location.latitude.toFixed(6)}, {selectedOrder.location.longitude.toFixed(6)}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Division Assigned</label>
                    <p className="text-slate-200 font-semibold mt-0.5">{selectedOrder.division_assigned}</p>
                  </div>

                  {/* Cavity & Material BOQ Detailed Breakdown */}
                  <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 space-y-2">
                    <p className="text-[11px] font-mono font-bold text-emerald-400 uppercase">Bill of Quantities (BOQ)</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400">Cavity Depth:</span>
                        <span className="text-white font-mono font-bold ml-1">{selectedOrder.cavity_dimensions.depth_cm} cm</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Surface Area:</span>
                        <span className="text-white font-mono font-bold ml-1">
                          {((selectedOrder.cavity_dimensions.length_cm * selectedOrder.cavity_dimensions.width_cm) / 10000).toFixed(2)} m²
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Hot Mix Asphalt:</span>
                        <span className="text-cyan-400 font-mono font-bold ml-1">{selectedOrder.material_estimate.asphalt_tons} T</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Tack Coat Bitumen:</span>
                        <span className="text-white font-mono font-bold ml-1">{selectedOrder.material_estimate.bitumen_tack_coat_liters} L</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Cold Milling Labor:</span>
                        <span className="text-white font-mono font-bold ml-1">{selectedOrder.material_estimate.cold_milling_labor_hours} hrs</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Total Est. Cost:</span>
                        <span className="text-emerald-400 font-mono font-bold ml-1">₹{selectedOrder.material_estimate.total_cost_inr.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Dispatch Workflow */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Dispatch Management</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={updatingId === selectedOrder.id || selectedOrder.status === 'DISPATCHED'}
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'DISPATCHED', 'Rapid Infill Squad #1 (NH-16)')}
                        className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-3 py-2 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span>Dispatch Crew</span>
                      </button>

                      <button
                        disabled={updatingId === selectedOrder.id || selectedOrder.status === 'COMPLETED'}
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED')}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3 py-2 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Mark Repaired</span>
                      </button>
                    </div>

                    {onNavigateToMap && (
                      <button
                        onClick={() => onNavigateToMap(selectedOrder.location.latitude, selectedOrder.location.longitude)}
                        className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <MapPin className="h-3.5 w-3.5 text-blue-400" />
                        <span>View on Central GIS Map</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500">
                <Wrench className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                <p className="text-xs font-mono">Select any work order to inspect volumetric dimensions, BOQ estimates, and assign response crews.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
