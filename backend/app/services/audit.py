from dataclasses import dataclass
from datetime import datetime
from typing import Protocol


@dataclass(frozen=True)
class AuditEvent:
    actor_id: str
    action: str
    entity_type: str
    entity_id: str
    occurred_at: datetime
    summary: str


class AuditEventWriter(Protocol):
    """Persistence boundary for auditable business events.

    TODO(AUDIT-LOG-01): add immutable persistence and transaction integration.
    Event summaries must avoid secrets, receipt contents, OCR text, and excess PII.
    """

    async def record(self, event: AuditEvent) -> None:
        raise NotImplementedError("AUDIT-LOG-01: audit event persistence is not implemented")
