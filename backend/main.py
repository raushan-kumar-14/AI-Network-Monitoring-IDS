from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router
from app.core.config import APP_NAME, APP_VERSION
from app.core.database import Base, engine
from app.models import NetworkLog

# Create FastAPI application
app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Include API routes
app.include_router(api_router)

# Home route
@app.get("/")
def home():
    return {
        "message": "AI Network Monitoring & Intrusion Detection System Running"
    }