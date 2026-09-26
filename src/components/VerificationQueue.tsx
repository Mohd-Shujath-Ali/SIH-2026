import React, { useState } from "react";
import {
  CheckSquare,
  AlertTriangle,
  FileText,
  Check,
  X,
  Edit3,
  ShieldCheck,
  Lock,
  ArrowRight,
  Cpu,
  UserCheck,
} from "lucide-react";
import { InvestigationDocument } from "../types";

interface VerificationQueueProps {
  documents: InvestigationDocument[];
  onVerifyDocument: (
    docId: string,
    status: "APPROVED" | "REJECTED",
    approvedText: string,
    notes: string,
    verifiedBy: string
  ) => Promise<void>;
  onNavigateToFirstLlm: () => void;
}

export const VerificationQueue: React.FC<VerificationQueueProps> = ({
  documents,
  onVerifyDocument,
  onNavigateToFirstLlm,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(
    documents[0]?.id || ""
  );
  const [editedText, setEditedText] = useState<string>("");
  const [investigatorNotes, setInvestigatorNotes] = useState<string>("");
  const [officerBadge, setOfficerBadge] = useState<string>("SP Rajeshwar Singh (IPS)");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  React.useEffect(() => {
    if (selectedDoc) {
      setEditedText(selectedDoc.approvedText || selectedDoc.rawExtractedText || "");
      setInvestigatorNotes(selectedDoc.verificationNotes || "");
      if (selectedDoc.verifiedBy) setOfficerBadge(selectedDoc.verifiedBy);
    }
  }, [selectedDoc?.id]);

  const handleAction = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedDoc) return;
    setIsSubmitting(true);
    try {
      await onVerifyDocument(
        selectedDoc.id,
        status,
        editedText,
        investigatorNotes,
        officerBadge
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingDocs = documents.filter((d) => d.verificationStatus === "PENDING");
  const approvedDocs = documents.filter((d) => d.verificationStatus === "APPROVED");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Strict Gate Banner */}
      <div className="bg-[#121927] border border-[#1f2c42] rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Lock className="w-4 h-4" />
              <span>STAGE 3 // STRICT INVESTIGATOR VERIFICATION GATE</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">
              Human-in-the-Loop Document Verification & Correction
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              To prevent hallucinated criminal links, raw OCR extractions from the Raspberry Pi <strong>cannot</strong> bypass human verification. The investigator must examine extracted text, correct OCR typos, verify key identities (suspect names, phone numbers, vehicle numbers), and approve before the First LLM can ingest it.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-[#0e1420] border border-[#1f2c42] rounded text-xs font-mono text-slate-300">
              <span className="text-amber-400 font-bold">{pendingDocs.length}</span> Pending Review
            </div>
            <div className="px-3 py-1.5 bg-[#0e1420] border border-[#1f2c42] rounded text-xs font-mono text-slate-300">
              <span className="text-emerald-400 font-bold">{approvedDocs.length}</span> Approved
            </div>
          </div>
        </div>
      </div>

      {/* Main Review Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document Selector Column (4 cols) */}
        <div className="lg:col-span-4 bg-[#121927] border border-[#1f2c42] rounded-lg p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Case Verification Queue
            </h3>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-3 rounded border text-xs cursor-pointer transition ${
                    selectedDoc?.id === doc.id
                      ? "bg-[#192437] border-emerald-500/70 shadow-sm"
                      : "bg-[#0e1420] border-[#1d2a3c] hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-slate-200 truncate">
                      {doc.filename}
                    </div>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 border ${
                        doc.verificationStatus === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : doc.verificationStatus === "REJECTED"
                          ? "bg-red-500/20 text-red-300 border-red-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {doc.verificationStatus}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-2">
                    <span>{doc.fileType}</span>
                    <span>•</span>
                    <span>{doc.sourceAgency}</span>
                  </div>

                  {doc.ocrMetadata && (
                    <div className="mt-1 text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                      <Cpu className="w-2.5 h-2.5" />
                      RPi TrOCR: {(doc.ocrMetadata.confidenceScore * 100).toFixed(0)}% Conf
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1b2638]">
            <button
              onClick={onNavigateToFirstLlm}
              disabled={approvedDocs.length === 0}
              className="w-full py-2 bg-[#1b283d] hover:bg-[#23344f] disabled:bg-slate-800 disabled:text-slate-600 border border-[#273a57] rounded text-xs text-blue-300 hover:text-white font-medium transition flex items-center justify-center gap-2"
            >
              <span>Proceed to 1st LLM Extraction</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Document Inspection & Verification Editor (8 cols) */}
        {selectedDoc ? (
          <div className="lg:col-span-8 bg-[#121927] border border-[#1f2c42] rounded-lg p-5 flex flex-col justify-between">
            <div>
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2638] pb-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-100">
                      {selectedDoc.filename}
                    </h3>
                    <span className="text-[10px] font-mono bg-[#1a2537] text-slate-300 px-2 py-0.5 rounded">
                      Type: {selectedDoc.fileType}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Source: {selectedDoc.sourceAgency} | Uploaded: {selectedDoc.uploadDate}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Current Status:</span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      selectedDoc.verificationStatus === "APPROVED"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : selectedDoc.verificationStatus === "REJECTED"
                        ? "bg-red-500/20 text-red-300 border-red-500/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }`}
                  >
                    {selectedDoc.verificationStatus}
                  </span>
                </div>
              </div>

              {/* Text Comparison & Correction Panel */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                    Investigator Verified Text (Edit if OCR misread names or numbers)
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    Characters: {editedText.length}
                  </span>
                </div>

                <textarea
                  rows={13}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full bg-[#0a0f18] border border-[#202d41] rounded p-3 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                  placeholder="Review extracted text here..."
                ></textarea>

                {/* Audit & Officer Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Verifying Officer / Badge ID
                    </label>
                    <input
                      type="text"
                      value={officerBadge}
                      onChange={(e) => setOfficerBadge(e.target.value)}
                      className="w-full bg-[#0d131f] border border-[#202d41] rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Verification Audit Notes
                    </label>
                    <input
                      type="text"
                      value={investigatorNotes}
                      onChange={(e) => setInvestigatorNotes(e.target.value)}
                      placeholder="e.g. Verified suspect names with station log"
                      className="w-full bg-[#0d131f] border border-[#202d41] rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-5 pt-3.5 border-t border-[#1b2638] flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400 font-mono">
                {selectedDoc.verificationStatus === "APPROVED" ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5" /> Approved on {selectedDoc.verifiedAt || "Record"}
                  </span>
                ) : (
                  <span>Awaiting official sign-off by duty investigator</span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleAction("REJECTED")}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  Reject Document
                </button>

                <button
                  onClick={() => handleAction("APPROVED")}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white rounded text-xs font-semibold transition flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  Approve for 1st LLM Extraction
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-[#121927] border border-[#1f2c42] rounded-lg p-8 text-center text-slate-400 text-xs">
            No document selected.
          </div>
        )}
      </div>
    </div>
  );
};
