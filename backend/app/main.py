from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import health_metrics, ai, users

app = FastAPI(
    title="Isidor API",
    description="API for Isidor, an AI-driven life protocol system",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Import and include other API routers as they are developed
# from app.api.endpoints import auth, protocols
# app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
# app.include_router(protocols.router, prefix="/api/protocols", tags=["Protocols"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 