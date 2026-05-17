"""
Servicio de auditoría.

Helper simple para registrar operaciones en la tabla operation_audit.
Se llama desde los routers/services después de cada operación importante.

Uso:
    from app.services.audit_service import log_operation
    log_operation(db, user_id=1, agency_id=1,
                  operation="CREATE_RESERVATION",
                  entity="reserva_hotel", entity_id=5,
                  detail="Hotel XYZ, room 3, 2 noches")
"""
import json
from sqlalchemy.orm import Session
from app.models.operation_audit import OperationAudit


def log_operation(
    db        : Session,
    operation : str,
    *,
    user_id   : int | None = None,
    agency_id : int | None = None,
    entity    : str | None = None,
    entity_id : int | None = None,
    detail    : dict | str | None = None,
    channel   : str = "WEB",
    status    : str = "SUCCESS",
    error     : str | None = None,
) -> None:
    """
    Registra una operación en la tabla de auditoría.
    No lanza excepción si falla — nunca debe bloquear el flujo principal.
    """
    try:
        detail_str = None
        if detail is not None:
            detail_str = json.dumps(detail, default=str) if isinstance(detail, dict) else str(detail)

        entry = OperationAudit(
            user_id      = user_id,
            agency_id    = agency_id,
            operation    = operation,
            entity       = entity,
            entity_id    = entity_id,
            detail       = detail_str,
            channel      = channel,
            status       = status,
            error_detail = error,
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        # No rompemos el flujo principal si la auditoría falla
        print(f"⚠️  Audit log failed: {e}")
