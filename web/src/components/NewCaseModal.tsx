import React, { useState } from "react";
import { X, FolderPlus, Shield } from "lucide-react";
import { Case } from "../types";

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCase: (caseData: Partial<Case>) => Promise<void>;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({
  isOpen,
  onClose,
  onCreateCase,
}) => {
  const [caseNumber, setCaseNumber] = useState<string>(
    `NCRB-2026-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [title, setTitle] = useState<string>("");
  const [department, setDepartment] = useState<string>(
    "NCRB Special Intercept & Narcotics Division"
  );
  const [description, setDescription] = useState<string>("");
  const [classification, setClassification] = useState<string>(
    "LAW ENFORCEMENT SENSITIVE // STRICT ACCESS"
  );
  const [leadInvestigator, setLeadInvestigator] = useState<string>(
    "Superintendent of Police Rajeshwar Singh (IPS)"
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !caseNumber.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateCase({
        caseNumber,
        title,
        department,
        description,
        classification,
        leadInvestigator,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121927] border border-[#23354f] rounded-lg max-w-lg w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1c273a] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Initiate New Investigation Case
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                NCRB Central Case Registry Entry
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Case Number / FIR Ref
              </label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                className="w-full bg-[#0d131f] border border-[#202d41] rounded px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Security Classification
              </label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className="w-full bg-[#0d131f] border border-[#202d41] rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="LAW ENFORCEMENT SENSITIVE // STRICT ACCESS">
                  LAW ENFORCEMENT SENSITIVE
                </option>
                <option value="TOP SECRET // SPECIAL INTELLIGENCE">
                  TOP SECRET // SI
                </option>
                <option value="CONFIDENTIAL // RESTRICTED">CONFIDENTIAL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Case Operation Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Operation HawkEye: Western Coastal Bullion & Hawala Ring"
              className="w-full bg-[#0d131f] border border-[#202d41] rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Lead Investigating Officer
              </label>
              <input
                type="text"
                value={leadInvestigator}
                onChange={(e) => setLeadInvestigator(e.target.value)}
                className="w-full bg-[#0d131f] border border-[#202d41] rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Command Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-[#0d131f] border border-[#202d41] rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Initial Intelligence Brief / Incident Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context regarding the crime network, operating jurisdictions, and suspected MO..."
              className="w-full bg-[#0d131f] border border-[#202d41] rounded p-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
            ></textarea>
          </div>

          <div className="pt-3 border-t border-[#1c273a] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#172233] hover:bg-[#1e2c40] text-slate-300 rounded text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded text-xs font-semibold transition"
            >
              Create Case File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
