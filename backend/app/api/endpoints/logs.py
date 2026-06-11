from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import NetworkLog
from app.schemas import NetworkLogCreate, NetworkLogResponse
from app.services import predict_attack

router = APIRouter()


@router.post("/logs", response_model=NetworkLogResponse)
def create_network_log(
    log: NetworkLogCreate,
    db: Session = Depends(get_db)
):
    prediction, confidence = predict_attack(
    log.protocol,
    log.packet_size
)

    db_log = NetworkLog(
        source_ip=log.source_ip,
        destination_ip=log.destination_ip,
        protocol=log.protocol,
        packet_size=log.packet_size,
        prediction=prediction,
        confidence=confidence
    )

    db.add(db_log)
    db.commit()
    db.refresh(db_log)

    return db_log
@router.get("/logs", response_model=list[NetworkLogResponse])
def get_network_logs(
    db: Session = Depends(get_db)
):
    logs = db.query(NetworkLog).all()
    return logs