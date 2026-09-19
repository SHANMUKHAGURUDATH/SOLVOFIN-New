import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Circle } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  AlertOctagon,
  Car,
  Flame,
  AlertTriangle,
  Layers,
  Eye,
  Sun,
  ShieldAlert,
  Users,
  ExternalLink,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  MediaRecord,
  TrafficBottleneck,
  HeatwaveAnalytics,
  IncidentRecord,
  LaneDepartureEvent,
  VulnerablePedestrianEvent,
  RoadDividerDetection,
} from '../types';

// Fix default leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  onSelectMedia: (mediaId: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({ onSelectMedia }) => {
  const [mediaList, setMediaList] = useState<MediaRecord[]>([]);
  const [bottlenecks, setBottlenecks] = useState<TrafficBottleneck[]>([]);
  const [heatwaves, setHeatwaves] = useState<HeatwaveAnalytics[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [laneDepartures, setLaneDepartures] = useState<LaneDepartureEvent[]>([]);
  const [vulnerablePeds, setVulnerablePeds] = useState<VulnerablePedestrianEvent[]>([]);
  const [roadDividers, setRoadDividers] = useState<RoadDividerDetection[]>([]);
  const [loading, setLoading] = useState(true);

  // Layer Visibility Toggles
  const [showMediaPins, setShowMediaPins] = useState(true);
  const [showBottlenecks, setShowBottlenecks] = useState(true);
  const [showHeatwaves, setShowHeatwaves] = useState(false);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showLaneDepartures, setShowLaneDepartures] = useState(true);
  const [showVulnerablePeds, setShowVulnerablePeds] = useState(true);
  const [showRoadDividers, setShowRoadDividers] = useState(true);

  const fetchGisData = async () => {
    setLoading(true);
    try {
      const [mRes, bRes, hRes, incRes, lRes, pRes, dRes] = await Promise.all([
        fetch('/api/media').then((r) => r.json()).catch(() => []),
        fetch('/api/analytics/bottlenecks').then((r) => r.json()).catch(() => []),
        fetch('/api/analytics/heatwaves').then((r) => r.json()).catch(() => []),
        fetch('/api/analytics/incidents').then((r) => r.json()).catch(() => []),
        fetch('/api/lane-departures').then((r) => r.json()).catch(() => []),
        fetch('/api/vulnerable-pedestrians').then((r) => r.json()).catch(() => []),
        fetch('/api/road-dividers').then((r) => r.json()).catch(() => []),
      ]);

      if (Array.isArray(mRes)) setMediaList(mRes);
      if (Array.isArray(bRes)) setBottlenecks(bRes);
      if (Array.isArray(hRes)) setHeatwaves(hRes);
      if (Array.isArray(incRes)) setIncidents(incRes);
      if (Array.isArray(lRes)) setLaneDepartures(lRes);
      if (Array.isArray(pRes)) setVulnerablePeds(pRes);
      if (Array.isArray(dRes)) setRoadDividers(dRes);
    } catch (err) {
      console.error('Error fetching GIS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGisData();
  }, []);

  const defaultCenter: [number, number] = [17.725, 83.315]; // Visakhapatnam Coastal Transit Axis

  return (
    <div id="map-view-container" className="mx-auto max-w-7xl px-4 py-5 sm:px-6 space-y-4">
      {/* Header & GIS Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-white font-mono uppercase tracking-wider">
              Central GIS Telemetry & Urban Spatial Command
            </h1>
            <span className="rounded bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
              SYNCHRONIZED
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Geospatial correlation of transit cameras, traffic bottleneck queues, heatwave thermal islands, and road safety incidents.
          </p>
        </div>

        {/* Layer Toggles & Refresh */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setShowLaneDepartures(!showLaneDepartures)}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold transition-all ${
              showLaneDepartures
                ? 'bg-teal-950/90 text-teal-300 border border-teal-500/50'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            <span>🛣️ Lanes ({laneDepartures.length})</span>
          </button>

          <button
            onClick={() => setShowVulnerablePeds(!showVulnerablePeds)}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold transition-all ${
              showVulnerablePeds
                ? 'bg-amber-950/90 text-amber-300 border border-amber-500/50'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            <span>🚸 Pedestrians ({vulnerablePeds.length})</span>
          </button>

          <button
            onClick={() => setShowRoadDividers(!showRoadDividers)}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold transition-all ${
              showRoadDividers
                ? 'bg-indigo-950/90 text-indigo-300 border border-indigo-500/50'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            <span>🚧 Dividers ({roadDividers.length})</span>
          </button>

          <button
            onClick={() => setShowBottlenecks(!showBottlenecks)}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold transition-all ${
              showBottlenecks
                ? 'bg-rose-950/90 text-rose-300 border border-rose-500/50'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            <Car className="h-3 w-3 text-rose-400" />
            Bottlenecks ({bottlenecks.length})
          </button>

          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold transition-all ${
              showIncidents
                ? 'bg-blue-950/90 text-blue-300 border border-blue-500/50'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            <ShieldAlert className="h-3 w-3 text-blue-400" />
            Incidents ({incidents.length})
          </button>

          <button
            onClick={() => setShowMediaPins(!showMediaPins)}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold transition-all ${
              showMediaPins
                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            <MapPin className="h-3 w-3 text-emerald-400" />
            Media ({mediaList.length})
          </button>

          <button
            onClick={fetchGisData}
            className="flex items-center gap-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 text-[11px]"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* GIS Map Canvas */}
      <div className="relative h-[680px] w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-2xl">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <span className="text-xs font-mono text-slate-400">Loading Geospatial Layers...</span>
          </div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Layer 1: Heatwave Thermal Zones (Pulsing Circles & Surface Radiance) */}
            {showHeatwaves &&
              heatwaves.map((h) => (
                <React.Fragment key={`heat-${h.id}`}>
                  <Circle
                    center={[h.location.latitude, h.location.longitude]}
                    radius={550}
                    pathOptions={{
                      color: h.alert_level === 'RED_SEVERE' ? '#ef4444' : '#f97316',
                      fillColor: h.alert_level === 'RED_SEVERE' ? '#ef4444' : '#f59e0b',
                      fillOpacity: 0.25,
                      weight: 2,
                      dashArray: '4, 4',
                    }}
                  />
                  <CircleMarker
                    center={[h.location.latitude, h.location.longitude]}
                    radius={16}
                    pathOptions={{
                      color: '#dc2626',
                      fillColor: '#ef4444',
                      fillOpacity: 0.9,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1.5 text-xs font-mono max-w-xs">
                        <div className="font-black text-rose-600 border-b border-slate-200 pb-1 flex items-center gap-1">
                          <Sun className="h-3.5 w-3.5 text-amber-500" />
                          <span>{h.zone_name}</span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-800">
                          ALERT: <span className="text-rose-600">{h.alert_level.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1.5 rounded text-[10px]">
                          <div>
                            Surface Temp: <strong>{h.surface_temperature_c}°C</strong>
                          </div>
                          <div>
                            Ambient Temp: <strong>{h.ambient_temperature_c}°C</strong>
                          </div>
                          <div>
                            Anomaly Delta: <strong className="text-rose-600">+{h.thermal_anomaly_delta}°C</strong>
                          </div>
                          <div>
                            Canopy: <strong>{h.tree_canopy_percentage}%</strong>
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-700">
                          <strong>Mitigation:</strong> {h.urban_cooling_interventions[0]}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              ))}

            {/* Layer 2: Traffic Bottleneck Corridors */}
            {showBottlenecks &&
              bottlenecks.map((b) => (
                <CircleMarker
                  key={`bot-${b.id}`}
                  center={[b.location.latitude, b.location.longitude]}
                  radius={18}
                  pathOptions={{
                    color: '#9333ea',
                    fillColor: '#a855f7',
                    fillOpacity: 0.85,
                    weight: 3,
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-1.5 text-xs font-mono max-w-xs">
                      <div className="font-black text-purple-700 border-b border-slate-200 pb-1 flex items-center gap-1">
                        <Car className="h-3.5 w-3.5 text-purple-600" />
                        <span>{b.corridor_name}</span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-800">
                        CONGESTION: <span className="text-purple-600">{b.congestion_index}%</span> • DELAY: +{b.avg_delay_minutes}m
                      </div>
                      <div className="text-[10px] bg-purple-50 p-1.5 rounded border border-purple-200 text-purple-900 space-y-0.5">
                        <div>Queue Length: <strong>{b.queue_length_meters} meters</strong></div>
                        <div>Flow vs Cap: <strong>{b.flow_rate_vehicles_per_min} / {b.capacity_vehicles_per_min} veh/min</strong></div>
                        <div>Cause: <strong>{b.bottleneck_cause.replace(/_/g, ' ')}</strong></div>
                      </div>
                      <div className="text-[10px] text-slate-700">
                        <strong>Action:</strong> {b.mitigation_action}
                      </div>
                      {b.media_id && (
                        <button
                          onClick={() => onSelectMedia(b.media_id!)}
                          className="mt-1 w-full rounded bg-purple-700 hover:bg-purple-800 text-white font-bold py-1 text-center block text-[10px]"
                        >
                          View Corridor Video Telemetry
                        </button>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

            {/* Layer 3: Incident Markers */}
            {showIncidents &&
              incidents.map((inc) => {
                if (!inc.latitude || !inc.longitude) return null;
                return (
                  <CircleMarker
                    key={`inc-${inc.id}`}
                    center={[inc.latitude, inc.longitude]}
                    radius={10}
                    pathOptions={{
                      color: '#0284c7',
                      fillColor: '#38bdf8',
                      fillOpacity: 0.9,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 text-xs font-mono max-w-xs">
                        <div className="font-bold text-sky-700 border-b border-slate-200 pb-0.5">
                          🚨 {inc.type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[11px] text-slate-800">
                          {inc.description}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Timestamp: @{inc.timestamp_sec}s • Severity: <strong>{inc.severity}</strong>
                        </div>
                        {inc.media_id && (
                          <button
                            onClick={() => onSelectMedia(inc.media_id)}
                            className="mt-1 w-full rounded bg-sky-600 hover:bg-sky-700 text-white font-bold py-1 text-center block text-[10px]"
                          >
                            Inspect Incident Frame
                          </button>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}

            {/* Layer 4: Media Upload Pins */}
            {showMediaPins &&
              mediaList.map((m) => {
                const lat = m.upload_location?.latitude || m.scene_location?.latitude;
                const lng = m.upload_location?.longitude || m.scene_location?.longitude;
                if (!lat || !lng) return null;

                return (
                  <Marker key={m.id} position={[lat, lng]}>
                    <Popup className="custom-popup">
                      <div className="p-1 space-y-2 text-xs font-mono">
                        <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 truncate">
                          {m.original_filename}
                        </div>
                        <div className="text-[11px] text-slate-700">
                          ROUTE: <strong>{m.bus_route_id || 'Transit Corridor'}</strong>
                        </div>
                        <div className="text-[11px] text-slate-700">
                          STATUS: <strong>{m.analysis_status}</strong>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
                        </div>
                        <button
                          onClick={() => onSelectMedia(m.id)}
                          className="mt-2 w-full rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 text-center block text-[11px]"
                        >
                          Open Full Telemetry
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Layer 5: Highway Lane Departures */}
            {showLaneDepartures &&
              laneDepartures.map((ld) => {
                if (!ld.latitude || !ld.longitude) return null;
                const isCritical = ld.severity === 'CRITICAL' || ld.severity === 'HIGH';
                return (
                  <CircleMarker
                    key={`ld-${ld.id}`}
                    center={[ld.latitude, ld.longitude]}
                    radius={12}
                    pathOptions={{
                      color: isCritical ? '#ef4444' : '#14b8a6',
                      fillColor: isCritical ? '#dc2626' : '#2dd4bf',
                      fillOpacity: 0.85,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 text-xs font-mono max-w-xs">
                        <div className="font-bold text-teal-700 border-b border-slate-200 pb-0.5 flex items-center justify-between">
                          <span>🛣️ {ld.event_type.replace(/_/g, ' ')}</span>
                          <span className="text-[9px] px-1 rounded bg-teal-100 text-teal-800">
                            {ld.severity}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-800">
                          {ld.description}
                        </div>
                        <div className="text-[10px] text-slate-600 bg-slate-50 p-1 rounded">
                          Offset: <strong>{ld.offset_meters.toFixed(2)}m</strong> ({ld.direction || 'LATERAL'}) • Conf: <strong>{(ld.confidence * 100).toFixed(0)}%</strong>
                        </div>
                        <div className="text-[9px] text-slate-500">
                          GPS: {ld.latitude.toFixed(5)}°N, {ld.longitude.toFixed(5)}°E ({ld.gps_status})
                        </div>
                        {ld.media_id && (
                          <button
                            onClick={() => onSelectMedia(ld.media_id)}
                            className="mt-1 w-full rounded bg-teal-600 hover:bg-teal-700 text-white font-bold py-1 text-center block text-[10px]"
                          >
                            Inspect Lane Detection Video
                          </button>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}

            {/* Layer 6: Vulnerable Pedestrians & School Children */}
            {showVulnerablePeds &&
              vulnerablePeds.map((ped) => {
                if (!ped.latitude || !ped.longitude) return null;
                const isSchool = ped.pedestrian_type === 'SCHOOL_CHILD' || ped.has_school_bag_indicator;
                return (
                  <CircleMarker
                    key={`ped-${ped.id}`}
                    center={[ped.latitude, ped.longitude]}
                    radius={13}
                    pathOptions={{
                      color: isSchool ? '#f59e0b' : '#d97706',
                      fillColor: isSchool ? '#fbbf24' : '#f59e0b',
                      fillOpacity: 0.9,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 text-xs font-mono max-w-xs">
                        <div className="font-bold text-amber-700 border-b border-slate-200 pb-0.5 flex items-center justify-between">
                          <span>{isSchool ? '🎒 School Child Risk' : '🚸 Vulnerable Pedestrian'}</span>
                          <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-900 font-bold">
                            {ped.severity}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-800">
                          {ped.description}
                        </div>
                        <div className="text-[10px] text-slate-700 bg-amber-50 p-1.5 rounded space-y-0.5">
                          <div>Situation: <strong>{ped.risk_situation.replace(/_/g, ' ')}</strong></div>
                          <div>Proximity to Vehicle: <strong>{ped.distance_to_vehicle_m ? `${ped.distance_to_vehicle_m.toFixed(1)}m` : 'Active Trajectory'}</strong></div>
                          <div>Proximity to Curb: <strong>{ped.distance_to_curb_m ? `${ped.distance_to_curb_m.toFixed(1)}m` : 'In Roadway'}</strong></div>
                        </div>
                        <div className="text-[9px] text-slate-500">
                          GPS: {ped.latitude.toFixed(5)}°N, {ped.longitude.toFixed(5)}°E ({ped.gps_status})
                        </div>
                        {ped.media_id && (
                          <button
                            onClick={() => onSelectMedia(ped.media_id)}
                            className="mt-1 w-full rounded bg-amber-600 hover:bg-amber-700 text-white font-bold py-1 text-center block text-[10px]"
                          >
                            View Pedestrian Video Frame
                          </button>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}

            {/* Layer 7: Road Dividers & Median Breaks */}
            {showRoadDividers &&
              roadDividers.map((div) => {
                if (!div.latitude || !div.longitude) return null;
                const isDamaged =
                  div.condition === 'DAMAGED_BARRIER' ||
                  div.condition === 'BROKEN_SECTION' ||
                  div.condition === 'MISSING_DIVIDER_SECTION' ||
                  div.condition === 'DISPLACED_INTO_LANE';
                return (
                  <CircleMarker
                    key={`div-${div.id}`}
                    center={[div.latitude, div.longitude]}
                    radius={14}
                    pathOptions={{
                      color: isDamaged ? '#e11d48' : '#6366f1',
                      fillColor: isDamaged ? '#f43f5e' : '#818cf8',
                      fillOpacity: 0.85,
                      weight: 3,
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 text-xs font-mono max-w-xs">
                        <div className="font-bold text-indigo-700 border-b border-slate-200 pb-0.5 flex items-center justify-between">
                          <span>🚧 {div.divider_type.replace(/_/g, ' ')}</span>
                          <span className={`text-[9px] px-1 rounded font-bold ${isDamaged ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'}`}>
                            {div.condition.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-800">
                          {div.description}
                        </div>
                        <div className="text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded space-y-0.5">
                          {div.gap_length_meters_est && <div>Gap Length: <strong className="text-rose-600">{div.gap_length_meters_est.toFixed(1)} meters</strong></div>}
                          <div>Action: <strong>{div.recommended_action || 'Inspect'}</strong></div>
                          <div>Evidence: <strong>{div.is_sufficient_evidence ? 'Sufficient' : 'Low Evidence'}</strong></div>
                        </div>
                        <div className="text-[9px] text-slate-500">
                          GPS: {div.latitude.toFixed(5)}°N, {div.longitude.toFixed(5)}°E ({div.gps_status})
                        </div>
                        {div.media_id && (
                          <button
                            onClick={() => onSelectMedia(div.media_id)}
                            className="mt-1 w-full rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 text-center block text-[10px]"
                          >
                            Inspect Barrier Video Frame
                          </button>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
          </MapContainer>
        )}

        {/* Floating Map Legend Overlay */}
        <div className="absolute bottom-4 right-4 z-[1000] rounded-lg border border-slate-800 bg-slate-950/90 p-3 shadow-xl backdrop-blur text-[11px] font-mono space-y-1.5 text-slate-300">
          <div className="font-bold text-white uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1">
            GIS Layer Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-teal-500 inline-block border border-teal-300" />
            <span>Lane Departure & Deviation Alerts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500 inline-block border border-amber-300" />
            <span>School Child & Vulnerable Pedestrians</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-indigo-500 inline-block border border-indigo-300" />
            <span>Road Divider & Median Barrier Breaks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-purple-500 inline-block border border-purple-300" />
            <span>Traffic Bottleneck & Chokepoint</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block border border-emerald-300" />
            <span>Transit Video Camera Feed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
