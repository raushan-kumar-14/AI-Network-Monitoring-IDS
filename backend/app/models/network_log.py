from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime

from app.core.database import Base


class NetworkLog(Base):
    __tablename__ = "network_logs"

    id = Column(Integer, primary_key=True, index=True)
    owner_username = Column(String, index=True, default="admin")
    source_ip = Column(String, index=True)
    destination_ip = Column(String, index=True)
    protocol = Column(String)
    packet_size = Column(Float)
    prediction = Column(String, default="Unknown")
    confidence = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)