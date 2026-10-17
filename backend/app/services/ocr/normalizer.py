from collections.abc import Iterator
from pathlib import Path

from app.services.ocr.schemas import DocumentKind, NormalizedPage


class UnsupportedDocumentError(ValueError):
    """Raised when a file is not one of the configured receipt formats."""


class DocumentNormalizationError(RuntimeError):
    """Raised when a supported receipt cannot be safely normalized."""


class DocumentNormalizer:
    """Convert an allowed receipt document into bounded raster pages for OCR.

    TODO(OCR-01):
    - Validate file signature and configured maximum file size, not only extension.
    - Rasterize PDF pages with a bounded page count and resolution.
    - Normalize JPEG/PNG orientation and color mode.
    - Extract text from Word documents with a deterministic local parser, or report
      that this input requires manual review if no approved parser is selected.
    - Write temporary files in a controlled location and clean them up reliably.
    - Reject Excel and all unsupported formats.

    Do not log input paths containing client identifiers, receipt text, or file data.
    """

    def normalize(self, source_path: Path, document_kind: DocumentKind) -> Iterator[NormalizedPage]:
        raise NotImplementedError("OCR-01: document normalization is not implemented")
