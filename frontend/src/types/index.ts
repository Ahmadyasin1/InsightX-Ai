export interface Investigation {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: "open" | "active" | "closed" | "archived";
  priority: "low" | "medium" | "high" | "critical";
  incident_score?: number;
  case_number?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: string;
  investigation_id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  duration_seconds?: number;
  fps?: number;
  width?: number;
  height?: number;
  status: "uploaded" | "processing" | "analyzed" | "failed";
  analysis_job_id?: string;
  created_at: string;
}

export interface AnalysisJob {
  id: string;
  evidence_id: string;
  investigation_id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  current_stage?: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface TimelineEvent {
  timestamp: number;
  type: string;
  description: string;
  severity?: string;
  evidence_id?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface Anomaly {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  timestamp: number;
  confidence: number;
  evidence_id?: string;
}

export interface AnalysisResult {
  id: string;
  job_id: string;
  evidence_id: string;
  investigation_id: string;
  incident_score?: number;
  risk_level?: string;
  person_count: number;
  vehicle_count: number;
  object_count: number;
  anomaly_count: number;
  detections?: Record<string, unknown>;
  tracking?: Record<string, unknown>;
  timeline?: TimelineEvent[];
  transcription?: { text: string; language: string; events?: unknown[] };
  audio_events?: unknown[];
  anomalies?: Anomaly[];
  reasoning?: Record<string, unknown>;
  evidence_graph?: { nodes: GraphNode[]; edges: GraphEdge[] };
  executive_brief?: string;
  created_at: string;
}

export interface GraphNode {
  id: string;
  type: "person" | "vehicle" | "object" | "anomaly" | "location" | "event";
  label: string;
  severity?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
  weight?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Array<{ text: string; timestamp?: number; evidence_id?: string }>;
  provider?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
