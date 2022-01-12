from typing import Any

from sqlalchemy.ext.declarative import declarative_base

Base: Any = declarative_base()


def all_required_fields_present(model: Base, instance):
    required_fields = [col.name for col in model.__table__.columns if not col.nullable]
    required_fields_present = all(
        map(
            lambda x: True if getattr(instance, x) is not None else False,
            required_fields,
        )
    )

    return required_fields_present
