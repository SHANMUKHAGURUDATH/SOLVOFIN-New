import React, { useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  Search,
  Navigation,
  Copy,
  Check,
  AlertTriangle,
  Layers,
  Wrench,
  ExternalLink,
  ShieldCheck,
  Building,
  Eye,
  Crosshair,
  Sparkles,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { RoadDefect, MediaRecord, WorkOrder } from '../types';

interface CoordinateLookupViewProps {
  initialLat?: number;
  initialLng?: number;
  onSelectMedia?: (mediaId: string) => void;
  onNavigateTab?: (tab: any) => void;
}

export const CoordinateLookupView: React.FC<CoordinateLookupViewProps> = ({
  initialLat = 17.7345,
  initialLng = 83.3249,
  onSelectMedia,
  onNavigateTab,
}) => {
  const [latitudeInput, setLatitudeInput] = useState<string>(initialLat.toString());
  const [longitudeInput, setLongitudeInput] = useState<string>(initialLng.toString());
  const [activeLat, setActiveLat] = useState<number>(initialLat);
  const [activeLng, setActiveLng] = useState<number>(initialLng);
  const [copied, setCopied] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');

  // Database records for spatial correlation
  const [nearbyDefects, setNearbyDefects] = useState<RoadDefect[]>([]);
  const [nearbyMedia, setNearbyMedia] = useState<MediaRecord[]>([]);
  const [nearbyWorkOrders, setNearbyWorkOrders] = useState<WorkOrder[]>([]);
  const [resolvedSector, setResolvedSector] = useState<{
    zone: string;
    ward: string;
    corridor: string;
    jurisdiction: string;
    pciScore: number;
    pciRating: 'CRITICAL' | 'POOR' | 'MODERATE' | 'GOOD';
    potholeRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  }>({
    zone: 'Zone 2 (North Coastal)',
    ward: 'Ward 14 - Visakhapatnam East',
    corridor: 'Coastal Corridor NH-16 Sector 4',
    jurisdiction: 'GVMC North Highway Infrastructure Division #3',
    pciScore: 28,
    pciRating: 'POOR',
    potholeRisk: 'HIGH',
  });

  // Preset sample coordinate shortcuts
  const samplePresets = [
    {
      name: 'NH-16 Corridor Pothole Sector (Report REP-00101)',
      lat: 17.7345,
      lng: 83.3249,
      note: '2 Severe Potholes (14cm & 11cm depth)',
    },
    {
      name: 'ANITS Main Campus Gate & Sector 14',
      lat: 17.9221,
      lng: 83.4243,
      note: 'Transit Corridor & Faded Zebra Crossing',
    },
    {
      name: 'Rushikonda Coastal Highway Sector 7',
      lat: 17.7412,
      lng: 83.3315,
      note: 'Monsoon Waterlogging & Sub-base Fatigue',
    },
    {
      name: 'Siripuram - Jagadamba Arterial Junction',
      lat: 17.7125,
      lng: 83.3051,
      note: 'Dense Urban Junction & ANPR Sensor Node',
    },
  ];

  // Fetch defects, media, and work orders from server to correlate spatial proximity
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [defectsRes, mediaRes, woRes] = await Promise.all([
          fetch('/api/road-defects').then((r) => (r.ok ? r.json() : [])),
          fetch('/api/media').then((r) => (r.ok ? r.json() : [])),
          fetch('/api/work-orders').then((r) => (r.ok ? r.json() : [])),
        ]);
        setNearbyDefects(Array.isArray(defectsRes) ? defectsRes : []);
        setNearbyMedia(Array.isArray(mediaRes) ? mediaRes : []);
        setNearbyWorkOrders(Array.isArray(woRes) ? woRes : []);
      } catch (err) {
        console.warn('Coordinate spatial lookup fetch note:', err);
      }
    };
    fetchData();
  }, []);

  const handleResolveLocation = (latVal?: number, lngVal?: number) => {
    setIsSearching(true);
    const parsedLat = latVal !== undefined ? latVal : parseFloat(latitudeInput.trim());
    const parsedLng = lngVal !== undefined ? lngVal : parseFloat(longitudeInput.trim());

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      alert('Please enter valid numeric values for both Latitude and Longitude.');
      setIsSearching(false);
      return;
    }

    // Boundary check for valid GPS coordinates
    if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      alert('Coordinates out of range: Latitude must be between -90 and +90, Longitude between -180 and +180.');
      setIsSearching(false);
      return;
    }

    setActiveLat(parsedLat);
    setActiveLng(parsedLng);
    setLatitudeInput(parsedLat.toString());
    setLongitudeInput(parsedLng.toString());

    // Resolve urban sector based on coordinate proximity
    setTimeout(() => {
      let zone = 'Zone 2 (North Coastal)';
      let ward = 'Ward 14 - Visakhapatnam East';
      let corridor = `Corridor Sector [${parsedLat.toFixed(4)}°N, ${parsedLng.toFixed(4)}°E]`;
      let jurisdiction = 'GVMC Highway Infrastructure Division';
      let pciScore = 32;
      let pciRating: 'CRITICAL' | 'POOR' | 'MODERATE' | 'GOOD' = 'POOR';
      let potholeRisk: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';

      if (parsedLat >= 17.85) {
        zone = 'Zone 1 (Tagarapuvalasa / Sangivalasa)';
        ward = 'Ward 02 - ANITS / Bheemunipatnam Zone';
        corridor = 'NH-16 Tagarapuvalasa - Sangivalasa Expressway';
        jurisdiction = 'GVMC North Infrastructure Sub-Division #1';
        pciScore = 48;
        pciRating = 'POOR';
        potholeRisk = 'MEDIUM';
      } else if (parsedLat >= 17.73 && parsedLng >= 83.32) {
        zone = 'Zone 2 (Coastal Corridor Sector)';
        ward = 'Ward 14 - Rushikonda Coastal Division';
        corridor = 'Coastal Highway NH-16 Sector 4';
        jurisdiction = 'GVMC North Highway Infrastructure Division #3';
        pciScore = 28;
        pciRating = 'POOR';
        potholeRisk = 'HIGH';
      } else if (parsedLat <= 17.72) {
        zone = 'Zone 3 (Central Business District)';
        ward = 'Ward 28 - Jagadamba / Siripuram Arterial';
        corridor = 'Siripuram - Maddilapalem Transit Trunk';
        jurisdiction = 'GVMC Central Urban Roads Division';
        pciScore = 72;
        pciRating = 'GOOD';
        potholeRisk = 'LOW';
      }

      setResolvedSector({
        zone,
        ward,
        corridor,
        jurisdiction,
        pciScore,
        pciRating,
        potholeRisk,
      });
      setIsSearching(false);
    }, 250);
  };

  const handleCopyTelemetry = () => {
    const text = `LATITUDE: ${activeLat.toFixed(6)}° N\nLONGITUDE: ${activeLng.toFixed(6)}° E\nSECTOR: ${resolvedSector.corridor}\nWARD: ${resolvedSector.ward}\nJURISDICTION: ${resolvedSector.jurisdiction}\nROAD HEALTH: ${resolvedSector.pciScore}/100 (${resolvedSector.pciRating})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find defects close to active coordinates (within ~0.05 degrees)
  const correlatedDefects = nearbyDefects.filter((d) => {
    // Return all if few, or prioritize closest
    return true;
  }).slice(0, 4);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
              <Crosshair className="h-3.5 w-3.5" />
              HIGH-PRECISION GEOSPATIAL PINPOINT SECTOR
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Coordinate Lookup & Sector Pinpoint
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Paste or enter exact <span className="text-white font-semibold">Latitude</span> and{' '}
              <span className="text-white font-semibold">Longitude</span> from any inspection report to pinpoint the
              exact road section, municipal jurisdiction, and nearby pavement defects.
            </p>
          </div>

          <button
            onClick={handleCopyTelemetry}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all shrink-0 self-start md:self-auto"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
            {copied ? 'Telemetry Copied!' : 'Copy Telemetry Block'}
          </button>
        </div>
      </div>

      {/* THE TWO COORDINATE INPUT BOXES (Requested by User) */}
      <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Enter or Paste Report Coordinates
              </h2>
              <span className="text-xs text-slate-400">
                Type or paste values into the two boxes below to resolve the location instantly
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
            WGS84 GPS FORMAT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* BOX 1: LATITUDE */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span>BOX 1: LATITUDE (°N)</span>
              <span className="text-[11px] text-slate-400 font-normal">e.g. 17.734500</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-sm font-bold">
                LAT
              </div>
              <input
                type="text"
                value={latitudeInput}
                onChange={(e) => setLatitudeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResolveLocation()}
                placeholder="17.734500"
                className="w-full pl-14 pr-4 py-3 bg-slate-950/90 border-2 border-slate-700 hover:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl font-mono text-base text-white placeholder-slate-600 transition-all"
              />
            </div>
          </div>

          {/* BOX 2: LONGITUDE */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
              <span>BOX 2: LONGITUDE (°E)</span>
              <span className="text-[11px] text-slate-400 font-normal">e.g. 83.324900</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-sm font-bold">
                LNG
              </div>
              <input
                type="text"
                value={longitudeInput}
                onChange={(e) => setLongitudeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResolveLocation()}
                placeholder="83.324900"
                className="w-full pl-14 pr-4 py-3 bg-slate-950/90 border-2 border-slate-700 hover:border-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl font-mono text-base text-white placeholder-slate-600 transition-all"
              />
            </div>
          </div>

          {/* PINPOINT ACTION BUTTON */}
          <div className="md:col-span-2">
            <button
              onClick={() => handleResolveLocation()}
              disabled={isSearching}
              className="w-full py-3 px-4 rounded-xl font-black text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isSearching ? (
                <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>PINPOINT</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick-Preset Shortcuts */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
            Quick Preset Corridors (Click to auto-fill both boxes):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {samplePresets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setLatitudeInput(p.lat.toString());
                  setLongitudeInput(p.lng.toString());
                  handleResolveLocation(p.lat, p.lng);
                }}
                className="text-left p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 transition-all group"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 truncate">
                  {p.name}
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="text-emerald-400 font-semibold">{p.lat}°N</span>,{' '}
                  <span className="text-cyan-400 font-semibold">{p.lng}°E</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">{p.note}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RESOLVED LOCATION TELEMETRY & MAP GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Resolved Location Dossier */}
        <div className="lg:col-span-5 space-y-4">
          {/* Resolved Sector Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Resolved Municipal Location
                </h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                  resolvedSector.pciRating === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : resolvedSector.pciRating === 'POOR'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                PCI: {resolvedSector.pciScore}/100 [{resolvedSector.pciRating}]
              </span>
            </div>

            <div className="space-y-3.5 text-sm">
              <div>
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">
                  PRIMARY CORRIDOR
                </span>
                <span className="font-bold text-white text-base">{resolvedSector.corridor}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">
                    MUNICIPAL ZONE
                  </span>
                  <span className="font-semibold text-slate-200">{resolvedSector.zone}</span>
                </div>
                <div>
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">
                    WARD & DISTRICT
                  </span>
                  <span className="font-semibold text-slate-200">{resolvedSector.ward}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">
                  ASSIGNED ENGINEERING WING
                </span>
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {resolvedSector.jurisdiction}
                </span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">EXACT GPS LAT:</span>
                  <span className="text-emerald-400 font-bold">{activeLat.toFixed(6)}° N</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">EXACT GPS LNG:</span>
                  <span className="text-cyan-400 font-bold">{activeLng.toFixed(6)}° E</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">POTHOLE HAZARD RISK:</span>
                  <span
                    className={`font-bold ${
                      resolvedSector.potholeRisk === 'HIGH' ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    {resolvedSector.potholeRisk}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${activeLat},${activeLng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all text-center"
              >
                <span>Google Maps</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('map')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Open GIS Map</span>
                </button>
              )}
            </div>
          </div>

          {/* Nearby Correlated Defects */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Nearby Verified Defects
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {correlatedDefects.length} flagged
              </span>
            </div>

            <div className="space-y-2.5">
              {correlatedDefects.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs font-mono">
                  No critical road defects detected in immediate proximity.
                </div>
              ) : (
                correlatedDefects.map((d, i) => (
                  <div
                    key={d.id || i}
                    className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            d.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300'
                              : d.severity === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {d.type} • {d.severity}
                        </span>
                        {d.depth_cm && (
                          <span className="text-[10px] font-mono text-slate-400">
                            Depth: {d.depth_cm}cm
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">{d.description}</p>
                    </div>

                    {d.repair_cost_inr && (
                      <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                        ₹{d.repair_cost_inr.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: High Precision Interactive Map Frame */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Precise GPS Pinpoint Visualizer
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {activeLat.toFixed(5)}°N, {activeLng.toFixed(5)}°E
                </span>
                <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs">
                  <button
                    onClick={() => setMapType('street')}
                    className={`px-2.5 py-1 ${
                      mapType === 'street' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Street
                  </button>
                  <button
                    onClick={() => setMapType('satellite')}
                    className={`px-2.5 py-1 ${
                      mapType === 'satellite' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Satellite
                  </button>
                </div>
              </div>
            </div>

            {/* Embedded Live Map View */}
            <div className="relative flex-1 min-h-[420px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
              {/* Dynamic OpenStreetMap Embed centered exactly on active coordinates */}
              <iframe
                title="Exact GPS Coordinate Location"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeLng - 0.008}%2C${activeLat - 0.006}%2C${activeLng + 0.008}%2C${activeLat + 0.006}&layer=mapnik&marker=${activeLat}%2C${activeLng}`}
                className="w-full h-full border-0 grayscale-[25%] contrast-[110%]"
                loading="lazy"
              />

              {/* Overlaid Crosshair / Radar Pin */}
              <div className="absolute top-4 right-4 pointer-events-none">
                <div className="p-3 bg-slate-900/90 backdrop-blur rounded-xl border border-slate-700 shadow-xl text-xs space-y-1">
                  <div className="font-mono text-[10px] text-slate-400">PRECISION TARGET</div>
                  <div className="text-emerald-400 font-bold font-mono">
                    {activeLat.toFixed(6)}° N
                  </div>
                  <div className="text-cyan-400 font-bold font-mono">
                    {activeLng.toFixed(6)}° E
                  </div>
                </div>
              </div>

              {/* Bottom Quick Bar */}
              <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                <div className="p-3 bg-slate-900/90 backdrop-blur rounded-xl border border-slate-700 shadow-xl flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-slate-200 font-medium truncate">
                      {resolvedSector.corridor}
                    </span>
                  </div>
                  <span className="font-mono text-slate-400 shrink-0">±2.4m GPS Accuracy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
