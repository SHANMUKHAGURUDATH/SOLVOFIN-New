export type RagCategory =
  | 'ROAD_SAFETY'
  | 'TRANSPORT_SAFETY'
  | 'INFRASTRUCTURE'
  | 'DRIVER_SAFETY'
  | 'VEHICLE_SAFETY'
  | 'EMERGENCY_RESPONSE'
  | 'URBAN_MOBILITY'
  | 'SUSTAINABILITY';

export interface DocumentMetadata {
  documentId: string;
  title: string;
  source: string;
  url?: string;
  organization: string;
  category: RagCategory;
  date?: string;
  version?: string;
  page?: string | number;
  section?: string;
  tags?: string[];
}

export interface DocumentChunk {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  totalChunks: number;
  text: string;
  tokenCount: number;
  metadata: DocumentMetadata;
  vector?: number[];
}

export interface IngestDocumentInput {
  title: string;
  source: string;
  url?: string;
  organization: string;
  category: RagCategory;
  date?: string;
  version?: string;
  section?: string;
  page?: string | number;
  content: string;
  tags?: string[];
}

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  organization: string;
  category: RagCategory;
  section: string;
  page?: string | number;
  source: string;
  url?: string;
  similarityScore: number;
  text: string;
}

export interface StructuredInspectionContext {
  defectType?: string;
  confidence?: number;
  location?: string;
  component?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  inspectionContext?: string;
}

export interface StructuredDriverSafetyContext {
  eventType?: string;
  severity?: 'LOW' | 'WARNING' | 'CRITICAL';
  riskScore?: number;
  perclos?: number;
  ear?: number;
  mar?: number;
  busNumber?: string;
}

export interface RagQueryResult {
  answer: string;
  retrievedEvidence: RetrievedChunk[];
  hasEvidence: boolean;
  confidenceScore: number;
  liveSolvofinContext?: any;
  limitationsDisclaimer: string;
  processingTimeMs: number;
}
