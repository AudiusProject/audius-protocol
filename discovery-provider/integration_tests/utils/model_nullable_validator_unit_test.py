from typing import Any

from sqlalchemy import Boolean, Column, Integer, PrimaryKeyConstraint, String
from sqlalchemy.ext.declarative import declarative_base

from src.utils.model_nullable_validator import all_required_fields_present

Base: Any = declarative_base()


def test_model_nullable_validator():
    class TestModel(Base):
        __tablename__ = "test"

        pk_field = Column(Integer, nullable=False)
        required_field_1 = Column(String, nullable=False)
        required_field_2 = Column(Integer, nullable=False)
        required_field_with_defaults = Column(Integer, nullable=False, default=False)
        optional_field_1 = Column(Boolean, nullable=True)
        optional_field_2 = Column(String, nullable=True)

        PrimaryKeyConstraint(pk_field)

    bad_instance = TestModel(pk_field=1, required_field_2=3, optional_field_1=False)
    good_instance = TestModel(
        pk_field=2, required_field_1="test", required_field_2=3, optional_field_1=False
    )
    assert all_required_fields_present(TestModel, good_instance) == True
    assert all_required_fields_present(TestModel, bad_instance) == False
