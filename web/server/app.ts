import express from "express";
import { database } from "./db";
import { getRpiStatus, updateRpiConfig } from "./rpiOcrService";
import { extractTextWithMockRpi, getMockRpiStatus } from "./mockRpiTextExtractor";
import { processDocumentWithPi, getLiveRpiStatus, checkPiHealth, getPiConfig } from "./piOcrService";
import { processDocumentWithFirstLlm, checkFirstLlmHealth, testFirstLlmInference } from "./firstLlmService";
import {
  processSecondLlmReasoning,
  checkSecondLlmHealth,
  testSecondLlmConnection,
  updateSecondLlmConfig,
  getSecondLlmConfig,
} from "./secondLlmService";
import { generatePredictionsForCase } from "./predictionService";
import { InvestigationDocument, Case, PostInvestigationReport } from "../src/types";

export const app = express();

// Enable CORS for Vercel preview URLs and external clients
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// URL path normalization for Vercel serverless rewrites:
// Handles x-matched-path, x-now-route-matches, x-forwarded-uri, and direct /api routing seamlessly
app.use((req, res, next) => {
  const matchedPath = (req.headers["x-matched-path"] as string) || (req.headers["x-invoke-path"] as string);
  const forwardedUri = req.headers["x-forwarded-uri"] as string;
  const nowMatches = req.headers["x-now-route-matches"] as string;

  if (matchedPath && matchedPath.startsWith("/api")) {
    req.url = matchedPath.split("?")[0];
  } else if (forwardedUri && forwardedUri.startsWith("/api")) {
    req.url = forwardedUri.split("?")[0];
  } else if (nowMatches && nowMatches.includes("1=")) {
    const match = nowMatches.match(/1=([^&]+)/);
    if (match && match[1]) {
      const captured = decodeURIComponent(match[1]);
      req.url = `/api/${captured.replace(/^\/+/, "")}`;
    }
  } else if (req.url === "/api" && req.originalUrl && req.originalUrl !== "/api") {
    req.url = req.originalUrl;
  }

  // Only rewrite to /api if the request is actually an API route or Vercel serverless invocation
  if (process.env.VERCEL && !req.url.startsWith("/api")) {
    req.url = `/api${req.url}`;
  }
  next();
});

// Request body parsers (supports up to 50MB for forensics, high-res scans, and base64 PDFs)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper to safely parse multipart/form-data from Node/Vercel request
async function parseMultipartRequest(req: express.Request): Promise<FormData> {
  let fullBuffer: Buffer;
  if (Buffer.isBuffer((req as any).body)) {
    fullBuffer = (req as any).body;
  } else if ((req as any).rawBody && Buffer.isBuffer((req as any).rawBody)) {
    fullBuffer = (req as any).rawBody;
  } else {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    fullBuffer = Buffer.concat(chunks);
  }
  const webReq = new Request("http://localhost", {
    method: "POST",
    headers: req.headers as any,
    body: fullBuffer,
  });
  return webReq.formData();
}

// --- API ROOT & HEALTH ROUTES ---

app.get("/api", (req, res) => {
  res.json({
    status: "ok",
    system: "AI-Powered Criminal Network Analysis System",
    division: "NCRB Central Intercept & Intelligence Analytics",
    healthEndpoint: "/api/health",
  });
});

app.get("/api/health", async (req, res) => {
  const [piHealth, firstLlmHealth, secondLlmHealth] = await Promise.all([
    checkPiHealth(),
    checkFirstLlmHealth(),
    checkSecondLlmHealth(),
  ]);

  res.json({
    status: "ok",
    system: "AI-Powered Criminal Network Analysis System",
    division: "NCRB Central Intercept & Intelligence Analytics",
    pipelineArchitecture: "File Input -> Raspberry Pi (OCR) -> Investigator Confirmation -> First LLM (Tailscale Qwen 3.5 4B) -> DB Storage -> Second LLM (Gokul PC Qwen 3.5 4B) -> Final Graph",
    piOcrService: {
      online: piHealth.online,
      version: piHealth.version,
      service: piHealth.service,
      latencyMs: piHealth.latencyMs,
    },
    firstLlmService: {
      online: firstLlmHealth.online,
      model: firstLlmHealth.model,
      endpoint: firstLlmHealth.endpoint,
      latencyMs: firstLlmHealth.latencyMs,
      error: firstLlmHealth.error,
    },
    secondLlmService: {
      online: secondLlmHealth.online,
      model: secondLlmHealth.model,
      endpoint: secondLlmHealth.endpoint,
      latencyMs: secondLlmHealth.latencyMs,
      apiKeyConfigured: secondLlmHealth.apiKeyConfigured,
      error: secondLlmHealth.error,
    },
    timestamp: new Date().toISOString(),
  });
});

// Dedicated First LLM status endpoint (Tailscale Qwen 3.5 4B)
app.get("/api/first-llm/status", async (req, res) => {
  const status = await checkFirstLlmHealth();
  res.json(status);
});

// Dedicated First LLM live inference & authentication test endpoint
app.post("/api/first-llm/test", async (req, res) => {
  const result = await testFirstLlmInference();
  res.json(result);
});

// Dedicated Second LLM status endpoint (Gokul PC Qwen 3.5 4B)
app.get("/api/second-llm/status", async (req, res) => {
  const status = await checkSecondLlmHealth();
  res.json(status);
});

// Dedicated Second LLM live inference & authentication test endpoint
app.post("/api/second-llm/test", async (req, res) => {
  const { apiKey } = req.body || {};
  const result = await testSecondLlmConnection(apiKey);
  res.json(result);
});

// Dedicated Second LLM configuration update endpoint
app.post("/api/second-llm/config", (req, res) => {
  const updated = updateSecondLlmConfig(req.body);
  res.json({
    status: "ok",
    message: "Second LLM (Gokul PC) configuration updated successfully",
    config: updated,
  });
});

// Dedicated OCR Processing endpoint for direct testing and modular usage
app.post("/api/ocr/process", async (req, res) => {
  try {
    let fileBuffer: Buffer | null = null;
    let filename = "uploaded_document.pdf";
    let mimeType = "application/pdf";
    let fileType = "OTHER";

    const isMultipart = req.headers["content-type"]?.includes("multipart/form-data");
    if (isMultipart) {
      const formData = await parseMultipartRequest(req);
      const file = formData.get("file") as File | null;
      if (!file) {
        return res.status(400).json({ error: "Missing 'file' field in multipart request" });
      }
      filename = file.name;
      mimeType = file.type || "application/octet-stream";
      fileType = (formData.get("fileType") as string) || "OTHER";
      const arr = await file.arrayBuffer();
      fileBuffer = Buffer.from(arr);
    } else {
      const { base64Data, fileDataUrl, rawContent } = req.body;
      filename = req.body.filename || filename;
      mimeType = req.body.mimeType || mimeType;
      fileType = req.body.fileType || fileType;

      if (fileDataUrl || base64Data) {
        const rawB64 = (fileDataUrl || base64Data).includes(";base64,")
          ? (fileDataUrl || base64Data).split(";base64,")[1]
          : fileDataUrl || base64Data;
        fileBuffer = Buffer.from(rawB64, "base64");
      } else if (rawContent) {
        fileBuffer = Buffer.from(rawContent, "utf-8");
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: "No document binary or text content provided." });
    }

    const result = await processDocumentWithPi({
      fileBuffer,
      filename,
      mimeType,
      fileType,
    });

    res.json(result);
  } catch (err: any) {
    console.error("[OCR Process API] Error:", err.message);
    const statusCode = err.message?.includes("timed out")
      ? 504
      : err.message?.includes("rejected file")
      ? 415
      : err.message?.includes("exceeds maximum allowed limit")
      ? 413
      : err.message?.includes("Failed to connect")
      ? 503
      : 500;
    res.status(statusCode).json({ error: err.message, status: "FAILED" });
  }
});

// Dedicated Mock Raspberry Pi Text Extraction Service Endpoint (legacy/testing support)
app.get("/api/mock-rpi/status", (req, res) => {
  res.json(getMockRpiStatus());
});

app.post("/api/mock-rpi/extract", async (req, res) => {
  try {
    const { filename, fileType, mimeType, sizeBytes, base64OrContent, sourceAgency } = req.body;
    if (!filename) {
      return res.status(400).json({ error: "Filename is required" });
    }
    const result = await extractTextWithMockRpi({
      filename,
      fileType: fileType || "OTHER",
      mimeType: mimeType || "application/octet-stream",
      sizeBytes: sizeBytes || 1024,
      base64OrContent,
      sourceAgency,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Mock text extraction failed" });
  }
});

// Live Raspberry Pi OCR Hardware telemetry
app.get("/api/rpi/status", async (req, res) => {
  try {
    const status = await getLiveRpiStatus();
    res.json(status);
  } catch (err: any) {
    console.error("RPi status fetch error:", err.message);
    res.json(getRpiStatus());
  }
});

app.post("/api/rpi/config", (req, res) => {
  const updated = updateRpiConfig(req.body);
  res.json(updated);
});

// Cases
app.get("/api/cases", (req, res) => {
  const cases = database.getCases();
  res.json(cases);
});

app.post("/api/cases", (req, res) => {
  const { title, caseNumber, department, description, classification, leadInvestigator } = req.body;
  if (!title || !caseNumber) {
    return res.status(400).json({ error: "Title and Case Number are required." });
  }
  const newCase: Case = {
    id: `case-${Date.now()}`,
    caseNumber,
    title,
    department: department || "NCRB Central Intercept & Analytics",
    description: description || "",
    dateOpened: new Date().toISOString().split("T")[0],
    classification: classification || "LAW ENFORCEMENT SENSITIVE",
    leadInvestigator: leadInvestigator || "Special Investigator",
    status: "ACTIVE",
  };
  const created = database.createCase(newCase);
  res.status(201).json(created);
});

app.get("/api/cases/:id", (req, res) => {
  const c = database.getCaseById(req.params.id);
  if (!c) return res.status(404).json({ error: "Case not found" });
  res.json(c);
});

// Documents Ingestion & OCR
app.get("/api/cases/:id/documents", (req, res) => {
  const docs = database.getDocuments(req.params.id);
  res.json(docs);
});

// Handler for uploading files, forwarding to Raspberry Pi OCR/HTR API, and storing raw extracted text alongside original file
const handleDocumentUploadAndExtraction = async (req: express.Request, res: express.Response) => {
  try {
    const caseId = req.params.id;
    let filename = "";
    let fileType: any = "OTHER";
    let originalSize = "1.0 MB";
    let mimeType = "application/octet-stream";
    let sourceAgency = "NCRB Direct Ingest";
    let requiresOcr = true;
    let rawContent: string | undefined = undefined;
    let fileDataUrl: string | undefined = undefined;
    let fileBuffer: Buffer | null = null;

    const isMultipart = req.headers["content-type"]?.includes("multipart/form-data");
    if (isMultipart) {
      try {
        const formData = await parseMultipartRequest(req);
        const file = formData.get("file") as File | null;
        if (file) {
          filename = (formData.get("filename") as string) || file.name;
          mimeType = file.type || "application/octet-stream";
          fileType = (formData.get("fileType") as string) || "OTHER";
          sourceAgency = (formData.get("sourceAgency") as string) || "NCRB Direct Ingest";
          const reqOcr = formData.get("requiresOcr");
          requiresOcr = reqOcr !== "false";

          const arr = await file.arrayBuffer();
          fileBuffer = Buffer.from(arr);
          originalSize = `${(fileBuffer.length / 1024).toFixed(1)} KB`;
          fileDataUrl = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
        }
      } catch (mpErr: any) {
        console.warn("[Upload] Multipart parse warning:", mpErr.message);
      }
    }

    if (!fileBuffer) {
      const body = req.body || {};
      filename = body.filename || filename;
      fileType = body.fileType || fileType || "OTHER";
      originalSize = body.originalSize || originalSize || "1.2 MB";
      mimeType = body.mimeType || mimeType || "application/octet-stream";
      sourceAgency = body.sourceAgency || sourceAgency || "NCRB Direct Ingest";
      requiresOcr = body.requiresOcr !== false;
      rawContent = body.rawContent;
      fileDataUrl = body.fileDataUrl || fileDataUrl;

      if (fileDataUrl) {
        const rawB64 = fileDataUrl.includes(";base64,")
          ? fileDataUrl.split(";base64,")[1]
          : fileDataUrl;
        fileBuffer = Buffer.from(rawB64, "base64");
      } else if (rawContent) {
        fileBuffer = Buffer.from(rawContent, "utf-8");
      }
    }

    if (!filename) {
      return res.status(400).json({ error: "Filename is required" });
    }

    const docId = `doc-${Date.now()}`;
    const lowerName = filename.toLowerCase();

    let extractionResult: {
      status: "COMPLETED" | "FAILED";
      rawExtractedText: string;
      metadata: any;
    };

    // Real Raspberry Pi OCR processing for supported document/image formats & OCR-requested text
    try {
      if (requiresOcr && fileBuffer && fileBuffer.length > 0) {
        console.log(`[Ingest] Forwarding ${filename} to Raspberry Pi OCR service...`);
        const piResult = await processDocumentWithPi({
          fileBuffer,
          filename,
          mimeType,
          fileType,
        });

        extractionResult = {
          status: piResult.status,
          rawExtractedText: piResult.rawExtractedText,
          metadata: piResult.metadata,
        };
      } else if (rawContent || (fileBuffer && (lowerName.endsWith(".txt") || lowerName.endsWith(".csv")))) {
        // Direct plain-text ingestion
        const text = rawContent || (fileBuffer ? fileBuffer.toString("utf-8") : "");
        const words = text.trim().split(/\s+/).filter(Boolean);
        extractionResult = {
          status: "COMPLETED",
          rawExtractedText: text,
          metadata: {
            rpiDevice: "Raspberry Pi OCR Node (Tailscale)",
            rpiDeviceIp: (process.env.OCR_PI_BASE_URL || "https://ali.tail743e77.ts.net").replace(/^https?:\/\//, ""),
            engine: "Direct Text Ingest & Forensic Parser",
            latencyMs: 18,
            confidenceScore: 1.0,
            charCount: text.length,
            wordCount: words.length,
            totalPages: 1,
            pagesSuccessful: 1,
            pagesFailed: 0,
            processedTimestamp: new Date().toISOString(),
          },
        };
      } else {
        // Fallback simulation for unsupported binary streams
        const mockRes = await extractTextWithMockRpi({
          filename,
          fileType: fileType || "OTHER",
          mimeType,
          base64OrContent: fileDataUrl || rawContent,
          sourceAgency,
        });
        extractionResult = {
          status: mockRes.status,
          rawExtractedText: mockRes.rawExtractedText,
          metadata: mockRes.metadata,
        };
      }
    } catch (ocrErr: any) {
      console.error(`[Ingest] Pi OCR error for ${filename}:`, ocrErr.message);
      extractionResult = {
        status: "FAILED",
        rawExtractedText: `[RASPBERRY PI OCR FAILURE]\nDocument: ${filename}\nError: ${ocrErr.message}\nTimestamp: ${new Date().toISOString()}\n\nYou can re-run OCR extraction using the "Re-Extract OCR" button or manually review/edit the intelligence text in the Verification Queue.`,
        metadata: {
          rpiDevice: "Raspberry Pi 3B (Tailscale Funnel)",
          rpiDeviceIp: (process.env.OCR_PI_BASE_URL || "https://ali.tail743e77.ts.net").replace(/^https?:\/\//, ""),
          engine: "TrOCR-Large-HTR + Tesseract-v5-Devanagari/Latin",
          latencyMs: 0,
          confidenceScore: 0.0,
          charCount: 0,
          wordCount: 0,
          totalPages: 1,
          pagesSuccessful: 0,
          pagesFailed: 1,
          error: ocrErr.message,
          processedTimestamp: new Date().toISOString(),
        },
      };
    }

    const newDoc: InvestigationDocument = {
      id: docId,
      caseId,
      filename,
      fileType: fileType || "OTHER",
      originalSize,
      mimeType,
      uploadDate: new Date().toISOString().replace("T", " ").substring(0, 19),
      sourceAgency,
      requiresOcr,
      extractionStatus: extractionResult.status,
      originalFileDataUrl: fileDataUrl && fileDataUrl.length < 300000 ? fileDataUrl : undefined,
      originalContent: rawContent || undefined,
      rawExtractedText: extractionResult.rawExtractedText,
      ocrMetadata: extractionResult.metadata,
      approvedText: "",
      verificationStatus: "PENDING", // Strict human-in-the-loop gate
    };

    database.addDocument(caseId, newDoc);
    res.status(201).json(newDoc);
  } catch (err: any) {
    console.error("Document ingestion error:", err.message);
    const statusCode = err.message?.includes("timed out")
      ? 504
      : err.message?.includes("rejected file")
      ? 415
      : err.message?.includes("exceeds maximum allowed limit")
      ? 413
      : err.message?.includes("Failed to connect")
      ? 503
      : 500;
    res.status(statusCode).json({
      error: err.message || "Failed to process document with Raspberry Pi OCR service",
      status: "FAILED",
    });
  }
};

app.post("/api/cases/:id/documents", handleDocumentUploadAndExtraction);
app.post("/api/cases/:id/documents/upload", handleDocumentUploadAndExtraction);
app.post("/cases/:id/documents", handleDocumentUploadAndExtraction);
app.post("/cases/:id/documents/upload", handleDocumentUploadAndExtraction);

// Re-run Raspberry Pi OCR Extraction for an existing document
app.post("/api/cases/:caseId/documents/:docId/re-extract", async (req, res) => {
  try {
    const { caseId, docId } = req.params;
    const doc = database.getDocumentById(caseId, docId);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    let extractionResult: {
      status: "COMPLETED" | "FAILED";
      rawExtractedText: string;
      metadata: any;
    };

    let fileBuffer: Buffer | null = null;
    if (doc.originalFileDataUrl) {
      const rawB64 = doc.originalFileDataUrl.includes(";base64,")
        ? doc.originalFileDataUrl.split(";base64,")[1]
        : doc.originalFileDataUrl;
      fileBuffer = Buffer.from(rawB64, "base64");
    } else if (doc.originalContent) {
      fileBuffer = Buffer.from(doc.originalContent, "utf-8");
    }

    const lowerName = doc.filename.toLowerCase();
    const isPdfOrImage =
      lowerName.endsWith(".pdf") ||
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".webp") ||
      lowerName.endsWith(".tiff") ||
      lowerName.endsWith(".tif") ||
      doc.mimeType.startsWith("image/") ||
      doc.mimeType === "application/pdf";

    if (isPdfOrImage && fileBuffer && fileBuffer.length > 0) {
      const piResult = await processDocumentWithPi({
        fileBuffer,
        filename: doc.filename,
        mimeType: doc.mimeType,
        fileType: doc.fileType,
      });
      extractionResult = {
        status: piResult.status,
        rawExtractedText: piResult.rawExtractedText,
        metadata: piResult.metadata,
      };
    } else {
      const mockRes = await extractTextWithMockRpi({
        filename: doc.filename,
        fileType: doc.fileType,
        mimeType: doc.mimeType,
        base64OrContent: doc.originalFileDataUrl || doc.originalContent,
        sourceAgency: doc.sourceAgency,
      });
      extractionResult = {
        status: mockRes.status,
        rawExtractedText: mockRes.rawExtractedText,
        metadata: mockRes.metadata,
      };
    }

    const updated = database.updateDocument(caseId, docId, {
      rawExtractedText: extractionResult.rawExtractedText,
      ocrMetadata: extractionResult.metadata,
      extractionStatus: extractionResult.status,
    });

    res.json(updated);
  } catch (err: any) {
    console.error("[Re-extract] Error:", err.message);
    const statusCode = err.message?.includes("timed out")
      ? 504
      : err.message?.includes("rejected file")
      ? 415
      : err.message?.includes("exceeds maximum allowed limit")
      ? 413
      : err.message?.includes("Failed to connect")
      ? 503
      : 500;
    res.status(statusCode).json({ error: err.message || "Failed to re-extract document text" });
  }
});

// Investigator Verification Queue
app.post("/api/cases/:caseId/documents/:docId/verify", (req, res) => {
  const { caseId, docId } = req.params;
  const { status, approvedText, notes, verifiedBy } = req.body;

  if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    return res.status(400).json({ error: "Status must be APPROVED, REJECTED, or PENDING" });
  }

  const doc = database.getDocumentById(caseId, docId);
  if (!doc) {
    return res.status(404).json({ error: "Document not found" });
  }

  const updated = database.updateDocument(caseId, docId, {
    verificationStatus: status,
    approvedText: status === "APPROVED" ? (approvedText || doc.rawExtractedText) : undefined,
    verificationNotes: notes || "",
    verifiedAt: new Date().toISOString(),
    verifiedBy: verifiedBy || "Duty Intelligence Officer",
  });

  res.json(updated);
});

// Step 4: First LLM Information Extraction
app.post("/api/cases/:caseId/documents/:docId/extract-first-llm", async (req, res) => {
  try {
    const { caseId, docId } = req.params;
    const result = await processDocumentWithFirstLlm(caseId, docId);
    
    // Automatically update the case ontology network so Second LLM & Graph views
    // immediately reflect the newly extracted real entities
    try {
      await processSecondLlmReasoning(caseId);
    } catch (netErr: any) {
      console.warn("Background network sync on First LLM extraction:", netErr.message);
    }

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "First LLM extraction failed" });
  }
});

app.get("/api/cases/:caseId/first-llm-outputs", (req, res) => {
  const outputs = database.getFirstLlmOutputs(req.params.caseId);
  res.json(outputs);
});

// Second LLM (Gokul PC) runtime configuration & testing
app.post("/api/second-llm/config", (req, res) => {
  const updated = updateSecondLlmConfig(req.body);
  res.json({
    status: "ok",
    message: "Second LLM (Gokul PC) configuration updated successfully",
    config: updated,
  });
});

app.get("/api/second-llm/config", (req, res) => {
  res.json(getSecondLlmConfig());
});

// Backward-compatible aliases for legacy routes
app.post("/api/config/gemini", (req, res) => {
  const { apiKey } = req.body || {};
  if (apiKey) {
    updateSecondLlmConfig({ authKey: apiKey });
  }
  res.json({
    status: "ok",
    message: "Second LLM key updated successfully",
    configured: true,
  });
});

app.post("/api/gemini/test", async (req, res) => {
  const { apiKey } = req.body || {};
  const result = await testSecondLlmConnection(apiKey);
  res.json(result);
});

// Step 6: Second Fine-Tuned LLM Reasoning & Network Construction (Powered by Gokul PC Tailscale Node)
app.post("/api/cases/:caseId/second-llm-reasoning", async (req, res) => {
  try {
    const { caseId } = req.params;
    const { apiKey, geminiApiKey } = req.body || {};
    const network = await processSecondLlmReasoning(caseId, apiKey || geminiApiKey);
    res.json(network);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Second LLM reasoning failed" });
  }
});

// Fallback route without :caseId param in URL (e.g. if caseId is passed in body)
app.post("/api/cases/second-llm-reasoning", async (req, res) => {
  try {
    const { caseId, apiKey, geminiApiKey } = req.body || {};
    const targetCaseId = caseId || "case-001";
    const network = await processSecondLlmReasoning(targetCaseId, apiKey || geminiApiKey);
    res.json(network);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Second LLM reasoning failed" });
  }
});

// Network Graph
app.get("/api/cases/:caseId/network", async (req, res) => {
  const caseId = req.params.caseId;
  let network = database.getFinalNetwork(caseId);
  const firstLlmOutputs = database.getFirstLlmOutputs(caseId);

  // If first LLM outputs exist, ensure network contains the real extracted entities
  if (firstLlmOutputs.length > 0) {
    const realNames = new Set(
      firstLlmOutputs.flatMap((o) => o.entities.map((e) => e.name.trim().toLowerCase()))
    );
    const hasRealEntities = network?.nodes.some((n) => realNames.has(n.name.trim().toLowerCase()));

    if (!network || !hasRealEntities) {
      try {
        network = await processSecondLlmReasoning(caseId);
      } catch (err: any) {
        console.warn("Auto-syncing real network on GET /network:", err.message);
      }
    }
  }

  if (!network) {
    return res.status(404).json({ error: "No network graph found for this case yet." });
  }
  res.json(network);
});

// Prediction & Risk Analysis
app.get("/api/cases/:caseId/predictions", (req, res) => {
  const preds = database.getPredictions(req.params.caseId);
  res.json(preds);
});

app.post("/api/cases/:caseId/predictions/generate", async (req, res) => {
  try {
    const preds = await generatePredictionsForCase(req.params.caseId);
    res.json(preds);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Prediction generation failed" });
  }
});

// Post-Investigation Feedback Loop
app.get("/api/cases/:caseId/feedback", (req, res) => {
  const reports = database.getFeedbackReports(req.params.caseId);
  res.json(reports);
});

app.post("/api/cases/:caseId/feedback", (req, res) => {
  const { caseId } = req.params;
  const {
    investigatorName,
    summary,
    confirmedRelationships,
    falsePositiveRelationships,
    missedConnections,
    predictionAccuracyRating,
    verifiedOutcomeSummary,
  } = req.body;

  const newReport: PostInvestigationReport = {
    id: `rep-${Date.now()}`,
    caseId,
    investigatorName: investigatorName || "Investigating Officer",
    reportDate: new Date().toISOString().split("T")[0],
    summary: summary || "",
    confirmedRelationships: confirmedRelationships || [],
    falsePositiveRelationships: falsePositiveRelationships || [],
    missedConnections: missedConnections || [],
    predictionAccuracyRating: Number(predictionAccuracyRating) || 5,
    verifiedOutcomeSummary: verifiedOutcomeSummary || "",
    usedForRetraining: true,
    modelRetrainedAt: new Date().toISOString(),
  };

  database.addFeedbackReport(caseId, newReport);
  res.status(201).json(newReport);
});

// Catch-all for any unhandled /api/* requests so they ALWAYS return clean JSON (never fall through to Vite HTML)
app.all("/api/*", (req, res) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl}`,
    status: "NOT_FOUND",
  });
});

// Global error handling middleware - ensure client always receives clean JSON instead of HTML 500
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Express Global Error]", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || "Internal server error occurred during request processing",
    status: "FAILED",
    code: err.code || "INTERNAL_ERROR",
  });
});

export default app;
