from fastapi import APIRouter
from pydantic import BaseModel
from app.services.packet_sniffer import (
    start_capture,
    stop_capture,
    set_owner,
)
class CaptureRequest(BaseModel):
    owner_username: str
    
router = APIRouter(prefix="/capture", tags=["Capture"])


@router.post("/start")
def start_live_capture(request: CaptureRequest):
    set_owner(request.owner_username)
    start_capture()

    return {
        "status": "success",
        "message": "Live capture started"
    }


@router.post("/stop")
def stop_live_capture():
    stop_capture()
    return {
        "status": "success",
        "message": "Live capture stopped"
    }