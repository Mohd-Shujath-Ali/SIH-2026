import React, { useState } from "react";
import {
  Binary,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Users,
  Building2,
  MapPin,
  Car,
  Phone,
  CreditCard,
  Crosshair,
  ArrowRight,
  Clock,
  Database,
  Layers,
} from "lucide-react";
import { Case, InvestigationDocument, FirstLlmOutput, Entity } from "../types";

interface FirstLlmExtractionProps {
  activeCase: Case | null;
  documents: InvestigationDocument[];
  firstLlmOutputs: FirstLlmOutput[];
  onRunFirstLlm: (docId: string) => Promise<void>;
  onNavigateToSecondLlm: () => void;
}

export const FirstLlmExtraction: React.FC<FirstLlmExtractionProps> = ({
  activeCase,
  documents,
  firstLlmOutputs,
  onRunFirstLlm,
  onNavigateToSecondLlm,
}) => {
  const approvedDocs = documents.filter((d) => d.verificationStatus === "APPROVED");
  const [selectedDocId, setSelectedDocId] = useState<string>(
    approvedDocs[0]?.id || documents[0]?.id || ""
  );
  const [viewMode, setViewMode] = useState<"ENTITIES" | "JSON" | "EVENTS">("ENTITIES");
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [activeFilterType, setActiveFilterType] = useState<string>("ALL");

  const selectedDoc = documents.find((d) => d.id === selectedDocId);
  const currentOutput = firstLlmOutputs.find((o) => o.documentId === selectedDocId);

  const handleTriggerExtraction = async () => {
    if (!selectedDocId) return;
    setIsExtracting(true);
    try {
      await onRunFirstLlm(selectedDocId);
    } finally {
      setIsExtracting(false);
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "PERSON":
        return <Users className="w-3.5 h-3.5 text-emerald-400" />;
      case "ORGANIZATION":
        return <Building2 className="w-3.5 h-3.5 text-blue-400" />;
      case "LOCATION":
        return <MapPin className="w-3.5 h-3.5 text-amber-400" />;
      case "VEHICLE":
        return <Car className="w-3.5 h-3.5 text-purple-400" />;
      case "PHONE":
        return <Phone className="w-3.5 h-3.5 text-cyan-400" />;
      case "FINANCIAL_ACCOUNT":
        return <CreditCard className="w-3.5 h-3.5 text-yellow-400" />;
      case "WEAPON":
        return <Crosshair className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredEntities = currentOutput
    ? activeFilterType === "ALL"
      ? currentOutput.entities
      : currentOutput.entities.filter((e) => e.type === activeFilterType)
    : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#121927] border border-[#1f2c42] rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
              <Binary className="w-4 h-4" />
              <span>STAGE 4 // FIRST LLM: INFORMATION EXTRACTION & STRUCTURING</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">
              Structured Entity & Explicit Relationship Extraction
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              After investigator approval, the first LLM processes the validated text to extract named entities (Suspects, Couriers, Shell Orgs, Locations, Burner Phones, Vehicles, Weapons, Financial Records), identifies basic in-document relationships, and maps everything into a standardized JSON schema stored in the Central Database.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToSecondLlm}
              className="px-4 py-2 bg-[#1b283d] hover:bg-[#223552] border border-[#293e62] rounded text-xs text-purple-300 font-semibold transition flex items-center gap-2"
            >
              <span>Next: Second Fine-Tuned LLM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Approved Documents Selection (4 cols) */}
        <div className="lg:col-span-4 bg-[#121927] border border-[#1f2c42] rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Approved Document
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                {approvedDocs.length} Approved
              </span>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {documents.map((doc) => {
                const hasExtracted = firstLlmOutputs.some((o) => o.documentId === doc.id);
                const isApproved = doc.verificationStatus === "APPROVED";

                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`p-3 rounded border text-xs cursor-pointer transition ${
                      selectedDoc?.id === doc.id
                        ? "bg-[#182335] border-blue-500/70"
                        : "bg-[#0e1420] border-[#1c2738] hover:border-slate-600"
                    } ${!isApproved ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-slate-200 truncate">
                        {doc.filename}
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 border ${
                          isApproved
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        }`}
                      >
                        {doc.verificationStatus}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center justify-between">
                      <span>{doc.fileType}</span>
                      {hasExtracted ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> JSON Stored
                        </span>
                      ) : (
                        <span className="text-slate-400">Not Extracted</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1b2638]">
            <button
              onClick={handleTriggerExtraction}
              disabled={isExtracting || selectedDoc?.verificationStatus !== "APPROVED"}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded text-xs font-semibold transition flex items-center justify-center gap-2 shadow"
            >
              {isExtracting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  First LLM Extracting JSON...
                </>
              ) : selectedDoc?.verificationStatus !== "APPROVED" ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Approval Required to Extract
                </>
              ) : (
                <>
                  <Binary className="w-4 h-4" />
                  Execute First LLM Extraction
                </>
              )}
            </button>
          </div>
        </div>

        {/* Extraction Results & Structured Schema Console (8 cols) */}
        <div className="lg:col-span-8 bg-[#121927] border border-[#1f2c42] rounded-lg p-5 flex flex-col justify-between">
          <div>
            {/* Header with Sub-tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2638] pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  First LLM Structured JSON Schema
                </h3>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Target Document: {selectedDoc?.filename || "None"}
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-[#0d131f] border border-[#1e2a3c] p-1 rounded text-xs">
                <button
                  onClick={() => setViewMode("ENTITIES")}
                  className={`px-3 py-1 rounded transition ${
                    viewMode === "ENTITIES"
                      ? "bg-[#1d2b40] text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Entities ({currentOutput?.entities.length || 0})
                </button>
                <button
                  onClick={() => setViewMode("JSON")}
                  className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
                    viewMode === "JSON"
                      ? "bg-[#1d2b40] text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Raw JSON
                </button>
                <button
                  onClick={() => setViewMode("EVENTS")}
                  className={`px-3 py-1 rounded transition ${
                    viewMode === "EVENTS"
                      ? "bg-[#1d2b40] text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Events & Links
                </button>
              </div>
            </div>

            {/* Content Area */}
            {!currentOutput ? (
              <div className="p-12 text-center border border-dashed border-[#223046] rounded-lg text-slate-400 text-xs">
                <Binary className="w-8 h-8 text-blue-400/60 mx-auto mb-2" />
                No First LLM structured output generated yet for this document.
                {selectedDoc?.verificationStatus === "APPROVED" ? (
                  <p className="mt-1 text-slate-300">
                    Click <strong>"Execute First LLM Extraction"</strong> on the left to extract structured entities and JSON schema.
                  </p>
                ) : (
                  <p className="mt-1 text-amber-400">
                    This document is pending investigator approval. Approve it in Stage 2 first.
                  </p>
                )}
              </div>
            ) : viewMode === "ENTITIES" ? (
              <div className="space-y-3">
                {/* Category filter pills */}
                <div className="flex flex-wrap gap-1.5 pb-2 border-b border-[#182333] text-[11px] font-mono">
                  {["ALL", "PERSON", "ORGANIZATION", "LOCATION", "VEHICLE", "PHONE", "WEAPON", "FINANCIAL_ACCOUNT"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveFilterType(cat)}
                      className={`px-2 py-0.5 rounded border transition ${
                        activeFilterType === cat
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/50"
                          : "bg-[#0d131f] text-slate-400 border-[#1c2738] hover:text-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Entity Table */}
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {filteredEntities.map((ent) => (
                    <div
                      key={ent.id}
                      className="p-3 bg-[#0d131f] border border-[#1b2638] rounded text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-[#152030] border border-[#21324c] flex items-center justify-center shrink-0">
                          {getEntityIcon(ent.type)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200 flex items-center gap-2">
                            {ent.name}
                            {ent.aliases && ent.aliases.length > 0 && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                [aka {ent.aliases.join(", ")}]
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Role: {ent.role}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span className="text-slate-400">{ent.type}</span>
                        <span className="text-emerald-400 font-bold">
                          {(ent.confidence * 100).toFixed(0)}% Conf
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : viewMode === "JSON" ? (
              <div>
                <pre className="p-3 bg-[#080d15] border border-[#192435] rounded font-mono text-[11px] text-emerald-300 max-h-[440px] overflow-y-auto leading-relaxed">
                  {JSON.stringify(currentOutput, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-200">
                  Extracted Case Events
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(currentOutput.extractedEvents || []).map((ev, i) => (
                    <div key={i} className="p-2.5 bg-[#0d131f] border border-[#1b2638] rounded text-xs">
                      <div className="font-semibold text-slate-200">{ev.eventName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{ev.description}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        Location: {ev.location} | Date: {ev.date}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-xs font-semibold text-slate-200 pt-2">
                  Explicit In-Document Relationships ({currentOutput.rawRelationships.length})
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {currentOutput.rawRelationships.map((r) => (
                    <div key={r.id} className="p-2.5 bg-[#0d131f] border border-[#1b2638] rounded text-xs">
                      <div className="font-mono text-blue-400 font-medium">
                        {r.sourceId} &rarr; <span className="text-slate-200">{r.relationType}</span> &rarr; {r.targetId}
                      </div>
                      {r.evidence[0] && (
                        <div className="text-[11px] text-slate-400 mt-1 italic border-l-2 border-blue-500/50 pl-2">
                          "{r.evidence[0].quoteExcerpt}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#1b2638] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Schema: NCRB-JSON-v1.0.4 // Central DB Synchronized</span>
            <span>Generated: {currentOutput?.generatedAt || "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
