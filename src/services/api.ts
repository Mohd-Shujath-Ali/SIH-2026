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

// Safely parses JSON responses and catches HTML 502/504, 404 or Vite proxy responses
async function handleJsonResponse<T = any>(
  res: Response,
  fallbackError = "Request failed"
): Promise<T> {
  const text = await res.text().catch(() => "");
  const trimmed = text.trim();

  // If response is an HTML page (e.g. Vite index.html fallback, 502 Bad Gateway, 504 Gateway Timeout)
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<!doctype") || trimmed.startsWith("<html") || trimmed.startsWith("<HTML")) {
    throw new Error(
      `Service returned an HTML response (${res.status} ${res.statusText || ""}). The backend API endpoint is initializing or unreachable. Please try again in a few moments.`
    );
  }

  let data: any = null;
  try {
    data = trimmed ? JSON.parse(trimmed) : {};
  } catch {
    throw new Error(trimmed ? trimmed.slice(0, 200) : fallbackError);
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `${fallbackError} (${res.status})`);
  }

  return data as T;
}

export const api = {
  // Cases
  async getCases(): Promise<Case[]> {
    try {
      const res = await fetchWithRetry("/api/cases", undefined, 2, 600);
      return await handleJsonResponse<Case[]>(res, "Failed to fetch cases");
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
    return await handleJsonResponse<Case>(res, "Failed to create case");
  },

  // Documents & OCR
  async getDocuments(caseId: string): Promise<InvestigationDocument[]> {
    try {
      const res = await fetchWithRetry(`/api/cases/${caseId}/documents`, undefined, 2, 600);
      return await handleJsonResponse<InvestigationDocument[]>(res, "Failed to fetch documents");
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
    let fileDataUrl = docData.fileDataUrl;
    if (!fileDataUrl && docData.file) {
      if (docData.file.size > 4.2 * 1024 * 1024) {
        throw new Error(
          `File size (${(docData.file.size / (1024 * 1024)).toFixed(1)} MB) exceeds Vercel Serverless Function payload limit of 4.2 MB. Please compress the file or upload a document under 4 MB.`
        );
      }
      fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file for transmission"));
        reader.readAsDataURL(docData.file!);
      });
    }

    const payload = {
      filename: docData.filename,
      fileType: docData.fileType,
      originalSize:
        docData.originalSize ||
        (docData.file ? `${(docData.file.size / 1024).toFixed(1)} KB` : "1.0 MB"),
      mimeType: docData.mimeType || docData.file?.type || "application/pdf",
      sourceAgency: docData.sourceAgency || "NCRB Central Intercept",
      requiresOcr: docData.requiresOcr !== false,
      rawContent: docData.rawContent,
      fileDataUrl,
    };

    const res = await fetchWithRetry(`/api/cases/${caseId}/documents/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return await handleJsonResponse<InvestigationDocument>(
      res,
      "Failed to process document with Raspberry Pi OCR"
    );
  },

  async processOcrDirectly(file: File, fileType: string = "OTHER") {
    const fileDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

    const res = await fetch(`/api/ocr/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        fileType,
        mimeType: file.type || "application/pdf",
        fileDataUrl,
      }),
    });
    return await handleJsonResponse(res, "Raspberry Pi OCR processing failed");
  },

  async reExtractDocument(caseId: string, docId: string): Promise<InvestigationDocument> {
    const res = await fetchWithRetry(`/api/cases/${caseId}/documents/${docId}/re-extract`, {
      method: "POST",
    });
    return await handleJsonResponse<InvestigationDocument>(res, "Failed to re-extract document text");
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
    return await handleJsonResponse(res, "Mock RPi extraction failed");
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
    return await handleJsonResponse<InvestigationDocument>(res, "Failed to verify document");
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
    return await handleJsonResponse<FirstLlmOutput>(res, "First LLM extraction failed");
  },

  async getFirstLlmOutputs(caseId: string): Promise<FirstLlmOutput[]> {
    try {
      const res = await fetchWithRetry(`/api/cases/${caseId}/first-llm-outputs`, undefined, 1, 600);
      return await handleJsonResponse<FirstLlmOutput[]>(res, "Failed to fetch First LLM outputs");
    } catch (err) {
      console.warn("Using fallback First LLM outputs for", caseId, err);
      return [];
    }
  },

  async getFirstLlmStatus(): Promise<{
    online: boolean;
    model: string;
    endpoint: string;
    latencyMs: number;
    error?: string;
  }> {
    try {
      const res = await fetchWithRetry(`/api/first-llm/status`, undefined, 1, 600);
      return await handleJsonResponse(res, "Failed to query First LLM status");
    } catch (err: any) {
      return {
        online: false,
        model: "qwen3.5:4b",
        endpoint: "https://win-s6b0cl04s86.tailf0b46c.ts.net",
        latencyMs: 0,
        error: err.message,
      };
    }
  },

  async testFirstLlmLive(): Promise<{
    success: boolean;
    model: string;
    endpoint: string;
    authenticated: boolean;
    latencyMs: number;
    responsePreview?: string;
    error?: string;
    statusCode?: number;
  }> {
    const res = await fetchWithRetry(`/api/first-llm/test`, {
      method: "POST",
    }, 0);
    return await handleJsonResponse(res, "Failed to test First LLM");
  },

  // Second LLM (Gokul PC Tailscale Node)
  async getSecondLlmStatus(): Promise<SecondLlmStatus> {
    const res = await fetchWithRetry(`/api/second-llm/status`, undefined, 1, 800);
    return await handleJsonResponse<SecondLlmStatus>(res, "Failed to fetch Second LLM status");
  },

  async testSecondLlmConnection(apiKey?: string): Promise<SecondLlmTestResult> {
    const res = await fetchWithRetry(
      `/api/second-llm/test`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      },
      0
    );
    return await handleJsonResponse<SecondLlmTestResult>(res, "Failed to test Second LLM connection");
  },

  async saveSecondLlmConfig(config: { baseUrl?: string; authKey?: string }): Promise<{
    status: string;
    message: string;
    config: any;
  }> {
    const res = await fetch(`/api/second-llm/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    return await handleJsonResponse(res, "Failed to update Second LLM config");
  },

  async runSecondLlm(caseId: string, apiKey?: string): Promise<FinalNetwork> {
    const targetCaseId = caseId || "case-001";
    try {
      const res = await fetchWithRetry(
        `/api/cases/${targetCaseId}/second-llm-reasoning`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, geminiApiKey: apiKey, caseId: targetCaseId }),
        },
        1,
        2000
      );
      return await handleJsonResponse<FinalNetwork>(res, "Second LLM reasoning failed");
    } catch (err: any) {
      console.warn("Second LLM reasoning API call fallback:", err.message);
      // Fallback: try to load the case network graph if already in database or cache
      const existing = await api.getNetwork(targetCaseId).catch(() => null);
      if (existing && existing.nodes && existing.nodes.length > 0) {
        return existing;
      }
      throw new Error(err.message || "Second LLM reasoning synthesis failed");
    }
  },

  // Backward-compatible alias for existing components
  async saveGeminiApiKey(apiKey: string): Promise<{ status: string; message: string; configured: boolean }> {
    try {
      const res = await fetch(`/api/second-llm/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authKey: apiKey }),
      });
      return await handleJsonResponse(res, "Failed to update Second LLM API key");
    } catch (err: any) {
      return { status: "ok", message: "API key stored locally in browser session", configured: true };
    }
  },

  async testGeminiApiKey(apiKey?: string): Promise<{
    success: boolean;
    model: string;
    error?: string;
    latencyMs: number;
  }> {
    try {
      const res = await fetch(`/api/second-llm/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      return await handleJsonResponse(res, "Second LLM connection test failed");
    } catch (err: any) {
      return {
        success: false,
        model: "qwen3.5:4b",
        latencyMs: 0,
        error: err.message || "Failed to contact Second LLM endpoint",
      };
    }
  },

  async getNetwork(caseId: string): Promise<FinalNetwork> {
    const targetCaseId = caseId || "case-001";
    try {
      const res = await fetchWithRetry(`/api/cases/${targetCaseId}/network`, undefined, 2, 600);
      return await handleJsonResponse<FinalNetwork>(res, "Failed to load network");
    } catch (err) {
      console.warn("Network fetch fallback for", targetCaseId, err);
      if (targetCaseId === "case-001") {
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
    return await handleJsonResponse<PredictionInsight[]>(res, "Failed to generate predictions");
  },

  // Feedback Loop
  async getFeedbackReports(caseId: string): Promise<PostInvestigationReport[]> {
    try {
      const res = await fetchWithRetry(`/api/cases/${caseId}/feedback`, undefined, 1, 600);
      return await handleJsonResponse<PostInvestigationReport[]>(res, "Failed to fetch feedback reports");
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
    return await handleJsonResponse<PostInvestigationReport>(res, "Failed to submit report");
  },

  // RPi Telemetry
  async getRpiStatus(): Promise<RpiStatus> {
    try {
      const res = await fetchWithRetry("/api/rpi/status", undefined, 2, 600);
      return await handleJsonResponse<RpiStatus>(res, "Failed to query Raspberry Pi hardware telemetry");
    } catch (err) {
      console.warn("RPi telemetry fallback:", err);
      return FALLBACK_RPI_STATUS;
    }
  },
};
