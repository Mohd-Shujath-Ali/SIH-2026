import React, { useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  Plane,
  Coins,
  Network,
  RefreshCw,
  Users,
  Compass,
  CheckCircle2,
} from "lucide-react";
import { Case, PredictionInsight } from "../types";

interface PredictionAnalysisProps {
  activeCase: Case | null;
  predictions: PredictionInsight[];
  onGeneratePredictions: () => Promise<void>;
}

export const PredictionAnalysis: React.FC<PredictionAnalysisProps> = ({
  activeCase,
  predictions,
  onGeneratePredictions,
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGeneratePredictions();
    } finally {
      setIsGenerating(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "FLIGHT_RISK":
        return <Plane className="w-4 h-4 text-red-400" />;
      case "SUSPICIOUS_PATTERN":
        return <Coins className="w-4 h-4 text-amber-400" />;
      case "FUTURE_CONNECTION":
      case "EMERGING_RELATIONSHIP":
        return <Network className="w-4 h-4 text-purple-400" />;
      case "KEY_INFLUENCER":
        return <Users className="w-4 h-4 text-blue-400" />;
      default:
        return <Compass className="w-4 h-4 text-emerald-400" />;
    }
  };

  const filteredPredictions =
    filterCategory === "ALL"
      ? predictions
      : predictions.filter((p) => p.category === filterCategory);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#121927] border border-[#1f2c42] rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-red-400">
              <TrendingUp className="w-4 h-4" />
              <span>STAGE 9 // PREDICTIVE THREAT & RISK INTELLIGENCE ENGINE</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">
              Anticipated Criminal Expansion, Hidden Couriers & Flight Risks
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Using the validated final criminal network JSON as input, the Second Fine-Tuned LLM forecasts emerging syndicate behavior, predicts who key influencers will contact next to replace compromised couriers, flags impending flight risks, and detects laundering velocity.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white rounded text-xs font-semibold transition flex items-center gap-2 shadow"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Forecasting Threat Vectors...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Fresh AI Predictions
              </>
            )}
          </button>
        </div>

        {/* Clear Separation Notice - Mandated by Problem Statement */}
        <div className="mt-4 p-3 bg-amber-950/20 border border-amber-500/40 rounded flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300 uppercase font-mono">
              Operational Legal Notice — Strict Evidence Separation:
            </span>{" "}
            All items below are <strong>AI-generated probabilistic investigative hypotheses</strong> and are strictly separated from court-admissible verified facts. They serve as tactical leads for covert surveillance, Look-Out Circulars (LOCs), and preventive interdictions.
          </div>
        </div>
      </div>

      {/* Filter Categories */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-slate-400 mr-1">Filter Categories:</span>
        {["ALL", "FUTURE_CONNECTION", "FLIGHT_RISK", "SUSPICIOUS_PATTERN", "KEY_INFLUENCER"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded border transition ${
              filterCategory === cat
                ? "bg-red-600/30 text-red-300 border-red-500"
                : "bg-[#0e1420] text-slate-400 border-[#1c2738] hover:text-slate-200"
            }`}
          >
            {cat.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Prediction Cards Grid */}
      {filteredPredictions.length === 0 ? (
        <div className="p-12 text-center bg-[#121927] border border-[#1f2c42] rounded-lg text-slate-500 text-xs">
          No predictive insights available for this category yet. Click "Generate Fresh AI Predictions" to run the model.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPredictions.map((pred) => (
            <div
              key={pred.id}
              className="bg-[#121927] border border-[#1f2c42] hover:border-[#2f4362] rounded-lg p-5 flex flex-col justify-between transition"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2 border-b border-[#1b2638] pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-[#162132] border border-[#213048] flex items-center justify-center">
                      {getCategoryIcon(pred.category)}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {pred.category.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        pred.riskLevel === "CRITICAL"
                          ? "bg-red-500/20 text-red-300 border-red-500/40"
                          : pred.riskLevel === "HIGH"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                      }`}
                    >
                      {pred.riskLevel} RISK
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {pred.probability}% Prob
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-100 leading-snug">
                  {pred.title}
                </h3>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {pred.description}
                </p>

                {/* Target Entities */}
                {pred.targetEntities && pred.targetEntities.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#182333]">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Subject Persons / Entities:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {pred.targetEntities.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-mono px-2 py-0.5 bg-[#0e1522] border border-[#1f2c40] rounded text-slate-300"
                        >
                          {t.name} <span className="text-slate-500">({t.role})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rationale */}
                <div className="mt-3 bg-[#0a0f18] p-3 rounded border border-[#192435] text-xs">
                  <span className="text-purple-300 font-mono text-[10px] uppercase font-bold block mb-0.5">
                    Analytical Pattern Rationale:
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {pred.rationale}
                  </p>
                </div>
              </div>

              {/* Recommended Law Enforcement Tactical Action */}
              <div className="mt-4 pt-3 border-t border-[#1b2638] bg-[#0c1524] p-3 rounded border border-blue-500/30">
                <span className="text-blue-300 font-mono text-[10px] uppercase font-bold flex items-center gap-1 mb-1">
                  <ShieldAlert className="w-3 h-3 text-blue-400" />
                  Suggested Law Enforcement Intervention:
                </span>
                <p className="text-slate-200 text-xs font-medium">
                  {pred.suggestedIntervention}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
