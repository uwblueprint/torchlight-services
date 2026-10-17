from app.services.ocr.schemas import OcrField, OcrResult


class ReceiptFieldParser:
    """Parse deterministic candidate fields from text returned by local OCR.

    TODO(OCR-02):
    - Parse likely total, date, and vendor candidates without an external AI service.
    - Preserve multiple candidates/ambiguity instead of silently selecting a wrong total.
    - Keep field-level OCR confidence distinct from parser confidence.
    - Never assign PassportONE category eligibility or approve/post an expense here.
    - Add tests for Canadian currency/date variants, tax/subtotal ambiguity, and no match.
    """

    def parse(self, raw_text: str, *, engine_confidence: float | None = None) -> OcrResult:
        raise NotImplementedError("OCR-02: deterministic receipt parsing is not implemented")


def missing_field(value: str | None, source: str) -> OcrField:
    """Build an explicit empty candidate for a field requiring manual entry."""

    return OcrField(value=value, confidence=None, source=source)
