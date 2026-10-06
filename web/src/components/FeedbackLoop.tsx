import React, { useState } from "react";
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Send,
  Star,
  ShieldCheck,
  FileCheck,
  Layers,
  Database,
  Check,
  Sparkles,
} from "lucide-react";
import { Case, PostInvestigationReport, FinalNetwork } from "../types";

interface FeedbackLoopProps {
  activeCase: Case | null;
  finalNetwork: FinalNetwork | null;
  feedbackReports: PostInvestigationReport[];
  onSubmitFeedback: (reportData: Partial<PostInvestigationReport>) => Promise<void>;
}

export const FeedbackLoop: React.FC<FeedbackLoopProps> = ({
  activeCase,
  finalNetwork,
  feedbackReports,
  onSubmitFeedback,
}) => {
  const [investigatorName, setInvestigatorName] = useState<string>("SP Rajeshwar Singh (IPS)");
  const [summary, setSummary] = useState<string>("");
  const [outcomeSummary, setOutcomeSummary] = useState<string>("");
  const [accuracyRating, setAccuracyRating] = useState<number>(5);
  const [falsePositiveSource, setFalsePositiveSource] = useState<string>("");
  const [falsePositiveTarget, setFalsePositiveTarget] = useState<string>("");
  const [falsePositiveReason, setFalsePositiveReason] = useState<string>("");
  const [missedSource, setMissedSource] = useState<string>("");
  const [missedTarget, setMissedTarget] = useState<string>("");
  const [missedRelationType, setMissedRelationType] = useState<string>("");
  const [missedHowDiscovered, setMissedHowDiscovered] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    setIsSubmitting(true);
    try {
      const falsePositives =
        falsePositiveSource && falsePositiveTarget
          ? [
              {
                relationshipId: `rel-fp-${Date.now()}`,
                sourceName: falsePositiveSource,
                targetName: falsePositiveTarget,
                feedback: falsePositiveReason || "Ground truth investigation found no criminal link.",
              },
            ]
          : [];

      const missed =
        missedSource && missedTarget
          ? [
              {
                sourceName: missedSource,
                targetName: missedTarget,
                relationType: missedRelationType || "COVERT_ASSOCIATION",
                howDiscovered: missedHowDiscovered || "Discovered during custodial interrogation.",
              },
            ]
          : [];

      await onSubmitFeedback({
        investigatorName,
        summary,
        verifiedOutcomeSummary: outcomeSummary,
        predictionAccuracyRating: accuracyRating,
        confirmedRelationships: finalNetwork?.edges.slice(0, 4).map((e) => e.id) || [],
        falsePositiveRelationships: falsePositives,
        missedConnections: missed,
      });

      setSummary("");
      setOutcomeSummary("");
      setFalsePositiveSource("");
      setFalsePositiveTarget("");
      setFalsePositiveReason("");
      setMissedSource("");
      setMissedTarget("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#121927] border border-[#1f2c42] rounded-lg p-5">
        <div className="flex items-center gap-2 text-xs font-mono text-teal-400">
          <RotateCcw className="w-4 h-4" />
          <span>STAGE 10 // POST-INVESTIGATION FEEDBACK & CONTINUOUS RETRAINING LOOP</span>
        </div>
        <h2 className="text-lg font-bold text-slate-100 mt-1">
          Ground-Truth Operational Feedback & AI Model Fine-Tuning Corpus
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          The criminal analysis engine continuously learns from live operations. When raids are conducted, convictions achieved, or physical evidence corroborates / refutes predictions, investigators log post-investigation feedback. This ground truth is curated into supervised fine-tuning (SFT) datasets for the Second LLM to minimize future false positives.
        </p>
      </div>

      {submitSuccess && (
        <div className="p-4 rounded bg-emerald-950/40 border border-emerald-500/50 flex items-center gap-2.5 text-xs text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Feedback report recorded into central database and flagged for Second Fine-Tuned LLM dataset compilation!
          </span>
        </div>
      )}

      {/* Main Grid: Form (7 cols) + Prior Reports (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form (7 cols) */}
        <div className="lg:col-span-7 bg-[#121927] border border-[#1f2c42] rounded-lg p-5">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-teal-400" />
            Submit Post-Investigation Ground Truth Report
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Investigating Officer Name & Rank
                </label>
                <input
                  type="text"
                  value={investigatorName}
                  onChange={(e) => setInvestigatorName(e.target.value)}
                  className="w-full bg-[#0d131f] border border-[#202d41] rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  AI Model Accuracy Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-1.5 py-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setAccuracyRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= accuracyRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-600"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-mono text-xs text-amber-400">
                    {accuracyRating} / 5 Stars
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Investigation Ground-Truth Summary
              </label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g. Raids executed at Mahipalpur warehouse confirmed contraband concealment. Suspect Vikrant Sharma apprehended attempting exit at airport."
                className="w-full bg-[#0d131f] border border-[#202d41] rounded p-2.5 text-slate-200 focus:outline-none focus:border-teal-500 font-mono text-[11px]"
                required
              ></textarea>
            </div>

            {/* False Positives Section */}
            <div className="p-3.5 bg-[#171216] border border-red-500/30 rounded space-y-2">
              <span className="text-[11px] font-bold text-red-300 uppercase font-mono block">
                Record False Positive Link (Relationships the AI wrongly inferred)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Entity A (e.g. Ramesh Choksi)"
                  value={falsePositiveSource}
                  onChange={(e) => setFalsePositiveSource(e.target.value)}
                  className="bg-[#0d131f] border border-[#29171b] rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-red-500"
                />
                <input
                  type="text"
                  placeholder="Entity B (e.g. Fortuner Vehicle)"
                  value={falsePositiveTarget}
                  onChange={(e) => setFalsePositiveTarget(e.target.value)}
                  className="bg-[#0d131f] border border-[#29171b] rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-red-500"
                />
              </div>
              <input
                type="text"
                placeholder="Why was this false? (e.g. No ownership; phone tower bounce was an innocent bystander)"
                value={falsePositiveReason}
                onChange={(e) => setFalsePositiveReason(e.target.value)}
                className="w-full bg-[#0d131f] border border-[#29171b] rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Missed Connections Section */}
            <div className="p-3.5 bg-[#0f171d] border border-blue-500/30 rounded space-y-2">
              <span className="text-[11px] font-bold text-blue-300 uppercase font-mono block">
                Record Missed Connection (Real connection the AI failed to identify)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Entity A (e.g. Sunita Deshmukh)"
                  value={missedSource}
                  onChange={(e) => setMissedSource(e.target.value)}
                  className="bg-[#0d131f] border border-[#172535] rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Entity B (e.g. Port Supervisor Verma)"
                  value={missedTarget}
                  onChange={(e) => setMissedTarget(e.target.value)}
                  className="bg-[#0d131f] border border-[#172535] rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Relation Type (e.g. BRIBED_OFFICIAL)"
                  value={missedRelationType}
                  onChange={(e) => setMissedRelationType(e.target.value)}
                  className="bg-[#0d131f] border border-[#172535] rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="How Discovered? (e.g. Seized phone WhatsApp)"
                  value={missedHowDiscovered}
                  onChange={(e) => setMissedHowDiscovered(e.target.value)}
                  className="bg-[#0d131f] border border-[#172535] rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Verified Outcome & Legal Status
              </label>
              <textarea
                rows={2}
                value={outcomeSummary}
                onChange={(e) => setOutcomeSummary(e.target.value)}
                placeholder="Chargesheet filed under NDPS Act, IPC 120B, and Arms Act..."
                className="w-full bg-[#0d131f] border border-[#202d41] rounded p-2 text-slate-200 text-xs focus:outline-none focus:border-teal-500 font-mono text-[11px]"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white rounded text-xs font-semibold transition flex items-center justify-center gap-2 shadow"
            >
              <Send className="w-4 h-4" />
              Submit Ground-Truth Feedback & Retraining Dataset
            </button>
          </form>
        </div>

        {/* Existing Feedback History (5 cols) */}
        <div className="lg:col-span-5 bg-[#121927] border border-[#1f2c42] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              Retraining Dataset & Prior Feedback Logs
            </h3>

            {feedbackReports.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#223046] rounded text-slate-500 text-xs">
                No feedback reports logged yet for this case.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {feedbackReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3.5 bg-[#0e1420] border border-[#1d293d] rounded-lg text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-[#182333] pb-2">
                      <div>
                        <div className="font-semibold text-slate-200">{rep.investigatorName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{rep.reportDate}</div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 font-mono text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {rep.predictionAccuracyRating} / 5
                      </div>
                    </div>

                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {rep.summary}
                    </p>

                    {rep.falsePositiveRelationships.length > 0 && (
                      <div className="p-2 bg-red-950/20 border border-red-900/30 rounded text-[11px] text-red-200">
                        <span className="font-bold text-red-300 block">False Positive:</span>
                        {rep.falsePositiveRelationships[0].sourceName} &rarr;{" "}
                        {rep.falsePositiveRelationships[0].targetName}:{" "}
                        {rep.falsePositiveRelationships[0].feedback}
                      </div>
                    )}

                    {rep.missedConnections.length > 0 && (
                      <div className="p-2 bg-blue-950/20 border border-blue-900/30 rounded text-[11px] text-blue-200">
                        <span className="font-bold text-blue-300 block">Missed Link Discovered:</span>
                        {rep.missedConnections[0].sourceName} &rarr;{" "}
                        {rep.missedConnections[0].targetName} (
                        {rep.missedConnections[0].relationType}) —{" "}
                        {rep.missedConnections[0].howDiscovered}
                      </div>
                    )}

                    <div className="pt-1.5 text-[10px] font-mono text-emerald-400 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3" /> Incorporated in SFT Retraining
                      </span>
                      <span className="text-slate-500">ID: {rep.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#1b2638] text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Model Corpus Version: NCRB-FT-v3.1</span>
            <span className="text-teal-400">Continuous SFT Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
