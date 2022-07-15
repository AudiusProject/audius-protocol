import logging
from typing import Any

from sqlalchemy.ext.declarative import declarative_base

Base: Any = declarative_base()
logger = logging.getLogger(__name__)


def all_required_fields_present(model, instance):
    table = model.__table__  # type: ignore
    required_fields = [
        col.name
        for col in table.columns
        if not col.nullable and not col.default and not col.server_default
    ]
    print("raymont", required_fields)
    missing_fields = []
    for field in required_fields:
        if getattr(instance, field) is None:
            missing_fields.append(field)
    print("raymont", missing_fields)
    if missing_fields:
        logger.error(
            f"model_nullable_validator.py | {instance} of table {table} missing required fields {missing_fields}"
        )
        required_fields_present = False
    else:
        required_fields_present = True
    print("raymont finish req field")
    return required_fields_present
