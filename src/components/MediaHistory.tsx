import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Video,
  Image as ImageIcon,
  MapPin,
  Clock,
  Eye,
  FileText,
  Play,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Car,
  AlertOctagon,
  Flame,
  PlusCircle,
} from 'lucide-react';
import { MediaRecord, UserRole } from '../types';
import { formatDate, formatBytes } from '../utils';

interface MediaHistoryProps {
  onSelectMedia: (mediaId: string) => void;
  onOpenUpload: () => void;
  userRole: UserRole;
}

export const MediaHistory: React.FC<MediaHistoryProps> = ({ onSelectMedia, onOpenUpload, userRole }) => {
  const [mediaList, setMediaList] = useState<MediaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'VIDEO' | 'IMAGE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PROCESSING' | 'FAILED'>('ALL');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/media?include_deleted=${includeDeleted}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Non-JSON response received');
      const data = await res.json();
      if (Array.isArray(data)) {
        setMediaList(data);
      }
    } catch (err) {
      console.error('Error fetching media history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [includeDeleted]);

  const handleDelete = async (id: string, hard = false) => {
    const confirmMsg = hard
      ? 'Permanently delete this media and all related database analysis records?'
      : 'Move this media record to deleted archive?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await fetch(`/api/media/${id}?hard=${hard}&user=${userRole}`, { method: 'DELETE' });
      fetchMedia();
    } catch (err) {
      console.error('Error deleting media:', err);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await fetch(`/api/media/${id}/restore`, { method: 'POST' });
      fetchMedia();
    } catch (err) {
      console.error('Error restoring media:', err);
    }
  };

  const handleReanalyze = async (id: string) => {
    try {
      await fetch(`/api/media/${id}/analyze`, { method: 'POST' });
      onSelectMedia(id);
    } catch (err) {
      console.error('Error starting analysis:', err);
    }
  };

  // Search and filter logic
  const filteredList = mediaList.filter((item) => {
    if (typeFilter !== 'ALL' && item.media_type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && item.analysis_status !== statusFilter) return false;

    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      item.original_filename.toLowerCase().includes(s) ||
      item.id.toLowerCase().includes(s) ||
      (item.bus_route_id && item.bus_route_id.toLowerCase().includes(s)) ||
      (item.upload_location.address_or_name && item.upload_location.address_or_name.toLowerCase().includes(s)) ||
      (item.scene_location.address_or_name && item.scene_location.address_or_name.toLowerCase().includes(s))
    );
  });

  return (
    <div id="media-history-container" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-5">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>PERSISTENT CATALOG & AUDIT TRAIL</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">Media Explorer & Archive</h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Persistent, searchable telemetry catalog of all analyzed urban transit footage and photos. Survives all refreshes and restarts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-950 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Ingest Footage</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-2.5 rounded-lg border border-slate-800 bg-[#0F172A] p-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search filename, ID, route, coordinates..."
            className="w-full rounded border border-slate-800 bg-slate-900 pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Media Type Filter */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[11px]">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                typeFilter === 'ALL' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('VIDEO')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                typeFilter === 'VIDEO' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => setTypeFilter('IMAGE')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                typeFilter === 'IMAGE' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Photos
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-300 font-mono text-[11px] focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">STATUS: ALL</option>
            <option value="COMPLETED">STATUS: COMPLETED</option>
            <option value="PROCESSING">STATUS: PROCESSING</option>
            <option value="FAILED">STATUS: FAILED</option>
          </select>

          {/* Admin Soft-Deleted Toggle */}
          {(userRole === 'ADMIN' || userRole === 'AUTHORITY') && (
            <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer pl-1 font-mono text-[11px]">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span>Archived</span>
            </label>
          )}
        </div>
      </div>

      {/* Media Items List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : filteredList.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-10 text-center">
          <Video className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-white uppercase">No records found</h3>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            {searchTerm ? 'No media matching search criteria.' : 'Ingest transit footage to initiate telemetry.'}
          </p>
          <button
            onClick={onOpenUpload}
            className="mt-3 inline-flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Ingest Media</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item) => {
            const isCompleted = item.analysis_status === 'COMPLETED';
            const isProcessing = item.analysis_status === 'PROCESSING';

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between overflow-hidden rounded-lg border bg-[#0F172A] transition-all hover:border-slate-700 ${
                  item.is_deleted
                    ? 'border-rose-900/40 opacity-60'
                    : 'border-slate-800'
                }`}
              >
                {/* Media Thumbnail & Badge Header */}
                <div className="relative h-40 w-full bg-slate-950 overflow-hidden">
                  {item.media_type === 'VIDEO' ? (
                    <video
                      src={item.storage_path}
                      muted
                      preload="metadata"
                      className="h-full w-full object-cover opacity-80 transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <img
                      src={item.storage_path || item.thumbnail_path}
                      alt={item.original_filename}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover opacity-80 transition-transform duration-500 hover:scale-105"
                    />
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white border border-slate-800">
                      {item.media_type === 'VIDEO' ? <Video className="h-3 w-3 text-emerald-400" /> : <ImageIcon className="h-3 w-3 text-blue-400" />}
                      {item.media_type}
                    </span>
                    {item.bus_route_id && (
                      <span className="rounded bg-slate-900/90 border border-slate-700 px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-400">
                        {item.bus_route_id}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-bold border ${
                        isCompleted
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                          : isProcessing
                          ? 'bg-amber-950/80 text-amber-400 border-amber-500/40 animate-pulse'
                          : 'bg-slate-900/80 text-slate-300 border-slate-700'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="h-3 w-3" />}
                      {item.analysis_status}
                    </span>
                  </div>

                  {/* Duration overlay if video */}
                  {item.media_type === 'VIDEO' && item.duration_sec && (
                    <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-mono text-slate-200 border border-slate-800">
                      00:{item.duration_sec < 10 ? `0${item.duration_sec}` : item.duration_sec}
                    </div>
                  )}
                </div>

                {/* Card Content Body */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white truncate font-mono" title={item.original_filename}>
                      {item.original_filename}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>{formatDate(item.upload_time)}</span>
                      <span>•</span>
                      <span>{formatBytes(item.file_size)}</span>
                    </div>

                    {/* Location Badge */}
                    <div className="mt-1.5 text-[10px] text-slate-400 font-mono">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">
                          GPS: {item.upload_location.latitude ? `${item.upload_location.latitude}, ${item.upload_location.longitude}` : 'Not Available'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="mt-3 grid grid-cols-3 gap-1 rounded border border-slate-800 bg-slate-900 p-1.5 text-center text-[10px] font-mono">
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase">Defects</div>
                        <div className="font-bold text-rose-400">
                          {isCompleted ? 'INDEXED' : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase">Vehicles</div>
                        <div className="font-bold text-emerald-400">
                          {isCompleted ? 'TRACKED' : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase">ANPR</div>
                        <div className="font-bold text-blue-400">
                          {isCompleted ? 'OCR-OK' : '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar matching required prompt layout */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSelectMedia(item.id)}
                        className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 text-[11px] font-bold text-emerald-400 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        <span>VIEW</span>
                      </button>

                      {isCompleted && (
                        <a
                          href={`/api/reports/${item.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-200 transition-colors"
                        >
                          <FileText className="h-3 w-3 text-emerald-400" />
                          <span>REPORT</span>
                        </a>
                      )}

                      <button
                        onClick={() => handleReanalyze(item.id)}
                        className="flex items-center gap-1 rounded bg-slate-800/60 hover:bg-slate-700 border border-slate-700 px-2 py-1 text-[11px] font-bold text-slate-300 transition-colors"
                        title="Re-run automated AI pipeline"
                      >
                        <Play className="h-3 w-3 text-blue-400" />
                        <span>RUN</span>
                      </button>
                    </div>

                    {/* Delete / Restore Controls */}
                    {userRole === 'ADMIN' && (
                      <div className="flex items-center gap-1">
                        {item.is_deleted ? (
                          <>
                            <button
                              onClick={() => handleRestore(item.id)}
                              className="rounded p-1 text-slate-400 hover:text-emerald-400"
                              title="Restore media"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, true)}
                              className="rounded p-1 text-slate-400 hover:text-rose-500"
                              title="Hard Delete Permanently"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDelete(item.id, false)}
                            className="rounded p-1 text-slate-500 hover:text-rose-400"
                            title="Soft delete media"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
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
