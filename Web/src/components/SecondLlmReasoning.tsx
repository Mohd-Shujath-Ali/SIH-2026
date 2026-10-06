import React, { useState } from "react";
import {
  BrainCircuit,
  Sparkles,
  ShieldCheck,
  Filter,
  Eye,
  AlertOctagon,
  FileText,
  ArrowRight,
  RefreshCw,
  Code2,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { FinalNetwork, Case, Relationship, Entity } from "../types";

interface SecondLlmReasoningProps {
  activeCase: Case | null;
  finalNetwork: FinalNetwork | null;
  onRunSecondLlm: () => Promise<void>;
  onNavigateToGraph: () => void;
}

export const SecondLlmReasoning: React.FC<SecondLlmReasoningProps> = ({
  activeCase,
  finalNetwork,
  onRunSecondLlm,
  onNavigateToGraph,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"HIDDEN" | "PRUNED" | "ALL_EDGES" | "RAW_JSON">("HIDDEN");
  const [selectedEdge, setSelectedEdge] = useState<Relationship | null>(
    finalNetwork?.edges.find((e) => e.isHiddenConnection) || finalNetwork?.edges[0] || null
  );

  const handleExecute = async () => {
    setIsRunning(true);
    try {
      await onRunSecondLlm();
    } finally {
      setIsRunning(false);
    }
  };

  const hiddenEdges = finalNetwork?.edges.filter((e) => e.isHiddenConnection) || [];
  const prunedEdges = finalNetwork?.prunedEdges || [];

  const getEntityName = (id: string) => {
    return finalNetwork?.nodes.find((n) => n.id === id)?.name || id;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#121927] border border-[#1f2c42] rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400">
              <BrainCircuit className="w-4 h-4" />
              <span>STAGE 6 // SECOND FINE-TUNED LLM: DEEP REASONING & VALIDATION LAYER</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">
              Cross-Evidence Synthesis, Hidden Link Discovery & Hallucination Pruning
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              The second fine-tuned LLM does not blindly trust the first LLM's outputs. It cross-examines all approved case documents, discovers indirect connections (financial mirroring, cell tower co-location, shared logistics fronts), and aggressively prunes weak or hallucinated links with forensic justification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExecute}
              disabled={isRunning}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded text-xs font-semibold transition flex items-center gap-2 shadow"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Reasoning & Validating Graph...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Second LLM Reasoning
                </>
              )}
            </button>

            <button
              onClick={onNavigateToGraph}
              className="px-4 py-2 bg-[#1b283d] hover:bg-[#23344f] border border-[#2b3e5e] text-blue-300 rounded text-xs font-semibold transition flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Open Network Graph</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Reasoning Metrics */}
        {finalNetwork && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-[#1b2638] text-xs font-mono">
            <div className="p-2.5 bg-[#0e1420] border border-[#192334] rounded">
              <span className="text-slate-400 text-[11px]">Validated Entities:</span>
              <div className="text-lg font-bold text-slate-100 mt-0.5">
                {finalNetwork.nodes.length}
              </div>
            </div>
            <div className="p-2.5 bg-[#0e1420] border border-[#192334] rounded">
              <span className="text-slate-400 text-[11px]">Verified Connections:</span>
              <div className="text-lg font-bold text-blue-400 mt-0.5">
                {finalNetwork.edges.length}
              </div>
            </div>
            <div className="p-2.5 bg-[#0e1420] border border-[#192334] rounded">
              <span className="text-slate-400 text-[11px]">Hidden Patterns Discovered:</span>
              <div className="text-lg font-bold text-purple-400 mt-0.5">
                {finalNetwork.networkMetrics.hiddenPatternsCount}
              </div>
            </div>
            <div className="p-2.5 bg-[#0e1420] border border-[#192334] rounded">
              <span className="text-slate-400 text-[11px]">Hallucinations Pruned:</span>
              <div className="text-lg font-bold text-red-400 mt-0.5">
                {finalNetwork.networkMetrics.prunedNoiseCount}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reasoning Summary Note */}
      {finalNetwork?.reasoningSummary && (
        <div className="p-4 bg-[#141b2b] border border-purple-500/30 rounded-lg text-xs flex items-start gap-3">
          <BrainCircuit className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-purple-300 font-mono">
              Second Fine-Tuned LLM Synthesis Log:
            </span>
            <p className="text-slate-300 mt-1 leading-relaxed">
              {finalNetwork.reasoningSummary}
            </p>
          </div>
        </div>
      )}

      {/* Main Analysis Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 cols: Filtered Relationships List */}
        <div className="lg:col-span-6 bg-[#121927] border border-[#1f2c42] rounded-lg p-5">
          {/* Sub-tabs */}
          <div className="flex items-center justify-between border-b border-[#1b2638] pb-3 mb-4">
            <div className="flex items-center gap-1.5 bg-[#0d131f] border border-[#1e2a3c] p-1 rounded text-xs">
              <button
                onClick={() => setActiveTab("HIDDEN")}
                className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
                  activeTab === "HIDDEN"
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/50 font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                Hidden / Indirect ({hiddenEdges.length})
              </button>
              <button
                onClick={() => setActiveTab("PRUNED")}
                className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
                  activeTab === "PRUNED"
                    ? "bg-red-600/30 text-red-300 border border-red-500/50 font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                Pruned Noise ({prunedEdges.length})
              </button>
              <button
                onClick={() => setActiveTab("ALL_EDGES")}
                className={`px-3 py-1 rounded transition ${
                  activeTab === "ALL_EDGES"
                    ? "bg-[#1d2b40] text-white font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All Validated ({finalNetwork?.edges.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("RAW_JSON")}
                className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
                  activeTab === "RAW_JSON"
                    ? "bg-[#1d2b40] text-white font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                JSON
              </button>
            </div>
          </div>

          {/* List display */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {activeTab === "HIDDEN" ? (
              hiddenEdges.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No indirect relationships found yet.
                </div>
              ) : (
                hiddenEdges.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => setSelectedEdge(rel)}
                    className={`p-3 rounded border text-xs cursor-pointer transition ${
                      selectedEdge?.id === rel.id
                        ? "bg-[#192437] border-purple-500/70"
                        : "bg-[#0d131f] border-[#1d2a3c] hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-purple-400 uppercase font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        INDIRECT / HIDDEN LINK
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {(rel.confidence * 100).toFixed(0)}% Conf
                      </span>
                    </div>

                    <div className="font-medium text-slate-100 mt-1">
                      {getEntityName(rel.sourceId)} &rarr;{" "}
                      <span className="text-purple-300 font-mono">{rel.relationType}</span> &rarr;{" "}
                      {getEntityName(rel.targetId)}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic">
                      "{rel.evidence[0]?.quoteExcerpt}"
                    </div>
                  </div>
                ))
              )
            ) : activeTab === "PRUNED" ? (
              prunedEdges.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No relationships were pruned as noise.
                </div>
              ) : (
                prunedEdges.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => setSelectedEdge(rel)}
                    className={`p-3 rounded border text-xs cursor-pointer transition ${
                      selectedEdge?.id === rel.id
                        ? "bg-[#20151b] border-red-500/70"
                        : "bg-[#0d131f] border-[#29171b] hover:border-red-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-red-400 uppercase font-semibold flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3" />
                        REJECTED BY 2ND LLM
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Weak Confidence: {(rel.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="font-medium text-slate-300 line-through opacity-80 mt-1">
                      {getEntityName(rel.sourceId)} &rarr; {rel.relationType} &rarr;{" "}
                      {getEntityName(rel.targetId)}
                    </div>

                    <div className="text-[11px] text-red-300 mt-1.5 bg-red-950/30 p-2 rounded border border-red-900/40">
                      <strong>Pruning Reason:</strong> {rel.pruneReason}
                    </div>
                  </div>
                ))
              )
            ) : activeTab === "ALL_EDGES" ? (
              (finalNetwork?.edges || []).map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => setSelectedEdge(rel)}
                  className={`p-3 rounded border text-xs cursor-pointer transition ${
                    selectedEdge?.id === rel.id
                      ? "bg-[#182335] border-blue-500/70"
                      : "bg-[#0d131f] border-[#1c2738] hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-blue-400 font-semibold">
                      {rel.isHiddenConnection ? "HIDDEN / INFERRED" : "DIRECT / EXPLICIT"}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {(rel.confidence * 100).toFixed(0)}% Conf
                    </span>
                  </div>

                  <div className="font-medium text-slate-100 mt-1">
                    {getEntityName(rel.sourceId)} &rarr;{" "}
                    <span className="text-blue-300 font-mono">{rel.relationType}</span> &rarr;{" "}
                    {getEntityName(rel.targetId)}
                  </div>
                </div>
              ))
            ) : (
              <pre className="p-3 bg-[#080d15] border border-[#192435] rounded font-mono text-[11px] text-purple-300 max-h-[480px] overflow-y-auto leading-relaxed">
                {JSON.stringify(finalNetwork, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Right 6 cols: Deep Evidence Attribution Inspector */}
        <div className="lg:col-span-6 bg-[#121927] border border-[#1f2c42] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1b2638] pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Explainable Relationship Evidence Inspector
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Traceability Audit
              </span>
            </div>

            {selectedEdge ? (
              <div className="space-y-4">
                {/* Edge Header */}
                <div className="p-3.5 bg-[#0e1522] border border-[#1e2a3c] rounded-lg">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">
                    Connection Under Inspection
                  </div>
                  <div className="text-sm font-bold text-slate-100 mt-1 flex items-center gap-2">
                    <span>{getEntityName(selectedEdge.sourceId)}</span>
                    <span className="text-purple-400 font-mono text-xs font-normal">
                      [{selectedEdge.relationType}]
                    </span>
                    <span>{getEntityName(selectedEdge.targetId)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] font-mono">
                    <span className="text-slate-400">
                      Type: {selectedEdge.isHiddenConnection ? "Indirect / Pattern Inference" : "Direct Statement"}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      Confidence Score: {(selectedEdge.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Evidence quotes from raw approved document */}
                {selectedEdge.evidence && selectedEdge.evidence.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                      Source Document Quotes & Forensic Reasoning
                    </div>
                    {selectedEdge.evidence.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#0a0f18] border border-[#1b2639] rounded text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-blue-400">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3 h-3" />
                            {ev.sourceDocumentName}
                          </span>
                          <span className="text-slate-500">ID: {ev.sourceDocumentId}</span>
                        </div>

                        <div className="bg-[#121927] p-2.5 rounded border border-[#1a2537] italic text-slate-200 text-[11px] leading-relaxed">
                          "{ev.quoteExcerpt}"
                        </div>

                        <div className="text-[11px] text-slate-300">
                          <strong className="text-purple-300 font-mono">Forensic Reasoning:</strong>{" "}
                          {ev.reasoning}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedEdge.prunedBySecondLlm ? (
                  <div className="p-3.5 bg-red-950/20 border border-red-500/40 rounded text-xs">
                    <span className="font-bold text-red-300 font-mono block mb-1">
                      HALLUCINATION PRUNING REPORT:
                    </span>
                    <p className="text-red-200 text-[11px] leading-relaxed">
                      {selectedEdge.pruneReason}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-500 text-xs">
                    No evidence records linked.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                Select a relationship from the left column to view its forensic evidence chain.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#1b2638] text-[10px] text-slate-400 font-mono">
            Every edge in the network maintains immutable provenance back to the primary officer notes and station FIRs.
          </div>
        </div>
      </div>
    </div>
  );
};
