import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  Calendar,
  MapPin,
  AlertTriangle,
  Layers,
  Car,
  ShieldCheck,
  CheckCircle,
  HardDrive,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Clock,
  Printer,
} from 'lucide-react';
import { ReportRecord, MediaRecord, RoadDefect, RoadCondition } from '../types';

interface InspectionReportsArchiveViewProps {
  onSelectMedia: (mediaId: string) => void;
  onNavigateTab?: (tab: any) => void;
}

export const InspectionReportsArchiveView: React.FC<InspectionReportsArchiveViewProps> = ({
  onSelectMedia,
  onNavigateTab,
}) => {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [mediaList, setMediaList] = useState<MediaRecord[]>([]);
  const [roadConditions, setRoadConditions] = useState<Record<string, RoadCondition>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState<string>('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reportsRes, mediaRes, dbDumpRes] = await Promise.all([
        fetch('/api/reports').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/media').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/export/json').then((r) => (r.ok ? r.json() : null)),
      ]);

      const fetchedReports: ReportRecord[] = Array.isArray(reportsRes) ? reportsRes : [];
      const fetchedMedia: MediaRecord[] = Array.isArray(mediaRes) ? mediaRes : [];

      // If reports endpoint was empty, pull from full dump
      let finalReports = fetchedReports;
      if (finalReports.length === 0 && dbDumpRes && Array.isArray(dbDumpRes.reports)) {
        finalReports = dbDumpRes.reports;
      }

      // Map road conditions for quick score lookups
      const condMap: Record<string, RoadCondition> = {};
      if (dbDumpRes && Array.isArray(dbDumpRes.road_conditions)) {
        dbDumpRes.road_conditions.forEach((rc: RoadCondition) => {
          condMap[rc.media_id] = rc;
        });
      }

      setReports(finalReports);
      setMediaList(fetchedMedia);
      setRoadConditions(condMap);
    } catch (err) {
      console.warn('Error loading inspection reports archive:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getMediaForReport = (mediaId: string) => {
    return mediaList.find((m) => m.id === mediaId);
  };

  const filteredReports = reports.filter((r) => {
    const media = getMediaForReport(r.media_id);
    const filename = media?.original_filename || '';
    const loc = media?.scene_location?.address_or_name || media?.upload_location?.address_or_name || '';
    const summary = r.summary_text || '';

    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.media_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.toLowerCase().includes(searchQuery.toLowerCase());

    const rating = r.stats_snapshot?.road_rating || roadConditions[r.media_id]?.rating || 'MODERATE';
    const matchesRating = selectedRating === 'ALL' || rating === selectedRating;

    return matchesSearch && matchesRating;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-2">
              <HardDrive className="h-3.5 w-3.5" />
              MUNICIPAL EVIDENCE & AUDIT REPOSITORY
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Stored Inspection Reports & Evidence Archive
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              All automated visual road audits, uploaded inspection images/videos, pothole classifications, and
              official signed PDF reports are securely cataloged and stored persistently.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <a
              href="/api/reports/operational/pdf?includeAI=true"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all shadow-sm"
              title="Download Municipal Transit Operational Mobility Audit (with AI Appendix)"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Operational AI Audit (PDF)</span>
            </a>

            <a
              href="/api/export/json"
              download="solvofin_full_archive.json"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all shadow-sm"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              Export Full JSON Dump
            </a>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Report ID, Media filename, Street, or keyword..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="w-full sm:w-auto px-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:border-emerald-500"
          >
            <option value="ALL">All Condition Ratings</option>
            <option value="CRITICAL">Critical Condition</option>
            <option value="POOR">Poor / Severe Condition</option>
            <option value="MODERATE">Moderate Condition</option>
            <option value="GOOD">Good Condition</option>
          </select>
        </div>
      </div>

      {/* Reports Archive Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-sm">
          <div className="h-6 w-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading verified reports repository...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Matching Reports Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Try adjusting your search criteria or upload a new road scan to generate an audit report.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => {
            const media = getMediaForReport(report.media_id);
            const stats = (report.stats_snapshot || {}) as any;
            const rating = stats.road_rating || roadConditions[report.media_id]?.rating || 'MODERATE';
            const healthScore = stats.road_health_score ?? roadConditions[report.media_id]?.health_score ?? 50;
            const potholes = stats.potholes_count ?? roadConditions[report.media_id]?.pothole_count ?? 0;
            const vehicles = stats.unique_vehicles_count ?? 0;

            const lat = media?.scene_location?.latitude || media?.upload_location?.latitude || 17.7342;
            const lng = media?.scene_location?.longitude || media?.upload_location?.longitude || 83.3248;
            const locName =
              media?.scene_location?.address_or_name ||
              media?.upload_location?.address_or_name ||
              'Coastal Highway NH-16 Sector 4';

            return (
              <div
                key={report.id}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {report.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rating === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : rating === 'POOR'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              : rating === 'MODERATE'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {healthScore}/100 [{rating}]
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-2 group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {media?.original_filename || `Road Audit - ${report.media_id}`}
                      </h3>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-800/80 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Visual Thumbnail Snapshot */}
                  {media && (
                    <div className="relative h-32 rounded-xl overflow-hidden mb-3 border border-slate-800 bg-slate-950">
                      <img
                        src={media.thumbnail_path || media.storage_path}
                        alt="Evidence snapshot"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-slate-300">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-emerald-400" />
                          {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
                        </span>
                        <span className="bg-slate-900/90 px-1.5 py-0.5 rounded text-white border border-slate-700">
                          {media.media_type}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Location & Sector */}
                  <div className="text-xs text-slate-300 flex items-center gap-1.5 mb-2 line-clamp-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>{locName}</span>
                  </div>

                  {/* Summary Snippet */}
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {report.summary_text || 'Automated visual road defect and urban intelligence assessment.'}
                  </p>

                  {/* Key Metric Badges */}
                  <div className="grid grid-cols-2 gap-2 py-2 border-t border-slate-800 font-mono text-[11px]">
                    <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-500">Potholes:</span>
                      <span className={`font-bold ${potholes > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {potholes}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-500">Vehicles:</span>
                      <span className="font-bold text-cyan-400">{vehicles}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(report.generated_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/api/reports/${report.media_id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all text-xs flex items-center gap-1"
                      title="Download Standard PDF Report"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-[11px] font-semibold">PDF</span>
                    </a>

                    <a
                      href={`/api/reports/${report.media_id}/pdf?includeAI=true`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 transition-all text-xs flex items-center gap-1"
                      title="Download Official PDF Report with AI Decision Support & Audit Appendix"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-[11px] font-semibold">+ AI Audit</span>
                    </a>

                    <button
                      onClick={() => onSelectMedia(report.media_id)}
                      className="px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <span>View Dossier</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
