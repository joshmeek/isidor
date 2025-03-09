from app.api.endpoints import ai, auth, health_metrics, protocols, user_protocols, users
from app.core.config import settings
from app.middleware import add_rate_limit_middleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Isidor API",
    description="API for Isidor, an AI-driven life protocol system",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,  # Use origins from settings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting middleware
add_rate_limit_middleware(app)


@app.get("/")
async def root():
    return {"message": "Welcome to Isidor API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Include API routers
app.include_router(health_metrics.router, prefix="/api/health-metrics", tags=["Health Metrics"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(protocols.router, prefix="/api/protocols", tags=["Protocols"])
app.include_router(user_protocols.router, prefix="/api/user-protocols", tags=["User Protocols"])

# Import and include other API routers as they are developed
# from app.api.endpoints import protocols
# app.include_router(protocols.router, prefix="/api/protocols", tags=["Protocols"])

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
