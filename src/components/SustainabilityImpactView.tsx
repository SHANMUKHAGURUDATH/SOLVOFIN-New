import React, { useState, useEffect } from 'react';
import {
  Globe,
  ShieldCheck,
  Eye,
  AlertTriangle,
  Layers,
  Wrench,
  Bus,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Leaf,
  ThermometerSun,
  Scale,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  SlidersHorizontal,
  Flame,
  Droplets,
  Building,
  CheckSquare,
  Sparkles,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ImpactSummaryResponse } from '../../server/impactService';

interface SustainabilityImpactViewProps {
  currentRole: 'GOVERNMENT' | 'CITIZEN' | 'ADMIN' | 'AUTHORITY' | 'OPERATOR' | 'VIEWER';
  onNavigateTab: (tab: any) => void;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const SustainabilityImpactView: React.FC<SustainabilityImpactViewProps> = ({
  currentRole,
  onNavigateTab,
}) => {
  const [data, setData] = useState<ImpactSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerspective, setSelectedPerspective] = useState<'GOVERNMENT' | 'CITIZEN'>(
    currentRole === 'CITIZEN' ? 'CITIZEN' : 'GOVERNMENT'
  );
  const [activeCategoryTab, setActiveCategoryTab] = useState<'TRANSPORT' | 'INFRA' | 'MOBILITY' | 'CLIMATE'>('TRANSPORT');
  const [expandedFrameworkBranches, setExpandedFrameworkBranches] = useState<Record<string, boolean>>({
    'Target 11.2': true,
    'Target 11.b': true,
  });

  const fetchImpactData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/impact/summary');
      if (!res.ok) {
        throw new Error(`Failed to fetch impact metrics (${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('[Impact View Fetch Error]:', err);
      setError(err.message || 'Error loading sustainability intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImpactData();
  }, []);

  const toggleBranch = (key: string) => {
    setExpandedFrameworkBranches((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4 font-mono text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-sm">Aggregating real-time sustainability & SDG 11 metrics from database...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-rose-950/30 border border-rose-800 p-6 rounded-xl space-y-3 font-mono text-rose-300">
        <div className="flex items-center gap-2 font-bold text-base text-rose-200">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
          <span>Error Loading Impact Intelligence</span>
        </div>
        <p className="text-xs">{error}</p>
        <button
          onClick={fetchImpactData}
          className="px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white rounded-lg text-xs transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const obs = data?.observedMetrics;
  const ai = data?.aiActivity;
  const human = data?.humanOversight;
  const distinction = data?.impactDistinction;
  const framework = data?.sustainabilityFrameworkTree;
  const story = data?.impactStoryFlow;

  // Chart data: Safety & Defect Distribution
  const issueDistributionData = [
    {
      name: 'Transit Incidents',
      count: obs?.publicTransportSafety.totalIncidents || 0,
      category: 'Public Transport',
      fill: '#EF4444',
    },
    {
      name: 'Road Defects',
      count: obs?.infrastructureSafety.totalRoadDefects || 0,
      category: 'Infrastructure',
      fill: '#F59E0B',
    },
    {
      name: 'Driver Safety Events',
      count: obs?.publicTransportSafety.totalDriverSafetyEvents || 0,
      category: 'Driver Vigilance',
      fill: '#10B981',
    },
    {
      name: 'Bus Interior Defects',
      count: obs?.infrastructureSafety.totalBusInteriorDefects || 0,
      category: 'Fleet Interior',
      fill: '#3B82F6',
    },
    {
      name: 'Citizen Reports',
      count: obs?.infrastructureSafety.citizenReportsLogged || 0,
      category: 'Civic Reports',
      fill: '#8B5CF6',
    },
  ];

  // Chart data: Work Orders Status
  const workOrdersData = Object.entries(obs?.infrastructureSafety.workOrdersByStatus || {}).map(
    ([status, count]) => ({
      status: status.replace(/_/g, ' '),
      count,
    })
  );

  // Chart data: Human Review Decisions on AI Recommendations
  const humanDecisionsData = [
    { name: 'Accepted', value: human?.acceptedCount || 0, color: '#10B981' },
    { name: 'Modified', value: human?.modifiedCount || 0, color: '#3B82F6' },
    { name: 'Rejected', value: human?.rejectedCount || 0, color: '#EF4444' },
    { name: 'Pending Review', value: human?.pendingReviewCount || 0, color: '#64748B' },
  ].filter((d) => d.value > 0);

  const humanReviewParticipationPct =
    (ai?.totalAiInsightsGenerated || 0) > 0
      ? Math.round(((human?.totalReviewedCases || 0) / (ai?.totalAiInsightsGenerated || 1)) * 100)
      : 0;

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-200">
      {/* 1. HEADER & SDG 11 POSITIONING */}
      <div className="bg-[#0A0E1A] border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Globe className="h-3.5 w-3.5" />
                SDG 11 IMPACT INTELLIGENCE
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                <Award className="h-3 w-3" />
                Target 11.2 Safe Public Transport
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                <Clock className="h-3 w-3 text-slate-400" />
                {data?.timePeriodDescription || 'Live System Database'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Sustainability & Impact Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Empirical transparency dashboard evaluating real-time system observations, AI decision-support workflows, human review participation, and alignment with UN Sustainable Development Goal 11.
            </p>
          </div>

          {/* Controls: Role Perspective Switcher & Refresh */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-mono">
              <button
                onClick={() => setSelectedPerspective('GOVERNMENT')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedPerspective === 'GOVERNMENT'
                    ? 'bg-emerald-600 text-white font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Government View
              </button>
              <button
                onClick={() => setSelectedPerspective('CITIZEN')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedPerspective === 'CITIZEN'
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Citizen View
              </button>
            </div>

            <button
              onClick={fetchImpactData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono transition-colors"
              title="Refresh live metrics from database"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </div>

        {/* Formal Alignment Statement & UN Disclaimer Banner */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="md:col-span-2 p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>ALIGNMENT STATEMENT (SDG 11 & TARGET 11.2)</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              &ldquo;{data?.sdg11Alignment.alignmentStatement}&rdquo;
            </p>
          </div>

          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Info className="h-3.5 w-3.5" />
              <span>NON-ENDORSEMENT NOTICE</span>
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              {data?.sdg11Alignment.unDisclaimer}
            </p>
          </div>
        </div>
      </div>

      {/* 2. THREE TIERS OF REALITY (KPI CARDS) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
            <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
            <span>PRIMARY METRICS BY REALITY TIER</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Green: Directly Observed | Blue: AI-Assisted | Slate: Unmeasured / Future
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Recorded Incidents [Observed] */}
          <div className="bg-[#0D121F] border border-emerald-500/40 hover:border-emerald-500 rounded-xl p-4 space-y-2 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                OBSERVED DATA
              </span>
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white">
                {obs?.publicTransportSafety.totalIncidents ?? 'No data available'}
              </div>
              <div className="text-xs text-slate-300 font-medium">Total Recorded Incidents</div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
              <span>Critical: {obs?.publicTransportSafety.incidentsBySeverity['CRITICAL'] || 0}</span>
              <span>Active: {obs?.publicTransportSafety.incidentsByStatus['ACTIVE'] || 0}</span>
            </div>
          </div>

          {/* Card 2: Road Defects Detected [Observed] */}
          <div className="bg-[#0D121F] border border-emerald-500/40 hover:border-emerald-500 rounded-xl p-4 space-y-2 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                OBSERVED DATA
              </span>
              <Wrench className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white">
                {obs?.infrastructureSafety.totalRoadDefects ?? 'No data available'}
              </div>
              <div className="text-xs text-slate-300 font-medium">Road Defects Detected</div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
              <span>Potholes: {obs?.infrastructureSafety.defectsByType['POTHOLE'] || 0}</span>
              <span>Asphalt: {obs?.infrastructureSafety.totalEstimatedAsphaltTons || 0} Tons</span>
            </div>
          </div>

          {/* Card 3: Driver Safety Events [Observed] */}
          <div className="bg-[#0D121F] border border-emerald-500/40 hover:border-emerald-500 rounded-xl p-4 space-y-2 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                OBSERVED DATA
              </span>
              <Eye className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white">
                {obs?.publicTransportSafety.totalDriverSafetyEvents ?? 'No data available'}
              </div>
              <div className="text-xs text-slate-300 font-medium">Driver Vigilance Events</div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
              <span>Drowsiness: {obs?.publicTransportSafety.driverEventsByType['PROLONGED_DROWSINESS'] || 0}</span>
              <span>Alerts: {obs?.publicTransportSafety.activeGovernmentSafetyAlerts || 0}</span>
            </div>
          </div>

          {/* Card 4: Municipal Work Orders [Observed] */}
          <div className="bg-[#0D121F] border border-emerald-500/40 hover:border-emerald-500 rounded-xl p-4 space-y-2 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                OBSERVED DATA
              </span>
              <CheckSquare className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white">
                {obs?.infrastructureSafety.totalWorkOrders ?? 'No data available'}
              </div>
              <div className="text-xs text-slate-300 font-medium">Municipal Work Orders</div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
              <span>Dispatched: {obs?.infrastructureSafety.workOrdersByStatus['DISPATCHED'] || 0}</span>
              <span>Done: {obs?.infrastructureSafety.workOrdersByStatus['COMPLETED'] || 0}</span>
            </div>
          </div>

          {/* Card 5: AI Safety Recommendations [AI-Assisted] */}
          <div className="bg-[#0D121F] border border-blue-500/40 hover:border-blue-500 rounded-xl p-4 space-y-2 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                AI-ASSISTED
              </span>
              <Sparkles className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white">
                {ai?.totalAiInsightsGenerated ?? 0}
              </div>
              <div className="text-xs text-slate-300 font-medium">AI Insights Generated</div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
              <span>RAG Evidence: {ai?.insightsWithRetrievedEvidence || 0}</span>
              <span>Docs: {ai?.ragKnowledgeBaseStatus.documentCount || 0}</span>
            </div>
          </div>

          {/* Card 6: Human Reviews Conducted [Human Oversight] */}
          <div className="bg-[#0D121F] border border-indigo-500/40 hover:border-indigo-500 rounded-xl p-4 space-y-2 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                HUMAN OVERSIGHT
              </span>
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white">
                {human?.totalReviewedCases ?? 0}
                <span className="text-xs font-normal text-slate-400 ml-1.5">
                  ({humanReviewParticipationPct}%)
                </span>
              </div>
              <div className="text-xs text-slate-300 font-medium">Human Decisions Logged</div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
              <span className="text-emerald-400">Accepted: {human?.acceptedCount || 0}</span>
              <span className="text-blue-400">Modified: {human?.modifiedCount || 0}</span>
            </div>
          </div>

          {/* Card 7: Carbon / Fuel Impact [Unmeasured] */}
          <div className="bg-[#0D121F] border border-slate-800 rounded-xl p-4 space-y-2 transition-all shadow-lg opacity-90">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                NOT CURRENTLY MEASURED
              </span>
              <Leaf className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <div className="text-sm font-bold font-mono text-slate-400">
                No tailpipe sensors
              </div>
              <div className="text-xs text-slate-400 font-medium">Direct CO₂ / Fuel Savings</div>
            </div>
            <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-2">
              Optical sensors cannot meter vehicle exhaust flow.
            </div>
          </div>

          {/* Card 8: Causal Accident Reduction [Unmeasured] */}
          <div className="bg-[#0D121F] border border-slate-800 rounded-xl p-4 space-y-2 transition-all shadow-lg opacity-90">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                UNMEASURED IMPACT
              </span>
              <TrendingUp className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <div className="text-sm font-bold font-mono text-slate-400">
                Longitudinal study required
              </div>
              <div className="text-xs text-slate-400 font-medium">Accident Reduction Rate</div>
            </div>
            <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-2">
              Requires multi-year police & hospital registry baselines.
            </div>
          </div>
        </div>
      </div>

      {/* 3. REQUIRED TRANSPARENCY SECTION: THREE-COLUMN REALITY MATRIX */}
      <div className="bg-[#0B0F1C] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                SYSTEM TRANSPARENCY MATRIX — WHAT SOLVOFIN MEASURES vs SUPPORTS vs LEAVES UNMEASURED
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              Mandatory Scientific Rigor Standard
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            A non-negotiable boundary ensuring operational credibility: Solvofin reports actual data while refusing to claim unproven causal miracles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* Column 1: What Solvofin Measures */}
          <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-emerald-500/30 pb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>WHAT SOLVOFIN MEASURES</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Direct physical, optical, and operational data points captured by active software pipelines:
            </p>
            <ul className="space-y-2.5 text-[11px] text-slate-300">
              {distinction?.whatSolvofinMeasures.map((item, idx) => (
                <li key={idx} className="bg-slate-950/60 p-2.5 rounded-lg border border-emerald-500/20">
                  <div className="text-emerald-300 font-bold">{item.category}</div>
                  <div className="text-slate-300 mt-0.5">{item.item}</div>
                  <div className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1">
                    <span className="text-slate-500">Source:</span> {item.source}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: What Solvofin Supports */}
          <div className="bg-blue-950/20 border border-blue-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-400 font-bold border-b border-blue-500/30 pb-2">
              <Sparkles className="h-4 w-4" />
              <span>WHAT SOLVOFIN SUPPORTS</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Assisted decision-support workflows where Solvofin aids human authorities:
            </p>
            <ul className="space-y-2.5 text-[11px] text-slate-300">
              {distinction?.whatSolvofinSupports.map((item, idx) => (
                <li key={idx} className="bg-slate-950/60 p-2.5 rounded-lg border border-blue-500/20">
                  <div className="text-blue-300 font-bold">{item.category}</div>
                  <div className="text-slate-300 mt-0.5">{item.item}</div>
                  <div className="text-[10px] text-blue-400/80 mt-1 flex items-center gap-1">
                    <span className="text-slate-500">Outcome:</span> {item.benefit}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: What Is Not Yet Measured */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-400 font-bold border-b border-slate-800 pb-2">
              <XCircle className="h-4 w-4 text-slate-500" />
              <span>WHAT IS NOT YET MEASURED</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Real-world outcomes that cannot be claimed or verified from current system sensors:
            </p>
            <ul className="space-y-2.5 text-[11px] text-slate-400">
              {distinction?.whatIsNotYetMeasured.map((item, idx) => (
                <li key={idx} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-rose-400/90 font-bold">{item.category}</div>
                  <div className="text-slate-300 mt-0.5">{item.item}</div>
                  <div className="text-[10px] text-amber-400/80 mt-1">
                    <span className="text-slate-500">Reason:</span> {item.reasonUnmeasured}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    Requires: {item.requiredPrerequisite}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 4. THE IMPACT STORY — VISUAL FLOW FROM DETECTION TO POTENTIAL IMPACT */}
      <div className="bg-[#0B0F1C] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white uppercase font-mono tracking-wide flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-sky-400" />
              THE IMPACT STORY — OPERATIONAL LIFECYCLE
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              The 8-step journey from raw video observation to human-reviewed action and future empirical outcome study.
            </p>
          </div>
          <span className="text-[11px] font-mono px-3 py-1 bg-sky-950/40 text-sky-300 border border-sky-500/30 rounded-full self-start">
            Human-Supervised Feedback Loop
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          {story?.map((step) => (
            <div
              key={step.step}
              className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                step.isOutcomeMeasurement
                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    STEP {step.step}
                  </span>
                  {step.isOutcomeMeasurement ? (
                    <span className="text-[10px] text-amber-400 font-bold">LONGITUDINAL</span>
                  ) : (
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                  )}
                </div>
                <div className="font-bold text-sm text-white pt-1">{step.title}</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{step.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                <span className="text-slate-500 block font-bold">Solvofin Implementation:</span>
                <span className="text-emerald-400/90">{step.solvofinExecution}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl font-mono text-[11px] text-amber-300 flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Essential Scientific Distinction:</strong> Steps 1 through 7 represent real-time operational software capabilities executing in production today. Step 8 is the empirical outcome boundary: measuring permanent causal accident or emissions reduction requires external longitudinal data that no computer-vision tool can invent or replace.
          </div>
        </div>
      </div>

      {/* 5. VISUALIZATIONS DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Issue Distribution Across Urban Sectors */}
        <div className="bg-[#0B0F1C] border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                OBSERVED SAFETY & DEFECT ISSUES DISTRIBUTION
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Counts of physical anomalies detected by CV modules in current dataset
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
              Live Database
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issueDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {issueDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            <span>Total Observed Physical Issues: {issueDistributionData.reduce((a, b) => a + b.count, 0)}</span>
            <button
              onClick={() => onNavigateTab('roads')}
              className="text-emerald-400 hover:underline flex items-center gap-1"
            >
              Explore In Road Defects <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Chart 2: Human Oversight & Review Pipeline */}
        <div className="bg-[#0B0F1C] border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                AI RECOMMENDATION & HUMAN REVIEW DECISIONS
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Human-in-the-loop participation rate: {humanReviewParticipationPct}%
              </p>
            </div>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-500/20">
              Governance Check
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {humanDecisionsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={humanDecisionsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {humanDecisionsData.map((entry, index) => (
                      <Cell key={`cell-pie-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs font-mono text-slate-500">No AI recommendations reviewed yet</div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Reviewed: {human?.totalReviewedCases || 0} / {ai?.totalAiInsightsGenerated || 0}</span>
            <button
              onClick={() => onNavigateTab('responsible_ai')}
              className="text-cyan-400 hover:underline flex items-center gap-1"
            >
              Audit RAG Provenance <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. IMPACT INDICATOR CATEGORIES (DEEP DIVE WITH TABS) */}
      <div className="bg-[#0B0F1C] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white uppercase font-mono tracking-wide flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-400" />
              INDICATOR CATEGORIES — REAL-TIME DOMAIN TELEMETRY
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Explore observed data points, municipal actions, and operational priorities by sector.
            </p>
          </div>

          {/* Category Selector Tabs */}
          <div className="flex flex-wrap items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-mono">
            <button
              onClick={() => setActiveCategoryTab('TRANSPORT')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeCategoryTab === 'TRANSPORT'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Public Transport Safety
            </button>
            <button
              onClick={() => setActiveCategoryTab('INFRA')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeCategoryTab === 'INFRA'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Infrastructure Safety
            </button>
            <button
              onClick={() => setActiveCategoryTab('MOBILITY')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeCategoryTab === 'MOBILITY'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Urban Mobility
            </button>
            <button
              onClick={() => setActiveCategoryTab('CLIMATE')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeCategoryTab === 'CLIMATE'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Climate & Environment
            </button>
          </div>
        </div>

        {/* Category Panel A: Public Transport Safety */}
        {activeCategoryTab === 'TRANSPORT' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block">TOTAL TRANSIT INCIDENTS</span>
                <span className="text-xl font-bold text-white">{obs?.publicTransportSafety.totalIncidents || 0}</span>
                <p className="text-[10px] text-slate-400">
                  Collisions, breakdowns, and near-miss events logged by telemetry.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block">DRIVER VIGILANCE SIGNALS</span>
                <span className="text-xl font-bold text-emerald-400">{obs?.publicTransportSafety.totalDriverSafetyEvents || 0}</span>
                <p className="text-[10px] text-slate-400">
                  In-cabin facial landmark monitoring (PERCLOS eye closure, yawning).
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block">BUS CABIN DEFECTS DETECTED</span>
                <span className="text-xl font-bold text-cyan-400">{obs?.infrastructureSafety.totalBusInteriorDefects || 0}</span>
                <p className="text-[10px] text-slate-400">
                  Handrail stability, grab-rail attachments, and emergency exit checks.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-white font-bold block">Connected Subsystems:</span>
                <span className="text-[11px] text-slate-400">
                  Driver Safety AI and Bus Infrastructure Computer Vision engines monitor continuous cabin video streams.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onNavigateTab('driver_safety')}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                >
                  <Eye className="h-3.5 w-3.5" /> Driver Safety Hub
                </button>
                <button
                  onClick={() => onNavigateTab('bus_inspection')}
                  className="px-3 py-1.5 bg-cyan-800 hover:bg-cyan-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                >
                  <Bus className="h-3.5 w-3.5" /> Bus Cabin Inspection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Panel B: Infrastructure Safety */}
        {activeCategoryTab === 'INFRA' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block">ROAD DEFECTS (POTHOLES/CRACKS)</span>
                <span className="text-xl font-bold text-amber-400">{obs?.infrastructureSafety.totalRoadDefects || 0}</span>
                <p className="text-[10px] text-slate-400">
                  Detected via forward vehicle cameras using 2-stage YOLO & spatial geometry.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block">ESTIMATED ASPHALT REPAIR TONNAGE</span>
                <span className="text-xl font-bold text-white">{obs?.infrastructureSafety.totalEstimatedAsphaltTons || 0} MT</span>
                <p className="text-[10px] text-slate-400">
                  Dimensional cavity computation (depth × area × asphalt compaction factor).
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block">MUNICIPAL WORK ORDERS TRACKED</span>
                <span className="text-xl font-bold text-cyan-400">{obs?.infrastructureSafety.totalWorkOrders || 0}</span>
                <p className="text-[10px] text-slate-400">
                  GVMC division dispatch: {obs?.infrastructureSafety.workOrdersByStatus['DISPATCHED'] || 0} Dispatched, {obs?.infrastructureSafety.workOrdersByStatus['COMPLETED'] || 0} Completed.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-white font-bold block">Connected Subsystems:</span>
                <span className="text-[11px] text-slate-400">
                  Dual-stage Pothole Vision and Municipal Bill of Quantities (BOQ) Work Orders engine.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onNavigateTab('roads')}
                  className="px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> Pothole Vision
                </button>
                <button
                  onClick={() => onNavigateTab('workorders')}
                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                >
                  <Wrench className="h-3.5 w-3.5" /> Work Orders & BOQ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Panel C: Urban Mobility */}
        {activeCategoryTab === 'MOBILITY' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block">CAMPUS & TRANSIT FLEET BUSES</span>
                <span className="text-xl font-bold text-indigo-400">{obs?.urbanMobility.totalCampusBuses || 0}</span>
                <p className="text-[10px] text-slate-400">
                  Active buses monitored on Route 14, 18, and 22 transit corridors.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block">TRAFFIC BOTTLENECK CHOKEPOINTS</span>
                <span className="text-xl font-bold text-sky-400">{obs?.urbanMobility.totalTrafficBottlenecks || 0}</span>
                <p className="text-[10px] text-slate-400">
                  Average observed bottleneck delay: {obs?.urbanMobility.averageBottleneckDelayMinutes || 0} minutes.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block">OBSERVED VEHICLES & PEDESTRIANS</span>
                <span className="text-xl font-bold text-white">
                  {obs?.urbanMobility.observedVehiclesCount || 0} Veh / {obs?.urbanMobility.observedPedestriansCount || 0} Ped
                </span>
                <p className="text-[10px] text-slate-400">
                  Optical counts from onboard video runs. Biometrics and personal identities strictly not collected.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-white font-bold block">Connected Subsystems:</span>
                <span className="text-[11px] text-slate-400">
                  Origin-Destination delay matrices, transit queue counters, and campus fleet telemetry.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onNavigateTab('od_delays')}
                  className="px-3 py-1.5 bg-sky-800 hover:bg-sky-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5" /> OD Matrix & Delays
                </button>
                <button
                  onClick={() => onNavigateTab('fleet')}
                  className="px-3 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                >
                  <Bus className="h-3.5 w-3.5" /> Campus Fleet Live
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Panel D: Climate & Environmental Context */}
        {activeCategoryTab === 'CLIMATE' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block">HEATWAVE VULNERABILITY HOTSPOTS</span>
                <span className="text-xl font-bold text-rose-400">{obs?.climateAndEnvironment.heatwaveVulnerabilityZones || 0}</span>
                <p className="text-[10px] text-slate-400">
                  Corridors monitored for asphalt softening risk (Max Surface: {obs?.climateAndEnvironment.maxObservedSurfaceTempC ? `${obs.climateAndEnvironment.maxObservedSurfaceTempC}°C` : 'Not recorded'}).
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block">WATERLOGGING ROAD DEFECTS</span>
                <span className="text-xl font-bold text-cyan-400">{obs?.climateAndEnvironment.waterloggingEventsCount || 0}</span>
                <p className="text-[10px] text-slate-400">
                  Standing stormwater pools detected that obscure road distress and erode road foundations.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block">CARBON & FUEL MEASUREMENT STATUS</span>
                <span className="text-sm font-bold text-amber-400">Not Currently Measured</span>
                <p className="text-[10px] text-slate-400">
                  Requires vehicle OBD-II fuel flow sensors. Solvofin refrains from ungrounded CO₂ claims.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-white font-bold block">Connected Subsystems:</span>
                <span className="text-[11px] text-slate-400">
                  Micro-climate heatwave analytics, urban canopy vegetation mapping, and drainage pooling detection.
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('analytics')}
                className="px-3 py-1.5 bg-purple-800 hover:bg-purple-700 text-white rounded-lg text-xs transition-colors flex items-center gap-1 self-start"
              >
                <ThermometerSun className="h-3.5 w-3.5" /> Urban & Heatwave Hub
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 7. SUSTAINABILITY INDICATOR FRAMEWORK (SDG 11 TREE) */}
      <div className="bg-[#0B0F1C] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl font-mono text-xs">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wide">
                SUSTAINABILITY INDICATOR FRAMEWORK — SDG 11 ARCHITECTURE
              </h2>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Hierarchical alignment mapping Solvofin features to UN SDG 11 targets.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px]">
            Target 11.2 Focused
          </span>
        </div>

        <div className="space-y-3">
          {framework?.branches.map((branch, idx) => {
            const isExpanded = expandedFrameworkBranches[branch.sdgCode] ?? true;
            return (
              <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleBranch(branch.sdgCode)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                      {branch.sdgCode}
                    </span>
                    <span className="font-bold text-white text-sm">{branch.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[10px] hidden sm:inline">{branch.actualFeatures.length} Active Features</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-3.5 pt-0 border-t border-slate-800/80 space-y-2.5 bg-slate-950/40">
                    <p className="text-[11px] text-slate-400 italic pt-2">
                      &ldquo;{branch.description}&rdquo;
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {branch.actualFeatures.map((feat, fIdx) => (
                        <div
                          key={fIdx}
                          className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-2 text-[11px] text-slate-300"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. CITIZEN VS GOVERNMENT PERSPECTIVE SUMMARY */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl space-y-3 font-mono text-xs shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <Building className="h-4 w-4 text-emerald-400" />
            <span>
              {selectedPerspective === 'GOVERNMENT'
                ? 'GOVERNMENT & MUNICIPAL PERSPECTIVE'
                : 'CITIZEN & PUBLIC CIVIC PERSPECTIVE'}
            </span>
          </div>
          <button
            onClick={() => setSelectedPerspective(selectedPerspective === 'GOVERNMENT' ? 'CITIZEN' : 'GOVERNMENT')}
            className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
          >
            Switch to {selectedPerspective === 'GOVERNMENT' ? 'Citizen View' : 'Government View'}
          </button>
        </div>

        {selectedPerspective === 'GOVERNMENT' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-300">
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
              <strong className="text-white block mb-1">Operational Governance</strong>
              Human supervisors maintain strict authority over all AI alerts. {human?.totalReviewedCases || 0} recommendations have been evaluated with transparent decision logging.
            </div>
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
              <strong className="text-white block mb-1">Infrastructure Prioritization</strong>
              {obs?.infrastructureSafety.totalRoadDefects || 0} detected defects quantified in cubic volume and asphalt metric tons to optimize municipal asphalt plant batching.
            </div>
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
              <strong className="text-white block mb-1">Fleet Liability & Vigilance</strong>
              Driver fatigue signals and bus grab-rail integrity are continuously tracked to protect passengers and lower public transit insurance liability.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-300">
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
              <strong className="text-white block mb-1">Civic Road Safety & SLA</strong>
              Citizens can track verified potholes and see when municipal patching crews are dispatched, eliminating opaque grievance portals.
            </div>
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
              <strong className="text-white block mb-1">Transit Commute Reliability</strong>
              Real-time monitoring of campus buses and bottleneck delays empowers riders with transparent transit flow data.
            </div>
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
              <strong className="text-white block mb-1">Micro-Climate Health Awareness</strong>
              High surface temperature corridors and monsoon waterlogged street sections are published openly for commuter route planning.
            </div>
          </div>
        )}
      </div>

      {/* 9. DATA BOUNDARY & EMPIRICAL LIMITATIONS */}
      <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2 font-mono text-[11px] text-slate-400">
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          <Info className="h-4 w-4 text-emerald-400" />
          <span>DATA LIMITATIONS & EMPIRICAL BOUNDARY CONDITIONS</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-400 leading-relaxed">
          {data?.limitations.map((lim, idx) => (
            <li key={idx}>{lim}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
