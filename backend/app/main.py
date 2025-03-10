import os
from typing import Dict

from app.api.api import api_router
from app.core.config import settings
from app.middleware.rate_limiter import add_rate_limit_middleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

# Create FastAPI app
app = FastAPI(
    title="Isidor API",
    description="""
    # Isidor Health Optimization API
    
    Isidor is an AI-driven life protocol system designed to optimize fitness, nutrition, sleep, cognitive performance, and overall well-being.
    
    ## Key Features
    
    * **Health Data Integration**: Track and analyze health metrics from various sources
    * **Protocol System**: Follow structured frameworks for health optimization
    * **AI-Powered Insights**: Get personalized health insights using Gemini AI
    * **Vector Embeddings**: Utilize semantic search for finding patterns in health data
    * **Privacy-First Design**: Secure storage of health data with encryption
    
    ## Authentication
    
    This API uses JWT-based authentication. To access protected endpoints:
    
    1. Obtain an access token using the `/api/v1/auth/login` endpoint
    2. Include the token in the Authorization header: `Authorization: Bearer {token}`
    3. Use the refresh token to obtain a new access token when it expires
    
    ## Rate Limiting
    
    API requests are rate-limited to prevent abuse. The current limit is 100 requests per hour per IP address.
    
    ## Data Privacy
    
    All sensitive health data is encrypted at rest using PostgreSQL's pgcrypto extension.
    """,
    version="1.0.0",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json",
)

# Set up CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Add rate limiting middleware if enabled
if settings.RATE_LIMIT_ENABLED:
    add_rate_limit_middleware(app)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """
    Root endpoint that redirects to API documentation.
    """
    return {"message": "Welcome to Isidor API. See /api/v1/docs for documentation."}


@app.get("/health", response_model=Dict[str, str])
async def health_check():
    """
    Health check endpoint for monitoring.

    Returns:
        A simple JSON response indicating the API is healthy.

    Example:
        ```json
        {
            "status": "healthy"
        }
        ```
    """
    return {"status": "healthy"}


# Import and include other API routers as they are developed
# from app.api.endpoints import protocols
# app.include_router(protocols.router, prefix="/api/protocols", tags=["Protocols"])

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
