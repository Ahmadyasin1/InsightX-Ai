import time
from collections import defaultdict
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = 60.0

        is_upload = "/evidence/upload" in request.url.path
        limit = settings.UPLOAD_RATE_LIMIT_PER_MINUTE if is_upload else settings.RATE_LIMIT_PER_MINUTE

        key = f"{client_ip}:{'upload' if is_upload else 'general'}"
        self._requests[key] = [t for t in self._requests[key] if now - t < window]

        if len(self._requests[key]) >= limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down."},
                headers={"Retry-After": "60"},
            )

        self._requests[key].append(now)
        return await call_next(request)
