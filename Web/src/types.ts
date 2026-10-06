export type DocumentType = 
  | 'FIR'
  | 'CDR'
  | 'FINANCIAL'
  | 'SURVEILLANCE'
  | 'INTELLIGENCE_REPORT'
  | 'FORENSIC_REPORT'
  | 'OTHER';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type EntityType = 
  | 'PERSON'
  | 'ORGANIZATION'
  | 'LOCATION'
  | 'VEHICLE'
  | 'PHONE'
  | 'FINANCIAL_ACCOUNT'
  | 'WEAPON'
  | 'EVENT'
  | 'CRIMINAL_CASE'
  | 'CYBER_ASSET';

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  department: string;
  description: string;
  dateOpened: string;
  classification: string;
  leadInvestigator: string;
  status: 'ACTIVE' | 'UNDER_REVIEW' | 'CLOSED';
}

export type ExtractionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface InvestigationDocument {
  id: string;
  caseId: string;
  filename: string;
  fileType: DocumentType;
  originalSize: string;
  mimeType: string;
  uploadDate: string;
  sourceAgency: string;
  requiresOcr: boolean;
  extractionStatus?: ExtractionStatus;
  originalFileDataUrl?: string;
  originalContent?: string;
  rawExtractedText?: string;
  ocrMetadata?: {
    rpiDevice?: string;
    rpiDeviceIp: string;
    engine: string;
    latencyMs: number;
    confidenceScore: number;
    charCount: number;
    wordCount?: number;
    totalPages?: number;
    pagesSuccessful?: number;
    pagesFailed?: number;
    evidenceDirectory?: string;
    rawPiResponse?: any;
    processedTimestamp?: string;
  };
  approvedText?: string;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  aliases?: string[];
  role?: string;
  confidence: number;
  sourceDocumentIds: string[];
  attributes?: Record<string, string | number | boolean>;
  isKeyInfluencer?: boolean;
  centralityScore?: number;
  threatLevel?: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'STANDARD';
  locationCoordinates?: [number, number]; // [lat, lng] for tactical map
}

export interface RelationshipEvidence {
  sourceDocumentId: string;
  sourceDocumentName: string;
  quoteExcerpt: string;
  reasoning: string;
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: string;
  confidence: number; // 0.00 - 1.00
  isDirect: boolean;
  isHiddenConnection?: boolean;
  prunedBySecondLlm?: boolean;
  pruneReason?: string;
  evidence: RelationshipEvidence[];
}

export interface FirstLlmOutput {
  id: string;
  documentId: string;
  caseId: string;
  generatedAt: string;
  entities: Entity[];
  rawRelationships: Relationship[];
  extractedEvents: {
    eventName: string;
    date?: string;
    location?: string;
    participants: string[];
    description: string;
  }[];
  jsonSchemaVersion: string;
}

export interface NetworkMetrics {
  totalEntities: number;
  totalRelationships: number;
  density: number;
  keyInfluencers: {
    entityId: string;
    name: string;
    type: EntityType;
    role: string;
    score: number;
  }[];
  hiddenPatternsCount: number;
  prunedNoiseCount: number;
}

export interface FinalNetwork {
  id: string;
  caseId: string;
  generatedAt: string;
  nodes: Entity[];
  edges: Relationship[];
  prunedEdges: Relationship[];
  reasoningSummary: string;
  networkMetrics: NetworkMetrics;
}

export interface PredictionInsight {
  id: string;
  caseId: string;
  category: 
    | 'FUTURE_CONNECTION'
    | 'EMERGING_RELATIONSHIP'
    | 'KEY_INFLUENCER'
    | 'SUSPICIOUS_PATTERN'
    | 'NETWORK_EXPANSION'
    | 'FLIGHT_RISK';
  title: string;
  probability: number; // 0 - 100
  description: string;
  targetEntities: { id: string; name: string; role?: string }[];
  rationale: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedIntervention: string;
  generatedAt: string;
}

export interface PostInvestigationReport {
  id: string;
  caseId: string;
  investigatorName: string;
  reportDate: string;
  summary: string;
  confirmedRelationships: string[];
  falsePositiveRelationships: {
    relationshipId: string;
    sourceName: string;
    targetName: string;
    feedback: string;
  }[];
  missedConnections: {
    sourceName: string;
    targetName: string;
    relationType: string;
    howDiscovered: string;
  }[];
  predictionAccuracyRating: number; // 1-5
  verifiedOutcomeSummary: string;
  usedForRetraining: boolean;
  modelRetrainedAt?: string;
}

export interface RpiStatus {
  online: boolean;
  deviceIp: string;
  deviceName: string;
  ocrEngine: string;
  cpuTempC: number;
  ramUsagePercent: number;
  processedJobs: number;
  lastPingMs: number;
}
