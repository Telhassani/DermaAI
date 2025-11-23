"""
DermAI Backend - FastAPI Application
Main entry point for the API
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import sentry_sdk

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.rate_limiter import rate_limit_handler
from app.core.security_headers import SecurityHeadersMiddleware
# Only import auth for now - other modules will be added in later phases
# from app.api.v1 import auth, patients, appointments, prescriptions, ai_analysis, billing

# Setup logging
setup_logging()

# Initialize Sentry (optional - only if SENTRY_DSN is set)
# if settings.SENTRY_DSN:
#     sentry_sdk.init(
#         dsn=settings.SENTRY_DSN,
#         environment=settings.ENVIRONMENT,
#         traces_sample_rate=1.0 if settings.DEBUG else 0.1,
#     )

# Initialize rate limiter
# limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Application SAAS pour Cabinet Dermatologique avec IA",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

# Add rate limiter to app
# app.state.limiter = limiter
# app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

# =====================================
# MIDDLEWARE
# =====================================

# Security Headers Middleware (must be added first to apply to all responses)
# app.add_middleware(SecurityHeadersMiddleware, settings=settings)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host Middleware (Production)
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS,
    )

# =====================================
# ROUTES
# =====================================

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - Health check"""
    return {
        "message": "DermAI API",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "status": "operational",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for load balancers"""
    return {"status": "healthy"}


@app.get("/api/v1", tags=["API"])
async def api_v1_root():
    """API v1 root"""
    return {
        "message": "DermAI API v1",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/v1/auth",
            "patients": "/api/v1/patients",
            "appointments": "/api/v1/appointments",
            "prescriptions": "/api/v1/prescriptions",
            "ai_analysis": "/api/v1/ai-analysis",
            "billing": "/api/v1/billing",
        },
    }


# Include routers
from app.api.v1 import auth, patients, consultations, prescriptions, images, appointments, ai_analysis

# Enable real authentication router with database
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(patients.router, prefix=f"{settings.API_V1_PREFIX}/patients", tags=["Patients"])
app.include_router(consultations.router, prefix=f"{settings.API_V1_PREFIX}/consultations", tags=["Consultations"])
app.include_router(prescriptions.router, prefix=f"{settings.API_V1_PREFIX}/prescriptions", tags=["Prescriptions"])
app.include_router(images.router, prefix=f"{settings.API_V1_PREFIX}/images", tags=["Images"])
app.include_router(appointments.router, prefix=f"{settings.API_V1_PREFIX}/appointments", tags=["Appointments"])
app.include_router(ai_analysis.router, prefix=f"{settings.API_V1_PREFIX}/ai-analysis", tags=["AI Analysis"])
# app.include_router(billing.router, prefix="/api/v1/billing", tags=["Billing"])

# =====================================
# EXCEPTION HANDLERS
# =====================================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Custom 404 handler"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "The requested resource was not found",
            "path": str(request.url),
        },
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Custom 500 handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
        },
    )


# =====================================
# STARTUP & SHUTDOWN EVENTS
# =====================================

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    print(f"🚀 DermAI API starting up...")
    print(f"📊 Environment: {settings.ENVIRONMENT}")
    print(f"🔒 Debug mode: {settings.DEBUG}")
    print(f"📝 API Docs: http://localhost:8000/docs")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    print("👋 DermAI API shutting down...")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning",
    )
