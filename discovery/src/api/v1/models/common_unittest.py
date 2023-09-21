import enum

from .common import StringEnumToLower


class TestEnum(str, enum.Enum):
    member = "MEMBER"


def test_map_enum_to_member_name():
    assert StringEnumToLower().format(TestEnum.member) == "member"
