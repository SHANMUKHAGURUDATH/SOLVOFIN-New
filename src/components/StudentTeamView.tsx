import React from 'react';
import {
  GraduationCap,
  Building2,
  BookOpen,
  Code2,
  Mail,
  Github,
  Linkedin,
  ExternalLink,
  Cpu,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Compass,
} from 'lucide-react';

export const StudentTeamView: React.FC = () => {
  return (
    <div id="anits-team-page" className="space-y-6 pb-12 max-w-5xl mx-auto animate-fadeIn">
      {/* Top Banner / Breadcrumb */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <GraduationCap className="w-56 h-56 text-emerald-400" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-mono font-bold text-amber-400">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>CONTACT ME</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
              Panangipalli Shanmukha GuruDath
            </h1>
            <p className="text-base sm:text-lg font-semibold text-emerald-400 flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              <span>Lead Developer — Solvofin</span>
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
            <span className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 font-medium">
              <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
              B.Tech CSE
            </span>
            <span className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 font-medium">
              <Building2 className="h-3.5 w-3.5 text-amber-400" />
              Anil Neerukonda Institute of Technology & Sciences (ANITS)
            </span>
          </div>
        </div>
      </div>

      {/* Project Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>PROJECT</span>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            SOLVOFIN
          </h2>
          <p className="text-sm sm:text-base font-semibold text-slate-200">
            AI-Powered Mobile Urban Intelligence Platform for Safer and Sustainable Public Transport
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 text-sm text-slate-300 leading-relaxed font-sans">
          "Designed and developed end-to-end as an AI-powered urban mobility intelligence platform integrating computer vision, RAG, analytics, decision support, human review, reporting, and responsible AI."
        </div>

        {/* Technical Core Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Cpu className="h-3.5 w-3.5" />
              <span>Computer Vision Intelligence</span>
            </div>
            <p className="text-xs text-slate-400">
              Automated pothole volumetric estimation, crack classification, and road safety defect detection.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Grounded Knowledge RAG</span>
            </div>
            <p className="text-xs text-slate-400">
              Evidence-based retrieval from IRC:82-2015, MoRTH specifications, AIS-140, and UN SDG 11 standards.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
              <Layers className="h-3.5 w-3.5" />
              <span>Telemetry & Urban Analytics</span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time heatwave vulnerability indexing, transit corridor bottlenecks, and live GIS map tracking.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Human Review & Work Orders</span>
            </div>
            <p className="text-xs text-slate-400">
              Municipal BOQ material estimates, engineer dispatch approval queues, and complete audit trails.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Responsible AI & Ethics</span>
            </div>
            <p className="text-xs text-slate-400">
              Differential privacy blur for faces/plates, zero automated enforcement, and transparency auditing.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
              <Compass className="h-3.5 w-3.5" />
              <span>Controlled AI Navigator</span>
            </div>
            <p className="text-xs text-slate-400">
              Read-only evidence-grounded search with tool allowlisting, rapid view jumping, and role guards.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
          <Mail className="h-4 w-4" />
          <span>CONTACT</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Email */}
          <a
            id="developer-email-link"
            href="mailto:gurudath2007@gmail.com"
            className="group flex flex-col p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-950 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-400 transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider font-mono">
                <Mail className="h-4 w-4 text-emerald-400" />
                <span>Email</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
            </div>
            <span className="mt-3 text-sm font-medium text-slate-100 group-hover:text-emerald-300 break-all transition-colors">
              gurudath2007@gmail.com
            </span>
          </a>

          {/* GitHub */}
          <a
            id="developer-github-link"
            href="https://github.com/SHANMUKHAGURUDATH"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-950 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between text-slate-400 group-hover:text-cyan-400 transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider font-mono">
                <Github className="h-4 w-4 text-cyan-400" />
                <span>GitHub</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
            </div>
            <span className="mt-3 text-sm font-medium text-slate-100 group-hover:text-cyan-300 break-all transition-colors">
              https://github.com/SHANMUKHAGURUDATH
            </span>
          </a>

          {/* LinkedIn */}
          <a
            id="developer-linkedin-link"
            href="https://www.linkedin.com/in/panangipalli-shanmukha-gurudath-939b20364"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-950 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between text-slate-400 group-hover:text-blue-400 transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider font-mono">
                <Linkedin className="h-4 w-4 text-blue-400" />
                <span>LinkedIn</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
            </div>
            <span className="mt-3 text-sm font-medium text-slate-100 group-hover:text-blue-300 break-all transition-colors">
              https://www.linkedin.com/in/panangipalli-shanmukha-gurudath-939b20364
            </span>
          </a>
        </div>
      </div>

      {/* Institutional Affiliation Footer */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-center text-xs text-slate-400">
        <p className="font-semibold text-slate-300">
          Department of Computer Science & Engineering (B.Tech CSE)
        </p>
        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
          Anil Neerukonda Institute of Technology & Sciences (ANITS), Sangivalasa, Visakhapatnam
        </p>
      </div>
    </div>
  );
};
