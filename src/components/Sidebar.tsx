import React, { useState } from 'react';
import {
  Layers,
  AlertOctagon,
  Cpu,
  Wrench,
  Bus,
  Car,
  Sparkles,
  MapPin,
  Compass,
  HardDrive,
  Plus,
  GraduationCap,
  Download,
  Bot,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  Eye,
  ShieldAlert,
  ArrowLeftRight,
  Activity,
  Scale,
  Globe,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'impact'
  | 'driver_safety'
  | 'lane_transition'
  | 'zig_zag_detection'
  | 'bus_inspection'
  | 'gov_alerts'
  | 'citizen_portal'
  | 'citizen_reviews'
  | 'roads'
  | 'od_delays'
  | 'benchmark'
  | 'workorders'
  | 'lookup'
  | 'reports'
  | 'fleet'
  | 'traffic'
  | 'analytics'
  | 'map'
  | 'googlemaps'
  | 'history'
  | 'upload'
  | 'team'
  | 'responsible_ai';

interface SidebarProps {
  currentRole: 'GOVERNMENT' | 'CITIZEN' | 'ADMIN' | 'AUTHORITY' | 'OPERATOR' | 'VIEWER';
  onRoleChange: (role: any) => void;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenExportModal: () => void;
  onOpenCopilot: () => void;
  onOpenNavigator?: () => void;
  onOpenLoginModal?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  onRoleChange,
  activeTab,
  onTabChange,
  onOpenExportModal,
  onOpenCopilot,
  onOpenNavigator,
  onOpenLoginModal,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNavClick = (tab: NavTab) => {
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const isCitizen = currentRole === 'CITIZEN';

  const citizenNavSections = [
    {
      title: 'CITIZEN URBAN PORTAL',
      items: [
        {
          id: 'citizen_portal' as NavTab,
          label: 'Report Road Issue & Track',
          icon: ShieldCheck,
          color: 'text-emerald-400',
          badge: 'Report & SLA',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
        {
          id: 'map' as NavTab,
          label: 'City GIS Hazard Map',
          icon: MapPin,
          color: 'text-teal-400',
          badge: 'Live',
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        },
        {
          id: 'lookup' as NavTab,
          label: 'Coordinate Lookup',
          icon: Compass,
          color: 'text-cyan-400',
          badge: 'GPS Pin',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        },
      ],
    },
    {
      title: 'DEVELOPER & SUSTAINABILITY',
      items: [
        {
          id: 'team' as NavTab,
          label: 'Contact Me',
          icon: GraduationCap,
          color: 'text-amber-400',
        },
        {
          id: 'impact' as NavTab,
          label: 'Sustainability & Impact',
          icon: Globe,
          color: 'text-emerald-400',
          badge: 'SDG 11',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
        {
          id: 'responsible_ai' as NavTab,
          label: 'Responsible AI & SDG 11',
          icon: Scale,
          color: 'text-cyan-400',
          badge: 'Transparency',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        },
      ],
    },
  ];

  const govNavSections = [
    {
      title: 'BUS VISION & DRIVER SAFETY',
      items: [
        {
          id: 'driver_safety' as NavTab,
          label: 'Driver Safety & Drowsiness',
          icon: Eye,
          color: 'text-emerald-400',
          badge: 'Continuous CV',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
        {
          id: 'lane_transition' as NavTab,
          label: 'Lane Transition & Tips',
          icon: ArrowLeftRight,
          color: 'text-sky-400',
          badge: '2-Photo CV',
          badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        },
        {
          id: 'zig_zag_detection' as NavTab,
          label: 'Zig-Zag / Erratic Driving',
          icon: Activity,
          color: 'text-amber-400',
          badge: 'CV Trajectory',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
        {
          id: 'bus_inspection' as NavTab,
          label: 'Bus Infrastructure Detection',
          icon: Layers,
          color: 'text-cyan-400',
          badge: 'Interior CV',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        },
        {
          id: 'gov_alerts' as NavTab,
          label: 'Safety & Defect Alerts',
          icon: ShieldAlert,
          color: 'text-rose-400',
          badge: 'Gov Dispatch',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        },
      ],
    },
    {
      title: 'CORE PLATFORM',
      items: [
        {
          id: 'dashboard' as NavTab,
          label: 'Command Dashboard',
          icon: Layers,
          color: 'text-emerald-400',
          badge: 'Live',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
        {
          id: 'impact' as NavTab,
          label: 'Sustainability & Impact',
          icon: Globe,
          color: 'text-emerald-400',
          badge: 'SDG 11',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
        {
          id: 'citizen_reviews' as NavTab,
          label: 'Citizen Escalations',
          icon: ShieldCheck,
          color: 'text-indigo-400',
          badge: 'Review & BOQ',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        },
        {
          id: 'roads' as NavTab,
          label: 'Pothole Vision',
          icon: AlertOctagon,
          color: 'text-rose-400',
          badge: 'CV Dual-Stage',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        },
        {
          id: 'od_delays' as NavTab,
          label: 'OD Matrix & Delays',
          icon: Sparkles,
          color: 'text-sky-400',
          badge: 'Flow Intel',
          badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        },
        {
          id: 'lookup' as NavTab,
          label: 'Coordinate Lookup',
          icon: Compass,
          color: 'text-teal-400',
          badge: '2-Box GPS',
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        },
        {
          id: 'reports' as NavTab,
          label: 'Inspection Reports',
          icon: HardDrive,
          color: 'text-amber-400',
          badge: 'Archive',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
        {
          id: 'benchmark' as NavTab,
          label: 'CV Benchmark & Test',
          icon: Cpu,
          color: 'text-cyan-400',
          badge: '92.6% P',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        },
        {
          id: 'workorders' as NavTab,
          label: 'Work Orders',
          icon: Wrench,
          color: 'text-amber-400',
          badge: 'GVMC',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
        {
          id: 'responsible_ai' as NavTab,
          label: 'Responsible AI & SDG 11',
          icon: Scale,
          color: 'text-cyan-400',
          badge: 'Transparency',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        },
      ],
    },
    {
      title: 'OPERATIONS & GIS',
      items: [
        {
          id: 'map' as NavTab,
          label: 'GIS Defect Map',
          icon: MapPin,
          color: 'text-emerald-400',
        },
        {
          id: 'googlemaps' as NavTab,
          label: 'Google Maps AI',
          icon: Compass,
          color: 'text-cyan-400',
          badge: 'Agent',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        },
        {
          id: 'fleet' as NavTab,
          label: 'Campus Fleet',
          icon: Bus,
          color: 'text-indigo-400',
          badge: 'ANITS',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        },
        {
          id: 'traffic' as NavTab,
          label: 'Traffic & ANPR',
          icon: Car,
          color: 'text-sky-400',
        },
        {
          id: 'analytics' as NavTab,
          label: 'Urban Insights',
          icon: Sparkles,
          color: 'text-purple-400',
        },
      ],
    },
    {
      title: 'INGESTION & MEDIA',
      items: [
        {
          id: 'upload' as NavTab,
          label: 'Add Media / Ingest',
          icon: Plus,
          color: 'text-emerald-400',
        },
        {
          id: 'history' as NavTab,
          label: 'Media History',
          icon: HardDrive,
          color: 'text-slate-400',
        },
        {
          id: 'team' as NavTab,
          label: 'Contact Me',
          icon: GraduationCap,
          color: 'text-amber-400',
        },
      ],
    },
  ];

  const navSections = isCitizen ? citizenNavSections : govNavSections;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0F172A] border-r border-slate-800 transition-all duration-300 ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64 xl:w-72'}`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group overflow-hidden"
          >
            <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-950 font-black text-sm tracking-tighter shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
              SV
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="text-sm font-black tracking-tight text-white uppercase leading-none truncate">
                  SOLVOFIN <span className="text-emerald-500">AI</span>
                </h1>
                <p className="text-[9px] text-slate-400 font-mono tracking-tight mt-1 truncate">
                  POTHOLE & TRANSIT CV
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Status Indicator */}
        {!isCollapsed && (
          <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 text-[10px] font-mono flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>DB: <strong className="text-emerald-400">ACTIVE</strong></span>
            </div>
            <div className="text-slate-400">
              MODEL: <strong className="text-cyan-400">YOLO-DETR v4.2</strong>
            </div>
          </div>
        )}

        {/* Navigation Sections (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {!isCollapsed && (
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 block">
                  {section.title}
                </span>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-${item.id}-btn`}
                      onClick={() => handleNavClick(item.id)}
                      title={item.label}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-slate-800 text-white shadow-sm border border-slate-700 font-bold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      } ${isCollapsed ? 'justify-center px-2' : ''}`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? item.color : 'text-slate-400'}`} />
                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between truncate">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono border truncate ${
                                item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2 shrink-0">
          {/* AI Navigator Quick Button */}
          {onOpenNavigator && (
            <button
              id="sidebar-navigator-btn"
              onClick={onOpenNavigator}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 hover:border-emerald-500/50 transition-all ${
                isCollapsed ? 'justify-center px-2' : ''
              }`}
              title="Launch Solvofin AI Navigator (Ctrl+K)"
            >
              <Compass className="h-4 w-4 text-emerald-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span>AI Navigator</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                    ⌘K
                  </span>
                </div>
              )}
            </button>
          )}

          {/* AI Copilot Quick Button */}
          <button
            id="sidebar-copilot-btn"
            onClick={onOpenCopilot}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 text-emerald-300 border border-emerald-500/40 transition-all ${
              isCollapsed ? 'justify-center px-2' : ''
            }`}
            title="Launch Solvofin AI Copilot"
          >
            <Bot className="h-4 w-4 text-emerald-400 shrink-0 animate-pulse" />
            {!isCollapsed && <span>AI Copilot</span>}
          </button>

          {/* Export Suite Button */}
          <button
            id="sidebar-export-btn"
            onClick={onOpenExportModal}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors ${
              isCollapsed ? 'justify-center px-2' : ''
            }`}
            title="Export Municipal Reports & Data"
          >
            <Download className="h-4 w-4 text-blue-400 shrink-0" />
            {!isCollapsed && <span>Export Suite</span>}
          </button>

          {/* User Role Switcher & Login Portal */}
          {!isCollapsed && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>ROLE:</span>
                </div>
                <select
                  id="sidebar-role-select"
                  value={currentRole}
                  onChange={(e) => onRoleChange(e.target.value as any)}
                  aria-label="User Role"
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 font-mono font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="GOVERNMENT">GOVERNMENT</option>
                  <option value="CITIZEN">CITIZEN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="AUTHORITY">AUTHORITY</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>

              {onOpenLoginModal && (
                <button
                  type="button"
                  onClick={onOpenLoginModal}
                  className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Switch Account / Login</span>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
