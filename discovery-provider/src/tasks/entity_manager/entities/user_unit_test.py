import pytest

from src.tasks.entity_manager.entities.user import validate_user_handle


def test_create_new_hash():
    valid = [
        "one_2_",
        "One2",
        "One.2.Three",
        "fire_emoji",
        "abcdefghijklmnopqrstuvwxyz1234",
    ]
    for v in valid:
        assert validate_user_handle(v) == v.lower()

    invalid = [
        # bad chars
        "one ",
        "one 2",
        "one-2",
        "one∆",
        "fire_emoji_🔥🔥🔥",
        # reserved words
        "podcast",
        "Podcast",
        # genres
        "jungle",
        "Jungle",
        # moods
        "upbeat",
        "Upbeat",
        # too long
        "abcdefghijklmnopqrstuvwxyz1234_",
    ]
    for x in invalid:
        with pytest.raises(Exception):
            validate_user_handle(x)
