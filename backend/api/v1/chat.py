import uuid
from datetime import datetime, timezone
from typing import AsyncIterator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import get_current_active_user
from core.exceptions import NotFoundError
from db.session import get_db
from db.models.user import User
from repositories.investigation_repository import InvestigationRepository, AnalysisResultRepository
from schemas.investigation import ChatMessageRequest, ChatMessageResponse
from agents.investigation_chat_agent import InvestigationChatAgent

router = APIRouter(prefix="/chat", tags=["AI Chat Investigator"])


@router.post("/stream")
async def chat_stream(
    body: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Stream AI investigation chat responses via SSE."""
    inv = await InvestigationRepository(db).get_by_id(body.investigation_id, user.id)
    if not inv:
        raise NotFoundError("Investigation", body.investigation_id)

    results = await AnalysisResultRepository(db).get_by_investigation(body.investigation_id)
    agent = InvestigationChatAgent()

    async def event_generator() -> AsyncIterator[bytes]:
        async for chunk in agent.stream_response(
            message=body.message,
            investigation=inv,
            analysis_results=results,
            evidence_ids=body.evidence_ids,
        ):
            yield f"data: {chunk}\n\n".encode()
        yield b"data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("", response_model=ChatMessageResponse)
async def chat(
    body: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Non-streaming chat for simple queries."""
    inv = await InvestigationRepository(db).get_by_id(body.investigation_id, user.id)
    if not inv:
        raise NotFoundError("Investigation", body.investigation_id)

    results = await AnalysisResultRepository(db).get_by_investigation(body.investigation_id)
    agent = InvestigationChatAgent()
    response = await agent.get_response(
        message=body.message,
        investigation=inv,
        analysis_results=results,
        evidence_ids=body.evidence_ids,
    )
    return ChatMessageResponse(
        id=str(uuid.uuid4()),
        role="assistant",
        content=response["content"],
        citations=response.get("citations"),
        provider=response.get("provider"),
        created_at=datetime.now(timezone.utc),
    )
