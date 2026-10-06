import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Sidebar, ActiveTab } from "./components/Sidebar";
import { PipelineOverview } from "./components/PipelineOverview";
import { DataIngestion } from "./components/DataIngestion";
import { FirstLlmExtraction } from "./components/FirstLlmExtraction";
import { SecondLlmReasoning } from "./components/SecondLlmReasoning";
import { NetworkGraphView } from "./components/NetworkGraphView";
import { PredictionAnalysis } from "./components/PredictionAnalysis";
import { FeedbackLoop } from "./components/FeedbackLoop";
import { NewCaseModal } from "./components/NewCaseModal";
import { api } from "./services/api";
import {
  Case,
  InvestigationDocument,
  FirstLlmOutput,
  FinalNetwork,
  PredictionInsight,
  PostInvestigationReport,
  RpiStatus,
} from "./types";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export default function App() {
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("pipeline");

  // Case Data
  const [documents, setDocuments] = useState<InvestigationDocument[]>([]);
  const [firstLlmOutputs, setFirstLlmOutputs] = useState<FirstLlmOutput[]>([]);
  const [finalNetwork, setFinalNetwork] = useState<FinalNetwork | null>(null);
  const [predictions, setPredictions] = useState<PredictionInsight[]>([]);
  const [feedbackReports, setFeedbackReports] = useState<PostInvestigationReport[]>([]);
  const [rpiStatus, setRpiStatus] = useState<RpiStatus | null>(null);

  // UI States
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Initial Load: Fetch Cases & Hardware Status with smooth retry
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async (attempts = 0) => {
      try {
        const fetchedCases = await api.getCases();
        if (!isMounted) return;
        if (fetchedCases && fetchedCases.length > 0) {
          setCases(fetchedCases);
          if (!activeCaseId) {
            setActiveCaseId(fetchedCases[0].id);
          }
        }

        const rpi = await api.getRpiStatus();
        if (!isMounted) return;
        if (rpi) {
          setRpiStatus(rpi);
        }
      } catch (err: any) {
        console.warn("Initial load retry:", err);
        if (attempts < 2 && isMounted) {
          setTimeout(() => loadInitialData(attempts + 1), 1500);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // When activeCaseId changes, load all case assets
  useEffect(() => {
    if (!activeCaseId) return;
    loadCaseData(activeCaseId);
  }, [activeCaseId]);

  const loadCaseData = async (caseId: string) => {
    try {
      const [docs, firstLlm, networkResult, preds, feedbacks] = await Promise.allSettled([
        api.getDocuments(caseId),
        api.getFirstLlmOutputs(caseId),
        api.getNetwork(caseId),
        api.getPredictions(caseId),
        api.getFeedbackReports(caseId),
      ]);

      if (docs.status === "fulfilled") setDocuments(docs.value);
      if (firstLlm.status === "fulfilled") setFirstLlmOutputs(firstLlm.value);
      if (networkResult.status === "fulfilled") setFinalNetwork(networkResult.value);
      else setFinalNetwork(null);

      if (preds.status === "fulfilled") setPredictions(preds.value);
      if (feedbacks.status === "fulfilled") setFeedbackReports(feedbacks.value);
    } catch (err) {
      console.error("Error loading case assets:", err);
    }
  };

  const activeCase = cases.find((c) => c.id === activeCaseId) || null;

  // Handler Actions
  const handleSelectCase = (caseId: string) => {
    setActiveCaseId(caseId);
    showToast(`Loaded Case Dossier #${caseId}`, "info");
  };

  const handleCreateCase = async (caseData: Partial<Case>) => {
    try {
      const created = await api.createCase(caseData);
      setCases((prev) => [...prev, created]);
      setActiveCaseId(created.id);
      showToast(`Case "${created.caseNumber}" successfully opened!`, "success");
      setActiveTab("ingestion");
    } catch (err: any) {
      showToast(err.message || "Failed to create case", "error");
    }
  };

  const handleUploadDocument = async (docData: {
    filename: string;
    fileType: string;
    originalSize?: string;
    mimeType?: string;
    sourceAgency?: string;
    requiresOcr?: boolean;
    rawContent?: string;
    fileDataUrl?: string;
    file?: File;
  }): Promise<InvestigationDocument | undefined> => {
    if (!activeCaseId) return;
    try {
      const newDoc = await api.uploadDocument(activeCaseId, docData);
      setDocuments((prev) => [...prev, newDoc]);
      showToast(
        `Document "${newDoc.filename}" processed via Raspberry Pi OCR! Ready for review.`,
        "success"
      );
      // Refresh RPi stats
      const rpi = await api.getRpiStatus().catch(() => null);
      if (rpi) setRpiStatus(rpi);
      return newDoc;
    } catch (err: any) {
      showToast(err.message || "Raspberry Pi OCR processing failed", "error");
      throw err;
    }
  };

  const handleVerifyDocument = async (
    docId: string,
    status: "APPROVED" | "REJECTED",
    approvedText: string,
    notes: string,
    verifiedBy: string
  ) => {
    if (!activeCaseId) return;
    try {
      const updated = await api.verifyDocument(activeCaseId, docId, {
        status,
        approvedText,
        notes,
        verifiedBy,
      });
      setDocuments((prev) => prev.map((d) => (d.id === docId ? updated : d)));
      showToast(
        status === "APPROVED"
          ? `Document approved for First LLM processing!`
          : `Document marked as rejected.`,
        status === "APPROVED" ? "success" : "info"
      );
    } catch (err: any) {
      showToast(err.message || "Verification failed", "error");
    }
  };

  const handleRunFirstLlm = async (docId: string) => {
    if (!activeCaseId) return;
    try {
      const output = await api.runFirstLlm(activeCaseId, docId);
      setFirstLlmOutputs((prev) => {
        const filtered = prev.filter((o) => o.documentId !== docId);
        return [...filtered, output];
      });
      showToast(`First LLM successfully extracted ${output.entities.length} entities!`, "success");
    } catch (err: any) {
      showToast(err.message || "First LLM extraction failed", "error");
    }
  };

  const handleRunSecondLlm = async () => {
    if (!activeCaseId) return;
    try {
      const net = await api.runSecondLlm(activeCaseId);
      setFinalNetwork(net);
      showToast(
        `Second Fine-Tuned LLM completed! Synthesized ${net.nodes.length} nodes and ${net.edges.length} connections.`,
        "success"
      );
    } catch (err: any) {
      showToast(err.message || "Second LLM reasoning failed", "error");
    }
  };

  const handleGeneratePredictions = async () => {
    if (!activeCaseId) return;
    try {
      const preds = await api.generatePredictions(activeCaseId);
      setPredictions(preds);
      showToast(`Generated ${preds.length} fresh predictive threat alerts!`, "success");
    } catch (err: any) {
      showToast(err.message || "Prediction generation failed", "error");
    }
  };

  const handleSubmitFeedback = async (reportData: Partial<PostInvestigationReport>) => {
    if (!activeCaseId) return;
    try {
      const report = await api.submitFeedbackReport(activeCaseId, reportData);
      setFeedbackReports((prev) => [report, ...prev]);
      showToast("Ground-truth report submitted and flagged for fine-tuning!", "success");
    } catch (err: any) {
      showToast(err.message || "Feedback submission failed", "error");
    }
  };

  const [isLoadingNetwork, setIsLoadingNetwork] = useState<boolean>(false);

  const handleReloadNetwork = async () => {
    if (!activeCaseId) return;
    setIsLoadingNetwork(true);
    try {
      const net = await api.getNetwork(activeCaseId);
      setFinalNetwork(net);
      showToast("Syndicate Network reloaded from server", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to reload network", "error");
    } finally {
      setIsLoadingNetwork(false);
    }
  };

  const pendingCount = documents.filter((d) => d.verificationStatus === "PENDING").length;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 text-xs font-mono transition-all animate-bounce ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 border-emerald-500 text-emerald-200"
              : toastMessage.type === "error"
              ? "bg-red-950/90 border-red-500 text-red-200"
              : "bg-[#141f32] border-blue-500 text-blue-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <Header
        cases={cases}
        activeCase={activeCase}
        onSelectCase={handleSelectCase}
        onOpenNewCaseModal={() => setIsNewCaseModalOpen(true)}
        rpiStatus={rpiStatus}
        onRefreshData={() => activeCaseId && loadCaseData(activeCaseId)}
      />

      {/* Main Layout: Sidebar + Stage Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          pendingVerificationCount={pendingCount}
          totalDocsCount={documents.length}
          entitiesCount={finalNetwork?.nodes.length || 0}
          predictionsCount={predictions.length}
        />

        <main className="flex-1 overflow-y-auto bg-[#0b0f17]">
          {activeTab === "pipeline" && (
            <PipelineOverview
              activeCase={activeCase}
              documents={documents}
              finalNetwork={finalNetwork}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "ingestion" && (
            <DataIngestion
              activeCase={activeCase}
              documents={documents}
              rpiStatus={rpiStatus}
              onUploadDocument={handleUploadDocument}
              onVerifyDocument={handleVerifyDocument}
              onNavigateToFirstLlm={() => setActiveTab("first-llm")}
            />
          )}

          {activeTab === "first-llm" && (
            <FirstLlmExtraction
              activeCase={activeCase}
              documents={documents}
              firstLlmOutputs={firstLlmOutputs}
              onRunFirstLlm={handleRunFirstLlm}
              onNavigateToSecondLlm={() => setActiveTab("second-llm")}
            />
          )}

          {activeTab === "second-llm" && (
            <SecondLlmReasoning
              activeCase={activeCase}
              finalNetwork={finalNetwork}
              onRunSecondLlm={handleRunSecondLlm}
              onNavigateToGraph={() => setActiveTab("network-graph")}
            />
          )}

          {activeTab === "network-graph" && (
            <NetworkGraphView
              finalNetwork={finalNetwork}
              onReloadNetwork={handleReloadNetwork}
              isLoading={isLoadingNetwork}
            />
          )}

          {activeTab === "predictions" && (
            <PredictionAnalysis
              activeCase={activeCase}
              predictions={predictions}
              onGeneratePredictions={handleGeneratePredictions}
            />
          )}

          {activeTab === "feedback" && (
            <FeedbackLoop
              activeCase={activeCase}
              finalNetwork={finalNetwork}
              feedbackReports={feedbackReports}
              onSubmitFeedback={handleSubmitFeedback}
            />
          )}
        </main>
      </div>

      {/* New Case Creation Modal */}
      <NewCaseModal
        isOpen={isNewCaseModalOpen}
        onClose={() => setIsNewCaseModalOpen(false)}
        onCreateCase={handleCreateCase}
      />
    </div>
  );
}
