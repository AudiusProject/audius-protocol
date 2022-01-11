from sqlalchemy.ext.declarative import declarative_base
from typing import Any

Base: Any = declarative_base()


def all_required_fields_present(model: Base, instance):
    required_fields = [
        col.name
        for col in model.__table__.columns
        if not col.nullable and not col.primary_key
    ]
    all_required_fields_present = all(
        map(lambda x: bool(getattr(instance, x)), required_fields)
    )

    return all_required_fields_present
