from hashids import Hashids

HASH_MIN_LENGTH = 5
HASH_SALT = "azowernasdfoia"

hashids = Hashids(min_length=5, salt=HASH_SALT)

def encode_int_id(id):
    return hashids.encode(id)

def decode_string_id(id):
    # Returns a tuple
    decoded = hashids.decode(id)
    if not len(decoded):
        return None
    return decoded[0]

def extend_track(track):
    track_id = encode_int_id(track["track_id"])
    owner_id = encode_int_id(track["owner_id"])
    track["id"] = track_id
    track["owner_id"] = owner_id
    return track


def decode_with_abort(identifier, namespace):
    decoded = decode_string_id(identifier)
    if decoded is None:
        namespace.abort(404, "Invalid ID: '{}'.".format(identifier))
    return decoded