from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path


class DocumentKind(StrEnum):
    PDF = "pdf"
    JPEG = "jpeg"
    PNG = "png"
    WORD = "word"


class ExtractionStatus(StrEnum):
    SUCCEEDED = "succeeded"
    NEEDS_REVIEW = "needs_review"
    FAILED = "failed"


@dataclass(frozen=True)
class OcrInput:
    """A private local file reference; never place receipt bytes in logs."""

    source_path: Path
    document_kind: DocumentKind


@dataclass(frozen=True)
class OcrField:
    """One candidate value from OCR, retaining confidence and provenance."""

    value: str | None
    confidence: float | None
    source: str


@dataclass(frozen=True)
class OcrResult:
    """Unapproved OCR suggestions. This result must never approve an expense."""

    status: ExtractionStatus
    raw_text: str | None
    amount: OcrField
    date: OcrField
    vendor: OcrField
    message: str | None = None


@dataclass(frozen=True)
class NormalizedPage:
    """A single raster page ready for local OCR processing."""

    image_path: Path
    page_number: int
    source_path: Path
