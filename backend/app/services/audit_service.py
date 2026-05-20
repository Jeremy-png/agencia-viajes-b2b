"""Servicio de auditoría."""
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
    """Registra una operación en la tabla de auditoría."""
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
        print(f"⚠️  Audit log failed: {e}")
