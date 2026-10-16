from app.core.config import Settings


def test_settings_use_development_defaults() -> None:
    settings = Settings()

    assert settings.app_name == "Torchlight Services API"
    assert settings.environment == "development"
    assert settings.api_v1_prefix == "/api/v1"


def test_settings_can_be_configured_explicitly() -> None:
    settings = Settings(app_name="Test API", api_v1_prefix="/test/v1")

    assert settings.app_name == "Test API"
    assert settings.api_v1_prefix == "/test/v1"
