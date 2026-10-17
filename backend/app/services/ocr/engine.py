from pathlib import Path

from app.services.ocr.schemas import OcrResult


class OcrEngineUnavailableError(RuntimeError):
    """Raised when the optional Python package or Tesseract binary is unavailable."""


class LocalTesseractEngine:
    """Local OCR adapter. Results are suggestions for review, never approvals.

    TODO(OCR-02):
    - Add pytesseract as an optional dependency and install the system Tesseract
      executable in the development/runtime image when this ticket is implemented.
    - Check the executable at runtime and report a clear setup error.
    - Use a configurable language/configuration and timeout.
    - Return OCR text/field candidates with provenance and confidence.
    - Ensure logs and exception messages do not expose receipt contents.
    - Add fixture-based tests using synthetic or anonymized documents.

    Import pytesseract inside the adapter method during implementation so importing
    unrelated backend modules does not require optional OCR dependencies.
    """

    def extract(self, image_path: Path) -> OcrResult:
        raise NotImplementedError("OCR-02: local Tesseract integration is not implemented")
