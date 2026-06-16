"""Initial InsightX AI schema

Revision ID: 0001
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("organization", sa.String(255), nullable=True),
        sa.Column("role", sa.String(50), server_default="analyst"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("is_verified", sa.Boolean(), server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "investigations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(50), server_default="open"),
        sa.Column("priority", sa.String(20), server_default="medium"),
        sa.Column("incident_score", sa.Float(), nullable=True),
        sa.Column("case_number", sa.String(100), nullable=True, unique=True),
        sa.Column("tags", JSONB, nullable=True),
        sa.Column("metadata", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_investigations_user_id", "investigations", ["user_id"])

    op.create_table(
        "analysis_jobs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("evidence_id", sa.String(), nullable=False),
        sa.Column("investigation_id", sa.String(), sa.ForeignKey("investigations.id"), nullable=False),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(50), server_default="queued"),
        sa.Column("progress", sa.Integer(), server_default="0"),
        sa.Column("current_stage", sa.String(100), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "evidence",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("investigation_id", sa.String(), sa.ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("filename", sa.String(500), nullable=False),
        sa.Column("original_filename", sa.String(500), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("storage_path", sa.String(1000), nullable=False),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
        sa.Column("fps", sa.Float(), nullable=True),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(50), server_default="uploaded"),
        sa.Column("analysis_job_id", sa.String(), sa.ForeignKey("analysis_jobs.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_evidence_investigation_id", "evidence", ["investigation_id"])

    op.create_table(
        "analysis_results",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("job_id", sa.String(), sa.ForeignKey("analysis_jobs.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("evidence_id", sa.String(), sa.ForeignKey("evidence.id"), nullable=False),
        sa.Column("investigation_id", sa.String(), sa.ForeignKey("investigations.id"), nullable=False),
        sa.Column("incident_score", sa.Float(), nullable=True),
        sa.Column("risk_level", sa.String(20), nullable=True),
        sa.Column("person_count", sa.Integer(), server_default="0"),
        sa.Column("vehicle_count", sa.Integer(), server_default="0"),
        sa.Column("object_count", sa.Integer(), server_default="0"),
        sa.Column("anomaly_count", sa.Integer(), server_default="0"),
        sa.Column("detections", JSONB, nullable=True),
        sa.Column("tracking", JSONB, nullable=True),
        sa.Column("timeline", JSONB, nullable=True),
        sa.Column("transcription", JSONB, nullable=True),
        sa.Column("audio_events", JSONB, nullable=True),
        sa.Column("anomalies", JSONB, nullable=True),
        sa.Column("reasoning", JSONB, nullable=True),
        sa.Column("evidence_graph", JSONB, nullable=True),
        sa.Column("executive_brief", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_analysis_results_job_id", "analysis_results", ["job_id"])


def downgrade():
    op.drop_table("analysis_results")
    op.drop_table("evidence")
    op.drop_table("analysis_jobs")
    op.drop_table("investigations")
    op.drop_table("users")
