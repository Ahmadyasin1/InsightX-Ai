import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from config import settings
from api.v1.router import api_router
from middleware.rate_limiter import RateLimitMiddleware
from middleware.request_id import RequestIDMiddleware
from core.logging import configure_logging

configure_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    # Auto-create tables for SQLite dev or first-run
    from db.session import create_tables, settings as _s
    if _s.DATABASE_URL.startswith("sqlite"):
        await create_tables()
        logger.info("SQLite tables created/verified")
    yield
    logger.info("Shutting down InsightX AI")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI Investigation & Evidence Intelligence Platform API",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # Middleware
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(api_router, prefix=settings.API_PREFIX)

    @app.get("/health", tags=["health"])
    async def health():
        return {"status": "healthy", "version": settings.APP_VERSION, "service": settings.APP_NAME}

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level="info",
    )
