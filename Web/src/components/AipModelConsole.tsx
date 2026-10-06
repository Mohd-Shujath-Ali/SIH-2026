import React, { useState } from "react";
import {
  Sliders,
  Shield,
  Activity,
  Cpu,
  Zap,
  TrendingUp,
  Lock,
  CheckCircle,
  AlertCircle,
  Database,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { RpiStatus } from "../types";

interface AipModelConsoleProps {
  rpiStatus: RpiStatus | null;
}

export const AipModelConsole: React.FC<AipModelConsoleProps> = ({ rpiStatus }) => {
  // ROC Curve Data matching Palantir AIP evaluation in screenshot
  const rocData = [
    { fpr: 0.0, tpr: 0.0, baseline: 0.0 },
    { fpr: 0.05, tpr: 0.42, baseline: 0.05 },
    { fpr: 0.1, tpr: 0.72, baseline: 0.1 },
    { fpr: 0.15, tpr: 0.88, baseline: 0.15 },
    { fpr: 0.2, tpr: 0.94, baseline: 0.2 },
    { fpr: 0.3, tpr: 0.97, baseline: 0.3 },
    { fpr: 0.5, tpr: 0.985, baseline: 0.5 },
    { fpr: 0.8, tpr: 0.995, baseline: 0.8 },
    { fpr: 1.0, tpr: 1.0, baseline: 1.0 },
  ];

  // Token & Spend trend data
  const activityData = [
    { time: "00:00", requests: 12, tokens: 4200 },
    { time: "04:00", requests: 8, tokens: 2800 },
    { time: "08:00", requests: 45, tokens: 14800 },
    { time: "12:00", requests: 92, tokens: 32000 },
    { time: "16:00", requests: 120, tokens: 41200 },
    { time: "20:00", requests: 64, tokens: 21800 },
    { time: "24:00", requests: 28, tokens: 9400 },
  ];

  const [piiRedaction, setPiiRedaction] = useState<boolean>(true);
  const [groundingEnforcement, setGroundingEnforcement] = useState<boolean>(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.75);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#121927] border border-[#1f2c42] rounded-lg p-5">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <Sliders className="w-4 h-4" />
          <span>AIP MODEL MANAGEMENT & DEFENSE EVALUATION COCKPIT</span>
        </div>
        <h2 className="text-lg font-bold text-slate-100 mt-1">
          AIP Dual-Model Governance, Guardrails & ROC Evaluation
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Operational control telemetry for the First LLM (Entity Extractor), Second LLM (Fine-Tuned Criminal Network Reasoner), and Edge Raspberry Pi OCR/HTR hardware cluster. Monitors latency, hallucination suppression, content protections, and ROC classification curves.
        </p>
      </div>

      {/* Model Deployment Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Model 1: First LLM */}
        <div className="bg-[#121927] border border-[#1f2c42] rounded-lg p-4 text-xs font-mono space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#1b2638] pb-2">
            <span className="font-bold text-blue-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> 1st LLM Extraction Engine
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
              DEPLOYED
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">Base Architecture:</span>
            <span>Gemini-3.8-Flash / JSON-Mime</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">Task Objective:</span>
            <span>Entity & Explicit Link Extraction</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">Output Schema:</span>
            <span>NCRB-JSON-v1.0.4</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">Inference Latency:</span>
            <span className="text-emerald-400">~620 ms</span>
          </div>
        </div>

        {/* Model 2: Second Fine-Tuned LLM */}
        <div className="bg-[#121927] border border-[#1f2c42] rounded-lg p-4 text-xs font-mono space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#1b2638] pb-2">
            <span className="font-bold text-purple-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> 2nd Fine-Tuned LLM Reasoner
            </span>
            <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30">
              SFT TIER-1
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">Objective:</span>
            <span>Cross-File Synthesis & Noise Pruning</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">F1 Score:</span>
            <span className="text-emerald-400 font-bold">0.962</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">AUC-ROC Metric:</span>
            <span className="text-emerald-400 font-bold">0.984</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">Provenance:</span>
            <span>Mandatory Excerpt Citation</span>
          </div>
        </div>

        {/* Model 3: Edge OCR */}
        <div className="bg-[#121927] border border-[#1f2c42] rounded-lg p-4 text-xs font-mono space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#1b2638] pb-2">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Raspberry Pi Edge Cluster
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
              LOCAL EDGE
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">Hardware:</span>
            <span>{rpiStatus?.deviceName || "RPi 4B 8GB"}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">OCR Stack:</span>
            <span>{rpiStatus?.ocrEngine || "TrOCR + Tesseract"}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">CPU Thermal:</span>
            <span className="text-amber-400">{rpiStatus?.cpuTempC ?? 48.2}°C</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">Jobs Handled:</span>
            <span className="text-emerald-400 font-bold">{rpiStatus?.processedJobs ?? 148}</span>
          </div>
        </div>
      </div>

      {/* ROC Curves & Spend Charts (Directly from Palantir AIP defense screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Classification Curve */}
        <div className="bg-[#121927] border border-[#1f2c42] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Model Evaluation: ROC Curve (Relationship Extraction)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                True Positive Rate vs. False Positive Rate across SFT checkpoints. AUC = 0.984.
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              AUC: 0.984
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2c42" />
                <XAxis dataKey="fpr" stroke="#64748b" fontSize={10} domain={[0, 1]} tickFormatter={(v) => `FPR ${v}`} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 1]} tickFormatter={(v) => `${v * 100}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0e1522",
                    borderColor: "#1f2d42",
                    fontSize: 11,
                    fontFamily: "JetBrains Mono",
                  }}
                />
                <Line type="monotone" dataKey="tpr" name="Fine-Tuned 2nd LLM" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="baseline" name="Random Classifier Baseline" stroke="#64748b" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inference Activity & Token Utilization */}
        <div className="bg-[#121927] border border-[#1f2c42] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Case Activity & Token Ingestion Velocity
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hourly throughput across investigative document analysis.
              </p>
            </div>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
              124.8k Tokens / 24h
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2c42" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0e1522",
                    borderColor: "#1f2d42",
                    fontSize: 11,
                    fontFamily: "JetBrains Mono",
                  }}
                />
                <Area type="monotone" dataKey="tokens" name="Tokens Processed" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Content Protections & Law Enforcement Guardrails */}
      <div className="bg-[#121927] border border-[#1f2c42] rounded-lg p-5">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2 font-mono">
          <Lock className="w-4 h-4 text-amber-400" />
          AIP Content Protections & Strict Audit Guardrails
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 bg-[#0d131f] border border-[#1d293d] rounded flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">Investigator Approval Gate</div>
              <div className="text-[10px] text-slate-400">Strict block on unverified OCR text</div>
            </div>
            <span className="text-emerald-400 font-bold">ACTIVE</span>
          </div>

          <div className="p-3 bg-[#0d131f] border border-[#1d293d] rounded flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">Source Quote Provenance</div>
              <div className="text-[10px] text-slate-400">Forces exact document citation</div>
            </div>
            <span className="text-emerald-400 font-bold">ENFORCED</span>
          </div>

          <div className="p-3 bg-[#0d131f] border border-[#1d293d] rounded flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">Confidence Threshold Gate</div>
              <div className="text-[10px] text-slate-400">Auto-prune links below 50%</div>
            </div>
            <span className="text-purple-400 font-bold">0.50 MIN</span>
          </div>
        </div>
      </div>
    </div>
  );
};
