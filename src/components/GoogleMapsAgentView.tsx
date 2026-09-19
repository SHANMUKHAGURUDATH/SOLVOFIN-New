import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Search,
  Sparkles,
  Bot,
  Car,
  Bus,
  Bike,
  Footprints,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Send,
  Loader2,
  Clock,
  Gauge,
  Layers,
  CheckCircle2,
  Phone,
  Star,
  RefreshCw,
  Info,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { GoogleMapsPlace, GoogleMapsRoute, MapsAgentQueryResponse, RoadDefect } from '../types';

// Custom Leaflet Icons
const createCustomIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 11px;
        border: 2px solid white;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
      ">
        ${label}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const originIcon = createCustomIcon('#10b981', 'A');
const destIcon = createCustomIcon('#06b6d4', 'B');
const placeIcon = createCustomIcon('#8b5cf6', '📍');
const hazardIcon = createCustomIcon('#ef4444', '⚠️');

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  places?: GoogleMapsPlace[];
  route?: GoogleMapsRoute;
  grounding_chunks?: Array<{ title?: string; uri?: string; snippet?: string }>;
  hazards?: Array<{ type: string; severity: string; distance_meters: number; recommended_action: string }>;
}

export const GoogleMapsAgentView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'agent' | 'routes' | 'places'>('agent');
  
  // AI Agent state
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      sender: 'agent',
      text: `### 🛰️ SOLVOFIN AI • Google Maps Platform Agent\n\nI am connected to real-time **Google Maps Places, Routes, and Directions** telemetry along with the Greater Visakhapatnam Municipal Corporation (GVMC) highway database.\n\n**Ask me anything about:**\n- **Places:** *"Find asphalt batching plants & municipal depots near Tagarapuvalasa"*\n- **Routes & Directions:** *"Best driving route from ANITS Campus to Visakhapatnam Railway Station"*\n- **Municipal Detours:** *"Find detour around NH-16 pothole hazard at chainage 17.7345"*\n- **Transit Telemetry:** *"What is the route & ETA for ANITS Campus Bus Route 14?"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Route calculation state
  const [origin, setOrigin] = useState('ANITS Autonomous Campus, Sangivalasa');
  const [destination, setDestination] = useState('Visakhapatnam Junction Railway Station');
  const [travelMode, setTravelMode] = useState<'DRIVE' | 'TRANSIT' | 'TWO_WHEELER' | 'WALK'>('DRIVE');
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [calculatedRoute, setCalculatedRoute] = useState<GoogleMapsRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Place search state
  const [placeQuery, setPlaceQuery] = useState('Asphalt batching plant & transit depot');
  const [placesList, setPlacesList] = useState<GoogleMapsPlace[]>([]);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<GoogleMapsPlace | null>(null);

  // Quick prompt suggestions
  const SUGGESTED_PROMPTS = [
    'Route from ANITS Campus to Visakhapatnam Airport with traffic',
    'Find emergency trauma hospitals near Sangivalasa NH-16',
    'Locate asphalt batching plants & municipal depots in Vizag',
    'Directions from RK Beach to Bheemunipatnam via Beach Road',
    'Check detour for Campus Bus around Tagarapuvalasa pothole',
  ];

  // Initial load
  useEffect(() => {
    handleSearchPlaces('ANITS Sangivalasa transit');
    handleComputeRoute('ANITS Campus', 'Visakhapatnam Junction', 'DRIVE');
  }, []);

  const handleSendAgentQuery = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/maps/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          user_location: { lat: 17.9221, lng: 83.4243 },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: MapsAgentQueryResponse = await res.json();

      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        places: data.places,
        route: data.route,
        grounding_chunks: data.grounding_chunks,
        hazards: data.hazards_identified,
      };

      setMessages((prev) => [...prev, agentMsg]);

      // If a route was generated in response, sync to route view
      if (data.route) {
        setCalculatedRoute(data.route);
        setOrigin(data.route.origin_name);
        setDestination(data.route.destination_name);
      }
      if (data.places && data.places.length > 0) {
        setPlacesList(data.places);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'agent',
          text: `⚠️ **Error connecting to Google Maps Agent:** ${err.message || 'Service unreachable. Please retry.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleComputeRoute = async (orig = origin, dest = destination, mode = travelMode) => {
    if (!orig || !dest) return;
    setRouteLoading(true);
    try {
      const res = await fetch('/api/maps/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: orig,
          destination: dest,
          travel_mode: mode,
          avoid_tolls: avoidTolls,
        }),
      });
      if (!res.ok) throw new Error('Failed to compute route');
      const data: GoogleMapsRoute = await res.json();
      setCalculatedRoute(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRouteLoading(false);
    }
  };

  const handleSearchPlaces = async (query = placeQuery) => {
    if (!query) return;
    setPlaceLoading(true);
    try {
      const res = await fetch(`/api/maps/places?q=${encodeURIComponent(query)}&lat=17.9221&lng=83.4243`);
      if (!res.ok) throw new Error('Failed to fetch places');
      const data: GoogleMapsPlace[] = await res.json();
      setPlacesList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPlaceLoading(false);
    }
  };

  // Map center determination
  const mapCenter: [number, number] = calculatedRoute
    ? [
        (calculatedRoute.origin_coords.lat + calculatedRoute.destination_coords.lat) / 2,
        (calculatedRoute.origin_coords.lng + calculatedRoute.destination_coords.lng) / 2,
      ]
    : [17.8500, 83.3500];

  return (
    <div id="google-maps-agent-view" className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">Google Maps Platform & AI Agent</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                LIVE GROUNDING
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time places search, turn-by-turn directions, traffic telemetry & municipal hazard overlay
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 self-start md:self-auto">
          <button
            id="tab-ai-agent"
            onClick={() => setActiveTab('agent')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'agent'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Maps Agent</span>
          </button>
          <button
            id="tab-routes"
            onClick={() => setActiveTab('routes')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'routes'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Routes & Directions</span>
          </button>
          <button
            id="tab-places"
            onClick={() => setActiveTab('places')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'places'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Place Explorer</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Panel (Active Tab UI) & Right Panel (Interactive Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols or 6 cols depending on screen) */}
        <div className="lg:col-span-6 space-y-4">
          {/* TAB 1: AI MAPS AGENT */}
          {activeTab === 'agent' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[650px] shadow-lg overflow-hidden">
              {/* Agent Header */}
              <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-200">Gemini 3.7 Maps Grounded Intelligence</span>
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Grounded in Google Maps
                </span>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[92%] rounded-xl p-3.5 ${
                        m.sender === 'user'
                          ? 'bg-cyan-600 text-white font-medium'
                          : 'bg-slate-950 border border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="markdown-body text-slate-200 prose-invert max-w-none text-xs leading-relaxed space-y-2">
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>

                      {/* Grounding Attribution Links */}
                      {m.grounding_chunks && m.grounding_chunks.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap gap-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block w-full">
                            Google Maps Sources:
                          </span>
                          {m.grounding_chunks.map((g, idx) => (
                            <a
                              key={idx}
                              href={g.uri || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-colors"
                            >
                              <MapPin className="w-2.5 h-2.5" />
                              <span>{g.title || 'Google Maps Location'}</span>
                              <ExternalLink className="w-2.5 h-2.5 ml-0.5 text-slate-400" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Route Card Attachment if available */}
                      {m.route && (
                        <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-700 space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-cyan-400">
                            <span className="flex items-center gap-1">
                              <Navigation className="w-3.5 h-3.5" />
                              {m.route.distance_text} • {m.route.duration_text}
                            </span>
                            <a
                              href={m.route.google_maps_nav_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-medium inline-flex items-center gap-1"
                            >
                              <span>Navigate</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            From: {m.route.origin_name} ➔ {m.route.destination_name}
                          </p>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl w-fit text-slate-300">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span className="text-xs">Querying Google Maps real-time platform & grounding...</span>
                  </div>
                )}
              </div>

              {/* Quick Suggestions */}
              <div className="p-2.5 bg-slate-950/40 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendAgentQuery(prompt)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-full border border-slate-700/80 whitespace-nowrap transition-colors flex-shrink-0"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Input Field */}
              <div className="p-3 border-t border-slate-800 bg-slate-950">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendAgentQuery();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    id="maps-agent-input"
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Ask about places, routes, directions, or municipal hazard detours..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    id="maps-agent-submit"
                    type="submit"
                    disabled={loading || !inputQuery.trim()}
                    className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: ROUTE & DIRECTIONS STUDIO */}
          {activeTab === 'routes' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  Route & Directions Calculator
                </h2>
                <span className="text-[11px] text-slate-400">Routes API (New) Telemetry</span>
              </div>

              {/* Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Origin (Point A)</label>
                  <div className="relative">
                    <input
                      id="route-origin-input"
                      type="text"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder="e.g. ANITS Campus, Sangivalasa"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                    <div className="absolute left-2.5 top-2.5 w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center text-[9px] text-white font-bold">
                      A
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Destination (Point B)</label>
                  <div className="relative">
                    <input
                      id="route-dest-input"
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Visakhapatnam Junction Railway Station"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                    <div className="absolute left-2.5 top-2.5 w-3 h-3 rounded-full bg-cyan-500 flex items-center justify-center text-[9px] text-white font-bold">
                      B
                    </div>
                  </div>
                </div>

                {/* Travel Mode Selector */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Travel Mode</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { mode: 'DRIVE', label: 'Car/Taxi', icon: Car },
                      { mode: 'TRANSIT', label: 'Transit Bus', icon: Bus },
                      { mode: 'TWO_WHEELER', label: '2-Wheeler', icon: Bike },
                      { mode: 'WALK', label: 'Walking', icon: Footprints },
                    ].map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.mode}
                          type="button"
                          onClick={() => {
                            setTravelMode(m.mode as any);
                            handleComputeRoute(origin, destination, m.mode as any);
                          }}
                          className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                            travelMode === m.mode
                              ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px] font-semibold">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toll Checkbox & Compute Button */}
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={avoidTolls}
                      onChange={(e) => {
                        setAvoidTolls(e.target.checked);
                      }}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0"
                    />
                    <span>Avoid Toll Plazas</span>
                  </label>

                  <button
                    id="btn-compute-route"
                    onClick={() => handleComputeRoute()}
                    disabled={routeLoading}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {routeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                    <span>Compute Route</span>
                  </button>
                </div>
              </div>

              {/* Route Results Summary */}
              {calculatedRoute && (
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Distance</span>
                      <span className="text-base font-bold text-slate-100">{calculatedRoute.distance_text}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Est. Duration</span>
                      <span className="text-base font-bold text-cyan-400">{calculatedRoute.duration_text}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">In Traffic</span>
                      <span className="text-base font-bold text-amber-400">{calculatedRoute.duration_in_traffic_minutes} mins</span>
                    </div>
                  </div>

                  {/* Hazard Warning if any */}
                  {calculatedRoute.hazards_along_route && calculatedRoute.hazards_along_route.length > 0 && (
                    <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-amber-300 block">
                          {calculatedRoute.hazards_along_route.length} Pothole/Surface Hazard(s) on Route
                        </span>
                        <ul className="text-[11px] text-amber-200/80 mt-1 list-disc pl-4 space-y-0.5">
                          {calculatedRoute.hazards_along_route.map((h, idx) => (
                            <li key={idx}>{h.warning_message}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Step by Step list */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    <span className="text-[11px] font-semibold text-slate-400 block">Turn-by-Turn Guidance:</span>
                    {calculatedRoute.steps.map((step, idx) => (
                      <div key={idx} className="p-2 bg-slate-950 rounded border border-slate-800 text-xs flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-slate-200 font-medium">{step.instruction}</p>
                          <span className="text-[10px] text-slate-400">{step.distance_text} • {step.duration_text}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* External Google Maps Button */}
                  <a
                    id="btn-open-google-maps"
                    href={calculatedRoute.google_maps_nav_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Launch Full Google Maps Navigation</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PLACE EXPLORER */}
          {activeTab === 'places' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  Real-Time Place & Facility Search
                </h2>
                <span className="text-[11px] text-slate-400">Places API (New)</span>
              </div>

              {/* Search Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchPlaces();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    id="place-search-input"
                    type="text"
                    value={placeQuery}
                    onChange={(e) => setPlaceQuery(e.target.value)}
                    placeholder="Search hospitals, asphalt depots, bus terminals, EV charging..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={placeLoading}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {placeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search</span>
                </button>
              </form>

              {/* Places List */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {placesList.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlace(p)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedPlace?.id === p.id
                        ? 'bg-purple-950/30 border-purple-500/60'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-bold text-slate-100">{p.name}</h3>
                      {p.rating && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {p.rating}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{p.formatted_address}</p>
                    {p.editorial_summary && (
                      <p className="text-[11px] text-slate-300 mt-1.5 bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
                        {p.editorial_summary}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className={`px-1.5 py-0.5 rounded ${p.open_now ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {p.open_now ? 'Open Now' : 'Closed'}
                        </span>
                        {p.phone_number && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Phone className="w-2.5 h-2.5" />
                            {p.phone_number}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDestination(p.name);
                            setActiveTab('routes');
                            handleComputeRoute(origin, p.name);
                          }}
                          className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                        >
                          <span>Route Here</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <a
                          href={p.google_maps_uri}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-purple-400 hover:underline flex items-center gap-0.5"
                        >
                          <span>Maps</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Leaflet GIS / Google Maps Overlay */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col h-[650px] overflow-hidden">
            {/* Map Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-100">Live Spatial Route & Grounding View</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  Origin (A)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span>
                  Destination (B)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  Pothole Hazard
                </span>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="flex-1 rounded-lg overflow-hidden relative border border-slate-800 mt-3 z-0">
              <MapContainer
                center={mapCenter}
                zoom={11}
                scrollWheelZoom={true}
                className="w-full h-full"
                style={{ background: '#0f172a' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; Google Maps Data Grounding'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {/* Route Polyline */}
                {calculatedRoute && calculatedRoute.polyline_points.length > 0 && (
                  <>
                    <Polyline
                      positions={calculatedRoute.polyline_points}
                      color="#06b6d4"
                      weight={5}
                      opacity={0.85}
                    />

                    {/* Origin Marker */}
                    <Marker
                      position={[calculatedRoute.origin_coords.lat, calculatedRoute.origin_coords.lng]}
                      icon={originIcon}
                    >
                      <Popup className="text-xs">
                        <div className="p-1">
                          <strong className="text-emerald-700">Origin:</strong>
                          <p>{calculatedRoute.origin_name}</p>
                          <p className="text-slate-500 text-[10px] mt-0.5">{calculatedRoute.origin_coords.address}</p>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Destination Marker */}
                    <Marker
                      position={[calculatedRoute.destination_coords.lat, calculatedRoute.destination_coords.lng]}
                      icon={destIcon}
                    >
                      <Popup className="text-xs">
                        <div className="p-1">
                          <strong className="text-cyan-700">Destination:</strong>
                          <p>{calculatedRoute.destination_name}</p>
                          <p className="text-slate-500 text-[10px] mt-0.5">{calculatedRoute.destination_coords.address}</p>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Hazard Markers along route */}
                    {calculatedRoute.hazards_along_route?.map((hazard, idx) => (
                      <Marker
                        key={idx}
                        position={[hazard.location.lat, hazard.location.lng]}
                        icon={hazardIcon}
                      >
                        <Popup className="text-xs">
                          <div className="p-1">
                            <strong className="text-rose-700">⚠️ Road Defect Hazard</strong>
                            <p className="text-slate-800 font-semibold">{hazard.hazard_type}</p>
                            <p className="text-slate-600 text-[10px]">{hazard.warning_message}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </>
                )}

                {/* Place Markers if in places tab */}
                {activeTab === 'places' &&
                  placesList.map((p) => (
                    <Marker
                      key={p.id}
                      position={[p.location.lat, p.location.lng]}
                      icon={placeIcon}
                    >
                      <Popup className="text-xs">
                        <div className="p-1 space-y-1">
                          <strong className="text-purple-800">{p.name}</strong>
                          <p className="text-slate-600 text-[10px]">{p.formatted_address}</p>
                          <a
                            href={p.google_maps_uri}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-600 font-semibold text-[10px] flex items-center gap-1"
                          >
                            <span>Open on Google Maps</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            </div>

            {/* Bottom Status bar */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Center: 17.9221°N, 83.4243°E (Sangivalasa Corridor)</span>
              <span>Google Maps Grounding Attribution Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
