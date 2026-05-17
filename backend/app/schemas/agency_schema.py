from pydantic import BaseModel
from datetime import datetime

class AgencyResponse(BaseModel):
    agency_id: int
    name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True