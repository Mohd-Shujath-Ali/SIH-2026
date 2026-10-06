import React from "react";
import { Case, RpiStatus } from "../types";
import {
  Shield,
  Cpu,
  Sparkles,
  ChevronDown,
  FolderOpen,
  Plus,
  RefreshCw,
} from "lucide-react";

interface HeaderProps {
  cases: Case[];
  activeCase: Case | null;
  onSelectCase: (caseId: string) => void;
  onOpenNewCaseModal: () => void;
  rpiStatus: RpiStatus | null;
  onRefreshData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cases,
  activeCase,
  onSelectCase,
  onOpenNewCaseModal,
  rpiStatus,
  onRefreshData,
}) => {
  return (
    <header className="border-b border-[#20293a] bg-[#0c1018] select-none sticky top-0 z-40">
      {/* Classification Banner - directly inspired by AIP Defense in screenshot */}
      <div className="bg-[#107038] text-white text-[11px] font-bold tracking-widest text-center py-0.5 px-4 uppercase flex items-center justify-between shadow-inner">
        <span className="text-emerald-200 opacity-90 hidden sm:inline">NCRB</span>
        <span className="mx-auto flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
          UNCLASSIFIED
        </span>
        <span className="text-emerald-200 opacity-90 text-[10px] hidden sm:inline font-mono">
          SEC-ID: 26189-NCRB
        </span>
      </div>

      {/* Main Header Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Organization & Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500/20 to-blue-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100 tracking-tight font-mono">
                NCRB AIP
              </span>
              <span className="text-slate-500 text-xs">/</span>
              <h1 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Criminal Network Analysis System
              </h1>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
              <span>MHA // Women Safety Division</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400">Pipeline Active</span>
            </div>
          </div>
        </div>

        {/* Center: Case Selector */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center bg-[#131b28] border border-[#223048] rounded px-2.5 py-1.5 text-xs text-slate-200 hover:border-slate-500 transition-colors">
            <FolderOpen className="w-3.5 h-3.5 text-blue-400 mr-2 shrink-0" />
            <span className="text-slate-400 text-[11px] mr-1.5 hidden md:inline">Case:</span>
            <select
              id="case-select"
              value={activeCase?.id || ""}
              onChange={(e) => onSelectCase(e.target.value)}
              className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer pr-4"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#121824] text-slate-200">
                  {c.caseNumber} - {c.title.substring(0, 32)}...
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-2" />
          </div>

          <button
            id="new-case-btn"
            onClick={onOpenNewCaseModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#172336] hover:bg-[#1e2f49] border border-[#253957] rounded text-xs text-slate-300 hover:text-white transition"
            title="Create New Investigation Case"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline text-[11px]">New Case</span>
          </button>
        </div>

        {/* Right: Telemetry Indicators */}
        <div className="flex items-center gap-2.5">
          {/* Raspberry Pi Hardware Status */}
          <div
            id="rpi-telemetry-badge"
            className="flex items-center gap-2 px-2.5 py-1 bg-[#111927] border border-[#1e2d42] rounded text-[11px] font-mono text-slate-300"
            title={`Raspberry Pi OCR/HTR: ${rpiStatus?.online ? "Connected" : "Unreachable"} | Node: ${rpiStatus?.deviceIp || "ali.tail743e77.ts.net"} | Latency: ${rpiStatus?.lastPingMs || 0}ms`}
          >
            <Cpu className={`w-3.5 h-3.5 ${rpiStatus?.online ? "text-emerald-400" : "text-amber-400"}`} />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 leading-tight">RPi OCR Node</span>
              <span className={`text-[10px] font-semibold leading-tight flex items-center gap-1 ${rpiStatus?.online ? "text-emerald-400" : "text-amber-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${rpiStatus?.online ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`}></span>
                {rpiStatus?.online ? `ONLINE (${rpiStatus.lastPingMs || 42}ms)` : "OFFLINE"}
              </span>
            </div>
          </div>

          {/* AI LLM Dual Engine Status */}
          <div
            id="llm-telemetry-badge"
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#111927] border border-[#1e2d42] rounded text-[11px] font-mono text-slate-300"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 leading-tight">Dual-LLM Engine</span>
              <span className="text-[10px] text-purple-300 font-semibold leading-tight">
                1st Extract + 2nd Reason
              </span>
            </div>
          </div>

          {/* Refresh Action */}
          <button
            id="refresh-data-btn"
            onClick={onRefreshData}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#1c273a] rounded border border-[#202d40] transition"
            title="Refresh All Investigation Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
