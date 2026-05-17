from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.provider import Provider
from app.schemas.provider_schema import ProviderCreate, ProviderUpdate

def list_providers(db: Session, agency_id: int):
    return db.query(Provider).filter(Provider.agency_id == agency_id).all()

def get_provider(db: Session, provider_id: int, agency_id: int) -> Provider:
    provider = db.query(Provider).filter(
        Provider.provider_id == provider_id,
        Provider.agency_id == agency_id
    ).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider no encontrado")
    return provider

def create_provider(db: Session, data: ProviderCreate, agency_id: int) -> Provider:
    provider = Provider(
        agency_id=agency_id,  # ✅ asignado por backend, NO por request
        name=data.name,
        provider_type=data.provider_type,
        base_url=data.base_url,
        is_active=data.is_active,
        agency_markup_percent=data.agency_markup_percent,
        ws_email=data.ws_email,
        ws_password=data.ws_password,
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return provider

def update_provider(db: Session, provider_id: int, data: ProviderUpdate, agency_id: int) -> Provider:
    provider = get_provider(db, provider_id, agency_id)
    payload = data.model_dump(exclude_unset=True)
    for field, value in payload.items():
        setattr(provider, field, value)
    db.commit()
    db.refresh(provider)
    return provider

def activate_provider(db: Session, provider_id: int, agency_id: int) -> Provider:
    provider = get_provider(db, provider_id, agency_id)
    provider.is_active = True
    db.commit()
    db.refresh(provider)
    return provider

def deactivate_provider(db: Session, provider_id: int, agency_id: int) -> Provider:
    provider = get_provider(db, provider_id, agency_id)
    provider.is_active = False
    db.commit()
    db.refresh(provider)
    return provider