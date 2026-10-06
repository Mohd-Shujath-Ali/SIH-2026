import {
  Case,
  InvestigationDocument,
  FirstLlmOutput,
  FinalNetwork,
  PredictionInsight,
  PostInvestigationReport,
  RpiStatus,
} from "../types";
import {
  FALLBACK_CASES,
  FALLBACK_RPI_STATUS,
  FALLBACK_DOCUMENTS,
  FALLBACK_FINAL_NETWORK_CASE1,
  FALLBACK_PREDICTIONS_CASE1,
  FALLBACK_FEEDBACK_CASE1,
} from "./fallbackData";

// Helper for resilient fetching with automatic retry backoff during server cold starts
async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 2,
  delay = 700
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delay * Math.pow(1.5, attempt)));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Network request to ${url} failed`);
}

export const api = {
  // Cases
  async getCases(): Promise<Case[]> {
    try {
      const res = await fetchWithRetry("/api/cases", undefined, 2, 600);
      if (!res.ok) throw new Error("Failed to fetch cases");
      return await res.json();
    } catch (err) {
      console.warn("Backend server not yet ready, using seeded intelligence cache:", err);
      return FALLBACK_CASES;
    }
  },

  async createCase(data: Partial<Case>): Promise<Case> {
    const res = await fetchWithRetry("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create case");
    }
    return res.json();
  },

  // Documents & OCR
  async getDocuments(caseId: string): Promise<InvestigationDocument[]> {
    try {
      const res = await fetchWithRetry(`/api/cases/${caseId}/documents`, undefined, 2, 600);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return await res.json();
    } catch (err) {
      console.warn("Using fallback documents for", caseId, err);
      return FALLBACK_DOCUMENTS.filter((d) => d.caseId === caseId);
    }
  },

  async uploadDocument(
    caseId: string,
    docData: {
      filename: string;
      fileType: string;
      originalSize?: string;
      mimeType?: string;
      sourceAgency?: string;
      requiresOcr?: boolean;
      rawContent?: string;
      fileDataUrl?: string;
      file?: File;
    }
  ): Promise<InvestigationDocument> {
    let res: Response;

    // If real browser File object is supplied, send multipart/form-data
    if (docData.file) {
      const formData = new FormData();
      formData.append("file", docData.file);
      formData.append("filename", docData.filename || docData.file.name);
      formData.append("fileType", docData.fileType);
      if (docData.sourceAgency) formData.append("sourceAgency", docData.sourceAgency);
      if (docData.requiresOcr !== undefined) formData.append("requiresOcr", String(docData.requiresOcr));

      res = await fetch(`/api/cases/${caseId}/documents/upload`, {
        method: "POST",
        body: formData,
      });
    } else {
      res = await fetchWithRetry(`/api/cases/${caseId}/documents/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docData),
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to upload document and process with Raspberry Pi OCR");
    }
    return res.json();
  },

  async processOcrDirectly(file: File, fileType: string = "OTHER") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", file.name);
    formData.append("fileType", fileType);

    const res = await fetch(`/api/ocr/process`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Raspberry Pi OCR processing failed");
    }
    return res.json();
  },

  async reExtractDocument(caseId: string, docId: string): Promise<InvestigationDocument> {
    const res = await fetchWithRetry(`/api/cases/${caseId}/documents/${docId}/re-extract`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to re-extract document text");
    }
    return res.json();
  },

  async extractWithMockRpi(data: {
    filename: string;
    fileType: string;
    mimeType?: string;
    sizeBytes?: number;
    base64OrContent?: string;
    sourceAgency?: string;
  }) {
    const res = await fetchWithRetry(`/api/mock-rpi/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Mock RPi extraction failed");
    }
    return res.json();
  },

  // Verification
  async verifyDocument(
    caseId: string,
    docId: string,
    payload: {
      status: "APPROVED" | "REJECTED" | "PENDING";
      approvedText?: string;
      notes?: string;
      verifiedBy?: string;
    }
  ): Promise<InvestigationDocument> {
    const res = await fetchWithRetry(`/api/cases/${caseId}/documents/${docId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to verify document");
    }
    return res.json();
  },

  // First LLM
  async runFirstLlm(caseId: string, docId: string): Promise<FirstLlmOutput> {
    const res = await fetchWithRetry(
      `/api/cases/${caseId}/documents/${docId}/extract-first-llm`,
      {
        method: "POST",
      },
      1,
      1000
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "First LLM extraction failed");
    }
    return res.json();
  },

  async getFirstLlmOutputs(caseId: string): Promise<FirstLlmOutput[]> {
    try {
      const res = await fetchWithRetry(`/api/cases/${caseId}/first-llm-outputs`, undefined, 1, 600);
      if (!res.ok) throw new Error("Failed to fetch First LLM outputs");
      return await res.json();
    } catch (err) {
      console.warn("Using fallback First LLM outputs for", caseId, err);
      return [];
    }
  },

  // Second LLM
  async runSecondLlm(caseId: string): Promise<FinalNetwork> {
    const res = await fetchWithRetry(
      `/api/cases/${caseId}/second-llm-reasoning`,
      {
        method: "POST",
      },
      1,
      1200
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Second LLM reasoning failed");
    }
    return res.json();
  },

  async getNetwork(caseId: string): Promise<FinalNetwork> {
    try {
      const res = await fetchWithRetry(`/api/cases/${caseId}/network`, undefined, 2, 600);
      if (!res.ok) {
        throw new Error("Failed to load network");
      }
      return await res.json();
    } catch (err) {
      console.warn("Network fetch fallback for", caseId, err);
      if (caseId === "case-001") {
        return FALLBACK_FINAL_NETWORK_CASE1;
      }
      throw err;
    }
  },

  // Predictions
  async getPredictions(caseId: string): Promise<PredictionInsight[]> {
    try {
      const res = await fetchWithRetry(`/api/cases/${caseId}/predictions`, undefined, 2, 600);
      if (!res.ok) throw new Error("Failed to load predictions");
      return await res.json();
    } catch (err) {
      console.warn("Predictions fetch fallback for", caseId, err);
      if (caseId === "case-001") {
        return FALLBACK_PREDICTIONS_CASE1;
      }
      return [];
    }
  },

  async generatePredictions(caseId: string): Promise<PredictionInsight[]> {
    const res = await fetchWithRetry(
      `/api/cases/${caseId}/predictions/generate`,
      {
        method: "POST",
      },
      1,
      1200
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to generate predictions");
    }
    return res.json();
  },

  // Feedback Loop
  async getFeedbackReports(caseId: string): Promise<PostInvestigationReport[]> {
    try {
      const res = await fetchWithRetry(`/api/cases/${caseId}/feedback`, undefined, 1, 600);
      if (!res.ok) throw new Error("Failed to fetch feedback reports");
      return await res.json();
    } catch (err) {
      console.warn("Feedback reports fallback for", caseId, err);
      if (caseId === "case-001") {
        return FALLBACK_FEEDBACK_CASE1;
      }
      return [];
    }
  },

  async submitFeedbackReport(
    caseId: string,
    data: Partial<PostInvestigationReport>
  ): Promise<PostInvestigationReport> {
    const res = await fetchWithRetry(`/api/cases/${caseId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to submit report");
    }
    return res.json();
  },

  // RPi Telemetry
  async getRpiStatus(): Promise<RpiStatus> {
    try {
      const res = await fetchWithRetry("/api/rpi/status", undefined, 2, 600);
      if (!res.ok) throw new Error("Failed to query Raspberry Pi hardware telemetry");
      return await res.json();
    } catch (err) {
      console.warn("RPi telemetry fallback:", err);
      return FALLBACK_RPI_STATUS;
    }
  },
};
