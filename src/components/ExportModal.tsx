import React from 'react';
import { X, Download, FileSpreadsheet, Database, Sparkles, FileText, CheckCircle2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const csvTables = [
    { name: 'vehicles', label: 'Unique Tracked Vehicles (CSV)', desc: 'Vehicle classifications, track IDs, estimated speeds, duration' },
    { name: 'road_defects', label: 'Road Defects & Potholes (CSV)', desc: 'Defect taxonomy, severity, confidence, timestamps, GPS' },
    { name: 'license_plates', label: 'ANPR License Plate Registry (CSV)', desc: 'OCR plate characters, confidence scores, track linkage' },
    { name: 'smoke_events', label: 'Visible Smoke & Emissions (CSV)', desc: 'Exhaust opacity, vehicle associations, severity metrics' },
    { name: 'buildings', label: 'Visible Building Counts (CSV)', desc: 'Structure tallies, confidence, first/last seen timestamps' },
    { name: 'traffic_metrics', label: 'Traffic Density & Congestion (CSV)', desc: 'Flow rates per minute, density scores, congestion levels' },
    { name: 'incidents', label: 'Safety & Incident Detections (CSV)', desc: 'Hazard classifications, timestamps, evidence notes' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 font-mono">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-slate-800 bg-[#0F172A] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              <Download className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Data Export & Archive Telemetry Suite</h3>
              <p className="text-[10px] text-slate-400">Download database dumps, CSV records, and audit tables.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-4 custom-scrollbar">
          {/* Option 1: Full Database JSON Dump */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-white uppercase">Database JSON Dump</h5>
                  <p className="text-[10px] text-slate-400">Complete raw snapshot of all tables & media relations.</p>
                </div>
              </div>
              <a
                href="/api/export/json"
                download="solvofin_db_dump.json"
                className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Export JSON
              </a>
            </div>
          </div>

          {/* Option 2: Individual Table CSV Exports */}
          <div>
            <h5 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              Municipal Data Audit CSV Tables
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {csvTables.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center justify-between rounded border border-slate-800 bg-slate-900 p-2.5"
                >
                  <div className="pr-2 truncate">
                    <div className="text-xs font-semibold text-slate-200 truncate">{t.label}</div>
                    <div className="text-[9px] text-slate-500 truncate">{t.desc}</div>
                  </div>
                  <a
                    href={`/api/export/csv/${t.name}`}
                    download={`solvofin_${t.name}.csv`}
                    className="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-emerald-400 hover:bg-slate-700 transition-colors"
                  >
                    <Download className="h-2.5 w-2.5" />
                    CSV
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 bg-slate-950 px-4 py-2.5">
          <button
            onClick={onClose}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
