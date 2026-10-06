import React from "react";
import {
  UploadCloud,
  Cpu,
  CheckCircle2,
  Binary,
  Database,
  BrainCircuit,
  Share2,
  TrendingUp,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Case, InvestigationDocument, FinalNetwork } from "../types";

interface PipelineOverviewProps {
  activeCase: Case | null;
  documents: InvestigationDocument[];
  finalNetwork: FinalNetwork | null;
  onNavigateTab: (tab: any) => void;
}

export const PipelineOverview: React.FC<PipelineOverviewProps> = ({
  activeCase,
  documents,
  finalNetwork,
  onNavigateTab,
}) => {
  const verifiedCount = documents.filter((d) => d.verificationStatus === "APPROVED").length;
  const pendingCount = documents.filter((d) => d.verificationStatus === "PENDING").length;

  const steps = [
    {
      step: 1,
      id: "ingestion",
      title: "Heterogeneous Data Input",
      desc: "Upload PDFs, FIRs, CDRs, Financial logs, Surveillance photos",
      icon: UploadCloud,
      status: documents.length > 0 ? "active" : "pending",
      badge: `${documents.length} Files`,
    },
    {
      step: 2,
      id: "ingestion",
      title: "Raspberry Pi OCR/HTR",
      desc: "Edge OCR/HTR extraction on Raspberry Pi 4 Model B (TrOCR + Tesseract v5)",
      icon: Cpu,
      status: documents.some((d) => d.requiresOcr) ? "active" : "pending",
      badge: "Edge Node Online",
    },
    {
      step: 3,
      id: "ingestion",
      title: "Investigator Verification",
      desc: "STRICT HUMAN-IN-THE-LOOP GATE: Review & approve raw text before AI processing",
      icon: CheckCircle2,
      status: verifiedCount > 0 ? "active" : pendingCount > 0 ? "warning" : "pending",
      badge: `${verifiedCount} Approved`,
      isGate: true,
    },
    {
      step: 4,
      id: "first-llm",
      title: "First LLM: Structuring",
      desc: "Information extraction: Entities (Persons, Orgs, Phones, Weapons) into strict JSON schema",
      icon: Binary,
      status: verifiedCount > 0 ? "active" : "pending",
      badge: "JSON Schema",
    },
    {
      step: 5,
      id: "pipeline",
      title: "Central Database",
      desc: "Stores full evidence lineage: Raw text -> Approved text -> 1st LLM JSON -> 2nd LLM Graph",
      icon: Database,
      status: "active",
      badge: "Traceable",
    },
    {
      step: 6,
      id: "second-llm",
      title: "Second Fine-Tuned LLM",
      desc: "Deeper reasoning: Detects hidden/indirect links, prunes hallucinations, attributes quotes",
      icon: BrainCircuit,
      status: finalNetwork ? "active" : "pending",
      badge: finalNetwork ? "Network Validated" : "Awaiting Run",
    },
    {
      step: 7,
      id: "network-graph",
      title: "Criminal Network Graph",
      desc: "Interactive graph with explainable relationships, evidence quotes & centrality metrics",
      icon: Share2,
      status: finalNetwork ? "active" : "pending",
      badge: finalNetwork ? `${finalNetwork.nodes.length} Nodes` : "Standby",
    },
    {
      step: 8,
      id: "predictions",
      title: "Prediction & Threat Risk",
      desc: "Forecasts emerging connections, key influencer vulnerabilities, and expansion risks",
      icon: TrendingUp,
      status: "active",
      badge: "Predictive",
    },
    {
      step: 9,
      id: "feedback",
      title: "Post-Investigation Loop",
      desc: "Ground-truth feedback logging & continuous AI model fine-tuning dataset generator",
      icon: RotateCcw,
      status: "active",
      badge: "Retraining",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Tactical Top Dossier Banner */}
      <div className="bg-[#121927] border border-[#1f2c42] rounded-lg p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1b2639] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                CASE ACTIVE // {activeCase?.caseNumber}
              </span>
              <span className="text-xs font-mono text-slate-400 bg-[#172233] px-2 py-0.5 rounded">
                {activeCase?.classification}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight mt-1.5">
              {activeCase?.title}
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl mt-1 leading-relaxed">
              {activeCase?.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab("ingestion")}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition flex items-center gap-2 shadow"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Evidence File
            </button>
            <button
              onClick={() => onNavigateTab("network-graph")}
              className="px-3.5 py-2 bg-[#1b283d] hover:bg-[#23344f] border border-[#2b3e5e] text-slate-200 rounded text-xs font-medium transition flex items-center gap-2"
            >
              <Share2 className="w-4 h-4 text-blue-400" />
              View Network Graph
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs font-mono">
          <div className="bg-[#0e1420] border border-[#192334] rounded p-2.5">
            <div className="text-slate-400 text-[11px]">Total Case Documents</div>
            <div className="text-lg font-bold text-slate-100 mt-0.5">{documents.length}</div>
          </div>
          <div className="bg-[#0e1420] border border-[#192334] rounded p-2.5">
            <div className="text-slate-400 text-[11px]">Investigator Verified</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{verifiedCount} / {documents.length}</div>
          </div>
          <div className="bg-[#0e1420] border border-[#192334] rounded p-2.5">
            <div className="text-slate-400 text-[11px]">Extracted Network Entities</div>
            <div className="text-lg font-bold text-blue-400 mt-0.5">{finalNetwork?.nodes.length || 0}</div>
          </div>
          <div className="bg-[#0e1420] border border-[#192334] rounded p-2.5">
            <div className="text-slate-400 text-[11px]">Validated Relationships</div>
            <div className="text-lg font-bold text-purple-400 mt-0.5">{finalNetwork?.edges.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Strict Pipeline Architecture View */}
      <div className="bg-[#121927] border border-[#1f2c42] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              End-to-End Operational Pipeline & Data Lineage
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict separation: Raw Evidence → Raspberry Pi OCR → Investigator Verification Gate → First LLM → Central DB → Second LLM Reasoning → Network Graph → Prediction → Feedback Loop
            </p>
          </div>
        </div>

        {/* Pipeline Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                onClick={() => onNavigateTab(s.id)}
                className={`p-3.5 rounded-lg border transition cursor-pointer relative flex flex-col justify-between ${
                  s.isGate
                    ? "bg-[#182019] border-emerald-500/50 hover:border-emerald-400"
                    : "bg-[#0e1420] border-[#1e2b3e] hover:border-[#2f4362]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 px-1.5 py-0.5 bg-[#172233] rounded">
                      STEP 0{s.step}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        s.status === "active"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : s.status === "warning"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {s.badge}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${
                        s.isGate
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-[#162338] text-slate-300 border border-[#23354f]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                        {s.title}
                        {s.isGate && (
                          <span className="text-[9px] text-amber-400 font-mono font-normal">
                            [MANDATORY GATE]
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#1a2536] flex items-center justify-between text-[11px] text-blue-400 hover:text-blue-300 font-medium">
                  <span>Open Stage Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Human in the loop strict notice */}
        <div className="mt-4 p-3 rounded bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">Mandatory Human-in-the-Loop Protocol:</span>{" "}
            Per NCRB and MHA security specifications, the AI pipeline will strictly refuse to process unapproved OCR extractions. Investigators must inspect and approve all documents in Step 2 before the First LLM and Second Fine-Tuned LLM can synthesize criminal intelligence.
          </div>
        </div>
      </div>
    </div>
  );
};
