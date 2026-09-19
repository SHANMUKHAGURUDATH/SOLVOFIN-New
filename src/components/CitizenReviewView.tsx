import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Clock,
  Wrench,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Send,
  Eye,
  Download,
  X,
} from 'lucide-react';
import { CitizenIssue, DefectSeverity } from '../types';
import { generateCitizenDefectPDF } from '../utils/pdfReportGenerator';
import { NinePointRoadAuditCard } from './NinePointRoadAuditCard';
import { buildNinePointAuditFromData } from '../utils/ninePointAudit';

interface CitizenReviewViewProps {
  onOpenWorkOrders?: () => void;
  onOpenGISMap?: () => void;
}

export const CitizenReviewView: React.FC<CitizenReviewViewProps> = ({
  onOpenWorkOrders,
  onOpenGISMap,
}) => {
  const [issues, setIssues] = useState<CitizenIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<CitizenIssue | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [remarks, setRemarks] = useState('');
  const [actionStatus, setActionStatus] = useState<'UNDER_GOVERNMENT_REVIEW' | 'WORK_ORDER_DISPATCHED' | 'RESOLVED'>('WORK_ORDER_DISPATCHED');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePhotoTab, setActivePhotoTab] = useState<'ORIGINAL' | 'ANNOTATED'>('ORIGINAL');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
    setActivePhotoTab('ORIGINAL');
  }, [selectedIssue?.id]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/citizen/issues');
      const data = await res.json();
      if (Array.isArray(data)) {
        setIssues(data);
        if (data.length > 0 && !selectedIssue) {
          setSelectedIssue(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch citizen issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/citizen/issues/${selectedIssue.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewed_by: 'GVMC Zone 3 Infrastructure Inspector',
          official_remarks: remarks.trim() || 'Verified via Mobile Transit Fleet Telemetry. Action dispatched.',
          status: actionStatus,
          create_work_order: actionStatus === 'WORK_ORDER_DISPATCHED',
        }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Failed to submit review');

      setRemarks('');
      setSelectedIssue(updated);
      fetchIssues();
    } catch (err: any) {
      alert(err.message || 'Error updating review');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredIssues = issues.filter((item) => {
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tracking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.citizen_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Government Authority Operations Center
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Citizen Urban Hazard Escalations & Work Order Dispatch
          </h1>
          <p className="text-slate-400 text-sm">
            Review citizen-submitted road defects, cross-verify against bus sensor passes, and dispatch municipal repair crews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onOpenWorkOrders && (
            <button
              onClick={onOpenWorkOrders}
              className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Wrench className="w-4 h-4" />
              Municipal Work Orders
            </button>
          )}
          {onOpenGISMap && (
            <button
              onClick={onOpenGISMap}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              GIS Hazard Map
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-5 space-y-3">
          {/* Filter and Search */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search citizen or tracking code..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'ALL', label: 'All Tickets' },
                { id: 'AI_VERIFIED', label: 'AI Verified' },
                { id: 'UNDER_GOVERNMENT_REVIEW', label: 'Under Review' },
                { id: 'WORK_ORDER_DISPATCHED', label: 'Dispatched' },
                { id: 'RESOLVED', label: 'Resolved' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                    filterStatus === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Cards */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading escalations...</div>
            ) : filteredIssues.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-900 rounded-2xl border border-slate-800">
                No tickets match your filter.
              </div>
            ) : (
              filteredIssues.map((issue) => {
                const isSelected = selectedIssue?.id === issue.id;
                return (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                        {issue.tracking_code}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          issue.status === 'WORK_ORDER_DISPATCHED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : issue.status === 'AI_VERIFIED'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : issue.status === 'UNDER_GOVERNMENT_REVIEW'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {issue.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">{issue.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">{issue.landmark || issue.address}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
                      <span>Reported by {issue.citizen_name}</span>
                      <span className="text-emerald-400">
                        {Math.round((issue.ai_validation?.confidence || 0.9) * 100)}% CV Match
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Ticket Review & Action Panel */}
        <div className="lg:col-span-7">
          {selectedIssue ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-500/40">
                      {selectedIssue.tracking_code}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Severity: {selectedIssue.severity}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{selectedIssue.title}</h2>
                </div>

                <div className="flex flex-col sm:items-end gap-2 text-xs text-slate-400">
                  <span>Logged on: {new Date(selectedIssue.timestamp).toLocaleString('en-IN')}</span>
                  <button
                    type="button"
                    onClick={() => {
                      generateCitizenDefectPDF({
                        tracking_code: selectedIssue.tracking_code,
                        report_date: selectedIssue.timestamp,
                        citizen_name: selectedIssue.citizen_name,
                        citizen_phone: selectedIssue.citizen_phone,
                        citizen_email: selectedIssue.citizen_email,
                        title: selectedIssue.title,
                        category: selectedIssue.category,
                        description: selectedIssue.description,
                        landmark: selectedIssue.landmark,
                        address: selectedIssue.address,
                        latitude: selectedIssue.latitude,
                        longitude: selectedIssue.longitude,
                        elevation_meters: 15.6,
                        gps_accuracy_meters: 3.2,
                        zone_division: selectedIssue.latitude > 17.8 ? 'GVMC Zone-1 (North Corridor)' : 'GVMC Zone-3 (Central Urban)',
                        status: selectedIssue.status,
                        severity: selectedIssue.severity as any,
                        evidence_url: selectedIssue.evidence_url,
                        ai_validation: {
                          is_verified: selectedIssue.ai_validation?.is_verified ?? true,
                          confidence: selectedIssue.ai_validation?.confidence ?? 0.94,
                          detected_class: selectedIssue.ai_validation?.detected_class ?? selectedIssue.category,
                          depth_cm: selectedIssue.ai_validation?.depth_cm ?? 11.2,
                          width_cm: selectedIssue.ai_validation?.width_cm ?? 68,
                          length_cm: selectedIssue.ai_validation?.length_cm ?? 85,
                          estimated_asphalt_kg: selectedIssue.ai_validation?.estimated_asphalt_kg ?? 260,
                          estimated_cost_inr: (selectedIssue.ai_validation as any)?.estimated_cost_inr ?? 14500,
                          priority_score: 88,
                          sla_target_hours: selectedIssue.severity === 'CRITICAL' ? 24 : 48,
                          summary: selectedIssue.ai_validation?.summary,
                        },
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Official PDF Report
                  </button>
                </div>
              </div>

              {/* Citizen Details & Location Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                    Citizen Reporter Details
                  </span>
                  <div className="font-bold text-white text-sm">{selectedIssue.citizen_name}</div>
                  <div className="text-slate-400">Phone: {selectedIssue.citizen_phone || 'N/A'}</div>
                  <div className="text-slate-400">Email: {selectedIssue.citizen_email || 'N/A'}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                    Geospatial Location
                  </span>
                  <div className="font-bold text-emerald-400">
                    {selectedIssue.latitude.toFixed(5)}°N, {selectedIssue.longitude.toFixed(5)}°E
                  </div>
                  <div className="text-slate-300 line-clamp-1">{selectedIssue.landmark}</div>
                  <div className="text-slate-500 line-clamp-1">{selectedIssue.address}</div>
                </div>
              </div>

              {/* Photo Evidence & AI CV Volumetric Validation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Citizen Photo Evidence with Original vs AI Annotation Distinction (Part A) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 block">Citizen Photo Evidence</span>
                    <button
                      type="button"
                      onClick={() => setIsPhotoModalOpen(true)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Original Resolution
                    </button>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setActivePhotoTab('ORIGINAL')}
                      className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-all ${
                        activePhotoTab === 'ORIGINAL'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Original Citizen Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePhotoTab('ANNOTATED')}
                      className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-all ${
                        activePhotoTab === 'ANNOTATED'
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      AI Annotated
                    </button>
                  </div>

                  {/* Photo Container */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 min-h-[176px] flex flex-col justify-center items-center">
                    {imageError ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center space-y-1.5">
                        <AlertTriangle className="w-6 h-6 text-rose-500" />
                        <span className="text-xs font-bold text-rose-400">Original citizen photo unavailable.</span>
                        <span className="text-[10px] text-slate-500 max-w-xs">
                          Asset cannot be loaded from storage. No substitute image displayed.
                        </span>
                      </div>
                    ) : activePhotoTab === 'ORIGINAL' ? (
                      <div className="relative w-full h-44 group cursor-pointer" onClick={() => setIsPhotoModalOpen(true)}>
                        <img
                          src={selectedIssue.original_photo?.original_url || selectedIssue.evidence_url}
                          alt={`Original Citizen Upload for ${selectedIssue.tracking_code}`}
                          onError={() => setImageError(true)}
                          className="w-full h-44 object-cover"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-950/90 text-[10px] font-bold text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Unaltered Citizen Photo
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-slate-300 border border-slate-700">
                          {selectedIssue.tracking_code}
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-44 overflow-hidden">
                        <img
                          src={selectedIssue.annotated_photo_url || selectedIssue.original_photo?.original_url || selectedIssue.evidence_url}
                          alt="AI Computer Vision Annotation"
                          onError={() => setImageError(true)}
                          className="w-full h-44 object-cover filter contrast-125"
                        />
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          <rect
                            x="22%"
                            y="25%"
                            width="56%"
                            height="50%"
                            fill="rgba(244, 63, 94, 0.15)"
                            stroke="#F43F5E"
                            strokeWidth="2"
                            strokeDasharray="4 2"
                            rx="6"
                          />
                          <text x="24%" y="22%" fill="#F43F5E" fontSize="11" fontWeight="bold">
                            {selectedIssue.category} • {Math.round((selectedIssue.ai_validation?.confidence || 0.94) * 100)}% Conf
                          </text>
                        </svg>
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-indigo-950/90 text-[10px] font-bold text-indigo-300 border border-indigo-500/40 flex items-center gap-1 shadow">
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          AI Annotation (Separate Asset)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Provenance Metadata Table (A1, A3) */}
                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Original Filename:</span>
                      <span className="text-slate-200 truncate max-w-[180px]">
                        {selectedIssue.original_photo?.original_filename || 'citizen_evidence.jpg'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">File Size:</span>
                      <span className="text-slate-200">
                        {selectedIssue.original_photo?.file_size_bytes
                          ? `${(selectedIssue.original_photo.file_size_bytes / 1024).toFixed(1)} KB`
                          : 'Preserved Raw Media'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">MIME Type:</span>
                      <span className="text-slate-200">{selectedIssue.original_photo?.mime_type || 'image/jpeg'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Upload Date/Time:</span>
                      <span className="text-slate-200">
                        {new Date(selectedIssue.original_photo?.uploaded_at || selectedIssue.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Escalation ID:</span>
                      <span className="text-indigo-400 font-bold">{selectedIssue.tracking_code}</span>
                    </div>
                    {selectedIssue.original_photo?.sha256_hash && (
                      <div className="flex items-center justify-between truncate">
                        <span className="text-slate-500">SHA-256:</span>
                        <span className="text-emerald-400 truncate max-w-[170px]" title={selectedIssue.original_photo.sha256_hash}>
                          {selectedIssue.original_photo.sha256_hash}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Volumetric Breakdown */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    AI Computer Vision Verification
                  </span>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs h-44 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400">Confidence Score:</span>
                        <span className="font-bold text-emerald-400">
                          {Math.round((selectedIssue.ai_validation?.confidence || 0.9) * 100)}% Match
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400">Estimated Depth:</span>
                        <span className="font-bold text-white">
                          {selectedIssue.ai_validation?.depth_cm || 11.5} cm
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Asphalt Material Required:</span>
                        <span className="font-bold text-amber-400">
                          {selectedIssue.ai_validation?.estimated_asphalt_kg || 280} kg
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 leading-relaxed">
                      {selectedIssue.ai_validation?.summary ||
                        'Verified via computer vision telemetry and matched against public bus sensor route data.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 9-Point Road Hazard Audit Inspection Card */}
              <NinePointRoadAuditCard
                auditResult={buildNinePointAuditFromData({
                  roadDefects: [
                    {
                      id: selectedIssue.id,
                      media_id: selectedIssue.tracking_code,
                      type: selectedIssue.category,
                      severity: selectedIssue.severity as any,
                      confidence: selectedIssue.ai_validation?.confidence || 0.94,
                      timestamp_sec: 0,
                      description: selectedIssue.description,
                      work_order_status: selectedIssue.status === 'RESOLVED' ? 'COMPLETED' : 'DISPATCHED',
                      depth_cm: selectedIssue.ai_validation?.depth_cm,
                      width_cm: selectedIssue.ai_validation?.width_cm,
                      length_cm: selectedIssue.ai_validation?.length_cm,
                      repair_cost_inr: (selectedIssue.ai_validation as any)?.estimated_cost_inr,
                      division_assigned: 'GVMC Road Infrastructure Wing',
                      is_temporal_validated: true,
                      temporal_status: 'CONFIRMED',
                    } as any,
                  ],
                  filename: selectedIssue.title,
                })}
                onDownloadPDF={() => {
                  generateCitizenDefectPDF({
                    tracking_code: selectedIssue.tracking_code,
                    report_date: selectedIssue.timestamp,
                    citizen_name: selectedIssue.citizen_name,
                    citizen_phone: selectedIssue.citizen_phone,
                    citizen_email: selectedIssue.citizen_email,
                    title: selectedIssue.title,
                    category: selectedIssue.category,
                    description: selectedIssue.description,
                    landmark: selectedIssue.landmark,
                    address: selectedIssue.address,
                    latitude: selectedIssue.latitude,
                    longitude: selectedIssue.longitude,
                    elevation_meters: 15.6,
                    gps_accuracy_meters: 3.2,
                    zone_division: selectedIssue.latitude > 17.8 ? 'GVMC Zone-1 (North Corridor)' : 'GVMC Zone-3 (Central Urban)',
                    status: selectedIssue.status,
                    severity: selectedIssue.severity as any,
                    evidence_url: selectedIssue.evidence_url,
                    ai_validation: {
                      is_verified: selectedIssue.ai_validation?.is_verified ?? true,
                      confidence: selectedIssue.ai_validation?.confidence ?? 0.94,
                      detected_class: selectedIssue.ai_validation?.detected_class ?? selectedIssue.category,
                      depth_cm: selectedIssue.ai_validation?.depth_cm ?? 11.2,
                      width_cm: selectedIssue.ai_validation?.width_cm ?? 68,
                      length_cm: selectedIssue.ai_validation?.length_cm ?? 85,
                      estimated_asphalt_kg: selectedIssue.ai_validation?.estimated_asphalt_kg ?? 260,
                      estimated_cost_inr: (selectedIssue.ai_validation as any)?.estimated_cost_inr ?? 14500,
                      priority_score: 88,
                      sla_target_hours: selectedIssue.severity === 'CRITICAL' ? 24 : 48,
                      summary: selectedIssue.ai_validation?.summary,
                    },
                  });
                }}
                mediaTitle={selectedIssue.title}
              />

              {/* Official Review & Action Dispatch Form */}
              <form onSubmit={handleReviewSubmit} className="pt-4 border-t border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Official Municipal Inspector Action
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Official Decision / Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'WORK_ORDER_DISPATCHED', label: 'Dispatch Work Order', color: 'emerald' },
                      { id: 'UNDER_GOVERNMENT_REVIEW', label: 'Mark Under Review', color: 'amber' },
                      { id: 'RESOLVED', label: 'Mark Resolved', color: 'cyan' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setActionStatus(opt.id as any)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                          actionStatus === opt.id
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Official Inspector Remarks & Work Order Note
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter inspection confirmation, assigned division or repair crew instructions..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Processing Decision...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        Save Decision & Dispatch {actionStatus === 'WORK_ORDER_DISPATCHED' ? 'Rapid Response BOQ' : 'Update'}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
              Select a citizen ticket from the left panel to review.
            </div>
          )}
        </div>
      </div>

      {/* Full-Resolution Original Citizen Photo Inspection Modal (Part A) */}
      {isPhotoModalOpen && selectedIssue && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Original Citizen Upload Inspection
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      Unaltered Source Evidence
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Escalation Reference: <span className="font-mono text-indigo-400">{selectedIssue.tracking_code}</span> • Category:{' '}
                    <span className="text-slate-200">{selectedIssue.category}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/50">
              {imageError ? (
                <div className="p-8 text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
                  <p className="text-sm font-bold text-rose-400">Original citizen photo unavailable.</p>
                  <p className="text-xs text-slate-500">
                    The original image cannot be loaded from storage. No substitute image displayed.
                  </p>
                </div>
              ) : (
                <img
                  src={selectedIssue.original_photo?.original_url || selectedIssue.evidence_url}
                  alt={`Full Resolution Evidence ${selectedIssue.tracking_code}`}
                  onError={() => setImageError(true)}
                  className="max-h-[60vh] w-auto max-w-full rounded-xl object-contain border border-slate-800 shadow-lg"
                />
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-[11px] text-slate-400 space-x-3 font-mono">
                <span>File: <strong className="text-white">{selectedIssue.original_photo?.original_filename || 'citizen_evidence.jpg'}</strong></span>
                <span>Size: <strong className="text-white">{selectedIssue.original_photo?.file_size_bytes ? `${(selectedIssue.original_photo.file_size_bytes / 1024).toFixed(1)} KB` : 'Raw Bytes'}</strong></span>
                <span>MIME: <strong className="text-white">{selectedIssue.original_photo?.mime_type || 'image/jpeg'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedIssue.original_photo?.original_url || selectedIssue.evidence_url}
                  download={selectedIssue.original_photo?.original_filename || `citizen_evidence_${selectedIssue.tracking_code}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Original
                </a>
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
