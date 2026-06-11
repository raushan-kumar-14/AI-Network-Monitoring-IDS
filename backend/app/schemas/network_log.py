from pydantic import BaseModel
from datetime import datetime


class NetworkLogCreate(BaseModel):
    source_ip: str
    destination_ip: str
    protocol: str
    packet_size: float


class NetworkLogResponse(NetworkLogCreate):
    id: int
    prediction: str
    confidence: float
    timestamp: datetime

    class Config:
        from_attributes = True