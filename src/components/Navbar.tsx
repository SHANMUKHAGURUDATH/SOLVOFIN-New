import React from 'react';
import {
  Eye,
  Cpu,
  Database,
  HardDrive,
  Download,
  Sparkles,
  UserCheck,
  Layers,
  MapPin,
  Plus,
  FileText,
  Car,
  AlertOctagon,
  Wrench,
  Bus,
  GraduationCap,
  Bot,
  Compass,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'lane_transition'
  | 'citizen_portal'
  | 'citizen_reviews'
  | 'googlemaps'
  | 'roads'
  | 'od_delays'
  | 'workorders'
  | 'fleet'
  | 'traffic'
  | 'analytics'
  | 'map'
  | 'history'
  | 'team'
  | 'upload';

interface NavbarProps {
  currentRole: 'GOVERNMENT' | 'CITIZEN' | 'ADMIN' | 'AUTHORITY' | 'OPERATOR' | 'VIEWER';
  onRoleChange: (role: any) => void;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenExportModal: () => void;
  onOpenCopilot: () => void;
  onOpenNavigator?: () => void;
  onOpenLoginModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  activeTab,
  onTabChange,
  onOpenExportModal,
  onOpenCopilot,
  onOpenNavigator,
  onOpenLoginModal,
}) => {
  const isCitizen = currentRole === 'CITIZEN';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0F172A] px-4 py-2.5 sm:px-6 shrink-0">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Left: Brand & Status */}
        <div className="flex items-center gap-4">
          <div
            id="nav-brand"
            onClick={() => onTabChange(isCitizen ? 'citizen_portal' : 'dashboard')}
            className="flex cursor-pointer items-center gap-2.5 group"
          >
            <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-slate-950 font-black text-sm tracking-tighter shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              SV
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase leading-none">
                  Solvofin <span className="text-emerald-500">{isCitizen ? 'Citizen' : 'Intelligence'}</span>
                </h1>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5">
                {isCitizen ? 'URBAN CITIZEN REPORTING & SLA' : 'MUNICIPAL TRANSIT TELEMETRY'}
              </p>
            </div>
          </div>

          {/* System Telemetry Badges (High Density) */}
          <div className="hidden 2xl:flex items-center gap-2 border-l border-slate-800 pl-4 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800" title="Data permanently stored in persistent database">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-slate-400">DB-PERSISTENCE: <strong className="text-emerald-400">ACTIVE</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
              <Cpu className="h-3 w-3 text-blue-400" />
              <span className="text-slate-400">ROLE: <strong className="text-emerald-400">{currentRole}</strong></span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Tabs (High Density) */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-[60vw] lg:max-w-none">
          {isCitizen ? (
            <>
              <button
                id="tab-citizen-portal-btn"
                onClick={() => onTabChange('citizen_portal')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'citizen_portal'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/40'
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-emerald-300" />
                <span>Citizen Reports & Tracking</span>
              </button>

              <button
                id="tab-map-btn"
                onClick={() => onTabChange('map')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'map'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                <span>City Hazard Map</span>
              </button>

              <button
                id="tab-team-btn"
                onClick={() => onTabChange('team')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'team'
                    ? 'bg-purple-600 text-white shadow-sm font-bold'
                    : 'text-purple-400 hover:text-purple-300 hover:bg-slate-800/60'
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Contact Me</span>
              </button>
            </>
          ) : (
            <>
              <button
                id="tab-dashboard-btn"
                onClick={() => onTabChange('dashboard')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-emerald-400" />
                <span>Dashboard</span>
              </button>

              <button
                id="tab-citizen-reviews-btn"
                onClick={() => onTabChange('citizen_reviews')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'citizen_reviews'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/60'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Citizen Escalations</span>
              </button>

              <button
                id="tab-roads-btn"
                onClick={() => onTabChange('roads')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'roads'
                    ? 'bg-rose-600 text-white shadow-sm font-bold'
                    : 'text-rose-400 hover:text-rose-300 hover:bg-slate-800/60'
                }`}
              >
                <AlertOctagon className="h-3.5 w-3.5" />
                <span>Pothole Vision</span>
              </button>

              <button
                id="tab-od-delays-btn"
                onClick={() => onTabChange('od_delays')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'od_delays'
                    ? 'bg-sky-600 text-white shadow-sm font-bold'
                    : 'text-sky-400 hover:text-sky-300 hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>OD Matrix & Delays</span>
              </button>

              <button
                id="tab-workorders-btn"
                onClick={() => onTabChange('workorders')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'workorders'
                    ? 'bg-amber-600 text-slate-950 shadow-sm font-bold'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/60'
                }`}
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>Work Orders</span>
              </button>

              <button
                id="tab-fleet-btn"
                onClick={() => onTabChange('fleet')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'fleet'
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-blue-400 hover:text-blue-300 hover:bg-slate-800/60'
                }`}
              >
                <Bus className="h-3.5 w-3.5" />
                <span>Fleet</span>
              </button>

              <button
                id="tab-map-btn"
                onClick={() => onTabChange('map')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'map'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                <span>GIS Map</span>
              </button>
            </>
          )}
        </nav>

        {/* Right: Copilot, Navigator, Role Switcher & Export Suite */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Global AI Search / Controlled Navigator Trigger */}
          {onOpenNavigator && (
            <button
              id="ai-navigator-search-btn"
              onClick={onOpenNavigator}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors shadow-sm"
              title="Ask Solvofin / Controlled AI Navigator (Ctrl+K)"
            >
              <Compass className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden lg:inline text-slate-300 font-medium">Ask Solvofin...</span>
              <span className="hidden xl:inline px-1 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
                Ctrl+K
              </span>
              <span className="lg:hidden text-emerald-400 font-bold">Search</span>
            </button>
          )}

          {/* AI Copilot Trigger */}
          <button
            id="ai-copilot-btn"
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1.5 text-xs font-bold text-emerald-400 transition-colors shadow-sm"
          >
            <Bot className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* Role selector dropdown */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs">
            <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
            <select
              id="role-selector"
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as any)}
              className="bg-transparent text-slate-200 font-mono text-[11px] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="GOVERNMENT" className="bg-slate-900 text-slate-100">GOVERNMENT</option>
              <option value="CITIZEN" className="bg-slate-900 text-slate-100">CITIZEN</option>
              <option value="ADMIN" className="bg-slate-900 text-slate-100">ADMIN</option>
              <option value="AUTHORITY" className="bg-slate-900 text-slate-100">AUTHORITY</option>
              <option value="OPERATOR" className="bg-slate-900 text-slate-100">OPERATOR</option>
              <option value="VIEWER" className="bg-slate-900 text-slate-100">VIEWER</option>
            </select>
          </div>

          {/* Switch / Login Button */}
          {onOpenLoginModal && (
            <button
              onClick={onOpenLoginModal}
              className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded text-xs font-semibold transition-colors"
            >
              Login
            </button>
          )}

          {/* Export Suite Button */}
          <button
            id="export-suite-btn"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};

