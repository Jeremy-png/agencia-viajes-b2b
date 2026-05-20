"""
Seed inicial de la base de datos.

Crea al arrancar (si no existen):
  - Agencia A  (agency_id=1)  →  admin: admin@agencia-a.com / Admin1234!
  - Agencia B  (agency_id=2)  →  admin: admin@agencia-b.com / Admin1234!

"""
from sqlalchemy.orm import Session
from app.models.agency import Agency
from app.models.user import User, Roles
from app.core.security import hash_password


# ------------------------------------------------------------------
# Datos de seed (fáciles de cambiar para la demo)
# ------------------------------------------------------------------
AGENCIES = [
    {"agency_id": 1, "name": "Agencia Viajes A"},
    {"agency_id": 2, "name": "Agencia Viajes B"},
]

ADMIN_USERS = [
    {
        "email"           : "admin@agencia-a.com",
        "password"        : "Admin1234!",
        "nombres"         : "Admin",
        "apellidos"       : "Agencia A",
        "edad"            : 30,
        "pais_origen"     : "Guatemala",
        "numero_pasaporte": "A00000001",
        "role"            : Roles.ADMIN,
        "agency_id"       : 1,
    },
    {
        "email"           : "admin@agencia-b.com",
        "password"        : "Admin1234!",
        "nombres"         : "Admin",
        "apellidos"       : "Agencia B",
        "edad"            : 30,
        "pais_origen"     : "Guatemala",
        "numero_pasaporte": "B00000001",
        "role"            : Roles.ADMIN,
        "agency_id"       : 2,
    },
]
# ------------------------------------------------------------------


def run_seed(db: Session) -> None:
    """
    Inserta agencias y admins si no existen.
    Idempotente: se puede llamar múltiples veces sin duplicar datos.
    """
    _seed_agencies(db)
    _seed_admins(db)


def _seed_agencies(db: Session) -> None:
    for data in AGENCIES:
        exists = db.query(Agency).filter(
            Agency.agency_id == data["agency_id"]
        ).first()
        if not exists:
            db.add(Agency(agency_id=data["agency_id"], name=data["name"]))
            print(f"  🏢 Agencia creada: {data['name']}")
    db.commit()


def _seed_admins(db: Session) -> None:
    for data in ADMIN_USERS:
        exists = db.query(User).filter(User.email == data["email"]).first()
        if not exists:
            db.add(User(
                email            = data["email"],
                password_hash    = hash_password(data["password"]),
                nombres          = data["nombres"],
                apellidos        = data["apellidos"],
                edad             = data["edad"],
                pais_origen      = data["pais_origen"],
                numero_pasaporte = data["numero_pasaporte"],
                role             = data["role"],
                is_active        = True,
                agency_id        = data["agency_id"],
            ))
            print(f"  👤 Admin creado: {data['email']} (agencia {data['agency_id']})")
    db.commit()
