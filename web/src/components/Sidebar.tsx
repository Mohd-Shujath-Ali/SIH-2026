import React from "react";
import {
  GitCommit,
  UploadCloud,
  CheckSquare,
  Binary,
  BrainCircuit,
  Share2,
  TrendingUp,
  RotateCcw,
  Sliders,
  FileText,
} from "lucide-react";

export type ActiveTab =
  | "pipeline"
  | "ingestion"
  | "first-llm"
  | "second-llm"
  | "network-graph"
  | "predictions"
  | "feedback";

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  pendingVerificationCount: number;
  totalDocsCount: number;
  entitiesCount: number;
  predictionsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingVerificationCount,
  totalDocsCount,
  entitiesCount,
  predictionsCount,
}) => {
  const navItems = [
    {
      id: "pipeline" as ActiveTab,
      label: "System Architecture",
      icon: GitCommit,
      badge: null,
      section: "PIPELINE OVERVIEW",
    },
    {
      id: "ingestion" as ActiveTab,
      label: "1. Document Ingestion & OCR",
      icon: UploadCloud,
      badge: totalDocsCount ? `${totalDocsCount} files` : null,
      badgeColor: pendingVerificationCount > 0 ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      section: "EVIDENCE & EXTRACTION",
    },
    {
      id: "first-llm" as ActiveTab,
      label: "2. 1st LLM Extraction",
      icon: Binary,
      badge: "JSON",
      section: "AI EXTRACTION & STRUCTURING",
    },
    {
      id: "second-llm" as ActiveTab,
      label: "3. 2nd LLM Reasoning",
      icon: BrainCircuit,
      badge: "Fine-Tuned",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      section: "DEEP REASONING & REJECTION",
    },
    {
      id: "network-graph" as ActiveTab,
      label: "4. Criminal Network Graph",
      icon: Share2,
      badge: entitiesCount ? `${entitiesCount} nodes` : null,
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      section: "GRAPH ANALYTICS",
    },
    {
      id: "predictions" as ActiveTab,
      label: "5. Prediction & Threat Risk",
      icon: TrendingUp,
      badge: predictionsCount ? `${predictionsCount} alerts` : null,
      badgeColor: "bg-red-500/20 text-red-300 border-red-500/40",
      section: "PREDICTIVE INTELLIGENCE",
    },
    {
      id: "feedback" as ActiveTab,
      label: "6. Post-Investigation Feedback",
      icon: RotateCcw,
      badge: "Retraining",
      badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
      section: "CONTINUOUS LEARNING",
    },
  ];

  return (
    <aside className="w-64 bg-[#0d121c] border-r border-[#1c2637] flex flex-col shrink-0 select-none text-slate-300">
      {/* Area of Interest header inspired by Palantir AIP */}
      <div className="p-3 border-b border-[#1b2535]">
        <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
          Area of Interest
        </div>
        <div className="text-xs font-semibold text-slate-200 mt-0.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          NCRB INTEL // DEFENSE AIP
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const showSection = index === 0 || navItems[index - 1].section !== item.section;

          return (
            <React.Fragment key={item.id}>
              {showSection && (
                <div className="px-2 pt-3 pb-1 text-[9px] font-mono tracking-wider uppercase text-slate-400">
                  {item.section}
                </div>
              )}
              <button
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition group ${
                  isActive
                    ? "bg-[#182335] text-white border border-[#2b3c58] font-medium shadow-sm"
                    : "hover:bg-[#131b28] text-slate-300 hover:text-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono border leading-tight ${
                      item.badgeColor || "bg-[#1f2c40] text-slate-300 border-[#2b3a52]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Footer Security Badge */}
      <div className="p-2.5 border-t border-[#1a2434] bg-[#090d14] text-[10px] font-mono text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          RBAC: Tier 4 Analyst
        </span>
        <span className="text-slate-400">v2.4.0</span>
      </div>
    </aside>
  );
};
