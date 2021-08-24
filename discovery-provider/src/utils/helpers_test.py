from src.utils.helpers import create_track_slug


def test_create_track_slug_normal_title():
    title = "Karma Police"
    assert create_track_slug(title, 1, 0) == "karma-police"
    assert create_track_slug(title, 1, 3) == "karma-police-3"


def test_create_track_slug_long_characters():
    title = "#$*$(Strip\x00\x00\x00 !!@#*)&$(&#$%*Weird   + Characters"
    assert create_track_slug(title, 1, 0) == "strip-weird-characters"
    assert create_track_slug(title, 1, 3) == "strip-weird-characters-3"


def test_create_track_slug_only_bad_characters():
    title = "???"
    assert create_track_slug(title, 15633, 0) == "LjEvV"
    assert create_track_slug(title, 15633, 3) == "LjEvV-3"


def test_create_track_slug_bad_and_good_characters():
    title = "???f"
    assert create_track_slug(title, 15633, 0) == "f"
    assert create_track_slug(title, 15633, 3) == "f-3"


def test_create_track_slug_good_and_bad_characters():
    title = "f???"
    assert create_track_slug(title, 15633, 0) == "f"
    assert create_track_slug(title, 15633, 3) == "f-3"


def test_create_track_slug_chinese():
    title = "听妈妈的话"
    assert create_track_slug(title, 15633, 0) == "听妈妈的话"
    assert create_track_slug(title, 15633, 3) == "听妈妈的话-3"


def test_create_track_slug_unicode():
    title = "ñóนมนุษşoföre"
    assert create_track_slug(title, 15633, 0) == "ñóนมนุษşoföre"
    assert create_track_slug(title, 15633, 3) == "ñóนมนุษşoföre-3"


def test_create_track_slug_periods_and_punctuation():
    title = "Some: track; that has, like, punctuation!? everywhere."
    assert (
        create_track_slug(title, 0, 0)
        == "some-track-that-has-like-punctuation-everywhere"
    )
