import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { TrafficSectorView } from './components/TrafficSectorView';
import { RoadDefectsView } from './components/RoadDefectsView';
import { CVBenchmarkView } from './components/CVBenchmarkView';
import { WorkOrdersView } from './components/WorkOrdersView';
import { CampusFleetView } from './components/CampusFleetView';
import { StudentTeamView } from './components/StudentTeamView';
import { UrbanAnalyticsHub } from './components/UrbanAnalyticsHub';
import { CoordinateLookupView } from './components/CoordinateLookupView';
import { InspectionReportsArchiveView } from './components/InspectionReportsArchiveView';
import { UploadSection } from './components/UploadSection';
import { MediaHistory } from './components/MediaHistory';
import { MediaDetailView } from './components/MediaDetailView';
import { MapView } from './components/MapView';
import { GoogleMapsAgentView } from './components/GoogleMapsAgentView';
import { AnalysisProgressModal } from './components/AnalysisProgressModal';
import { ExportModal } from './components/ExportModal';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { CitizenPortalView } from './components/CitizenPortalView';
import { CitizenReviewView } from './components/CitizenReviewView';
import { TrafficODAndDelaysView } from './components/TrafficODAndDelaysView';
import { DriverSafetyView } from './components/DriverSafetyView';
import { InfrastructureInspectionView } from './components/InfrastructureInspectionView';
import { GovernmentAlertsHubView } from './components/GovernmentAlertsHubView';
import { LaneTransitionDetectionView } from './components/LaneTransitionDetectionView';
import { ZigZagDetectionView } from './components/ZigZagDetectionView';
import { ResponsibleAIView } from './components/ResponsibleAIView';
import { SustainabilityImpactView } from './components/SustainabilityImpactView';
import { AINavigatorModal } from './components/AINavigatorModal';
import { LoginPortal } from './components/LoginPortal';
import { MediaRecord, User } from './types';
import {
  Menu,
  Sparkles,
  Download,
  Bot,
  Database,
  Cpu,
  Layers,
  AlertOctagon,
  Wrench,
  Bus,
  Car,
  MapPin,
  Compass,
  HardDrive,
  Plus,
  GraduationCap,
  FileText,
  Crosshair,
  ShieldCheck,
  UserCheck,
  LogIn,
  Eye,
  ShieldAlert,
  ArrowLeftRight,
  Activity,
  Scale,
} from 'lucide-react';

const DEFAULT_GOV_USER: User = {
  id: 'USR-GOV-01',
  username: 'gov_admin',
  name: 'GVMC Municipal Commissioner',
  email: 'commissioner@gvmc.gov.in',
  role: 'GOVERNMENT',
  token: 'gov-auth-token-99881',
};

const DEFAULT_CITIZEN_USER: User = {
  id: 'USR-CIT-01',
  username: 'citizen_vizag',
  name: 'P. Sai Krishna',
  email: 'saikrishna.vizag@gmail.com',
  phone: '+91 98480 22341',
  role: 'CITIZEN',
  token: 'cit-auth-token-55412',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [userRole, setUserRole] = useState<'GOVERNMENT' | 'CITIZEN' | 'ADMIN' | 'AUTHORITY' | 'OPERATOR' | 'VIEWER'>('GOVERNMENT');
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_GOV_USER);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [activeAnalyzingMedia, setActiveAnalyzingMedia] = useState<MediaRecord | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [lookupLat, setLookupLat] = useState<number>(17.7345);
  const [lookupLng, setLookupLng] = useState<number>(83.3249);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle AI Navigator on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsNavigatorOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleLaneTransitionNav = () => {
      setSelectedMediaId(null);
      setActiveTab('lane_transition');
    };
    window.addEventListener('nav-lane-transition', handleLaneTransitionNav);
    return () => window.removeEventListener('nav-lane-transition', handleLaneTransitionNav);
  }, []);

  const handleRoleChange = (role: any) => {
    setUserRole(role);
    if (role === 'CITIZEN') {
      setCurrentUser(DEFAULT_CITIZEN_USER);
      setActiveTab('citizen_portal');
    } else {
      setCurrentUser(DEFAULT_GOV_USER);
      if (activeTab === 'citizen_portal') {
        setActiveTab('dashboard');
      }
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setUserRole(user.role);
    if (user.role === 'CITIZEN') {
      setActiveTab('citizen_portal');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleMediaUploadedAndAnalyze = (media: MediaRecord) => {
    setActiveAnalyzingMedia(media);
  };

  const handleViewAnalysis = (mediaId: string) => {
    setActiveAnalyzingMedia(null);
    setSelectedMediaId(mediaId);
  };

  const handleOpenCoordinateLookup = (lat: number, lng: number) => {
    setLookupLat(lat);
    setLookupLng(lng);
    setSelectedMediaId(null);
    setActiveTab('lookup');
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Central Transit & Road Command', icon: Layers, color: 'text-emerald-400' };
      case 'driver_safety':
        return { title: 'Driver Safety & Drowsiness Monitoring', icon: Eye, color: 'text-emerald-400' };
      case 'lane_transition':
        return { title: '2-Photo Vehicle Lane Transition Detection & Driver Coaching', icon: ArrowLeftRight, color: 'text-sky-400' };
      case 'zig_zag_detection':
        return { title: 'Potential Zig-Zag / Erratic Driving Detection', icon: Activity, color: 'text-amber-400' };
      case 'bus_inspection':
        return { title: 'Bus Infrastructure Detection', icon: Layers, color: 'text-cyan-400' };
      case 'gov_alerts':
        return { title: 'Government Transit Safety & Defect Command', icon: ShieldAlert, color: 'text-rose-400' };
      case 'citizen_portal':
        return { title: 'Citizen Road Defect Reporting & SLA Tracker', icon: ShieldCheck, color: 'text-emerald-400' };
      case 'citizen_reviews':
        return { title: 'Citizen Hazard Escalations & Work Order Dispatch', icon: ShieldCheck, color: 'text-indigo-400' };
      case 'roads':
        return { title: 'Pothole & Road Defect Vision', icon: AlertOctagon, color: 'text-rose-400' };
      case 'od_delays':
        return { title: 'Origin-Destination Flows & Route Delays', icon: Sparkles, color: 'text-sky-400' };
      case 'lookup':
        return { title: 'Coordinate Lookup & 2-Box GPS Pinpoint', icon: Crosshair, color: 'text-teal-400' };
      case 'reports':
        return { title: 'Stored Inspection Reports & Evidence Archive', icon: FileText, color: 'text-amber-400' };
      case 'benchmark':
        return { title: 'Computer Vision Benchmark & Model Suite', icon: Cpu, color: 'text-cyan-400' };
      case 'workorders':
        return { title: 'Municipal Work Orders (GVMC)', icon: Wrench, color: 'text-amber-400' };
      case 'fleet':
        return { title: 'ANITS Campus Transit Fleet', icon: Bus, color: 'text-indigo-400' };
      case 'traffic':
        return { title: 'Traffic Flow & ANPR Enforcement', icon: Car, color: 'text-sky-400' };
      case 'analytics':
        return { title: 'Urban Intelligence & Heatwaves', icon: Sparkles, color: 'text-purple-400' };
      case 'map':
        return { title: 'GIS Road Defect & Asset Map', icon: MapPin, color: 'text-emerald-400' };
      case 'googlemaps':
        return { title: 'Google Maps AI Navigation & Routing Agent', icon: Compass, color: 'text-cyan-400' };
      case 'upload':
        return { title: 'Ingest Video & Road Scans', icon: Plus, color: 'text-emerald-400' };
      case 'history':
        return { title: 'Media Scans & Inspection Archive', icon: HardDrive, color: 'text-slate-400' };
      case 'team':
        return { title: 'Contact Me — Developer Profile', icon: GraduationCap, color: 'text-amber-400' };
      case 'responsible_ai':
        return { title: 'Responsible AI & Sustainability Transparency', icon: Scale, color: 'text-cyan-400' };
      default:
        return { title: 'Solvofin Intelligence', icon: Layers, color: 'text-emerald-400' };
    }
  };

  const pageInfo = getPageTitle();
  const PageIcon = pageInfo.icon;

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-300 font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col justify-between">
      <div className="flex flex-1 min-h-screen">
        {/* Left Side Navigation Sidebar */}
        <Sidebar
          currentRole={userRole}
          onRoleChange={handleRoleChange}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setSelectedMediaId(null);
            setActiveTab(tab);
          }}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenNavigator={() => setIsNavigatorOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area (Docked to right of sidebar) */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64 xl:pl-72 transition-all duration-300">
          {/* Top Header Bar for Breadcrumb & Actions */}
          <header className="sticky top-0 z-30 bg-[#0F172A]/95 backdrop-blur border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                aria-label="Open Navigation Menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2.5 truncate">
                <PageIcon className={`h-5 w-5 shrink-0 ${pageInfo.color}`} />
                <div className="truncate">
                  <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight truncate">
                    {pageInfo.title}
                  </h2>
                  <span className="text-[10px] font-mono text-slate-400 hidden sm:inline-block">
                    {userRole === 'CITIZEN'
                      ? `LOGGED AS CITIZEN: ${currentUser.name || currentUser.username}`
                      : `SOLVOFIN COMMAND • ROLE: ${userRole}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions on Top Bar */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Global AI Navigator / Search Button */}
              <button
                id="global-ai-navigator-btn"
                onClick={() => setIsNavigatorOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-emerald-500/50 transition-all shadow-sm"
                title="Ask Solvofin / Controlled AI Navigator (Ctrl+K)"
              >
                <Compass className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden md:inline text-slate-300">Ask Solvofin...</span>
                <span className="hidden xl:inline px-1 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
                  Ctrl+K
                </span>
                <span className="md:hidden text-emerald-400 font-bold">Search</span>
              </button>

              {/* Account / Role Pill with Switch Button */}
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
                title="Switch between Government and Citizen accounts"
              >
                <LogIn className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden sm:inline">
                  {userRole === 'CITIZEN' ? 'Citizen Portal' : 'Gov Portal'}
                </span>
                <span className="text-[10px] text-slate-400 underline ml-1">Switch</span>
              </button>

              {userRole !== 'CITIZEN' && (
                <button
                  onClick={() => setIsCopilotOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all shadow-sm"
                >
                  <Bot className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">AI Copilot</span>
                </button>
              )}

              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-blue-400" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </header>

          {/* Main Body Content */}
          <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
            {selectedMediaId ? (
              <MediaDetailView
                mediaId={selectedMediaId}
                onBack={() => setSelectedMediaId(null)}
                userRole={userRole}
              />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardOverview
                    onNavigate={(tab) => setActiveTab(tab as any)}
                    onSelectMedia={(id) => setSelectedMediaId(id)}
                  />
                )}

                {activeTab === 'impact' && (
                  <SustainabilityImpactView
                    currentRole={userRole}
                    onNavigateTab={(tab) => setActiveTab(tab as any)}
                  />
                )}

                {activeTab === 'driver_safety' && (
                  <DriverSafetyView
                    onNavigateToGovAlerts={() => setActiveTab('gov_alerts')}
                  />
                )}

                {activeTab === 'lane_transition' && (
                  <LaneTransitionDetectionView
                    onNavigateToDriverSafety={() => setActiveTab('driver_safety')}
                    onNavigateToGovAlerts={() => setActiveTab('gov_alerts')}
                  />
                )}

                {activeTab === 'zig_zag_detection' && (
                  <ZigZagDetectionView
                    onNavigateToGovAlerts={() => setActiveTab('gov_alerts')}
                    onOpenCopilot={() => setIsCopilotOpen(true)}
                    onOpenExportModal={() => setIsExportModalOpen(true)}
                    onSwitchPortal={() => handleRoleChange(userRole === 'GOVERNMENT' ? 'CITIZEN' : 'GOVERNMENT')}
                  />
                )}

                {activeTab === 'bus_inspection' && (
                  <InfrastructureInspectionView
                    onNavigateToGovAlerts={() => setActiveTab('gov_alerts')}
                    currentUser={currentUser}
                  />
                )}

                {activeTab === 'gov_alerts' && (
                  <GovernmentAlertsHubView
                    onNavigateToDriverSafety={() => setActiveTab('driver_safety')}
                    onNavigateToBusInfra={() => setActiveTab('bus_inspection')}
                    onNavigateToZigZag={() => setActiveTab('zig_zag_detection')}
                  />
                )}

                {activeTab === 'citizen_portal' && (
                  <CitizenPortalView
                    currentUser={currentUser}
                    onOpenGISMap={() => setActiveTab('map')}
                  />
                )}

                {activeTab === 'citizen_reviews' && (
                  <CitizenReviewView
                    onOpenWorkOrders={() => setActiveTab('workorders')}
                    onOpenGISMap={() => setActiveTab('map')}
                  />
                )}

                {activeTab === 'od_delays' && (
                  <TrafficODAndDelaysView />
                )}

                {activeTab === 'roads' && (
                  <RoadDefectsView
                    onSelectMedia={(id) => setSelectedMediaId(id)}
                    onNavigateToMap={() => setActiveTab('map')}
                    onNavigateToUpload={() => setActiveTab('upload')}
                    onNavigateToBenchmark={() => setActiveTab('benchmark')}
                    userRole={userRole}
                  />
                )}

                {activeTab === 'lookup' && (
                  <CoordinateLookupView
                    initialLat={lookupLat}
                    initialLng={lookupLng}
                    onSelectMedia={(id) => setSelectedMediaId(id)}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                )}

                {activeTab === 'reports' && (
                  <InspectionReportsArchiveView
                    onSelectMedia={(id) => setSelectedMediaId(id)}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                )}

                {activeTab === 'benchmark' && (
                  <CVBenchmarkView />
                )}

                {activeTab === 'googlemaps' && (
                  <GoogleMapsAgentView />
                )}

                {activeTab === 'workorders' && (
                  <WorkOrdersView
                    currentRole={userRole}
                    onNavigateToMap={() => setActiveTab('map')}
                  />
                )}

                {activeTab === 'fleet' && (
                  <CampusFleetView
                    currentRole={userRole}
                    onNavigateToMap={() => setActiveTab('map')}
                  />
                )}

                {activeTab === 'traffic' && (
                  <TrafficSectorView
                    onSelectMedia={(id) => setSelectedMediaId(id)}
                    onNavigateToMap={() => setActiveTab('map')}
                    onNavigateToUpload={() => setActiveTab('upload')}
                    userRole={userRole}
                  />
                )}

                {activeTab === 'analytics' && (
                  <UrbanAnalyticsHub
                    onSelectMedia={(id) => setSelectedMediaId(id)}
                    onNavigateToMap={() => setActiveTab('map')}
                    userRole={userRole}
                  />
                )}

                {activeTab === 'team' && (
                  <StudentTeamView />
                )}

                {activeTab === 'responsible_ai' && (
                  <ResponsibleAIView
                    onNavigateToBusInfra={() => setActiveTab('bus_inspection')}
                    onNavigateToCitizen={() => setActiveTab('citizen_portal')}
                    onNavigateToImpact={() => setActiveTab('impact')}
                  />
                )}

                {activeTab === 'upload' && (
                  <UploadSection onMediaUploadedAndAnalyze={handleMediaUploadedAndAnalyze} />
                )}

                {activeTab === 'history' && (
                  <MediaHistory
                    onSelectMedia={(id) => setSelectedMediaId(id)}
                    onOpenUpload={() => setActiveTab('upload')}
                    userRole={userRole}
                  />
                )}

                {activeTab === 'map' && (
                  <MapView onSelectMedia={(id) => setSelectedMediaId(id)} />
                )}
              </>
            )}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-800/80 bg-[#0A0D14] py-3 px-4 sm:px-6 text-[11px] font-mono text-slate-500 shrink-0">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300">SOLVOFIN AI PLATFORM</span>
                <span>•</span>
                <span>Visakhapatnam & NH-16 Autonomous Roadway Vision</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMediaId(null);
                    setActiveTab('responsible_ai');
                  }}
                  className="text-cyan-400/90 hover:text-cyan-300 underline transition-colors cursor-pointer"
                >
                  Responsible AI & SDG 11
                </button>
                <span>•</span>
                <span className="text-emerald-400">Database: Active</span>
                <span>•</span>
                <span className="text-cyan-400">CV Pipeline: Dual-Stage v4.2</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Real-time Analysis Progress Modal */}
      {activeAnalyzingMedia && (
        <AnalysisProgressModal
          media={activeAnalyzingMedia}
          onClose={() => setActiveAnalyzingMedia(null)}
          onViewAnalysis={handleViewAnalysis}
        />
      )}

      {/* Export Suite Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* AI Copilot Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      {/* Controlled AI Navigator & Global Search Modal */}
      <AINavigatorModal
        isOpen={isNavigatorOpen}
        onClose={() => setIsNavigatorOpen(false)}
        userRole={userRole}
        onNavigateTab={(tab) => {
          setSelectedMediaId(null);
          setActiveTab(tab as any);
        }}
      />

      {/* Government & Citizen Login / Role Portal */}
      <LoginPortal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialRole={userRole === 'CITIZEN' ? 'CITIZEN' : 'GOVERNMENT'}
      />
    </div>
  );
}
