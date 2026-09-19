import React, { useState, useRef } from 'react';
import { Video, Image as ImageIcon, MapPin, UploadCloud, AlertTriangle, CheckCircle2, Navigation, Bus, Play, Sparkles } from 'lucide-react';
import { LocationData, MediaRecord } from '../types';

interface UploadSectionProps {
  onMediaUploadedAndAnalyze: (media: MediaRecord) => void;
}

interface CorridorPreset {
  id: string;
  name: string;
  routeId: string;
  lat: number;
  lng: number;
  accuracy: number;
}

const CORRIDOR_PRESETS: CorridorPreset[] = [
  {
    id: 'coastal-18',
    name: 'Coastal Corridor NH-16 Sector 4 (Default)',
    routeId: 'BUS-18-COASTAL-ROUTE',
    lat: 17.7342,
    lng: 83.3248,
    accuracy: 4,
  },
  {
    id: 'tagarapuvalasa',
    name: 'NH-16 Tagarapuvalasa Transit Corridor',
    routeId: 'BUS-14-TAGARAPUVALASA',
    lat: 17.9221,
    lng: 83.4243,
    accuracy: 5,
  },
  {
    id: 'sangivalasa-anits',
    name: 'ANITS Sangivalasa Campus Sector Gate',
    routeId: 'BUS-22-SANGIVALASA-ANITS',
    lat: 17.9214,
    lng: 83.4231,
    accuracy: 4,
  },
  {
    id: 'siripuram-junction',
    name: 'Siripuram Circle - Maddilapalem Corridor',
    routeId: 'BUS-07-MADDILAPALEM',
    lat: 17.7208,
    lng: 83.3156,
    accuracy: 6,
  },
  {
    id: 'visakha-hub',
    name: 'Visakhapatnam Central Transit Terminal B',
    routeId: 'BUS-CENTRAL-HUB-01',
    lat: 17.7289,
    lng: 83.3184,
    accuracy: 5,
  },
  {
    id: 'kolkata-arterial',
    name: 'Kolkata Central Highway Crossing',
    routeId: 'WB-CORRIDOR-04',
    lat: 22.5726,
    lng: 88.3639,
    accuracy: 5,
  },
];

export const UploadSection: React.FC<UploadSectionProps> = ({ onMediaUploadedAndAnalyze }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'VIDEO' | 'IMAGE' | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('coastal-18');
  const [locationSource, setLocationSource] = useState<'CORRIDOR_TELEMETRY' | 'BROWSER_DEVICE' | 'MANUAL_CUSTOM'>('CORRIDOR_TELEMETRY');
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'REQUESTING' | 'DETECTED' | 'DENIED'>('IDLE');
  
  const [locationData, setLocationData] = useState<LocationData>({
    latitude: 17.7342,
    longitude: 83.3248,
    accuracy: 4,
    timestamp: new Date().toISOString(),
  });
  
  const [busRouteId, setBusRouteId] = useState('BUS-18-COASTAL-ROUTE');
  const [uploadedBy, setUploadedBy] = useState('Transit Fleet Telemetry Unit');
  const [ingestionSector, setIngestionSector] = useState<'TRAFFIC' | 'ROAD_DEFECTS' | 'HEATWAVE' | 'ALL'>('ALL');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const applyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = CORRIDOR_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setLocationData({
        latitude: preset.lat,
        longitude: preset.lng,
        accuracy: preset.accuracy,
        timestamp: new Date().toISOString(),
      });
      setBusRouteId(preset.routeId);
      setLocationSource('CORRIDOR_TELEMETRY');
    }
  };

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('DENIED');
      return;
    }

    setLocationStatus('REQUESTING');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationData({
          latitude: parseFloat(pos.coords.latitude.toFixed(5)),
          longitude: parseFloat(pos.coords.longitude.toFixed(5)),
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: new Date().toISOString(),
        });
        setLocationStatus('DETECTED');
        setLocationSource('BROWSER_DEVICE');
      },
      (err) => {
        console.warn('Geolocation permission note:', err.message);
        setLocationStatus('DENIED');
        // Keep resilient corridor default coordinates
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleFileChange = (file: File, type: 'VIDEO' | 'IMAGE') => {
    setSelectedFile(file);
    setMediaTypeFilter(type);
    setUploadError(null);

    // Try detecting device GPS if idle
    if (locationStatus === 'IDLE' && locationSource === 'CORRIDOR_TELEMETRY') {
      requestBrowserLocation();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const isVid = file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|avi|mkv|webm)$/i);
      handleFileChange(file, isVid ? 'VIDEO' : 'IMAGE');
    }
  };

  const loadDemoSampleFile = (sampleName: string, isVideo: boolean) => {
    // Generate a structured dummy video/image file for instant zero-friction AI testing
    const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
    const content = new Blob(['SOLVOFIN_DEMO_SAMPLE_PAYLOAD_' + Date.now()], { type: mimeType });
    const file = new File([content], sampleName, { type: mimeType });
    handleFileChange(file, isVideo ? 'VIDEO' : 'IMAGE');
    if (locationStatus === 'IDLE') {
      setLocationData({
        latitude: 17.7345,
        longitude: 83.3249,
        accuracy: 3.5,
        timestamp: new Date().toISOString(),
        address_or_name: 'NH-16 Tagarapuvalasa Severe Pothole Corridor',
      });
      setLocationSource('CORRIDOR_TELEMETRY');
      setLocationStatus('DETECTED');
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) {
      setUploadError('Please select or drag a video/image file first, or pick one of the sample test presets.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('media_file', selectedFile);
      formData.append('uploaded_by', uploadedBy);
      formData.append('bus_route_id', busRouteId);

      const activeLat = locationData.latitude !== null && locationData.latitude !== undefined ? locationData.latitude : 17.7345;
      const activeLng = locationData.longitude !== null && locationData.longitude !== undefined ? locationData.longitude : 83.3249;

      formData.append('upload_latitude', activeLat.toString());
      formData.append('upload_longitude', activeLng.toString());
      formData.append('upload_accuracy', (locationData.accuracy || 5).toString());
      formData.append('upload_timestamp', locationData.timestamp || new Date().toISOString());

      // Assign scene GPS
      formData.append('scene_latitude', activeLat.toString());
      formData.append('scene_longitude', activeLng.toString());
      formData.append('scene_accuracy', (locationData.accuracy || 5).toString());

      // Step 1: Upload file & create persistent DB record
      const uploadRes = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      }).catch((netErr) => {
        throw new Error(`Network communication error: ${netErr.message || 'Unable to connect to server backend'}`);
      });

      let mediaRecord: MediaRecord;

      if (!uploadRes.ok) {
        let errMessage = `Upload failed (Status ${uploadRes.status})`;
        try {
          const errJson = await uploadRes.json();
          if (errJson && errJson.error) {
            errMessage = errJson.error;
          }
        } catch {
          try {
            const text = await uploadRes.text();
            if (text && text.length < 150 && !text.includes('<!')) {
              errMessage = text;
            }
          } catch {}
        }
        throw new Error(errMessage);
      }

      try {
        mediaRecord = await uploadRes.json();
      } catch (jsonErr: any) {
        throw new Error(`Failed to parse media record: ${jsonErr?.message || 'Invalid JSON response'}`);
      }

      // Step 2: Trigger automated AI analysis pipeline
      try {
        await fetch(`/api/media/${mediaRecord.id}/analyze`, { method: 'POST' });
      } catch (analyzeErr) {
        console.warn('Analysis pipeline trigger note:', analyzeErr);
      }

      // Notify parent to open live progress monitor
      onMediaUploadedAndAnalyze(mediaRecord);

      // Reset local file selection
      setSelectedFile(null);
      setLocationStatus('IDLE');
    } catch (err: any) {
      console.error('Error during upload & analysis trigger:', err);
      setUploadError(err.message || 'An error occurred during upload. Please verify the connection and retry.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section id="upload-media-section" className="mx-auto max-w-4xl px-4 py-6">
      {/* High Density Theme Card: SOLVOFIN INTELLIGENCE */}
      <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-[#0F172A] p-5 sm:p-7 shadow-xl">
        <div className="mb-6 border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>INGESTION TELEMETRY PIPELINE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              Solvofin Ingestion Hub
            </h2>
            <p className="mt-0.5 text-xs text-slate-300">
              Transform public transport dashcams and junction feeds into continuous urban perception sensors.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
              DB-PERSISTENCE: ACTIVE
            </span>
          </div>
        </div>

        {/* Sector Specialization Selector */}
        <div className="mb-5 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
          <label className="block text-[11px] font-mono font-bold uppercase text-slate-300 mb-2">
            Select Target Ingestion Sector:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setIngestionSector('TRAFFIC')}
              className={`p-2 rounded text-left border text-xs font-mono transition-all ${
                ingestionSector === 'TRAFFIC'
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500/50'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-white">
                <span className="text-emerald-400">🚦</span> Traffic Operations
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Vehicles, Queues & ANPR</div>
            </button>

            <button
              type="button"
              onClick={() => setIngestionSector('ROAD_DEFECTS')}
              className={`p-2 rounded text-left border text-xs font-mono transition-all ${
                ingestionSector === 'ROAD_DEFECTS'
                  ? 'border-rose-500 bg-rose-950/40 text-rose-300 ring-1 ring-rose-500/50'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-white">
                <span className="text-rose-400">🛠️</span> Road & Potholes
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Pavements, Cracks, Ruts</div>
            </button>

            <button
              type="button"
              onClick={() => setIngestionSector('HEATWAVE')}
              className={`p-2 rounded text-left border text-xs font-mono transition-all ${
                ingestionSector === 'HEATWAVE'
                  ? 'border-amber-500 bg-amber-950/40 text-amber-300 ring-1 ring-amber-500/50'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-white">
                <span className="text-amber-400">🌡️</span> Heatwave / UHI
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Thermal & Asphalt Island</div>
            </button>

            <button
              type="button"
              onClick={() => setIngestionSector('ALL')}
              className={`p-2 rounded text-left border text-xs font-mono transition-all ${
                ingestionSector === 'ALL'
                  ? 'border-blue-500 bg-blue-950/40 text-blue-300 ring-1 ring-blue-500/50'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-white">
                <span className="text-blue-400">🌐</span> Multimodal Scan
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">All Sensors & Vision</div>
            </button>
          </div>
        </div>

        {/* Action Choice Buttons - High Density Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto mb-6">
          <button
            id="upload-video-action-btn"
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className={`flex items-center justify-center gap-3 rounded border p-3 text-xs font-bold transition-all ${
              mediaTypeFilter === 'VIDEO'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-500/20 text-emerald-400">
              <Video className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white uppercase">Upload Video</div>
              <div className="text-[10px] text-slate-400 font-mono">MP4, MOV, AVI, WebM</div>
            </div>
          </button>

          <button
            id="upload-photo-action-btn"
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className={`flex items-center justify-center gap-3 rounded border p-3 text-xs font-bold transition-all ${
              mediaTypeFilter === 'IMAGE'
                ? 'border-blue-500 bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/40'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/20 text-blue-400">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white uppercase">Upload Photo</div>
              <div className="text-[10px] text-slate-400 font-mono">JPG, JPEG, PNG, WEBP</div>
            </div>
          </button>

          {/* Hidden HTML file inputs */}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileChange(e.target.files[0], 'VIDEO');
            }}
          />
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileChange(e.target.files[0], 'IMAGE');
            }}
          />
        </div>

        {/* Quick Instant Test Presets (Zero friction 1-click test) */}
        <div className="mb-4 p-3 rounded-lg bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Or Test Instantly with Pre-Loaded Urban Road Scans:</span>
            <span className="text-emerald-400 font-bold">1-Click Load</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => loadDemoSampleFile('pothole_inspection_severe_nh16.mp4', true)}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-rose-400 truncate">
                📹 Severe Pothole Video
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">NH-16 Corridor (2 Potholes)</div>
            </button>

            <button
              type="button"
              onClick={() => loadDemoSampleFile('campus_transit_anits_gate.mp4', true)}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 truncate">
                🚌 ANITS Transit Video
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">Fleet, ANPR & Zebra Crossings</div>
            </button>

            <button
              type="button"
              onClick={() => loadDemoSampleFile('monsoon_surface_cracks.jpg', false)}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-amber-400 truncate">
                📸 Deep Pavement Crack Photo
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">High-Resolution Road Snapshot</div>
            </button>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-all ${
            selectedFile
              ? 'border-emerald-500/50 bg-slate-900'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900'
          }`}
        >
          {selectedFile ? (
            <div className="flex flex-col items-center justify-center gap-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-white">{selectedFile.name}</p>
              <p className="text-[11px] text-slate-400 font-mono">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {mediaTypeFilter} READY FOR PIPELINE
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setMediaTypeFilter(null);
                }}
                className="mt-1 text-[11px] text-rose-400 hover:underline font-mono"
              >
                Change or remove file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5">
              <UploadCloud className="h-6 w-6 text-slate-500" />
              <p className="text-xs text-slate-400 font-medium">Or drag and drop your media file directly here</p>
            </div>
          )}
        </div>

        {/* Location Capture Component with Mandatory Transparency */}
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex-1 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200 uppercase tracking-wide text-xs">Geospatial Telemetry & Route Coordinates</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    locationSource === 'BROWSER_DEVICE'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : locationSource === 'CORRIDOR_TELEMETRY'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                      : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                  }`}>
                    {locationSource === 'BROWSER_DEVICE' ? 'DEVICE SENSOR' : locationSource === 'CORRIDOR_TELEMETRY' ? 'CORRIDOR TELEMETRY' : 'CUSTOM OVERRIDE'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={requestBrowserLocation}
                  className="flex items-center gap-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 text-[11px] font-mono text-emerald-400 transition-colors"
                >
                  <Navigation className="h-3 w-3" />
                  <span>Detect Device GPS</span>
                </button>
              </div>

              <p className="mt-1 text-[11px] text-slate-400 leading-relaxed italic">
                «Location is used to associate this uploaded media with the geographic corridor where road defects, traffic, and fleet telemetry are mapped.»
              </p>

              {/* Transit Corridor Preset Selector */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-3">
                  <label className="block text-slate-400 font-medium mb-1 text-[10px] uppercase font-bold tracking-wider">
                    Select Target Transit Corridor / Campus Route:
                  </label>
                  <select
                    value={selectedPresetId}
                    onChange={(e) => applyPreset(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    {CORRIDOR_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — [{p.lat}° N, {p.lng}° E]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Editable Latitude / Longitude Fields */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1 text-[10px] uppercase font-bold tracking-wider">
                    Latitude (°N)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={locationData.latitude ?? ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setLocationData((prev) => ({ ...prev, latitude: isNaN(val) ? null : val }));
                      setLocationSource('MANUAL_CUSTOM');
                    }}
                    placeholder="17.7342"
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1 text-[10px] uppercase font-bold tracking-wider">
                    Longitude (°E)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={locationData.longitude ?? ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setLocationData((prev) => ({ ...prev, longitude: isNaN(val) ? null : val }));
                      setLocationSource('MANUAL_CUSTOM');
                    }}
                    placeholder="83.3248"
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1 text-[10px] uppercase font-bold tracking-wider">
                    Accuracy Radius (m)
                  </label>
                  <input
                    type="number"
                    value={locationData.accuracy ?? 5}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setLocationData((prev) => ({ ...prev, accuracy: isNaN(val) ? 5 : val }));
                    }}
                    placeholder="±5m"
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-slate-300 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Notice */}
              {locationStatus === 'REQUESTING' && (
                <div className="mt-2.5 text-emerald-400 animate-pulse font-mono text-[11px]">
                  Requesting browser device geolocation...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transit Metadata Options */}
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
              <Bus className="h-3 w-3 text-emerald-400" />
              Transit Bus Route / Camera Unit ID
            </label>
            <input
              type="text"
              value={busRouteId}
              onChange={(e) => setBusRouteId(e.target.value)}
              placeholder="e.g. BUS-18-NORTH or CAM-JUNCTION-04"
              className="w-full rounded border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1 text-[10px] uppercase font-bold tracking-wider">
              Logged By / Telemetry Unit
            </label>
            <input
              type="text"
              value={uploadedBy}
              onChange={(e) => setUploadedBy(e.target.value)}
              className="w-full rounded border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Upload Error banner */}
        {uploadError && (
          <div className="mt-3 flex items-center gap-2 rounded border border-rose-500/40 bg-rose-950/30 p-2.5 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* ONE ACTION Automated Pipeline Trigger [ ANALYZE ] */}
        <div className="mt-6 text-center">
          <button
            id="start-ai-analysis-btn"
            type="button"
            disabled={!selectedFile || isUploading}
            onClick={handleStartAnalysis}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded px-6 py-2.5 text-xs font-bold transition-all ${
              !selectedFile || isUploading
                ? 'cursor-not-allowed border border-slate-800 bg-slate-800/50 text-slate-500'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950 cursor-pointer active:scale-98'
            }`}
          >
            {isUploading ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Uploading & Launching Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>[ START AUTOMATED AI ANALYSIS ]</span>
              </>
            )}
          </button>
          <p className="mt-1.5 text-[10px] text-slate-400 font-mono">
            One-click triggers all 12 modules: Road defects, ANPR, Traffic, Smoke, People, Buildings & Report.
          </p>
        </div>
      </div>
    </section>
  );
};
