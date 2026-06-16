from fastapi import APIRouter
from api.v1 import auth, investigations, evidence, analysis, reports, chat, timeline, alerts, settings, dashboard

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(investigations.router)
api_router.include_router(evidence.router)
api_router.include_router(analysis.router)
api_router.include_router(reports.router)
api_router.include_router(chat.router)
api_router.include_router(timeline.router)
api_router.include_router(alerts.router)
api_router.include_router(settings.router)
