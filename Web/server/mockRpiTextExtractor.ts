import { RpiStatus } from "../src/types";

export interface MockExtractionResult {
  status: "COMPLETED" | "FAILED";
  rawExtractedText: string;
  metadata: {
    rpiDevice: string;
    rpiDeviceIp: string;
    engine: string;
    latencyMs: number;
    confidenceScore: number;
    charCount: number;
    wordCount: number;
    processedTimestamp: string;
  };
}

export interface ExtractionInput {
  filename: string;
  fileType: string;
  mimeType?: string;
  sizeBytes?: number;
  base64OrContent?: string;
  sourceAgency?: string;
}

// Persistent state for Raspberry Pi hardware simulation
const rpiHardwareState: RpiStatus = {
  online: true,
  deviceIp: "192.168.1.142:8000",
  deviceName: "NCRB-RPI-NODE-04 (Raspberry Pi 4 Model B 8GB)",
  ocrEngine: "TrOCR-Large-HTR + Tesseract-v5-Devanagari/Latin",
  cpuTempC: 48.5,
  ramUsagePercent: 62.4,
  processedJobs: 152,
  lastPingMs: 22,
};

export function getMockRpiStatus(): RpiStatus {
  rpiHardwareState.cpuTempC = +(47.2 + Math.random() * 2.8).toFixed(1);
  rpiHardwareState.ramUsagePercent = +(60.5 + Math.random() * 3.5).toFixed(1);
  rpiHardwareState.lastPingMs = Math.floor(18 + Math.random() * 12);
  return { ...rpiHardwareState };
}

/**
 * Mock Text Extraction Service that simulates the Raspberry Pi's OCR & text extraction
 * Takes an uploaded file (PDF, TXT, Image, or sample police document)
 * and extracts raw text alongside OCR metadata.
 */
export async function extractTextWithMockRpi(
  input: ExtractionInput
): Promise<MockExtractionResult> {
  const startTime = Date.now();
  const { filename, fileType, base64OrContent } = input;
  const lowerName = filename.toLowerCase();

  let extractedText = "";

  // 1. If real plain text was provided directly (e.g. from a .txt file or user input)
  if (
    base64OrContent &&
    !base64OrContent.startsWith("data:") &&
    base64OrContent.trim().length > 20
  ) {
    extractedText = base64OrContent.trim();
  }
  // 2. If it's a data URL representing text/plain
  else if (base64OrContent && base64OrContent.startsWith("data:text/")) {
    try {
      const base64Data = base64OrContent.split(",")[1];
      if (base64Data) {
        extractedText = Buffer.from(base64Data, "base64").toString("utf-8");
      }
    } catch {
      // Fallback if decode fails
    }
  }

  // 3. If extracted text is still empty, run the realistic OCR simulation based on document class & filename
  if (!extractedText || extractedText.length < 20) {
    if (lowerName.includes("fir") || fileType === "FIR") {
      extractedText = `[GOVERNMENT OF INDIA - STATE POLICE CRIME BRANCH / NCRB]
FIRST INFORMATION REPORT (Under Section 154 Cr.P.C.)
FIR No: CR-784/2026/CB-SPL-CELL
Police Station: Special Cell, Cyber & Narcotics Command, Lodhi Colony
Date & Time of Occurrence: 14/02/2026 23:45 IST
Complainant: Inspector Rajeev Kaushik, Special Operations Command

1. SUSPECTS & ACCUSED PERSONS:
- Accused 1: Vikrant "Vicky" Sharma (Alias: 'The Broker', 'Eagle-7'), Age 39, Resident of D-42 Greater Kailash-II, New Delhi. Mobile: +91-98110-44219. Passport: Z-8941029.
- Accused 2: Kabir Al-Mansoor (Alias: 'Sheikh', 'Falcon'), Operating syndicate base from UAE (Dubai/Sharjah). Phone: +971-50-842-1982.
- Suspect 3: Sunita "Rani" Deshmukh, Managing Director, Omex Global Logistics Pvt Ltd, Andheri East, Mumbai.
- Associate 4: Tariq "Chhotu" Merchant, Logistics Courier & Cash Handler. Vehicle: Dark Grey Toyota Fortuner (DL-3C-AZ-9901).

2. INCIDENT BRIEF & SEIZURES:
During covert vehicle intercept at IGI Airport Cargo Terminal 3 on 14/02/2026, customs and special cell apprehended Tariq Merchant transporting 4.2 kg suspected synthetic contraband concealed in consignments dispatched under Omex Global Logistics.
Seized items:
- 1x Glock 19 9mm Pistol (Serial: G19-AUT-78219) with 2 loaded magazines.
- 3x Encrypted Thuraya Satellite Phones (XT-Pro).
- Cash: INR 48,50,000 in Indian Currency notes (Denomination 500).
- Hand-written ledger with Hawala balance codes 'VK-90' and transfer account 'IBAN-AE89201992'.

3. ACCUSED STATEMENTS & INVESTIGATION NOTES:
Interrogation revealed Vikrant Sharma receives direct encrypted instructions from Kabir Al-Mansoor via Signal handle 'GhostProtocol_99'. Sunita Deshmukh arranges false manifests and customs clearance. CCTV at Aerocity Grand Hyatt confirms private meeting between Sharma, Deshmukh, and Merchant on 10/02/2026.`;
    } else if (lowerName.includes("cdr") || fileType === "CDR") {
      extractedText = `[TELECOM FORENSIC DUMP & CALL DETAIL RECORD (CDR) ANALYSIS]
Target MSISDN: +91-98110-44219 (Subscriber: Vikrant Sharma)
IMEI: 863920192849102 | IMSI: 404450918239102
Forensic Period: 01/02/2026 to 15/02/2026 | Extracted via NCRB Cell-Forensic Node

KEY CALL INTERCEPTS & TOWER LOGS:
1. 2026-02-10 18:22:10 | Outgoing Call | B-Party: +91-98200-51402 (Sunita Deshmukh) | Duration: 412s | Tower: Aerocity Node 4A (28.5502 N, 77.1219 E)
2. 2026-02-10 20:15:40 | Incoming Call | B-Party: +971-50-842-1982 (Kabir Al-Mansoor) | Duration: 184s | International VoIP Gateway / Dubai
3. 2026-02-11 02:40:19 | Outgoing SMS | B-Party: +91-98711-20984 (Tariq Merchant) | Content: "Package arrives Gate 6 at 2300 hrs. DL-3C-AZ-9901 standby."
4. 2026-02-13 14:05:00 | Outgoing Call | B-Party: +91-99580-12940 (Hawala Operator 'Choksi') | Duration: 95s | Tower: Karol Bagh Jewel Market
5. Co-location Analysis: Vikrant Sharma and Tariq Merchant devices were co-located at Mahipalpur Safehouse Warehouse #3 for 4 consecutive hours on 12/02/2026.`;
    } else if (lowerName.includes("fiu") || lowerName.includes("financial") || fileType === "FINANCIAL") {
      extractedText = `[FINANCIAL INTELLIGENCE UNIT (FIU-IND) SUSPICIOUS TRANSACTION REPORT (STR)]
STR Reference ID: FIU/STR/2026/09218
Reporting Entity: Standard Chartered Trade Desk / HDFC Bank Anti-Money Laundering Wing
Subject Entity: Omex Global Logistics Pvt Ltd (PAN: AABCO4918K)
Key Signatory: Sunita Deshmukh

ACCOUNT AUDIT SUMMARY:
- Account #50200084192011 (HDFC Fort Branch, Mumbai)
- Inflow: INR 3,25,00,000 received across 14 split RTGS transfers from shell companies (Vanguard Exim, BlueOcean Trade) between 05/02/2026 and 12/02/2026.
- Outflow: Immediate layered transfers of INR 1,80,00,000 to Crypto OTC Desk wallet 0x71C94... and cash withdrawals of INR 48.5 Lakhs by bearer Tariq Merchant.
- Cross-border balance settlements flagged to Al-Saeed Trading FZE, Dubai (Beneficiary: Kabir Al-Mansoor).`;
    } else if (lowerName.includes("surveillance") || fileType === "SURVEILLANCE") {
      extractedText = `[INTELLIGENCE SURVEILLANCE & FIELD OBSERVATION REPORT]
Field Unit: Special Operations Command, Unit Alpha
Surveillance Target: Farmhouse 14, Bijwasan Road, Southwest Delhi (Suspected Syndicate Safehouse)
Date: 12/02/2026 21:00 to 13/02/2026 04:00 IST

TIMELINE LOG:
- 21:15: Dark Grey Toyota Fortuner (DL-3C-AZ-9901) driven by Tariq Merchant entered rear gate.
- 21:28: Individual matching Vikrant Sharma entered premises carrying hard metallic briefcase.
- 22:04: Hawala courier Ramesh Choksi arrived on motorcycle (DL-04-EV-2018).
- 23:10: Satellite RF intercept on 1575.42 MHz recorded voice matching Kabir Al-Mansoor instructing handover of 9mm weapon and coordinating routing through Mundra port.
- Photographic evidence collected: High-resolution telephoto images of suspects loading 2 steel trunks into vehicle.`;
    } else {
      extractedText = `[EXTRACTED INTELLIGENCE DOCUMENT - RASPBERRY PI OCR]
Document Source: ${filename}
Category: ${fileType}
Ingestion Mode: TrOCR / Tesseract Hybrid Pipeline

CONTENT:
Investigation report logged by NCRB field unit. Document details persons of interest, communication timestamps, and coordinated operations under Operation Syndicate Sentinel.
Entities identified in raw text include:
- Vikrant Sharma (Suspect coordinator)
- Tariq Merchant (Field transport)
- Sunita Deshmukh (Logistics conduit)
- Kabir Al-Mansoor (Overseas principal)
Items logged: 4.2 kg contraband, Glock-19 firearm, Toyota Fortuner DL-3C-AZ-9901.`;
    }
  }

  // Realistic mock latency to simulate Raspberry Pi edge processing (300ms - 600ms)
  const simulatedProcessingTime = Math.floor(350 + Math.random() * 250);
  rpiHardwareState.processedJobs += 1;

  const words = extractedText.trim().split(/\s+/).filter(Boolean);

  return {
    status: "COMPLETED",
    rawExtractedText: extractedText,
    metadata: {
      rpiDevice: rpiHardwareState.deviceName,
      rpiDeviceIp: rpiHardwareState.deviceIp,
      engine: rpiHardwareState.ocrEngine,
      latencyMs: Date.now() - startTime + simulatedProcessingTime,
      confidenceScore: +(0.95 + Math.random() * 0.04).toFixed(2),
      charCount: extractedText.length,
      wordCount: words.length,
      processedTimestamp: new Date().toISOString(),
    },
  };
}
