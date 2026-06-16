import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Integer, Float, func, JSON
from sqlalchemy.orm import Mapped, mapped_column
from db.session import Base

# Use JSON (cross-database); migrations explicitly upgrade to JSONB on PostgreSQL
JSONB = JSON


class Investigation(Base):
    __tablename__ = "investigations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="open")  # open | active | closed | archived
    priority: Mapped[str] = mapped_column(String(20), default="medium")  # low | medium | high | critical
    incident_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    case_number: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)
    tags: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    investigation_metadata: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id: Mapped[str] = mapped_column(String, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    fps: Mapped[float | None] = mapped_column(Float, nullable=True)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="uploaded")  # uploaded | processing | analyzed | failed
    analysis_job_id: Mapped[str | None] = mapped_column(String, ForeignKey("analysis_jobs.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    evidence_id: Mapped[str] = mapped_column(String, ForeignKey("evidence.id", ondelete="CASCADE"), nullable=False, index=True)
    investigation_id: Mapped[str] = mapped_column(String, ForeignKey("investigations.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="queued")  # queued | running | completed | failed | cancelled
    progress: Mapped[int] = mapped_column(Integer, default=0)
    current_stage: Mapped[str | None] = mapped_column(String(100), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id: Mapped[str] = mapped_column(String, ForeignKey("analysis_jobs.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    evidence_id: Mapped[str] = mapped_column(String, ForeignKey("evidence.id"), nullable=False)
    investigation_id: Mapped[str] = mapped_column(String, ForeignKey("investigations.id"), nullable=False)
    incident_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_level: Mapped[str | None] = mapped_column(String(20), nullable=True)  # low | medium | high | critical
    person_count: Mapped[int] = mapped_column(Integer, default=0)
    vehicle_count: Mapped[int] = mapped_column(Integer, default=0)
    object_count: Mapped[int] = mapped_column(Integer, default=0)
    anomaly_count: Mapped[int] = mapped_column(Integer, default=0)
    detections: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    tracking: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    timeline: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    transcription: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    audio_events: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    anomalies: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    reasoning: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    evidence_graph: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    executive_brief: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
