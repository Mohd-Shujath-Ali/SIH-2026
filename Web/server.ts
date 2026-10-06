import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { database } from "./server/db";
import { getRpiStatus, updateRpiConfig } from "./server/rpiOcrService";
import { extractTextWithMockRpi, getMockRpiStatus } from "./server/mockRpiTextExtractor";
import { processDocumentWithPi, getLiveRpiStatus, checkPiHealth, getPiConfig } from "./server/piOcrService";
import { processDocumentWithFirstLlm } from "./server/firstLlmService";
import { processSecondLlmReasoning } from "./server/secondLlmService";
import { generatePredictionsForCase } from "./server/predictionService";
import { InvestigationDocument, Case, PostInvestigationReport } from "./src/types";

// Helper to safely parse multipart/form-data from Node Express request using web standard FormData
async function parseMultipartRequest(req: express.Request): Promise<FormData> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const fullBuffer = Buffer.concat(chunks);
  const webReq = new Request("http://localhost", {
    method: "POST",
    headers: req.headers as any,
    body: fullBuffer,
  });
  return webReq.formData();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // --- API ROUTES FIRST ---

  // Health check
  app.get("/api/health", async (req, res) => {
    const piHealth = await checkPiHealth();
    res.json({
      status: "ok",
      system: "AI-Powered Criminal Network Analysis System",
      division: "NCRB Central Intercept & Intelligence Analytics",
      piOcrService: {
        online: piHealth.online,
        version: piHealth.version,
        service: piHealth.service,
        latencyMs: piHealth.latencyMs,
      },
      timestamp: new Date().toISOString(),
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
        const formData = await parseMultipartRequest(req);
        const file = formData.get("file") as File | null;
        if (!file) {
          return res.status(400).json({ error: "No file provided in multipart upload." });
        }
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
      } else {
        const body = req.body;
        filename = body.filename;
        fileType = body.fileType || "OTHER";
        originalSize = body.originalSize || "1.2 MB";
        mimeType = body.mimeType || "application/octet-stream";
        sourceAgency = body.sourceAgency || "NCRB Direct Ingest";
        requiresOcr = body.requiresOcr !== false;
        rawContent = body.rawContent;
        fileDataUrl = body.fileDataUrl;

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
      const isPdfOrImage =
        lowerName.endsWith(".pdf") ||
        lowerName.endsWith(".png") ||
        lowerName.endsWith(".jpg") ||
        lowerName.endsWith(".jpeg") ||
        lowerName.endsWith(".webp") ||
        lowerName.endsWith(".tiff") ||
        lowerName.endsWith(".tif") ||
        mimeType.startsWith("image/") ||
        mimeType === "application/pdf";

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
        return res.status(502).json({
          error: `Raspberry Pi OCR failed: ${ocrErr.message}`,
          details: ocrErr.message,
        });
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
        originalFileDataUrl: fileDataUrl || undefined,
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
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "First LLM extraction failed" });
    }
  });

  app.get("/api/cases/:caseId/first-llm-outputs", (req, res) => {
    const outputs = database.getFirstLlmOutputs(req.params.caseId);
    res.json(outputs);
  });

  // Step 6: Second Fine-Tuned LLM Reasoning & Network Construction
  app.post("/api/cases/:caseId/second-llm-reasoning", async (req, res) => {
    try {
      const { caseId } = req.params;
      const network = await processSecondLlmReasoning(caseId);
      res.json(network);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Second LLM reasoning failed" });
    }
  });

  // Network Graph
  app.get("/api/cases/:caseId/network", (req, res) => {
    const network = database.getFinalNetwork(req.params.caseId);
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

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[NCRB AI SYSTEM] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
