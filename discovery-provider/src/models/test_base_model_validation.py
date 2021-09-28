from sqlalchemy import Column, String, Text, Integer
from src.models.models import Base


class TestModel(Base):
    __tablename__ = "fake"
    id = Column(Integer, primary_key=True)
    text_column = Column(Text)
    string_column = Column(String)


def test_validated_base():
    my_model = TestModel(
        string_column="κόσμε\uD800\x00",
        text_column="κόσμε\x00\uDF80\uDB7F\uDFFF",
    )

    assert my_model.string_column == "κόσμε"
    assert my_model.text_column == "κόσμε"
