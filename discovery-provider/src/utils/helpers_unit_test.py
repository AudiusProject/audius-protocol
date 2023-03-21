from urllib.parse import unquote

from src.utils.helpers import is_fqdn, sanitize_slug


def test_create_track_slug_normal_title():
    title = "Karma Police"
    assert sanitize_slug(title, 1, 0) == "karma-police"
    assert sanitize_slug(title, 1, 3) == "karma-police-3"


def test_create_track_slug_long_characters():
    title = "#$*$(Strip\x00\x00\x00 !!@#*)&$(&#$%*Weird   + Characters"
    assert sanitize_slug(title, 1, 0) == "strip-weird-characters"
    assert sanitize_slug(title, 1, 3) == "strip-weird-characters-3"


def test_create_track_slug_only_bad_characters():
    title = "???"
    assert sanitize_slug(title, 15633, 0) == "LjEvV"
    assert sanitize_slug(title, 15633, 3) == "LjEvV-3"


def test_create_track_slug_bad_and_good_characters():
    title = "???f"
    assert sanitize_slug(title, 15633, 0) == "f"
    assert sanitize_slug(title, 15633, 3) == "f-3"


def test_create_track_slug_good_and_bad_characters():
    title = "f???"
    assert sanitize_slug(title, 15633, 0) == "f"
    assert sanitize_slug(title, 15633, 3) == "f-3"


def test_create_track_slug_chinese():
    title = "听妈妈的话"
    assert sanitize_slug(title, 15633, 0) == "听妈妈的话"
    assert sanitize_slug(title, 15633, 3) == "听妈妈的话-3"


def test_create_track_slug_unicode():
    title = "ñóนมนุษşoföre"
    assert sanitize_slug(title, 15633, 0) == "ñóนมนุษşoföre"
    assert sanitize_slug(title, 15633, 3) == "ñóนมนุษşoföre-3"


def test_create_track_slug_periods_and_punctuation():
    title = "Some: track; that has, like, punctuation!? everywhere."
    assert (
        sanitize_slug(title, 0, 0) == "some-track-that-has-like-punctuation-everywhere"
    )


def test_create_track_slug_trailing_spaces():
    assert sanitize_slug(" some track title ", 0, 0) == "some-track-title"
    assert sanitize_slug("some ( original mix )", 0, 0) == "some-original-mix"
    assert sanitize_slug("( some track title )", 0, 0) == "some-track-title"


def test_create_track_slug_unicode_normalization():
    # We always want NFC.

    # dağılır-benliklerim in unicode NFD format: https://minaret.info/test/normalize.msp
    nfd = unquote("dag%CC%86%C4%B1l%C4%B1r-benliklerim")
    # dağılır-benliklerim in unicode NFC format: https://minaret.info/test/normalize.msp
    nfc = unquote("da%C4%9F%C4%B1l%C4%B1r-benliklerim")

    nfd_as_string = "dağılır-benliklerim"
    nfc_as_string = "dağılır-benliklerim"

    # Both NFD and NFC should go to NFC
    assert sanitize_slug(nfc, 0, 0) == nfc
    assert sanitize_slug(nfd, 0, 0) == nfc
    assert sanitize_slug(nfd_as_string, 0, 0) == nfc
    assert sanitize_slug(nfc_as_string, 0, 0) == nfc


def test_is_fqdn_url():
    assert is_fqdn("https://validurl1.domain.com") == True
    assert is_fqdn("http://validurl2.subdomain.domain.com") == True
    assert is_fqdn("http://cn2_creator-node_1:4001") == True
    assert is_fqdn("http://www.example.$com\and%26here.html") == False
