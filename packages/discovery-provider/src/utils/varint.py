"""
Varint encoder/decoder.

Varints are a common encoding for variable length integer data, used in libraries such as sqlite, protobuf, v8, etc.
Ported from https://github.com/hareeshnagaraj/py-multihash

"""

from io import BytesIO
from typing import Tuple


def to_varint(number: int) -> bytes:
    """
    Pack `number` into varint bytes.

    :param number: Integer value to pack into varint bytes.
    :return: Varint bytes array.
    """
    buf = b""
    while True:
        towrite = number & 0x7F
        number >>= 7
        if number:
            buf += _byte(towrite | 0x80)
        else:
            buf += _byte(towrite)
            break
    return buf


def from_stream(stream: BytesIO, offset: int = 0) -> Tuple[int, int]:
    """
    Read a varint from `stream`.

    :param stream: Input bytes stream.
    :param offset: Offset in bytes from which to begin decoding.
    :return: Tuple containing decoded integer and offset of the first byte after encoded integer in source stream.
    """
    shift = 0
    result = 0
    stream.seek(offset)
    while True:
        i = _read_one(stream)
        result |= (i & 0x7F) << shift
        shift += 7
        if not i & 0x80:
            return result, offset + shift // 7


def from_varint(data: bytes, offset: int = 0) -> Tuple[int, int]:
    """
    Return an integer value obtained by decoding varint data.

    :param data: Input varint bytes array.
    :param offset: Offset in bytes from which to begin decoding.
    :return: Tuple containing decoded integer and offset of the first byte after encoded integer in source bytes array.
    """
    return from_stream(BytesIO(data), offset)


# Wrap int in tuple and return bytes
def _byte(b: int) -> bytes:
    return bytes((b,))


def _read_one(stream: BytesIO) -> int:
    """
    Read a byte from a file-like object (as an integer)

    :param stream: Input bytes stream.
    :return: Decoded integer value
    :raises: EOFError if the stream ends while reading bytes.
    """
    c = stream.read(1)
    if c == b"":
        raise EOFError("Unexpected EOF while reading bytes")
    return ord(c)
