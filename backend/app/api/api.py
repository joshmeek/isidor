from app.api.endpoints import ai, auth, health_metrics, protocols, user_protocols, users
from fastapi import APIRouter

api_router = APIRouter()

# Include all API routers with appropriate prefixes and tags
api_router.include_router(
    health_metrics.router,
    prefix="/health-metrics",
    tags=["Health Metrics"],
    responses={404: {"description": "Health metric not found"}},
)

api_router.include_router(
    ai.router,
    prefix="/ai",
    tags=["AI"],
    responses={404: {"description": "Resource not found"}},
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["Users"],
    responses={404: {"description": "User not found"}},
)

api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"],
    responses={401: {"description": "Authentication failed"}},
)

api_router.include_router(
    protocols.router,
    prefix="/protocols",
    tags=["Protocols"],
    responses={404: {"description": "Protocol not found"}},
)

api_router.include_router(
    user_protocols.router,
    prefix="/user-protocols",
    tags=["User Protocols"],
    responses={404: {"description": "User protocol not found"}},
)
