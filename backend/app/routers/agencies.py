from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.agency import Agency
from app.schemas.agency_schema import AgencyResponse

router = APIRouter()

@router.get("/", response_model=list[AgencyResponse])
def list_agencies(db: Session = Depends(get_db)):
    return db.query(Agency).filter(Agency.is_active == True).all()