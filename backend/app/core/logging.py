from __future__ import annotations
import logging
import sys

from app.core.config import settings


def setup_logging() -> None:
    level = logging.DEBUG if settings.app_env == "development" else logging.INFO
    fmt = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    logging.basicConfig(stream=sys.stdout, level=level, format=fmt)

    # Silence overly verbose libraries
    for noisy in ("uvicorn.access", "sqlalchemy.engine", "celery"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


logger = logging.getLogger("cropweedai")
