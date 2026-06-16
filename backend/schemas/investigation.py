from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime
from enum import Enum


class InvestigationStatus(str, Enum):
    OPEN = "open"
    ACTIVE = "active"
    CLOSED = "closed"
    ARCHIVED = "archived"


class InvestigationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class CreateInvestigationRequest(BaseModel):
    title: str = Field(min_length=3, max_length=500)
    description: Optional[str] = None
    priority: InvestigationPriority = InvestigationPriority.MEDIUM
    tags: Optional[List[str]] = None


class UpdateInvestigationRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=500)
    description: Optional[str] = None
    status: Optional[InvestigationStatus] = None
    priority: Optional[InvestigationPriority] = None
    incident_score: Optional[float] = None
    tags: Optional[List[str]] = None


class InvestigationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    status: str
    priority: str
    incident_score: Optional[float]
    case_number: Optional[str]
    tags: Optional[Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EvidenceResponse(BaseModel):
    id: str
    investigation_id: str
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    duration_seconds: Optional[float]
    width: Optional[int]
    height: Optional[int]
    status: str
    analysis_job_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AnalysisJobResponse(BaseModel):
    id: str
    evidence_id: str
    investigation_id: str
    status: str
    progress: int
    current_stage: Optional[str]
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class AnalysisResultResponse(BaseModel):
    id: str
    job_id: str
    evidence_id: str
    investigation_id: str
    incident_score: Optional[float]
    risk_level: Optional[str]
    person_count: int
    vehicle_count: int
    object_count: int
    anomaly_count: int
    detections: Optional[Dict[str, Any]]
    tracking: Optional[Dict[str, Any]]
    timeline: Optional[List[Any]]
    transcription: Optional[Dict[str, Any]]
    audio_events: Optional[List[Any]]
    anomalies: Optional[List[Any]]
    reasoning: Optional[Dict[str, Any]]
    evidence_graph: Optional[Dict[str, Any]]
    executive_brief: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    investigation_id: str
    evidence_ids: Optional[List[str]] = None


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    citations: Optional[List[Dict[str, Any]]]
    provider: Optional[str] = None
    created_at: datetime


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    pages: int
