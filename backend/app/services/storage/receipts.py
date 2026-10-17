from pathlib import Path
from typing import Protocol


class ReceiptStorage(Protocol):
    """Private receipt object storage interface.

    TODO(FILE-01): implement an approved local-development and production adapter.
    Authorization must be checked by the API before opening or returning an object.
    Never make receipt objects public and never log object bytes or sensitive keys.
    """

    def put(self, *, source_path: Path, object_key: str, content_type: str) -> None:
        """Store a validated receipt privately."""
        raise NotImplementedError("FILE-01: receipt storage is not implemented")

    def open(self, *, object_key: str) -> Path:
        """Return a controlled local path to a privately stored receipt."""
        raise NotImplementedError("FILE-01: receipt retrieval is not implemented")

    def delete(self, *, object_key: str) -> None:
        """Delete a stored object only under the approved retention policy."""
        raise NotImplementedError("FILE-01: receipt deletion is not implemented")
