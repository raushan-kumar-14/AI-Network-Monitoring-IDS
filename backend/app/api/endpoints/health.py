from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "AI Network Monitoring IDS Backend Running"
    }