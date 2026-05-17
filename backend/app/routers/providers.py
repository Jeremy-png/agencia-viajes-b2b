from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.auth_dependencies import require_admin
from app.database.database import get_db
from app.schemas.provider_schema import ProviderCreate, ProviderUpdate, ProviderResponse
from app.services.provider_service import (
    list_providers,
    get_provider,
    create_provider,
    update_provider,
    activate_provider,
    deactivate_provider,
)

from app.core.auth_dependencies import require_admin

router = APIRouter()

@router.get("/", response_model=list[ProviderResponse])
def get_all(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return list_providers(db, admin.agency_id)

@router.get("/{provider_id}", response_model=ProviderResponse)
def get_one(provider_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    return get_provider(db, provider_id, admin.agency_id)

@router.post("/", response_model=ProviderResponse)
def post_one(data: ProviderCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    return create_provider(db, data, admin.agency_id)

@router.put("/{provider_id}", response_model=ProviderResponse)
def put_one(provider_id: int, data: ProviderUpdate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    return update_provider(db, provider_id, data, admin.agency_id)

@router.post("/{provider_id}/activate", response_model=ProviderResponse)
def activate(provider_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    return activate_provider(db, provider_id, admin.agency_id)

@router.post("/{provider_id}/deactivate", response_model=ProviderResponse)
def deactivate(provider_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    return deactivate_provider(db, provider_id, admin.agency_id)