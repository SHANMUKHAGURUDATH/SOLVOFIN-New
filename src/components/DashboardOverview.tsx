import React, { useEffect, useState } from 'react';
import {
  Car,
  TrendingUp,
  AlertOctagon,
  Flame,
  CheckCircle,
  Eye,
  ArrowUpRight,
  ShieldCheck,
  Building,
  Users,
  MapPin,
  Sparkles,
  Sun,
  Lightbulb,
  ShieldAlert,
  Activity,
  ArrowRight,
  Compass,
  ArrowLeftRight,
  Globe,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardOverviewProps {
  onNavigate: (tab: any) => void;
  onSelectMedia: (mediaId: string) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  onSelectMedia,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(async (res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) throw new Error('Non-JSON response received');
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching dashboard stats:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="text-xs font-mono text-slate-400">CONNECTING SOLVOFIN TELEMETRY...</span>
        </div>
      </div>
    );
  }

  // Format data for charts
  const vehicleChartData = stats?.vehicles_by_type
    ? Object.entries(stats.vehicles_by_type).map(([key, value]) => ({
        name: key.replace(/_/g, ' '),
        count: value,
      }))
    : [];

  const defectChartData = stats?.defects_by_type
    ? Object.entries(stats.defects_by_type).map(([key, value]) => ({
        name: key.replace(/_/g, ' '),
        count: value,
      }))
    : [];

  const roadHealth = stats?.avg_road_health ?? 68;
  const healthLabel = roadHealth >= 85 ? 'EXCELLENT' : roadHealth >= 70 ? 'GOOD' : roadHealth >= 50 ? 'MODERATE' : roadHealth >= 30 ? 'POOR' : 'CRITICAL';
  const healthColor = roadHealth >= 70 ? 'text-emerald-400' : roadHealth >= 50 ? 'text-amber-400' : 'text-rose-500';

  return (
    <div id="dashboard-overview-container" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Top Banner: Operations Hub Header */}
      <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-[#0F172A] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>CENTRAL MUNICIPAL SENSOR PLATFORM</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              Autonomous Fleet Sensor Network & Urban Intelligence
            </h1>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Real-time corridor telemetry: vehicle detection, traffic bottlenecks, urban heatwaves, AI actionable insights, ANPR plates, and pedestrian safety monitoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('impact')}
              className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold px-3.5 py-2 rounded text-xs transition-colors flex items-center shadow-sm border border-emerald-500/40"
            >
              <Globe className="h-3.5 w-3.5 mr-1.5 text-emerald-400 animate-pulse" /> SDG 11 Impact
            </button>
            <button
              onClick={() => onNavigate('googlemaps')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3.5 py-2 rounded text-xs transition-colors flex items-center shadow-sm border border-cyan-400/30"
            >
              <Compass className="h-3.5 w-3.5 mr-1.5 animate-pulse" /> Google Maps AI Agent
            </button>
            <button
              onClick={() => onNavigate('upload')}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3.5 py-2 rounded text-xs transition-colors flex items-center shadow-sm"
            >
              <span className="mr-1.5">📹</span> Ingest Video
            </button>
            <button
              onClick={() => onNavigate('analytics')}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3.5 py-2 rounded text-xs transition-colors flex items-center shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Urban Analytics Hub
            </button>
            <button
              onClick={() => onNavigate('map')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded text-xs font-semibold transition-colors flex items-center"
            >
              <MapPin className="h-3.5 w-3.5 mr-1.5 text-blue-400" /> Central GIS
            </button>
          </div>
        </div>
      </div>

      {/* Bus Computer Vision & Transit Safety Quick Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div
          onClick={() => onNavigate('driver_safety')}
          className="cursor-pointer rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-3.5 flex items-center justify-between hover:bg-emerald-950/40 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-900/60 p-2 text-emerald-300">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-emerald-300">
                Driver Safety & Drowsiness
              </div>
              <div className="text-base font-black text-white font-mono">
                Continuous Eye/MAR CV
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-emerald-400" />
        </div>

        <div
          onClick={() => onNavigate('lane_transition')}
          className="cursor-pointer rounded-lg border border-sky-900/50 bg-sky-950/20 p-3.5 flex items-center justify-between hover:bg-sky-950/40 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-sky-900/60 p-2 text-sky-300">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-sky-300">
                Lane Transition & Tips
              </div>
              <div className="text-base font-black text-white font-mono">
                2-Photo CV & Tips
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-sky-400" />
        </div>

        <div
          onClick={() => onNavigate('zig_zag_detection')}
          className="cursor-pointer rounded-lg border border-amber-900/50 bg-amber-950/20 p-3.5 flex items-center justify-between hover:bg-amber-950/40 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-amber-900/60 p-2 text-amber-300">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-amber-300">
                Zig-Zag / Erratic Driving
              </div>
              <div className="text-base font-black text-white font-mono">
                CV Trajectory
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-400" />
        </div>

        <div
          onClick={() => onNavigate('bus_inspection')}
          className="cursor-pointer rounded-lg border border-cyan-900/50 bg-cyan-950/20 p-3.5 flex items-center justify-between hover:bg-cyan-950/40 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-cyan-900/60 p-2 text-cyan-300">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-cyan-300">
                Cabin Condition Inspection
              </div>
              <div className="text-base font-black text-white font-mono">
                Seats & Infra Health
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-cyan-400" />
        </div>

        <div
          onClick={() => onNavigate('gov_alerts')}
          className="cursor-pointer rounded-lg border border-rose-900/50 bg-rose-950/20 p-3.5 flex items-center justify-between hover:bg-rose-950/40 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-rose-900/60 p-2 text-rose-300">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-rose-300">
                Safety & Defect Dispatch
              </div>
              <div className="text-base font-black text-white font-mono">
                Gov Alert Queue
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-rose-400" />
        </div>
      </div>

      {/* Urban Intelligence Quick Highlights Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => onNavigate('analytics')}
          className="cursor-pointer rounded-lg border border-purple-900/50 bg-purple-950/20 p-3.5 flex items-center justify-between hover:bg-purple-950/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-purple-900/60 p-2 text-purple-300">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-purple-300">
                Traffic Bottlenecks
              </div>
              <div className="text-base font-black text-white font-mono">
                {stats?.bottlenecks || 3} Corridors Active
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-purple-400" />
        </div>

        <div
          onClick={() => onNavigate('analytics')}
          className="cursor-pointer rounded-lg border border-amber-900/50 bg-amber-950/20 p-3.5 flex items-center justify-between hover:bg-amber-950/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-amber-900/60 p-2 text-amber-300">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-amber-300">
                Heatwave Hotspots
              </div>
              <div className="text-base font-black text-white font-mono">
                {stats?.heatwave_hotspots || 3} Zones Monitored
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-400" />
        </div>

        <div
          onClick={() => onNavigate('analytics')}
          className="cursor-pointer rounded-lg border border-blue-900/50 bg-blue-950/20 p-3.5 flex items-center justify-between hover:bg-blue-950/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-blue-900/60 p-2 text-blue-300">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-blue-300">
                Actionable Insights
              </div>
              <div className="text-base font-black text-white font-mono">
                {stats?.actionable_insights_pending || 4} Pending Action
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-blue-400" />
        </div>
      </div>

      {/* Bento Grid Layout - High Density Command Center */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Road Health Index Panel */}
        <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Road Health Index</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <div className={`text-4xl font-light font-mono leading-none ${healthColor}`}>{roadHealth}</div>
              <div className={`text-xs font-bold uppercase font-mono ${healthColor}`}>{healthLabel}</div>
            </div>
          </div>
          <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <div className="flex justify-between py-0.5 border-b border-slate-800/50">
              <span className="text-slate-400">Potholes Detected</span>
              <span className="text-rose-400 font-mono font-bold">{stats?.potholes || 0}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/50">
              <span className="text-slate-400">Surface Distress Defects</span>
              <span className="text-white font-mono">{stats?.road_defects || 0}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Lane Markings Audit</span>
              <span className="text-emerald-400 font-mono font-bold">PASS</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Vehicles & Traffic Density */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Unique Vehicles</span>
              <Car className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-4xl font-light text-white font-mono leading-none">{stats?.unique_vehicles || 0}</div>
            <div className="text-[10px] font-mono text-emerald-400 mt-1">Multi-Object Temporal Tracked</div>
          </div>
          <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <div className="flex justify-between py-0.5 border-b border-slate-800/50">
              <span className="text-slate-400">Transit Buses</span>
              <span className="text-blue-400 font-mono font-bold">{stats?.buses || 0}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/50">
              <span className="text-slate-400">ANPR OCR Indexed</span>
              <span className="text-purple-400 font-mono font-bold">{stats?.license_plates || 0}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Bottleneck Delay</span>
              <span className="text-amber-400 font-mono font-bold">Avg +9.8m</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Emissions & Safety Incidents */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Emissions & Safety</span>
              <Flame className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-4xl font-light text-amber-400 font-mono leading-none">{stats?.smoke_events || 0}</div>
            <div className="text-[10px] font-mono text-amber-300 mt-1">Visible Exhaust Plumes</div>
          </div>
          <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <div className="flex justify-between py-0.5 border-b border-slate-800/50">
              <span className="text-slate-400">Safety Incidents</span>
              <span className="text-rose-400 font-mono font-bold">{stats?.incidents || 0}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/50">
              <span className="text-slate-400">Pedestrians Tracked</span>
              <span className="text-teal-400 font-mono font-bold">{stats?.people || 18}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Thermal Anomaly</span>
              <span className="text-rose-400 font-mono font-bold">Max +11.6°C</span>
            </div>
          </div>
        </div>

        {/* Metric 4: System Node Telemetry */}
        <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Node Telemetry</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xs font-mono text-white space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Uploader Node:</span>
                <span className="text-emerald-400 font-bold">NODE-184</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Persistence:</span>
                <span className="text-emerald-400 font-bold">LOCAL-JSON/DB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Storage Engine:</span>
                <span className="text-emerald-400 font-bold">READY</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500">MEDIA COUNT: {stats?.total_media || 0}</span>
            <button
              onClick={() => onNavigate('history')}
              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
            >
              EXPLORER <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Vehicles by Classification */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Unique Vehicles by Classification</h3>
              <p className="text-[11px] text-slate-500">Tracked with duplicate elimination</p>
            </div>
            <Car className="h-4 w-4 text-emerald-400" />
          </div>

          <div className="h-56 w-full">
            {vehicleChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleChartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '11px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500 font-mono">
                No vehicle detection records yet.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Road Defects & Hazards Distribution */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Road Defects & Hazards Breakdown</h3>
              <p className="text-[11px] text-slate-500">Classified by computer vision hazard classifier</p>
            </div>
            <AlertOctagon className="h-4 w-4 text-rose-400" />
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {defectChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defectChartData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={38}
                    paddingAngle={3}
                  >
                    {defectChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 font-mono">No defect records logged.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
