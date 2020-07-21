from hashids import Hashids
from flask_restx import fields

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

def extend_user(user):
    user_id = encode_int_id(user["user_id"])
    user["id"] = user_id
    return user

def extend_track(track):
    track_id = encode_int_id(track["track_id"])
    owner_id = encode_int_id(track["owner_id"])
    if (track["user"]):
        track["user"] = extend_user(track["user"])
    track["id"] = track_id
    track["user_id"] = owner_id
    return track

def extend_playlist(playlist):
    playlist_id = encode_int_id(playlist["playlist_id"])
    owner_id = encode_int_id(playlist["playlist_owner_id"])
    playlist["id"] = playlist_id
    playlist["user_id"] = owner_id
    return playlist

def abort_not_found(identifier, namespace):
    namespace.abort(404, "Oh no! Resource for ID {} not found.".format(identifier))

def decode_with_abort(identifier, namespace):
    decoded = decode_string_id(identifier)
    if decoded is None:
        namespace.abort(404, "Invalid ID: '{}'.".format(identifier))
    return decoded

def make_response(name, namespace, modelType):
    version_metadata = namespace.model("version_metadata", {
        "service": fields.String(required=True),
        "version": fields.String(required=True)
    })

    return namespace.model(name, {
        "data": modelType,
        "latest_chain_block":	fields.Integer(required=True),
        "latest_indexed_block":	fields.Integer(required=True),
        "owner_wallet":	fields.Integer(required=True),
        "signature": fields.String(required=True),
        "success": fields.Boolean(required=True),
        "timestamp": fields.String(required=True)	,
        "version": fields.Nested(version_metadata, required=True),
    })
