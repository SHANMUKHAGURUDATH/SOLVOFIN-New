import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle, Terminal, FileText, ChevronRight, Sparkles, X } from 'lucide-react';
import { AnalysisJob, MediaRecord } from '../types';

interface AnalysisProgressModalProps {
  media: MediaRecord | null;
  onClose: () => void;
  onViewAnalysis: (mediaId: string) => void;
}

export const AnalysisProgressModal: React.FC<AnalysisProgressModalProps> = ({
  media,
  onClose,
  onViewAnalysis,
}) => {
  const [job, setJob] = useState<AnalysisJob | null>(null);

  useEffect(() => {
    if (!media) return;

    // Connect to SSE stream
    const eventSource = new EventSource(`/api/jobs/${media.id}/events`);

    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.job) {
          setJob(payload.job);
        }
      } catch (err) {}
    };

    // Also fallback periodic poll
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${media.id}`);
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          setJob(data);
          if (data.status === 'COMPLETED' || data.status === 'FAILED') {
            clearInterval(pollInterval);
          }
        }
      } catch (err) {}
    }, 1500);

    return () => {
      eventSource.close();
      clearInterval(pollInterval);
    };
  }, [media?.id]);

  if (!media) return null;

  const progress = job ? job.progress : 10;
  const isCompleted = job?.status === 'COMPLETED' || progress >= 100;
  const isFailed = job?.status === 'FAILED';

  const pipelineSteps = [
    { key: 'media_preprocessing', label: 'Media Preprocessing & Stream Validation' },
    { key: 'frame_extraction', label: 'Spatial Sampling & Keyframe Extraction' },
    { key: 'object_detection', label: 'Urban Object Detection (Gemini 3.7 Flash)' },
    { key: 'vehicle_tracking', label: 'Multi-Object Tracking (Unique Vehicle IDs)' },
    { key: 'road_analysis', label: 'Road Defect & Surface Health Scoring' },
    { key: 'people_detection', label: 'Pedestrian Detection & Aggregate Estimates' },
    { key: 'traffic_metrics', label: 'Traffic Density & Congestion Calculation' },
    { key: 'anpr', label: 'License Plate OCR (ANPR Pipeline)' },
    { key: 'smoke_detection', label: 'Visible Exhaust / Smoke Plume Detection' },
    { key: 'building_count', label: 'Visible Building & Structure Tallies' },
    { key: 'incident_detection', label: 'Incident & Pedestrian Safety Analysis' },
    { key: 'report_generation', label: 'PDF Report Generation & Database Persistence' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 font-mono">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-slate-800 bg-[#0F172A] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Automated AI Pipeline Execution</h3>
              <p className="text-[10px] text-slate-400 truncate max-w-xs sm:max-w-md">
                INPUT: <span className="text-emerald-400 font-bold">{media.original_filename}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress & Current Module Banner */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              STATUS: <strong className="text-white">{job?.current_module || 'Processing...'}</strong>
            </div>
            <div className="text-sm font-black text-emerald-400">{progress}%</div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full overflow-hidden rounded bg-slate-900 border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-emerald-500'
                  : isFailed
                  ? 'bg-rose-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Module Checklist */}
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar text-xs">
            {pipelineSteps.map((step, idx) => {
              const status = job?.modules_status?.[step.key as keyof AnalysisJob['modules_status']] || (progress > (idx + 1) * 8 ? 'COMPLETED' : 'QUEUED');
              const isRunning = status === 'RUNNING';
              const isDone = status === 'COMPLETED' || isCompleted;

              return (
                <div
                  key={step.key}
                  className={`flex items-center justify-between rounded px-2.5 py-1.5 text-[11px] transition-colors ${
                    isRunning
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                      : isDone
                      ? 'bg-slate-900/60 text-slate-300 border border-slate-800/40'
                      : 'text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                    ) : isRunning ? (
                      <Loader2 className="h-3.5 w-3.5 text-emerald-400 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded border border-slate-700 flex-shrink-0 flex items-center justify-center text-[9px]">
                        {idx + 1}
                      </div>
                    )}
                    <span className="font-medium">{step.label}</span>
                  </div>

                  <span className="text-[10px] font-bold uppercase">
                    {isDone ? (
                      <span className="text-emerald-400">DONE</span>
                    ) : isRunning ? (
                      <span className="text-emerald-400">ACTIVE</span>
                    ) : (
                      <span className="text-slate-600">QUEUED</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Live Log Terminal Output */}
          {job?.logs && job.logs.length > 0 && (
            <div className="rounded border border-slate-800 bg-slate-950 p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1.5 border-b border-slate-800/60 pb-1 uppercase">
                <Terminal className="h-3 w-3 text-emerald-400" />
                Live Pipeline Telemetry Output
              </div>
              <div className="max-h-20 overflow-y-auto font-mono text-[10px] space-y-0.5 pr-1">
                {job.logs.slice(-4).map((l, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-slate-500 select-none">[{l.timestamp}]</span>
                    <span
                      className={
                        l.level === 'ERROR'
                          ? 'text-rose-400'
                          : l.level === 'WARN'
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }
                    >
                      {l.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-3">
          <div className="text-[11px] text-slate-400 font-mono">
            {isCompleted ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" /> PIPELINE COMPLETE ✓
              </span>
            ) : isFailed ? (
              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                <AlertCircle className="h-3.5 w-3.5" /> Pipeline failure recorded
              </span>
            ) : (
              <span>Background asynchronous computation...</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isCompleted && (
              <>
                <a
                  href={`/api/reports/${media.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  <FileText className="h-3 w-3 text-emerald-400" />
                  PDF Report
                </a>
                <button
                  type="button"
                  onClick={() => onViewAnalysis(media.id)}
                  className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-sm shadow-emerald-950"
                >
                  <span>View Analysis</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
