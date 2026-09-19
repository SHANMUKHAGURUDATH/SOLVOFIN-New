import React, { useState } from 'react';
import {
  Scale,
  Shield,
  Eye,
  Lock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Cpu,
  Bus,
  Database,
  UserCheck,
  Globe,
  Info,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
  MapPin,
  ChevronRight,
  BookOpen,
  Filter,
} from 'lucide-react';

interface ResponsibleAIViewProps {
  onNavigateToBusInfra?: () => void;
  onNavigateToCitizen?: () => void;
  onNavigateToImpact?: () => void;
}

type TabFilter =
  | 'ALL'
  | 'PIPELINE'
  | 'PRIVACY'
  | 'FAIRNESS'
  | 'SAFETY'
  | 'OVERSIGHT'
  | 'RAG'
  | 'SUSTAINABILITY';

export const ResponsibleAIView: React.FC<ResponsibleAIViewProps> = ({
  onNavigateToBusInfra,
  onNavigateToCitizen,
  onNavigateToImpact,
}) => {
  const [activeFilter, setActiveFilter] = useState<TabFilter>('ALL');

  // Real knowledge base documents indexed in SOLVOFIN (from server/ragEngine.ts)
  const realIndexedDocuments = [
    {
      id: 'DOC-IRC-82-2015',
      title: 'IRC:82-2015 Code of Practice for Maintenance of Bituminous Roads',
      organization: 'Indian Roads Congress (IRC)',
      category: 'ROAD_MAINTENANCE',
      section: 'Section 4: Classification and Repair of Pavement Distress',
      coverage: 'Pothole depth/area classification, tack coat emulsion protocols, dense bituminous macadam layering.',
      url: 'https://irc.nic.in',
    },
    {
      id: 'DOC-MORTH-BS-2019',
      title: 'MoRTH Guidelines for Identification & Rectification of Accident Black Spots',
      organization: 'Ministry of Road Transport and Highways (MoRTH)',
      category: 'ROAD_SAFETY',
      section: 'Section 5: Black Spot Prioritization Criteria and Engineering Countermeasures',
      coverage: '500m crash cluster criteria, retroreflective thermoplastic crosswalks, W-beam crash barriers.',
      url: 'https://morth.nic.in',
    },
    {
      id: 'DOC-CIRT-DFS-2021',
      title: 'Commercial Motor Vehicle Driver Fatigue & Drowsiness Mitigation Standard',
      organization: 'Central Institute of Road Transport (CIRT) & NHTSA',
      category: 'DRIVER_SAFETY',
      section: 'Section 3: Ocular Metric Monitoring (PERCLOS), Head Nodding and Alert Escalations',
      coverage: 'PERCLOS > 0.22 micro-sleep classification, Eye Aspect Ratio (EAR), mandatory 20-minute rest intervals.',
      url: 'https://cirtindia.com',
    },
    {
      id: 'DOC-UNECE-REG-107',
      title: 'UNECE Regulation No. 107 - Uniform Provisions Concerning Public Service Vehicles (Buses)',
      organization: 'United Nations Economic Commission for Europe (UNECE)',
      category: 'VEHICLE_SAFETY',
      section: 'Annex 3: Passenger Compartment Interior Safety, Handrails, Emergency Exits and Gangways',
      coverage: 'Grab rail clearance (30-45mm), seat anchorage 10g deceleration resistance, anti-pinch door sensors.',
      url: 'https://unece.org/transport/vehicle-regulations',
    },
    {
      id: 'DOC-UN-SDG-11-2022',
      title: 'United Nations SDG 11: Sustainable Cities and Communities - Target 11.2 Framework',
      organization: 'United Nations Human Settlements Programme (UN-Habitat)',
      category: 'SUSTAINABILITY',
      section: 'Target 11.2: Safe, Affordable, Accessible and Sustainable Transport Systems for All',
      coverage: 'Indicator 11.2.1 transit accessibility, vulnerable road user protection, proactive infrastructure durability.',
      url: 'https://sdgs.un.org/goals/goal11',
    },
    {
      id: 'DOC-IRC-SP-20',
      title: 'IRC:SP:20 Rural & Urban Connector Road Drainage and Waterlogging Mitigation Manual',
      organization: 'Indian Roads Congress (IRC)',
      category: 'INFRASTRUCTURE',
      section: 'Section 7: Surface Drainage, Camber Retention and Ponding Prevention',
      coverage: '2.0%-2.5% pavement camber, standing water stripping effect on bitumen, longitudinal drain clearing.',
      url: 'https://irc.nic.in',
    },
    {
      id: 'DOC-MOHUA-NUTP-2020',
      title: 'National Urban Transport Policy (NUTP) Guidelines on Traffic Bottlenecks & Corridors',
      organization: 'Ministry of Housing and Urban Affairs (MoHUA)',
      category: 'URBAN_MOBILITY',
      section: 'Section 4: Corridor Decongestion and Dedicated Transit Priority',
      coverage: 'Bottleneck clearance, transit schedule predictability, public transport reliability enhancements.',
      url: 'https://mohua.gov.in',
    },
  ];

  return (
    <div
      id="responsible-ai-view"
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans text-slate-300"
    >
      {/* 1. Header Banner */}
      <div className="bg-[#0F172A] border border-cyan-500/30 rounded-xl p-6 sm:p-8 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                SOLVOFIN PART 5
              </span>
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                SDG 11 TRANSPARENCY
              </span>
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                INFORMATIONAL & GOVERNANCE LAYER
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight font-mono">
              Responsible AI & Sustainability Transparency
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              SOLVOFIN provides evidence-grounded decision support for municipal operators, transport engineers, and urban transit authorities. This section openly discloses the system's pipeline, data provenance, human-in-the-loop safeguards, privacy boundaries, fairness considerations, and sustainability alignment under UN SDG 11.
            </p>
          </div>

          {/* Quick Nav Links */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            {onNavigateToImpact && (
              <button
                type="button"
                id="btn-nav-impact-dashboard"
                onClick={onNavigateToImpact}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition-colors"
              >
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                Live SDG 11 Impact Intelligence
              </button>
            )}
            {onNavigateToBusInfra && (
              <button
                type="button"
                id="btn-nav-bus-infra"
                onClick={onNavigateToBusInfra}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-colors"
              >
                <Layers className="h-3.5 w-3.5" />
                Live Bus Inspection AI
              </button>
            )}
            {onNavigateToCitizen && (
              <button
                type="button"
                id="btn-nav-citizen-portal"
                onClick={onNavigateToCitizen}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Citizen Reporting & SLA
              </button>
            )}
          </div>
        </div>

        {/* Informational Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 border-t border-slate-800 text-xs font-mono scrollbar-none">
          <span className="text-slate-400 flex items-center gap-1 mr-1 text-[11px]">
            <Filter className="h-3 w-3 text-cyan-400" /> Filter:
          </span>
          {[
            { id: 'ALL', label: 'All Disclosures' },
            { id: 'PIPELINE', label: 'Pipeline Transparency' },
            { id: 'PRIVACY', label: 'Privacy & Minimization' },
            { id: 'FAIRNESS', label: 'Fairness & Bias' },
            { id: 'SAFETY', label: 'Safety & Boundaries' },
            { id: 'OVERSIGHT', label: 'Human Oversight & Audit' },
            { id: 'RAG', label: 'RAG Evidence & Standards' },
            { id: 'SUSTAINABILITY', label: 'SDG 11 Sustainability' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as TabFilter)}
              className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
                activeFilter === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. SECTION: RESPONSIBLE AI CHECKLIST (Informational Only) */}
      <div
        id="responsible-ai-checklist"
        className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white uppercase font-mono tracking-wide">
              RESPONSIBLE AI CHECKLIST
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            Informational Self-Audit • Not a Formal Legal Certification
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed font-mono">
          The following principles guide SOLVOFIN's system architecture, user interface disclosures, and reasoning boundaries. This checklist reflects implemented architectural safeguards, not a marketing claim or external compliance seal.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          {[
            {
              title: 'Transparency',
              desc: 'Explicit 6-stage pipeline from optical detection to RAG evidence and AI recommendation.',
            },
            {
              title: 'Human Oversight',
              desc: 'Mandatory engineer sign-off (Accept / Modify / Reject) before consequential work orders.',
            },
            {
              title: 'Traceability',
              desc: 'Append-only audit trail preserving original AI recommendations alongside human decisions.',
            },
            {
              title: 'Privacy',
              desc: 'Strict data minimization; no facial recognition, passenger profiling, or private biometric storage.',
            },
            {
              title: 'Safety Boundaries',
              desc: 'Non-autonomous decision support; no automated legal, punitive, or emergency dispatches.',
            },
            {
              title: 'Fairness Considerations',
              desc: 'Explicit awareness of optical & weather variance; no demographic classification or socioeconomic bias.',
            },
            {
              title: 'Evidence Provenance',
              desc: 'Grounding in recognized public standards (IRC, MoRTH, UNECE) with exact sections and URLs.',
            },
            {
              title: 'AI Limitations',
              desc: 'Plain-language disclosure of optical, contextual, and retrieval bounds without inflated accuracy numbers.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg space-y-1.5"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="uppercase">{item.title}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SECTION: AI TRANSPARENCY (Pipeline Architecture & Flow) */}
      {(activeFilter === 'ALL' || activeFilter === 'PIPELINE') && (
        <div
          id="ai-transparency-section"
          className="bg-[#0F172A] border border-cyan-500/30 rounded-xl p-5 sm:p-6 space-y-6 shadow-xl"
        >
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                AI TRANSPARENCY
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              End-to-end explainability pipeline showing how raw observations become evidence-grounded recommendations.
            </p>
          </div>

          {/* Simple Pipeline Flow Representation */}
          <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 space-y-3 font-mono">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
              The SOLVOFIN Reasoning Flow
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="px-2.5 py-1 bg-slate-900 rounded border border-slate-700 text-white font-bold">
                1. Input
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="px-2.5 py-1 bg-slate-900 rounded border border-slate-700 text-white font-bold">
                2. Computer Vision / Operational Data
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="px-2.5 py-1 bg-slate-900 rounded border border-slate-700 text-white font-bold">
                3. Context
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="px-2.5 py-1 bg-slate-900 rounded border border-slate-700 text-white font-bold">
                4. RAG Evidence Retrieval
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="px-2.5 py-1 bg-slate-900 rounded border border-slate-700 text-white font-bold">
                5. AI Interpretation
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="px-2.5 py-1 bg-slate-900 rounded border border-slate-700 text-white font-bold">
                6. Recommendation
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="px-2.5 py-1 bg-emerald-950/60 rounded border border-emerald-500/50 text-emerald-300 font-bold">
                7. Human Review
              </span>
            </div>
          </div>

          {/* Explicit 5-Way Distinction Mandate */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Clear Separation of Data Sources and System Boundaries:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
              {/* 1. Existing CV Detection */}
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Cpu className="h-4 w-4" />
                  <span>EXISTING CV DETECTION</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  What the computer vision system detected from photographic or video streams (e.g. bounding coordinates, defect class, and raw optical confidence percentage).
                </p>
                <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded">
                  Source: Deep learning inference on camera frames. No semantic reasoning applied at this stage.
                </div>
              </div>

              {/* 2. Live Operational Data */}
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-bold">
                  <Database className="h-4 w-4" />
                  <span>LIVE OPERATIONAL DATA</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  What information was available from Solvofin's live relational records, such as bus vehicle registration, GPS coordinate fixes, open municipal work orders, and corridor bottleneck status.
                </p>
                <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded">
                  Source: Municipal databases, transit schedule APIs, and telemetry beacons.
                </div>
              </div>

              {/* 3. Retrieved Knowledge */}
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <FileText className="h-4 w-4" />
                  <span>RETRIEVED KNOWLEDGE</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  What authoritative engineering documents and regulatory standards were retrieved from the curated corpus using semantic vector matching.
                </p>
                <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded">
                  Source: Public transport regulations (IRC, MoRTH, UNECE, UN-Habitat).
                </div>
              </div>

              {/* 4. AI Interpretation */}
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold">
                  <Sparkles className="h-4 w-4" />
                  <span>AI INTERPRETATION</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  What the AI reasoning engine synthesized from combining optical detections, operational context, and retrieved standards into a qualitative risk evaluation (High, Moderate, Low, or Unable to Determine).
                </p>
                <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded">
                  Nature: Advisory synthesis. Does not constitute an autonomous engineering directive.
                </div>
              </div>

              {/* 5. Human Decision */}
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <UserCheck className="h-4 w-4" />
                  <span>HUMAN DECISION</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  What the authorized municipal engineer or depot manager ultimately decided after inspecting the advisory (ACCEPT, MODIFY, or REJECT), along with their written observations and optional revised directive.
                </p>
                <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded">
                  Authority: The certified human reviewer is the sole authority executing consequential action.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SECTION: PRIVACY & DATA MINIMIZATION */}
      {(activeFilter === 'ALL' || activeFilter === 'PRIVACY') && (
        <div
          id="privacy-data-minimization-section"
          className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-xl"
        >
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                PRIVACY & DATA MINIMIZATION
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Operational data protection, secret isolation, and non-intrusive public infrastructure monitoring.
            </p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            SOLVOFIN operates strictly under the principle of data minimization: collecting and processing only the data necessary for road surface maintenance, transit vehicle component inspection, and commuter route safety.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">1. Minimizing Unnecessary Personal Information</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The computer vision models process road pavement and bus interior fixtures (grab rails, seats, emergency hammers, doorways). The system does NOT perform passenger facial recognition, identity verification, or pedestrian tracking.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">2. Avoid Exposing Sensitive Information</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Spatial coordinates and vehicle identifiers are strictly restricted to municipal assets and public transit routes. Exact personal residence addresses are never linked to citizen hazard reports.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">3. Use of De-Identified / Public / Demo Data</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                In prototype and evaluator environments, all transit fleet telemetry, citizen accounts, and road defect coordinates utilize de-identified, synthetic, or publicly permissible sample data.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">4. Strict Access Control & Role Separation</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Operational data access is bounded by explicit role permissions (Citizen, Government Dispatcher, Transit Engineer, System Admin). Citizens cannot access internal municipal work order finances or contractor logs.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">5. Retention Only for System Operations</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Image frames and telemetry records are retained only for the duration required to verify defects, monitor SLA resolution, and maintain audit traceability for completed work orders.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">6. Protection of API Credentials & Secrets</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All external API credentials, Gemini keys, and database passwords are kept exclusively on the server side in environment variables (`process.env.GEMINI_API_KEY`). Secrets are never exposed to the client or browser DOM.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Info className="h-3.5 w-3.5" />
              <span>Boundary Notice:</span>
            </div>
            <p>
              SOLVOFIN does not claim a formal privacy certification (e.g. ISO/IEC 27701 or statutory GDPR certification) and does not assert legal compliance unless independently certified by an accredited municipal auditor. No real personally identifiable citizen data is accepted or stored in this evaluation prototype.
            </p>
          </div>
        </div>
      )}

      {/* 5. SECTION: FAIRNESS & BIAS CONSIDERATIONS */}
      {(activeFilter === 'ALL' || activeFilter === 'FAIRNESS') && (
        <div
          id="fairness-bias-section"
          className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-xl"
        >
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                FAIRNESS & BIAS CONSIDERATIONS
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Acknowledging physical sensing variations, model boundaries, and prohibiting demographic bias.
            </p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            Computer vision and machine learning models are fundamentally sensitive to input distribution shifts. Optical defect recognition and telematics correlation can behave differently across varied environmental and infrastructural settings.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
              Physical & Environmental Factors That May Impact Model Performance:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded">
                <span className="text-white font-bold text-[11px] block">Lighting Conditions:</span>
                <span className="text-[10px] text-slate-400">
                  Direct sunlight glare, night-time streetlamps, tree canopy shadows, and uneven cabin illumination.
                </span>
              </div>

              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded">
                <span className="text-white font-bold text-[11px] block">Camera Angle & Mounting:</span>
                <span className="text-[10px] text-slate-400">
                  Dashcam pitch, vehicle chassis vibration, smartphone handheld tilt, and lens distortion.
                </span>
              </div>

              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded">
                <span className="text-white font-bold text-[11px] block">Weather & Environment:</span>
                <span className="text-[10px] text-slate-400">
                  Heavy monsoon rain, road surface waterlogging, airborne dust, fog, and seasonal heatwaves.
                </span>
              </div>

              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded">
                <span className="text-white font-bold text-[11px] block">Image Quality & Compression:</span>
                <span className="text-[10px] text-slate-400">
                  Video compression artifacts, motion blur at high vehicle speeds, and varying sensor megapixels.
                </span>
              </div>

              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded">
                <span className="text-white font-bold text-[11px] block">Pavement & Asset Diversity:</span>
                <span className="text-[10px] text-slate-400">
                  Differences between bituminous asphalt, concrete slabs, unpaved gravel connectors, and patched surfaces.
                </span>
              </div>

              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded">
                <span className="text-white font-bold text-[11px] block">Incomplete Training Distribution:</span>
                <span className="text-[10px] text-slate-400">
                  Rare structural defects, non-standard bus retrofit fixtures, or atypical road geometries.
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2 font-mono text-xs">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Prohibition of Social & Demographic Bias:
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside leading-relaxed">
              <li>
                <strong>No Assumptions About People:</strong> The system evaluates physical infrastructure components and vehicular dynamics only. It avoids making assumptions about individuals, drivers, communities, or neighborhoods.
              </li>
              <li>
                <strong>No Socioeconomic Profiling:</strong> Pothole severity, road priority scores, and work order scheduling are calculated from objective geometric dimensions (depth, area, traffic flow volume), never from demographic or socioeconomic criteria.
              </li>
              <li>
                <strong>No Demographic Classifications:</strong> SOLVOFIN does not generate demographic tags, gender labels, or ethnic classifications.
              </li>
              <li>
                <strong>No Synthetic Fairness Scores:</strong> We do not publish automated "fairness ratings" or claim that the system is completely bias-free. Continuous manual oversight and field verification are essential to identify edge-case disparities.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* 6. SECTION: AI SAFETY & BOUNDARIES */}
      {(activeFilter === 'ALL' || activeFilter === 'SAFETY') && (
        <div
          id="ai-safety-section"
          className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-xl"
        >
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-rose-400" />
              <h2 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                AI SAFETY & BOUNDARIES
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Non-autonomous operational limits, fallibility disclosures, and consequential decision boundaries.
            </p>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-lg space-y-2 font-mono text-xs">
            <div className="flex items-center gap-2 text-rose-400 font-bold uppercase">
              <AlertTriangle className="h-4 w-4" />
              <span>Core Safety Directive: Decision Support Only</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              All AI outputs generated by SOLVOFIN—including defect bounding, severity scoring, risk interpretation, and work order suggestions—are strictly intended for <strong>decision support</strong>. The AI system does not possess autonomous authority.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">Human Review Requirement</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Human review by an authorized municipal supervisor or certified bus fleet engineer is mandatory before issuing contractor dispatches, road closures, or bus groundings.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">CV Detection Fallibility</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Computer vision detections may produce false positives (e.g. mistaking a shadow or oil stain for a pothole) or false negatives (failing to detect a fracture under severe glare).
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">RAG Corpus Completeness</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Knowledge retrieval is limited to the documents currently ingested into the knowledge base. Local municipal amendments or novel vehicle chassis designs may not be represented.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">Operational Data Incompleteness</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                GPS telemetry, fleet assignments, or weather data may be delayed, intermittent, or absent during network disconnects.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">Verification Before Consequential Action</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Recommendations must be verified through physical site inspection or calibrated manual measurement before committing municipal budget or issuing citations.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">No Autonomous Legal or Punitive Actions</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The system does not autonomously issue traffic fines, driver suspensions, legal notices, or governmental sanctions.
              </p>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-mono italic">
            SOLVOFIN does not claim guaranteed safety, zero-error rates, or flawless hazard prediction. It is an engineering assistant designed to enhance operational visibility.
          </p>
        </div>
      )}

      {/* 7. SECTION: HUMAN OVERSIGHT & AUDIT TRAIL (Part 4 Integration) */}
      {(activeFilter === 'ALL' || activeFilter === 'OVERSIGHT') && (
        <div
          id="human-oversight-section"
          className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-xl"
        >
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                HUMAN OVERSIGHT & AUDIT TRAIL
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Architecture of the Part 4 Human Review interface, decision workflow, and append-only audit history retention.
            </p>
          </div>

          {/* Workflow Diagram */}
          <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 space-y-3 font-mono">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
              Human Review & Oversight Loop (Part 4 Implementation)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-900 rounded border border-slate-700">
                <span className="text-[10px] text-cyan-400 block uppercase font-bold">Step 1</span>
                <span className="text-white font-bold text-xs">AI Recommendation</span>
                <p className="text-[10px] text-slate-400 mt-1">Generated with evidence references & urgency.</p>
              </div>

              <div className="p-2.5 bg-slate-900 rounded border border-slate-700">
                <span className="text-[10px] text-cyan-400 block uppercase font-bold">Step 2</span>
                <span className="text-white font-bold text-xs">Human Inspection</span>
                <p className="text-[10px] text-slate-400 mt-1">Evaluated by authenticated reviewer.</p>
              </div>

              <div className="p-2.5 bg-slate-900 rounded border border-cyan-500/40">
                <span className="text-[10px] text-cyan-400 block uppercase font-bold">Step 3</span>
                <span className="text-cyan-300 font-bold text-xs">ACCEPTED / MODIFIED / REJECTED</span>
                <p className="text-[10px] text-slate-400 mt-1">Direct reviewer determination recorded.</p>
              </div>

              <div className="p-2.5 bg-slate-900 rounded border border-emerald-500/40">
                <span className="text-[10px] text-emerald-400 block uppercase font-bold">Step 4</span>
                <span className="text-emerald-300 font-bold text-xs">Append-Only Audit Trail</span>
                <p className="text-[10px] text-slate-400 mt-1">Preserves both original AI & human directive.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Key Oversight Features Implemented in SOLVOFIN:
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
                <strong className="text-white block text-xs">Original Recommendation Preservation</strong>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  When a reviewer selects <code className="text-cyan-300 font-bold">[ MODIFY ]</code> and inputs a custom maintenance directive, the original AI recommendation is NOT deleted or overwritten. Both exist side-by-side in the permanent audit record.
                </p>
              </div>

              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
                <strong className="text-white block text-xs">Attributed Reviewer Identity</strong>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Every review decision captures the authenticated session's reviewer identity, operational role (e.g. AUTHORITY, GOVERNMENT, OPERATOR), and an exact ISO timestamp.
                </p>
              </div>

              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
                <strong className="text-white block text-xs">Sequential Review History</strong>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  If an inspection status changes over time (e.g. from PENDING to MODIFIED, and subsequently to ACCEPTED upon depot reinspection), all intermediate events are preserved sequentially.
                </p>
              </div>

              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
                <strong className="text-white block text-xs">No Phantom Sign-Offs</strong>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  If no authenticated session is present, the system records <span className="text-amber-400 italic">"Authenticated Session Unavailable"</span> rather than generating synthetic user credentials.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. SECTION: TRACEABILITY & PROVENANCE */}
      {(activeFilter === 'ALL' || activeFilter === 'OVERSIGHT') && (
        <div
          id="traceability-provenance-section"
          className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-xl"
        >
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                TRACEABILITY & PROVENANCE
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Data schema and real fields stored in the SOLVOFIN AI Infrastructure Insights audit trail.
            </p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            Every insight record generated by SOLVOFIN captures a comprehensive diagnostic snapshot using the system's actual data model, enabling full retrospective evaluation:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded space-y-1">
              <span className="text-[10px] text-cyan-400 font-bold uppercase block">1. Detection Provenance</span>
              <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
                <li>Defect ID & Type</li>
                <li>Component Category</li>
                <li>Raw Optical Confidence</li>
                <li>Bounding Coordinates</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded space-y-1">
              <span className="text-[10px] text-sky-400 font-bold uppercase block">2. Operational Context</span>
              <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
                <li>Vehicle / Bus Match</li>
                <li>Corridor Information</li>
                <li>Open Work Orders Count</li>
                <li>GPS Latitude / Longitude</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded space-y-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase block">3. Retrieved RAG Evidence</span>
              <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
                <li>Document ID & Title</li>
                <li>Issuing Organization</li>
                <li>Exact Section & Clause</li>
                <li>Similarity Score & Web URL</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded space-y-1">
              <span className="text-[10px] text-purple-400 font-bold uppercase block">4. AI Interpretation</span>
              <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
                <li>Qualitative Risk Level</li>
                <li>Engineering Rationale</li>
                <li>Evaluated Contributing Factors</li>
                <li>Generation Timestamp</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded space-y-1">
              <span className="text-[10px] text-cyan-400 font-bold uppercase block">5. AI Recommendation</span>
              <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
                <li>Action Title</li>
                <li>Detailed Action Text</li>
                <li>Urgency Window</li>
                <li>SDG 11 Alignment Note</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-900/90 border border-emerald-500/40 rounded space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">6. Human Review Record</span>
              <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
                <li>Decision Status</li>
                <li>Reviewer Identity & Role</li>
                <li>Review Timestamp</li>
                <li>Reviewer Comment & Directive</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 9. SECTION: RAG SOURCE TRANSPARENCY & RELEVANT EVIDENCE */}
      {(activeFilter === 'ALL' || activeFilter === 'RAG') && (
        <div
          id="rag-source-transparency-section"
          className="bg-[#0F172A] border border-cyan-500/30 rounded-xl p-5 sm:p-6 space-y-6 shadow-xl"
        >
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                RAG SOURCE TRANSPARENCY & KNOWLEDGE BASE
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              How Retrieval-Augmented Generation indexes, retrieves, and cites authoritative engineering standards.
            </p>
          </div>

          {/* RAG Pipeline Explained */}
          <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 space-y-2 font-mono text-xs">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
              High-Level RAG Architecture
            </span>
            <div className="flex flex-wrap items-center gap-2 text-slate-300 text-[11px]">
              <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800">Authoritative Documents</span>
              <ArrowRight className="h-3 w-3 text-cyan-400" />
              <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800">Text Extraction & Metadata</span>
              <ArrowRight className="h-3 w-3 text-cyan-400" />
              <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800">Semantic Chunking</span>
              <ArrowRight className="h-3 w-3 text-cyan-400" />
              <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800">Embedding / TF-IDF Vector Space</span>
              <ArrowRight className="h-3 w-3 text-cyan-400" />
              <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800">Cosine Similarity Search</span>
              <ArrowRight className="h-3 w-3 text-cyan-400" />
              <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800">Relevant Evidence Filtering</span>
              <ArrowRight className="h-3 w-3 text-cyan-400" />
              <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 rounded">Grounded AI Reasoning</span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
              The AI must use retrieved evidence where available to ground its diagnostic rationale. If the cosine similarity score is below the relevance threshold (0.07), the system explicitly indicates: <span className="text-amber-400 italic">"No relevant knowledge-base evidence was retrieved for this case"</span>. The system does not claim that every AI response is automatically complete or correct.
            </p>
          </div>

          {/* Catalog of 7 Real Indexed Documents */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Indexed Engineering Standards & Regulatory Corpus ({realIndexedDocuments.length} Sources):
              </span>
              <span className="text-[10px] font-mono text-cyan-400">Strict Non-Fabrication Rule</span>
            </div>

            <div className="space-y-2.5">
              {realIndexedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 space-y-2 font-mono text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-white text-xs">{doc.title}</strong>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        {doc.organization}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{doc.id}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div>
                      <span className="text-slate-500">Section: </span>
                      <span className="text-slate-300">{doc.section}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Official Link: </span>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
                      >
                        {doc.url} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 italic bg-slate-950/60 p-2 rounded border border-slate-800/80">
                    "{doc.coverage}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 10. SECTION: AI LIMITATIONS */}
      {(activeFilter === 'ALL' || activeFilter === 'SAFETY') && (
        <div
          id="ai-limitations-section"
          className="bg-[#0F172A] border border-amber-500/30 rounded-xl p-5 sm:p-6 space-y-4 shadow-xl"
        >
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h2 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                AI LIMITATIONS
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Honest disclosure of actual boundaries and edge-case failure modes in the current application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">CV Detections Can Be Imperfect</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Optical defect detection models cannot guarantee 100% precision. Occlusions, rain drops on camera lenses, and unusual surface shadows can cause misclassifications.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">Image & Video Quality Direct Impact</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Low-resolution phone sensors, night-time noise, or high-speed motion blur substantially degrade bounding box localization accuracy.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">Missing Telemetry Weakens Context</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                If a citizen photo upload lacks EXIF GPS tags or a transit bus enters a tunnel GPS dead-zone, the system cannot automatically correlate corridor bottleneck history.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">RAG Depends on Ingested Documents</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The RAG engine retrieves information strictly from the 7 curated reference frameworks. Questions on unrelated domains or undocumented local municipal codes cannot be answered with authoritative grounding.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">Retrieved Evidence Coverage Gaps</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Even authoritative standards do not prescribe solutions for every bespoke vehicle customization or localized asphalt blend.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-1">
              <strong className="text-white block text-xs">AI Reasoning Fallibility</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Language models may synthesize overly conservative risk levels or miss nuances in complex multiparty municipal jurisdictions.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="text-amber-400 font-bold block mb-0.5">Strict Reporting Rule:</span>
            No artificial benchmark numbers or fabricated accuracy metrics (such as "99% accuracy" or "zero-latency guarantees") are published in this prototype.
          </div>
        </div>
      )}

      {/* 11. SECTION: SUSTAINABILITY PURPOSE & SDG 11 / TARGET 11.2 */}
      {(activeFilter === 'ALL' || activeFilter === 'SUSTAINABILITY') && (
        <div
          id="sustainability-sdg11-section"
          className="bg-[#0F172A] border border-emerald-500/30 rounded-xl p-5 sm:p-6 space-y-6 shadow-xl"
        >
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                SUSTAINABILITY PURPOSE — UN SDG 11
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              How SOLVOFIN supports sustainable cities, safer public transport, and urban infrastructure durability.
            </p>
          </div>

          {/* Primary SDG Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Globe className="h-4 w-4" />
                <span>PRIMARY SDG: GOAL 11</span>
              </div>
              <strong className="text-white block text-sm">
                Sustainable Cities and Communities
              </strong>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                SOLVOFIN <strong>supports</strong> safer and more sustainable urban mobility by helping transport stakeholders monitor infrastructure, identify potential defects, and make evidence-informed maintenance decisions.
              </p>
              <span className="text-[10px] text-emerald-400/90 block pt-1">
                Role: Decision-support tool for municipal road inspection and transit asset management.
              </span>
            </div>

            <div className="p-4 bg-cyan-950/20 border border-cyan-500/40 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Bus className="h-4 w-4" />
                <span>SDG 11 TARGET 11.2</span>
              </div>
              <strong className="text-white block text-sm">
                Sustainable Transport & Accessible Mobility
              </strong>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Target 11.2 focuses on providing access to safe, affordable, accessible, and sustainable transport systems for all, improving road safety, notably by expanding public transport, with special attention to vulnerable road users.
              </p>
              <span className="text-[10px] text-cyan-400/90 block pt-1">
                Relevance: Proactive inspection of bus handrails, passenger safety equipment, and road corridors.
              </span>
            </div>
          </div>

          {/* Environmental Impact Language — Strictly Non-Fabricated */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 font-mono text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-bold uppercase">
              <Info className="h-4 w-4 text-cyan-400" />
              <span>Environmental & Carbon Impact Transparency</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              While proactive pavement maintenance and corridor decongestion theoretically reduce vehicle rolling resistance and vehicle idling emissions, <strong>environmental impact metrics have not yet been empirically measured in this prototype.</strong>
            </p>
            <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-[10px] text-slate-400">
              <strong>Mandatory Reporting Boundary:</strong> SOLVOFIN does not publish synthetic claims regarding tonnes of CO2 saved, liters of diesel fuel conserved, percentage emissions reductions, or financial cost savings without formal empirical instrumentation.
            </div>
          </div>

          {/* UN Endorsement Boundary */}
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <span className="text-amber-400 font-bold block">Institutional Boundary Statement:</span>
            <p>
              SOLVOFIN is an academic engineering capstone and prototype decision-support system. It is <strong>not</strong> an official United Nations program and does not claim official UN endorsement or partnership. The project voluntarily references UN SDG 11 Target 11.2 indicators to guide its architectural purpose and technical objectives.
            </p>
          </div>
        </div>
      )}

      {/* 12. Footer with Engineering Authorship */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-500">
        <div>
          SOLVOFIN Decision Support System • Anil Neerukonda Institute of Technology and Sciences (ANITS)
        </div>
        <div className="flex items-center gap-3">
          <span>Part 5: Responsible AI & SDG 11</span>
          <span className="text-cyan-400">● Live Prototype</span>
        </div>
      </div>
    </div>
  );
};
