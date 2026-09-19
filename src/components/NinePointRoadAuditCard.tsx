import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Download,
  Check,
  X,
  Info,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { NinePointRoadAuditResult, NinePointRoadAuditItem } from '../types';
import { NINE_POINT_INSPECTION_ITEMS } from '../utils/ninePointAudit';

interface NinePointRoadAuditCardProps {
  auditResult: NinePointRoadAuditResult;
  onDownloadPDF?: () => void;
  mediaTitle?: string;
  isCompact?: boolean;
}

export const NinePointRoadAuditCard: React.FC<NinePointRoadAuditCardProps> = ({
  auditResult,
  onDownloadPDF,
  mediaTitle = 'Road Image Scan',
  isCompact = false,
}) => {
  const { total_items_checked, items_present_count, items_clear_count, all_clear, score, items, overall_verdict } = auditResult;

  const getSeverityBadge = (severity: string, detected: boolean) => {
    if (!detected) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-slate-900 border border-slate-700/60 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-400">
          NOMINAL
        </span>
      );
    }
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-950/80 border border-rose-500/60 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300">
            <AlertOctagon className="h-3 w-3 text-rose-400" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-orange-950/80 border border-orange-500/60 px-2 py-0.5 text-[10px] font-mono font-bold text-orange-300">
            <AlertTriangle className="h-3 w-3 text-orange-400" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-950/80 border border-amber-500/60 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-950/80 border border-blue-500/60 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-300">
            LOW
          </span>
        );
    }
  };

  return (
    <div
      id="nine-point-road-audit-card"
      className="rounded-xl border border-slate-800 bg-[#0B132B] shadow-xl overflow-hidden font-sans"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#101E3D] to-slate-900 border-b border-slate-800 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                9-Point Automated Road Defect Inspection Checklist
                <span className="rounded bg-teal-950/90 border border-teal-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-teal-300">
                  IRC:82 STANDARDS
                </span>
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-300">
              Automated multi-class computer vision audit checking all 9 mandatory civil road defect parameters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onDownloadPDF && (
              <button
                type="button"
                onClick={onDownloadPDF}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition-all shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export 9-Point PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Score and Verdict Bar */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 sm:col-span-2">
            <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Audit Status & Verdict</div>
            <div className="mt-1 flex items-center gap-2">
              {all_clear ? (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>ALL 9 ITEMS NOMINAL (ZERO HAZARDS)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
                  <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                  <span>{items_present_count} of 9 ROAD HAZARD ITEMS DETECTED</span>
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-300 mt-1 line-clamp-1">{auditResult.overall_verdict}</div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 flex flex-col justify-between">
            <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Checklist Breakdown</div>
            <div className="mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs font-bold text-rose-400">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                {items_present_count} YES
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                {items_clear_count} NO (Clear)
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Total checked: 9/9</div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 flex flex-col justify-between">
            <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Road Quality Index</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-xl font-black ${score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                {score}/100
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {score >= 80 ? 'EXCELLENT' : score >= 60 ? 'FAIR' : 'ACTION REQ.'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">IRC Volumetric Rating</div>
          </div>
        </div>
      </div>

      {/* The 9 Items Grid */}
      <div className="p-4 sm:p-5">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <span>Official 9-Item Civil Inspection Matrix</span>
          <span className="text-emerald-400 text-[11px]">100% Machine Vision Scanned</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => {
            const defItem = NINE_POINT_INSPECTION_ITEMS.find((d) => d.item_number === item.item_number);
            const icon = defItem?.icon || '🔍';

            return (
              <div
                key={item.id}
                id={`audit-item-box-${item.item_number}`}
                className={`rounded-lg border p-3.5 transition-all flex flex-col justify-between ${
                  item.detected
                    ? 'border-rose-500/50 bg-rose-950/20 shadow-sm shadow-rose-950/40'
                    : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Bar: Number, Icon, Title, and YES / NO badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{icon}</span>
                      <div>
                        <div className="text-xs font-bold text-white leading-tight">
                          {item.item_number}. {item.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {item.key}
                        </div>
                      </div>
                    </div>

                    {/* Prominent YES / NO badge */}
                    <div className="flex-shrink-0">
                      {item.detected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500 px-2.5 py-0.5 text-[11px] font-black font-mono text-rose-300 animate-pulse">
                          <Check className="h-3 w-3 text-rose-400 stroke-[3]" />
                          YES
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold font-mono text-emerald-400">
                          <X className="h-3 w-3 text-emerald-400 stroke-[2.5]" />
                          NO (Clear)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Findings / Details */}
                  <div className="mt-2 text-[11px] leading-relaxed text-slate-300 bg-slate-950/70 rounded p-2 border border-slate-800/80">
                    <p>{item.details}</p>
                  </div>
                </div>

                {/* Bottom Metadata & Action */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <span>Conf:</span>
                      <strong className="text-slate-200">{(item.confidence * 100).toFixed(0)}%</strong>
                    </span>
                    {item.detected && (
                      <span className="flex items-center gap-1">
                        <span>Count:</span>
                        <strong className="text-rose-300">{item.count} detected</strong>
                      </span>
                    )}
                    <div>{getSeverityBadge(item.severity, item.detected)}</div>
                  </div>

                  <div className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                    <strong className="text-slate-300">Action:</strong> {item.action_required}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
