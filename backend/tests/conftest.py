import os

import pytest


def pytest_configure(config: pytest.Config) -> None:
    # Live-DB tests skip without TEST_DATABASE_URL; in CI that would turn a broken setup green.
    if os.environ.get("CI") and not os.environ.get("TEST_DATABASE_URL"):
        raise pytest.UsageError("TEST_DATABASE_URL must be set in CI so live-database tests run")
