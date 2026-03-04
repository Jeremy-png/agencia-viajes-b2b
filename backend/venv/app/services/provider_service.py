from sqlalchemy.orm import Session
from app.models.provider import Provider
from app.schemas.provider_schema import ProviderCreate

def create_provider(db: Session, data: ProviderCreate) -> Provider:
    """
    Crea un proveedor en la base de datos.

    Responsabilidad:
    - Construir el modelo Provider (SQLAlchemy)
    - Persistirlo en MySQL
    - Devolver el objeto creado
    """
    provider = Provider(
        name=data.name,
        provider_type=data.provider_type,
        base_url=data.base_url,
        is_active=data.is_active,
        agency_markup_percent=data.agency_markup_percent
    )

    db.add(provider)     # prepara INSERT
    db.commit()          # ejecuta INSERT en MySQL
    db.refresh(provider) # trae valores generados (provider_id, etc.)

    return provider

def list_providers(db: Session):
    """
    Lista todos los proveedores.
    Para el MVP: devuelve todos.
    Luego podemos filtrar por activos, por tipo, paginar, etc.
    """
    return db.query(Provider).all()