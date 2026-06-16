from fastapi import HTTPException, status


class InsightXException(HTTPException):
    pass


class NotFoundError(InsightXException):
    def __init__(self, resource: str, resource_id: str):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=f"{resource} '{resource_id}' not found")


class UnauthorizedError(InsightXException):
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail, headers={"WWW-Authenticate": "Bearer"})


class ForbiddenError(InsightXException):
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class ConflictError(InsightXException):
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class ValidationError(InsightXException):
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


class ServiceUnavailableError(InsightXException):
    def __init__(self, detail: str = "Service temporarily unavailable"):
        super().__init__(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)
