import {
  Case,
  InvestigationDocument,
  FirstLlmOutput,
  FinalNetwork,
  PredictionInsight,
  PostInvestigationReport,
  Entity,
  Relationship,
} from "../src/types";

// In-Memory persistent DB store
interface DBStore {
  cases: Map<string, Case>;
  documents: Map<string, InvestigationDocument[]>; // caseId -> docs
  firstLlmOutputs: Map<string, FirstLlmOutput[]>; // caseId -> outputs
  finalNetworks: Map<string, FinalNetwork>; // caseId -> network
  predictions: Map<string, PredictionInsight[]>; // caseId -> predictions
  feedbackReports: Map<string, PostInvestigationReport[]>; // caseId -> reports
}

const db: DBStore = {
  cases: new Map(),
  documents: new Map(),
  firstLlmOutputs: new Map(),
  finalNetworks: new Map(),
  predictions: new Map(),
  feedbackReports: new Map(),
};

// Seed initial authentic NCRB investigation cases
export function seedDatabase() {
  const case1: Case = {
    id: "case-001",
    caseNumber: "NCRB-2026-0894",
    title: "Operation Syndicate Sentinel: Cyber-Hawala & Narcotics Axis",
    department: "National Crime Records Bureau (NCRB) - Special Intercept Division",
    description: "Multi-jurisdictional intelligence operation tracking transnational organized syndicate coordinating synthetic contraband transit, encrypted communications, and shell-company Hawala laundering spanning Dubai, Delhi, Mumbai, and Mundra Port.",
    dateOpened: "2026-02-01",
    classification: "LAW ENFORCEMENT SENSITIVE // STRICT ACCESS",
    leadInvestigator: "Superintendent of Police Rajeshwar Singh (IPS)",
    status: "ACTIVE",
  };

  const case2: Case = {
    id: "case-002",
    caseNumber: "NCRB-2026-0412",
    title: "Golden Corridor Contraband Ring",
    department: "NCRB Financial Crimes & Border Intel Directorate",
    description: "Investigation into bullion smuggling, forged trade certificates, and cross-border maritime couriers operating along the western coastal corridor.",
    dateOpened: "2026-01-15",
    classification: "CONFIDENTIAL // RESTRICTED",
    leadInvestigator: "Deputy Director Ananya Sen",
    status: "ACTIVE",
  };

  db.cases.set(case1.id, case1);
  db.cases.set(case2.id, case2);

  // Case 1 Documents
  const doc1: InvestigationDocument = {
    id: "doc-101",
    caseId: "case-001",
    filename: "FIR_784_SpecialCell_LodhiColony.pdf",
    fileType: "FIR",
    originalSize: "2.4 MB",
    mimeType: "application/pdf",
    uploadDate: "2026-02-15 08:30:00",
    sourceAgency: "Delhi Police Special Cell / NCRB",
    requiresOcr: true,
    rawExtractedText: `[GOVERNMENT OF INDIA - STATE POLICE CRIME BRANCH / NCRB]
FIRST INFORMATION REPORT (Under Section 154 Cr.P.C.)
FIR No: CR-784/2026/CB-SPL-CELL
Police Station: Special Cell, Cyber & Narcotics Command, Lodhi Colony
Date & Time of Occurrence: 14/02/2026 23:45 IST
Complainant / Informant: Inspector Rajeev Kaushik, Special Ops Unit

1. SUSPECTS & ACCUSED PERSONS:
- Accused 1: Vikrant "Vicky" Sharma (Alias: 'The Broker', 'Eagle-7'), Age 39, Resident of D-42 Greater Kailash-II, New Delhi. Mobile: +91-98110-44219. Passport: Z-8941029.
- Accused 2: Kabir Al-Mansoor (Alias: 'Sheikh', 'Falcon'), Operating out of Dubai / Sharjah. Phone: +971-50-842-1982.
- Suspect 3: Sunita "Rani" Deshmukh, Director of Omex Global Logistics Pvt Ltd, Andheri East, Mumbai.
- Associate 4: Tariq "Chhotu" Merchant, Courier & Cash Handler. Linked vehicle: Toyota Fortuner Dark Grey (Registration: DL-3C-AZ-9901).

2. INCIDENT BRIEF & SEIZURES:
During covert intercept at IGI Cargo Terminal 3 on 14/02/2026, customs and special cell apprehended Tariq Merchant transporting 4.2 kg suspected synthetic contraband concealed in consignments dispatched under consignee Omex Global Logistics. Seized items include:
- 1x Glock 19 9mm Pistol (Serial: G19-AUT-78219) with 2 loaded magazines.
- 3x Encrypted Sat-phones (Thuraya XT-Pro).
- Cash: INR 48,50,000 in uncounted 500 denominations.
- Hand-written ledger notebook listing code entries "VK-90" and Hawala transfers to account "IBAN-AE89201992".

3. ACCUSED STATEMENTS & INVESTIGATION NOTES:
Interrogation revealed Vikrant Sharma receives direct voice instructions from Kabir Al-Mansoor via encrypted Signal channel handle 'GhostProtocol_99'. Sunita Deshmukh provides port clearance and false manifests. Meeting recorded on CCTV at Grand Hyatt Aerocity Room 402 on 10/02/2026 between Sharma, Deshmukh, and driver Tariq Merchant.`,
    ocrMetadata: {
      rpiDeviceIp: "192.168.1.142:8000",
      engine: "TrOCR-Large-HTR + Tesseract-v5-Devanagari/Latin",
      latencyMs: 642,
      confidenceScore: 0.98,
      charCount: 1720,
    },
    approvedText: `[GOVERNMENT OF INDIA - STATE POLICE CRIME BRANCH / NCRB]
FIRST INFORMATION REPORT (Under Section 154 Cr.P.C.)
FIR No: CR-784/2026/CB-SPL-CELL
Police Station: Special Cell, Cyber & Narcotics Command, Lodhi Colony
Date & Time of Occurrence: 14/02/2026 23:45 IST
Complainant / Informant: Inspector Rajeev Kaushik, Special Ops Unit

1. SUSPECTS & ACCUSED PERSONS:
- Accused 1: Vikrant "Vicky" Sharma (Alias: 'The Broker', 'Eagle-7'), Age 39, Resident of D-42 Greater Kailash-II, New Delhi. Mobile: +91-98110-44219. Passport: Z-8941029.
- Accused 2: Kabir Al-Mansoor (Alias: 'Sheikh', 'Falcon'), Operating out of Dubai / Sharjah. Phone: +971-50-842-1982.
- Suspect 3: Sunita "Rani" Deshmukh, Director of Omex Global Logistics Pvt Ltd, Andheri East, Mumbai.
- Associate 4: Tariq "Chhotu" Merchant, Courier & Cash Handler. Linked vehicle: Toyota Fortuner Dark Grey (Registration: DL-3C-AZ-9901).

2. INCIDENT BRIEF & SEIZURES:
During covert intercept at IGI Cargo Terminal 3 on 14/02/2026, customs and special cell apprehended Tariq Merchant transporting 4.2 kg suspected synthetic contraband concealed in consignments dispatched under consignee Omex Global Logistics. Seized items include:
- 1x Glock 19 9mm Pistol (Serial: G19-AUT-78219) with 2 loaded magazines.
- 3x Encrypted Sat-phones (Thuraya XT-Pro).
- Cash: INR 48,50,000 in uncounted 500 denominations.
- Hand-written ledger notebook listing code entries "VK-90" and Hawala transfers to account "IBAN-AE89201992".

3. ACCUSED STATEMENTS & INVESTIGATION NOTES:
Interrogation revealed Vikrant Sharma receives direct voice instructions from Kabir Al-Mansoor via encrypted Signal channel handle 'GhostProtocol_99'. Sunita Deshmukh provides port clearance and false manifests. Meeting recorded on CCTV at Grand Hyatt Aerocity Room 402 on 10/02/2026 between Sharma, Deshmukh, and driver Tariq Merchant.`,
    verificationStatus: "APPROVED",
    verificationNotes: "Approved by SP Rajeshwar Singh. Key suspect identities and seizure items verified with station case diary.",
    verifiedAt: "2026-02-15 09:12:00",
    verifiedBy: "Inspector R. Kaushik (Badge #NCRB-4819)",
  };

  const doc2: InvestigationDocument = {
    id: "doc-102",
    caseId: "case-001",
    filename: "CDR_Analysis_Vikrant_Sharma_Feb2026.csv",
    fileType: "CDR",
    originalSize: "5.1 MB",
    mimeType: "text/csv",
    uploadDate: "2026-02-15 11:20:00",
    sourceAgency: "Telecom Intercept Wing (NTRO/NCRB)",
    requiresOcr: false,
    rawExtractedText: `[CALL DETAIL RECORD (CDR) & CELL SITE FORENSIC DUMP]
Target MSISDN: +91-98110-44219 (Subscriber: Vikrant Sharma)
IMEI: 863920192849102 | IMSI: 404450918239102
Period: 01/02/2026 to 15/02/2026

CALL LOG HIGHLIGHTS:
1. 2026-02-10 18:22:10 | Outgoing | B-Party: +91-98200-51402 (Sunita Deshmukh) | Duration: 412s | Tower: Aerocity Node 4A (28.5502, 77.1219)
2. 2026-02-10 20:15:40 | Incoming | B-Party: +971-50-842-1982 (Kabir Al-Mansoor) | Duration: 184s | VoIP Relay / Satellite Gateway
3. 2026-02-11 02:40:19 | Outgoing SMS | B-Party: +91-98711-20984 (Tariq Merchant) | Content: "Package arrives Gate 6 at 2300 hrs. DL-3C-AZ-9901 standby."
4. 2026-02-13 14:05:00 | Outgoing | B-Party: +91-99580-12940 (Hawala Operator 'Choksi') | Duration: 95s | Tower: Karol Bagh Jewel Hub
5. Co-location Analysis: Vikrant Sharma and Tariq Merchant devices were co-located at Mahipalpur Safehouse Warehouse #3 for 4 consecutive hours on 12/02/2026.`,
    approvedText: `[CALL DETAIL RECORD (CDR) & CELL SITE FORENSIC DUMP]
Target MSISDN: +91-98110-44219 (Subscriber: Vikrant Sharma)
IMEI: 863920192849102 | IMSI: 404450918239102
Period: 01/02/2026 to 15/02/2026

CALL LOG HIGHLIGHTS:
1. 2026-02-10 18:22:10 | Outgoing | B-Party: +91-98200-51402 (Sunita Deshmukh) | Duration: 412s | Tower: Aerocity Node 4A (28.5502, 77.1219)
2. 2026-02-10 20:15:40 | Incoming | B-Party: +971-50-842-1982 (Kabir Al-Mansoor) | Duration: 184s | VoIP Relay / Satellite Gateway
3. 2026-02-11 02:40:19 | Outgoing SMS | B-Party: +91-98711-20984 (Tariq Merchant) | Content: "Package arrives Gate 6 at 2300 hrs. DL-3C-AZ-9901 standby."
4. 2026-02-13 14:05:00 | Outgoing | B-Party: +91-99580-12940 (Hawala Operator 'Choksi') | Duration: 95s | Tower: Karol Bagh Jewel Hub
5. Co-location Analysis: Vikrant Sharma and Tariq Merchant devices were co-located at Mahipalpur Safehouse Warehouse #3 for 4 consecutive hours on 12/02/2026.`,
    verificationStatus: "APPROVED",
    verificationNotes: "CDR records cross-checked with telecom service provider switch logs.",
    verifiedAt: "2026-02-15 12:05:00",
    verifiedBy: "Analyst Priya Nair",
  };

  const doc3: InvestigationDocument = {
    id: "doc-103",
    caseId: "case-001",
    filename: "FIU_STR_Report_OmexLogistics.pdf",
    fileType: "FINANCIAL",
    originalSize: "1.8 MB",
    mimeType: "application/pdf",
    uploadDate: "2026-02-15 14:00:00",
    sourceAgency: "Financial Intelligence Unit (FIU-IND)",
    requiresOcr: true,
    rawExtractedText: `[FINANCIAL INTELLIGENCE UNIT (FIU-IND) SUSPICIOUS TRANSACTION REPORT (STR)]
STR Reference: FIU/STR/2026/09218
Reporting Entity: HDFC Bank / Standard Chartered Trade Desk
Subject Entity: Omex Global Logistics Pvt Ltd (PAN: AABCO4918K)
Authorized Signatory: Sunita Deshmukh

ACCOUNT ACTIVITY AUDIT:
- Account #50200084192011 (HDFC Fort Branch, Mumbai)
- Inflow: INR 3,25,00,000 received across 14 split RTGS transactions from shell companies (Vanguard Exim, BlueOcean Trade) between 05/02/2026 and 12/02/2026.
- Outflow: Immediate layered transfers of INR 1,80,000,000 to Crypto OTC Desk wallet 0x71C94... and cash withdrawals of INR 48.5 Lakhs by bearer Tariq Merchant.
- Cross-border remittances flagged to Al-Saeed Trading FZE, Dubai (Beneficiary: Kabir Al-Mansoor).`,
    ocrMetadata: {
      rpiDeviceIp: "192.168.1.142:8000",
      engine: "TrOCR-Large-HTR + Tesseract-v5-Devanagari/Latin",
      latencyMs: 512,
      confidenceScore: 0.96,
      charCount: 940,
    },
    verificationStatus: "PENDING",
  };

  db.documents.set("case-001", [doc1, doc2, doc3]);
  db.documents.set("case-002", []);

  // Seed Initial Entities and Relationships for Case 1
  seedCase1Network();
}

function seedCase1Network() {
  const nodes: Entity[] = [
    {
      id: "ent-001",
      name: "Kabir Al-Mansoor",
      type: "PERSON",
      aliases: ["Sheikh", "Falcon", "GhostProtocol_99"],
      role: "Syndicate Kingpin & Strategic Financier",
      confidence: 0.98,
      sourceDocumentIds: ["doc-101", "doc-102"],
      attributes: { location: "Dubai / Sharjah", jurisdiction: "UAE", passport: "C-9018410" },
      isKeyInfluencer: true,
      centralityScore: 0.94,
      threatLevel: "CRITICAL",
      locationCoordinates: [25.2048, 55.2708],
    },
    {
      id: "ent-002",
      name: "Vikrant 'Vicky' Sharma",
      type: "PERSON",
      aliases: ["The Broker", "Eagle-7"],
      role: "Domestic Network Coordinator & Distributor",
      confidence: 0.99,
      sourceDocumentIds: ["doc-101", "doc-102"],
      attributes: { residence: "Greater Kailash-II, New Delhi", phone: "+91-98110-44219" },
      isKeyInfluencer: true,
      centralityScore: 0.89,
      threatLevel: "CRITICAL",
      locationCoordinates: [28.5355, 77.241],
    },
    {
      id: "ent-003",
      name: "Sunita 'Rani' Deshmukh",
      type: "PERSON",
      aliases: ["Rani"],
      role: "Logistics Controller & Port Clearing Proxy",
      confidence: 0.95,
      sourceDocumentIds: ["doc-101", "doc-102"],
      attributes: { company: "Omex Global Logistics", city: "Mumbai" },
      isKeyInfluencer: false,
      centralityScore: 0.72,
      threatLevel: "HIGH",
      locationCoordinates: [19.076, 72.8777],
    },
    {
      id: "ent-004",
      name: "Tariq 'Chhotu' Merchant",
      type: "PERSON",
      aliases: ["Chhotu", "Courier-1"],
      role: "Physical Transit Courier & Armed Enforcer",
      confidence: 0.99,
      sourceDocumentIds: ["doc-101", "doc-102"],
      attributes: { custodyStatus: "Arrested at IGI Airport", vehicleLinked: "DL-3C-AZ-9901" },
      isKeyInfluencer: false,
      centralityScore: 0.65,
      threatLevel: "HIGH",
      locationCoordinates: [28.5562, 77.1000],
    },
    {
      id: "ent-005",
      name: "Ramesh Choksi",
      type: "PERSON",
      aliases: ["Bhaiji", "Choksi Bullion"],
      role: "Hawala Operator & Cash Liquidity Provider",
      confidence: 0.88,
      sourceDocumentIds: ["doc-102"],
      attributes: { operatingHub: "Karol Bagh, New Delhi", trade: "Jewelry / Cash settlement" },
      isKeyInfluencer: false,
      centralityScore: 0.58,
      threatLevel: "ELEVATED",
      locationCoordinates: [28.6517, 77.1906],
    },
    {
      id: "ent-006",
      name: "Omex Global Logistics Pvt Ltd",
      type: "ORGANIZATION",
      aliases: ["Omex Exim"],
      role: "Commercial Front Company for Port Consignments",
      confidence: 0.97,
      sourceDocumentIds: ["doc-101"],
      attributes: { pan: "AABCO4918K", registeredAddress: "Andheri East, Mumbai" },
      isKeyInfluencer: false,
      centralityScore: 0.61,
      threatLevel: "HIGH",
      locationCoordinates: [19.1136, 72.8697],
    },
    {
      id: "ent-007",
      name: "Al-Saeed Trading FZE",
      type: "ORGANIZATION",
      aliases: ["Al-Saeed Dubai"],
      role: "Offshore Shell Vehicle for Hawala Routing",
      confidence: 0.91,
      sourceDocumentIds: ["doc-101"],
      attributes: { jurisdiction: "Sharjah Free Zone / Dubai" },
      isKeyInfluencer: false,
      centralityScore: 0.52,
      threatLevel: "HIGH",
      locationCoordinates: [25.3573, 55.4033],
    },
    {
      id: "ent-008",
      name: "Toyota Fortuner (DL-3C-AZ-9901)",
      type: "VEHICLE",
      aliases: ["Grey Fortuner"],
      role: "Tactical Transit Vehicle for Seized Contraband",
      confidence: 0.99,
      sourceDocumentIds: ["doc-101", "doc-102"],
      attributes: { color: "Dark Grey", registeredState: "Delhi" },
      isKeyInfluencer: false,
      centralityScore: 0.44,
      threatLevel: "ELEVATED",
      locationCoordinates: [28.5562, 77.1000],
    },
    {
      id: "ent-009",
      name: "+91-98110-44219",
      type: "PHONE",
      aliases: ["Primary Burner MSISDN"],
      role: "Encrypted Operational Link (Vikrant Sharma)",
      confidence: 0.99,
      sourceDocumentIds: ["doc-101", "doc-102"],
      attributes: { imei: "863920192849102", serviceProvider: "Airtel Delhi" },
      isKeyInfluencer: false,
      centralityScore: 0.68,
      threatLevel: "HIGH",
    },
    {
      id: "ent-010",
      name: "Glock 19 9mm Pistol (G19-AUT-78219)",
      type: "WEAPON",
      aliases: ["Seized Sidearm"],
      role: "Smuggled Austrian Firearm seized during arrest",
      confidence: 0.99,
      sourceDocumentIds: ["doc-101"],
      attributes: { caliber: "9x19mm", origin: "Austria via Balkan Pipeline" },
      isKeyInfluencer: false,
      centralityScore: 0.35,
      threatLevel: "CRITICAL",
    },
    {
      id: "ent-011",
      name: "Mahipalpur Safehouse Warehouse #3",
      type: "LOCATION",
      aliases: ["Depot 3"],
      role: "Consolidation Hub for Cargo Shipments",
      confidence: 0.93,
      sourceDocumentIds: ["doc-102"],
      attributes: { zone: "Mahipalpur, Southwest Delhi near IGI" },
      isKeyInfluencer: false,
      centralityScore: 0.49,
      threatLevel: "ELEVATED",
      locationCoordinates: [28.5434, 77.1264],
    },
    {
      id: "ent-012",
      name: "Hawala Account IBAN-AE89201992",
      type: "FINANCIAL_ACCOUNT",
      aliases: ["Dubai Settlement Ledger 'VK-90'"],
      role: "Transnational Money Laundering Sink",
      confidence: 0.92,
      sourceDocumentIds: ["doc-101"],
      attributes: { bank: "Mashreq Bank / UAE Financial Channel" },
      isKeyInfluencer: false,
      centralityScore: 0.63,
      threatLevel: "CRITICAL",
    }
  ];

  const edges: Relationship[] = [
    {
      id: "rel-001",
      sourceId: "ent-001", // Kabir Al-Mansoor
      targetId: "ent-002", // Vikrant Sharma
      relationType: "COMMANDS_AND_FINANCES",
      confidence: 0.97,
      isDirect: true,
      evidence: [
        {
          sourceDocumentId: "doc-101",
          sourceDocumentName: "FIR_784_SpecialCell_LodhiColony.pdf",
          quoteExcerpt: "Interrogation revealed Vikrant Sharma receives direct voice instructions from Kabir Al-Mansoor via encrypted Signal channel handle 'GhostProtocol_99'.",
          reasoning: "Direct hierarchical command link confirmed by intercepted communications and accused testimony.",
        },
        {
          sourceDocumentId: "doc-102",
          sourceDocumentName: "CDR_Analysis_Vikrant_Sharma_Feb2026.csv",
          quoteExcerpt: "2026-02-10 20:15:40 | Incoming | B-Party: +971-50-842-1982 (Kabir Al-Mansoor) | Duration: 184s",
          reasoning: "Confirmed CDR voice session between UAE MSISDN and domestic coordinator.",
        },
      ],
    },
    {
      id: "rel-002",
      sourceId: "ent-002", // Vikrant Sharma
      targetId: "ent-004", // Tariq Merchant
      relationType: "EMPLOYS_COURIER",
      confidence: 0.98,
      isDirect: true,
      evidence: [
        {
          sourceDocumentId: "doc-101",
          sourceDocumentName: "FIR_784_SpecialCell_LodhiColony.pdf",
          quoteExcerpt: "Meeting recorded on CCTV at Grand Hyatt Aerocity Room 402 on 10/02/2026 between Sharma, Deshmukh, and driver Tariq Merchant.",
          reasoning: "In-person co-presence and physical assignment of cargo handover.",
        },
        {
          sourceDocumentId: "doc-102",
          sourceDocumentName: "CDR_Analysis_Vikrant_Sharma_Feb2026.csv",
          quoteExcerpt: "Outgoing SMS: 'Package arrives Gate 6 at 2300 hrs. DL-3C-AZ-9901 standby.'",
          reasoning: "Direct dispatch instructions specifying pickup time and vehicle registration.",
        }
      ],
    },
    {
      id: "rel-003",
      sourceId: "ent-002", // Vikrant Sharma
      targetId: "ent-003", // Sunita Deshmukh
      relationType: "COORDINATES_LOGISTICS",
      confidence: 0.94,
      isDirect: true,
      evidence: [
        {
          sourceDocumentId: "doc-101",
          sourceDocumentName: "FIR_784_SpecialCell_LodhiColony.pdf",
          quoteExcerpt: "Sunita Deshmukh provides port clearance and false manifests... Meeting recorded on CCTV at Grand Hyatt Aerocity.",
          reasoning: "Commercial coordination for air freight terminal clearance.",
        },
      ],
    },
    {
      id: "rel-004",
      sourceId: "ent-003", // Sunita Deshmukh
      targetId: "ent-006", // Omex Global Logistics
      relationType: "DIRECTOR_OF",
      confidence: 0.99,
      isDirect: true,
      evidence: [
        {
          sourceDocumentId: "doc-101",
          sourceDocumentName: "FIR_784_SpecialCell_LodhiColony.pdf",
          quoteExcerpt: "Sunita 'Rani' Deshmukh, Director of Omex Global Logistics Pvt Ltd, Andheri East, Mumbai.",
          reasoning: "Corporate registry and operational signatory authority.",
        },
      ],
    },
    {
      id: "rel-005",
      sourceId: "ent-004", // Tariq Merchant
      targetId: "ent-008", // Toyota Fortuner
      relationType: "OPERATED_VEHICLE",
      confidence: 0.99,
      isDirect: true,
      evidence: [
        {
          sourceDocumentId: "doc-101",
          sourceDocumentName: "FIR_784_SpecialCell_LodhiColony.pdf",
          quoteExcerpt: "customs and special cell apprehended Tariq Merchant... Linked vehicle: Toyota Fortuner Dark Grey (DL-3C-AZ-9901).",
          reasoning: "Physical apprehension at vehicle and ignition keys recovered from person.",
        },
      ],
    },
    {
      id: "rel-006",
      sourceId: "ent-004", // Tariq Merchant
      targetId: "ent-010", // Glock 19 Pistol
      relationType: "ILLEGAL_POSSESSION_OF",
      confidence: 0.99,
      isDirect: true,
      evidence: [
        {
          sourceDocumentId: "doc-101",
          sourceDocumentName: "FIR_784_SpecialCell_LodhiColony.pdf",
          quoteExcerpt: "Seized items include: 1x Glock 19 9mm Pistol (Serial: G19-AUT-78219) with 2 loaded magazines.",
          reasoning: "Arms Act recovery memo drawn up at apprehension scene.",
        },
      ],
    },
    {
      id: "rel-007",
      sourceId: "ent-001", // Kabir Al-Mansoor (Dubai)
      targetId: "ent-007", // Al-Saeed Trading
      relationType: "BENEFICIAL_OWNER",
      confidence: 0.93,
      isDirect: true,
      evidence: [
        {
          sourceDocumentId: "doc-101",
          sourceDocumentName: "FIR_784_SpecialCell_LodhiColony.pdf",
          quoteExcerpt: "Hawala transfers to account 'IBAN-AE89201992' linked to Al-Saeed Trading FZE, Dubai (Beneficiary: Kabir Al-Mansoor).",
          reasoning: "Offshore trade license and remittance audit trail.",
        },
      ],
    },
    {
      id: "rel-008",
      sourceId: "ent-002", // Vikrant Sharma
      targetId: "ent-005", // Ramesh Choksi (Hawala)
      relationType: "FUNDS_LIQUIDATION_VIA",
      confidence: 0.89,
      isDirect: true,
      evidence: [
        {
          sourceDocumentId: "doc-102",
          sourceDocumentName: "CDR_Analysis_Vikrant_Sharma_Feb2026.csv",
          quoteExcerpt: "2026-02-13 14:05:00 | Outgoing | B-Party: +91-99580-12940 (Hawala Operator 'Choksi') | Tower: Karol Bagh Jewel Hub",
          reasoning: "Telephonic coordination coinciding with cash withdrawal entries in ledger.",
        },
      ],
    },
    // HIDDEN / INDIRECT CONNECTIONS DETECTED BY SECOND FINE-TUNED LLM
    {
      id: "rel-009",
      sourceId: "ent-001", // Kabir Al-Mansoor
      targetId: "ent-003", // Sunita Deshmukh
      relationType: "INDIRECT_OFFSHORE_FINANCING",
      confidence: 0.91,
      isDirect: false,
      isHiddenConnection: true,
      evidence: [
        {
          sourceDocumentId: "doc-101",
          sourceDocumentName: "FIR_784_SpecialCell_LodhiColony.pdf",
          quoteExcerpt: "Hawala transfers to account 'IBAN-AE89201992' matched with Omex Global Logistics import consignments.",
          reasoning: "Second LLM detected that Al-Mansoor's Dubai shell company transferred funds through shell proxies directly balancing Omex Global accounts, despite no direct phone call between them.",
        },
      ],
    },
    {
      id: "rel-010",
      sourceId: "ent-004", // Tariq Merchant
      targetId: "ent-011", // Mahipalpur Safehouse
      relationType: "CO_LOCATED_PREPARATION",
      confidence: 0.95,
      isDirect: false,
      isHiddenConnection: true,
      evidence: [
        {
          sourceDocumentId: "doc-102",
          sourceDocumentName: "CDR_Analysis_Vikrant_Sharma_Feb2026.csv",
          quoteExcerpt: "Vikrant Sharma and Tariq Merchant devices were co-located at Mahipalpur Safehouse Warehouse #3 for 4 consecutive hours on 12/02/2026.",
          reasoning: "Geospatial cell-tower triangulation proves joint staging of the contraband before airport transit.",
        },
      ],
    },
    {
      id: "rel-011",
      sourceId: "ent-005", // Ramesh Choksi
      targetId: "ent-012", // Hawala Account
      relationType: "LEDGER_SETTLEMENT_PROXY",
      confidence: 0.90,
      isDirect: false,
      isHiddenConnection: true,
      evidence: [
        {
          sourceDocumentId: "doc-101",
          sourceDocumentName: "FIR_784_SpecialCell_LodhiColony.pdf",
          quoteExcerpt: "Hand-written ledger notebook listing code entries 'VK-90' and Hawala transfers to account 'IBAN-AE89201992'.",
          reasoning: "Ramesh Choksi operates the domestic token book that mirrors the foreign ledger entry 'VK-90' found in the seized notebook.",
        },
      ],
    },
  ];

  // Pruned noisy/hallucinated edges by Second LLM
  const prunedEdges: Relationship[] = [
    {
      id: "rel-pruned-001",
      sourceId: "ent-003",
      targetId: "ent-010",
      relationType: "WEAPON_OWNERSHIP",
      confidence: 0.22,
      isDirect: false,
      prunedBySecondLlm: true,
      pruneReason: "First LLM weakly associated Sunita Deshmukh with the Glock 19 due to co-accused status. Second LLM cross-verified source text: weapon was solely recovered from Tariq Merchant's waist holster. Rejected to prevent hallucinated culpability.",
      evidence: [],
    },
    {
      id: "rel-pruned-002",
      sourceId: "ent-005",
      targetId: "ent-008",
      relationType: "VEHICLE_CO_OWNER",
      confidence: 0.18,
      isDirect: false,
      prunedBySecondLlm: true,
      pruneReason: "CDR showed single tower bounce near Aerocity, but RTO registration definitively proves Choksi never had custody or title to DL-3C-AZ-9901. Pruned as spurious link.",
      evidence: [],
    },
  ];

  const finalNetwork: FinalNetwork = {
    id: "net-case-001",
    caseId: "case-001",
    generatedAt: "2026-02-15 15:30:00",
    nodes,
    edges,
    prunedEdges,
    reasoningSummary: "Second Fine-Tuned LLM validated 12 verified entities across 2 approved investigative documents (FIR & CDR). 3 indirect/hidden links established using cell-tower triangulation, shell trade matching, and ledger token cross-referencing. 2 hallucinated/weak relationships pruned with detailed evidence justifications.",
    networkMetrics: {
      totalEntities: nodes.length,
      totalRelationships: edges.length,
      density: 0.18,
      keyInfluencers: [
        { entityId: "ent-001", name: "Kabir Al-Mansoor", type: "PERSON", role: "Syndicate Kingpin", score: 0.94 },
        { entityId: "ent-002", name: "Vikrant Sharma", type: "PERSON", role: "Domestic Network Coordinator", score: 0.89 },
        { entityId: "ent-003", name: "Sunita Deshmukh", type: "PERSON", role: "Logistics Controller", score: 0.72 },
      ],
      hiddenPatternsCount: 3,
      prunedNoiseCount: 2,
    },
  };

  db.finalNetworks.set("case-001", finalNetwork);

  // Predictions for Case 1
  const predictions: PredictionInsight[] = [
    {
      id: "pred-001",
      caseId: "case-001",
      category: "FUTURE_CONNECTION",
      title: "Anticipated Offshore Replacement Courier in Nhava Sheva Sector",
      probability: 88,
      description: "With Tariq Merchant under arrest and 4.2kg contraband seized, network telemetry indicates Kabir Al-Mansoor will activate a secondary transit node in Navi Mumbai / Nhava Sheva port within 72 hours.",
      targetEntities: [
        { id: "ent-001", name: "Kabir Al-Mansoor", role: "Financier" },
        { id: "ent-003", name: "Sunita Deshmukh", role: "Logistics Proxy" },
      ],
      rationale: "Historical MO analysis shows Omex Global maintains alternate customs bonding licenses in JNPT Port; sudden cessation of flights triggers maritime switch.",
      riskLevel: "CRITICAL",
      suggestedIntervention: "Issue red-flag surveillance alerts to JNPT Customs Intelligence Unit on Omex Global bill-of-lading filings.",
      generatedAt: "2026-02-15 16:00:00",
    },
    {
      id: "pred-002",
      caseId: "case-001",
      category: "FLIGHT_RISK",
      title: "High Flight Risk Warning: Vikrant Sharma",
      probability: 93,
      description: "Vikrant Sharma holds valid Schengen Visa and Passport Z-8941029. Analysis of communications reveals sudden liquidation calls to Hawala operator Ramesh Choksi immediately following courier arrest.",
      targetEntities: [
        { id: "ent-002", name: "Vikrant Sharma", role: "Domestic Coordinator" },
      ],
      rationale: "Sudden closure of digital footprint and rapid fund transfers to crypto wallets 0x71C94... indicate pre-flight evacuation protocol.",
      riskLevel: "CRITICAL",
      suggestedIntervention: "Issue immediate Look-Out Circular (LOC) across all international airports and land border checkpoints.",
      generatedAt: "2026-02-15 16:15:00",
    },
    {
      id: "pred-003",
      caseId: "case-001",
      category: "SUSPICIOUS_PATTERN",
      title: "Crypto-OTC Hawala Layering Convergence",
      probability: 82,
      description: "Patterns in ledger 'VK-90' correlate with INR 1.8 Crore outbound payments to private unhosted wallet cluster within 30 minutes of cash collection.",
      targetEntities: [
        { id: "ent-005", name: "Ramesh Choksi", role: "Hawala Operator" },
        { id: "ent-012", name: "Hawala Account IBAN-AE89201992", role: "Sink" },
      ],
      rationale: "Dual-layer settlement prevents tracing by traditional banking switch; OTC brokers in Dubai provide immediate dirham release.",
      riskLevel: "HIGH",
      suggestedIntervention: "Coordinate with FIU-IND and Cyber Forensics to freeze crypto wallet cluster on major domestic VASPs.",
      generatedAt: "2026-02-15 16:30:00",
    },
  ];

  db.predictions.set("case-001", predictions);
  db.predictions.set("case-002", []);

  // Post Investigation Feedback Reports
  const reports: PostInvestigationReport[] = [
    {
      id: "rep-001",
      caseId: "case-001",
      investigatorName: "SP Rajeshwar Singh (IPS)",
      reportDate: "2026-02-16",
      summary: "Interim Ground-Truth Assessment following raids on Mahipalpur Safehouse and Karol Bagh bullion exchange.",
      confirmedRelationships: ["rel-001", "rel-002", "rel-003", "rel-004", "rel-005", "rel-006", "rel-010"],
      falsePositiveRelationships: [
        {
          relationshipId: "rel-008",
          sourceName: "Vikrant Sharma",
          targetName: "Ramesh Choksi",
          feedback: "Actual CDR was routed through an intermediary runner named 'Montu', not Choksi directly. Connection valid, but one hop displaced.",
        }
      ],
      missedConnections: [
        {
          sourceName: "Sunita Deshmukh",
          targetName: "Airport Ground Supervisor Ashok Verma",
          relationType: "BRIBED_OFFICIAL",
          howDiscovered: "Discovered via seized WhatsApp backup on Tariq Merchant's phone during forensic extraction.",
        }
      ],
      predictionAccuracyRating: 5,
      verifiedOutcomeSummary: "Look-Out Circular triggered at IGI Airport at 04:00 AM on 16/02/2026 successfully prevented Vikrant Sharma from boarding Emirates flight EK-513 to Dubai. Prediction #pred-002 confirmed with 100% operational precision.",
      usedForRetraining: true,
      modelRetrainedAt: "2026-02-16 10:00:00",
    }
  ];

  db.feedbackReports.set("case-001", reports);
  db.feedbackReports.set("case-002", []);
}

// Database helper accessors
export const database = {
  getCases: (): Case[] => Array.from(db.cases.values()),
  getCaseById: (id: string): Case | undefined => db.cases.get(id),
  createCase: (newCase: Case): Case => {
    db.cases.set(newCase.id, newCase);
    db.documents.set(newCase.id, []);
    db.firstLlmOutputs.set(newCase.id, []);
    db.predictions.set(newCase.id, []);
    db.feedbackReports.set(newCase.id, []);
    return newCase;
  },

  getDocuments: (caseId: string): InvestigationDocument[] => db.documents.get(caseId) || [],
  getDocumentById: (caseId: string, docId: string): InvestigationDocument | undefined => {
    const docs = db.documents.get(caseId) || [];
    return docs.find((d) => d.id === docId);
  },
  addDocument: (caseId: string, doc: InvestigationDocument): InvestigationDocument => {
    const docs = db.documents.get(caseId) || [];
    docs.push(doc);
    db.documents.set(caseId, docs);
    return doc;
  },
  updateDocument: (caseId: string, docId: string, updates: Partial<InvestigationDocument>): InvestigationDocument | null => {
    const docs = db.documents.get(caseId) || [];
    const index = docs.findIndex((d) => d.id === docId);
    if (index === -1) return null;
    docs[index] = { ...docs[index], ...updates };
    db.documents.set(caseId, docs);
    return docs[index];
  },

  getFirstLlmOutputs: (caseId: string): FirstLlmOutput[] => db.firstLlmOutputs.get(caseId) || [],
  saveFirstLlmOutput: (caseId: string, output: FirstLlmOutput): FirstLlmOutput => {
    const outputs = db.firstLlmOutputs.get(caseId) || [];
    const filtered = outputs.filter((o) => o.documentId !== output.documentId);
    filtered.push(output);
    db.firstLlmOutputs.set(caseId, filtered);
    return output;
  },

  getFinalNetwork: (caseId: string): FinalNetwork | null => db.finalNetworks.get(caseId) || null,
  saveFinalNetwork: (caseId: string, network: FinalNetwork): FinalNetwork => {
    db.finalNetworks.set(caseId, network);
    return network;
  },

  getPredictions: (caseId: string): PredictionInsight[] => db.predictions.get(caseId) || [],
  savePredictions: (caseId: string, predictions: PredictionInsight[]): PredictionInsight[] => {
    db.predictions.set(caseId, predictions);
    return predictions;
  },

  getFeedbackReports: (caseId: string): PostInvestigationReport[] => db.feedbackReports.get(caseId) || [],
  addFeedbackReport: (caseId: string, report: PostInvestigationReport): PostInvestigationReport => {
    const reports = db.feedbackReports.get(caseId) || [];
    reports.unshift(report);
    db.feedbackReports.set(caseId, reports);
    return report;
  },
};

// Auto-seed on startup
seedDatabase();
