import contextlib
import datetime
import functools
import json
import logging
import os
import re
import time
from functools import reduce
from json.encoder import JSONEncoder
from typing import Optional, cast
from urllib.parse import urljoin

import requests
from flask import g, request
from hashids import Hashids
from jsonformatter import JsonFormatter
from src import exceptions

from . import multihash


def get_ip(request_obj):
    """Gets the IP address from a request using the X-Forwarded-For header if present"""
    ip = request_obj.headers.get("X-Forwarded-For", request_obj.remote_addr)
    if not ip:
        return ""
    return ip.split(",")[0].strip()


def get_openresty_public_key():
    """Get public key for openresty if it is running"""
    try:
        resp = requests.get("http://localhost:5000/openresty_pubkey")
        resp.raise_for_status()
        return resp.text
    except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError):
        return None


def redis_restore(redis, key):
    logger = logging.getLogger(__name__)
    filename = f"{key}_dump"
    try:
        with open(filename, "rb") as f:
            dumped = f.read()
            redis.restore(key, 0, dumped)
            logger.info(f"successfully restored redis value for key: {key}")
            return redis.get(key)
    except FileNotFoundError as not_found:
        logger.error(f"could not read redis dump file: {filename}")
        logger.error(not_found)
        return None
    except Exception as e:
        logger.error(f"could not perform redis restore for key: {key}")
        logger.error(e)
        return None


def redis_get_or_restore(redis, key):
    value = redis.get(key)
    return value if value else redis_restore(redis, key)


def redis_get_json_cached_key_or_restore(redis, key):
    logger = logging.getLogger(__name__)
    cached_value = redis.get(key)
    if not cached_value:
        logger.info(f"Redis Cache - miss {key}, restoring")
        cached_value = redis_restore(redis, key)

    if cached_value:
        logger.info(f"Redis Cache - hit {key}")
        try:
            deserialized = json.loads(cached_value)
            return deserialized
        except Exception as e:
            logger.warning(f"Unable to deserialize json cached response: {e}")
            return None
    logger.info(f"Redis Cache - miss {key}")
    return None


def redis_dump(redis, key):
    logger = logging.getLogger(__name__)
    try:
        dumped = redis.dump(key)
        filename = f"{key}_dump"
        with open(filename, "wb") as f:
            f.write(dumped)
            logger.info(f"successfully performed redis dump for key: {key}")
    except Exception as e:
        logger.error(f"could not perform redis dump for key: {key}")
        logger.error(e)


def redis_set_json_and_dump(redis, key, value):
    serialized = json.dumps(value)
    redis_set_and_dump(redis, key, serialized)


def redis_set_and_dump(redis, key, value):
    redis.set(key, value)
    redis_dump(redis, key)


@contextlib.contextmanager
def cd(path):
    """Context manager that changes to directory `path` and return to CWD
    when exited.
    """
    old_path = os.getcwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(old_path)


def bytes32_to_str(bytes32input):
    bytes32_stripped = bytes32input.rstrip(b"\x00")
    return bytes32_stripped.decode("utf8")


# Regex used to verify valid FQDN
fqdn_regex = re.compile(
    r"^(?:^|[ \t])((https?:\/\/)?(?:localhost|[\w-]+(?:\.[\w-]+)+)(:\d+)?(\/\S*)?)$"
)


# Helper function to check if a given string is a valid FQDN
def is_fqdn(endpoint_str):
    # Regex used to verify valid FQDN
    valid_endpoint = fqdn_regex.match(endpoint_str)
    if valid_endpoint:
        return True
    return False


def query_result_to_list(query_result):
    results = []
    for row in query_result:
        results.append(model_to_dictionary(row, None))
    return results


def model_to_dictionary(model, exclude_keys=None):
    """Converts the given SQLAlchemy model into a dictionary, primarily used
    for serialization to JSON.

    - Includes columns, relationships, and properties decorated with
    `@property` (useful for calculated values from relationships).
    - Excludes the keys in `exclude_keys` and the keys in the given model's
    `exclude_keys` property or attribute.
    - Excludes any property or attribute with a leading underscore.
    """
    model_dict = {}

    columns = model.__table__.columns.keys()
    relationships = model.__mapper__.relationships.keys()
    properties = []
    for key in list(set(dir(model)) - set(columns) - set(relationships)):
        if hasattr(type(model), key):
            attr = getattr(type(model), key)
            if not callable(attr) and isinstance(attr, property):
                properties.append(key)

    if exclude_keys is None:
        exclude_keys = []
    if hasattr(model, "exclude_keys"):
        exclude_keys.extend(model.exclude_keys)

    assert set(exclude_keys).issubset(set(properties).union(columns))

    for key in columns:
        if key not in exclude_keys and not key.startswith("_"):
            model_dict[key] = getattr(model, key)

    for key in properties:
        if key not in exclude_keys and not key.startswith("_"):
            model_dict[key] = getattr(model, key)

    for key in relationships:
        if key not in exclude_keys and not key.startswith("_"):
            attr = getattr(model, key)
            if isinstance(attr, list):
                model_dict[key] = query_result_to_list(attr)
            else:
                model_dict[key] = model_to_dictionary(attr)

    return model_dict


# Convert a tuple of model format into the proper model itself represented as a dictionary.
# The number of entries in the tuple, must map the model.
#
# When a subquery selects the entirety of a model and an outer query selects the entirety
# of that subquery, the results are returned as a tuple. They can be safely coerced into
# a dictionary with column keys.
def tuple_to_model_dictionary(t, model):
    """Converts the given tuple into the proper SQLAlchemy model object in dictionary form."""
    keys = model.__table__.columns.keys()
    assert len(t) == len(keys)

    return dict(zip(keys, t))


log_format = {
    "levelno": "levelno",
    "level": "levelname",
    "msg": "message",
    "timestamp": "asctime",
}

formatter = JsonFormatter(log_format, ensure_ascii=False, mix_extra=True)


def reset_logging():
    root = logging.getLogger()
    list(map(root.removeHandler, root.handlers))
    list(map(root.removeFilter, root.filters))


# Configures root logger with custom format and loglevel
# All child loggers will inherit settings from root logger as configured in this function
def configure_logging(loglevel_str="WARN"):
    logger = logging.getLogger()  # retrieve root logger

    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    try:
        loglevel = getattr(logging, loglevel_str)
    except AttributeError:
        logger.warning(
            f"{loglevel_str} is not a valid loglevel. Defaulting to logging.WARN"
        )
        loglevel = logging.WARN

    logger.setLevel(loglevel)


def configure_flask_app_logging(app, loglevel_str):
    # Disable werkzeug logger to remove default flask logs in favor of app decorator log below
    werkzeug_log = logging.getLogger("werkzeug")
    werkzeug_log.disabled = True

    configure_logging(loglevel_str)
    logger = logging.getLogger()  # retrieve root logger

    # Set a timer before the req to get the request time
    @app.before_request
    def start_timer():  # pylint: disable=W0612
        # pylint: disable=E0237
        g.start = time.time()

    # Log the request
    @app.after_request
    def log_request(response):  # pylint: disable=W0612

        now = time.time()
        duration = int((now - g.start) * 1000)
        ip = get_ip(request)
        host = request.host.split(":", 1)[0]
        args = request.query_string.decode("utf-8")

        log_params = {
            "method": request.method,
            "path": request.path,
            "status": response.status_code,
            "duration": duration,
            "ip": ip,
            "host": host,
            "params": args,
        }

        request_user_id = request.headers.get("X-User-ID")
        if request_user_id:
            log_params["request_user_id"] = request_user_id

        parts = []
        for name, value in log_params.items():
            part = "{}={}".format(name, value)
            parts.append(part)

        logger.info("handle flask request", extra=log_params)
        return response


def load_abi_values():
    abiDir = os.path.join(os.getcwd(), "build", "contracts")
    jsonFiles = os.listdir(abiDir)
    loaded_abi_values = {}
    for contractJsonFile in jsonFiles:
        fullPath = os.path.join(abiDir, contractJsonFile)
        with open(fullPath) as f:
            data = json.load(f)
            loaded_abi_values[data["contractName"]] = data
    return loaded_abi_values


# Load Ethereum ABI values
def load_eth_abi_values():
    abiDir = os.path.join(os.getcwd(), "build", "eth-contracts")
    jsonFiles = os.listdir(abiDir)
    loaded_abi_values = {}
    for contractJsonFile in jsonFiles:
        fullPath = os.path.join(abiDir, contractJsonFile)
        with open(fullPath) as f:
            data = json.load(f)
            loaded_abi_values[data["contractName"]] = data
    return loaded_abi_values


def remove_test_file(filepath):
    """Try and remove a file, no-op if not present"""
    try:
        os.remove(filepath)
    except OSError:
        pass


def multihash_digest_to_cid(multihash_digest):
    user_metadata_digest = multihash_digest.hex()
    user_metadata_hash_fn = 18
    buf = multihash.encode(bytes.fromhex(user_metadata_digest), user_metadata_hash_fn)
    return multihash.to_b58_string(buf)


def get_web3_endpoint(shared_config):
    if shared_config["web3"]["port"] != "443":
        web3endpoint = "http://{}:{}".format(
            shared_config["web3"]["host"], shared_config["web3"]["port"]
        )
    else:
        web3endpoint = "https://{}".format(shared_config["web3"]["host"])
    return web3endpoint


def get_discovery_provider_version():
    versionFilePath = os.path.join(os.getcwd(), ".version.json")
    data = None
    with open(versionFilePath) as f:
        data = json.load(f)
    return data


def get_valid_multiaddr_from_id_json(id_json):
    logger = logging.getLogger(__name__)
    # js-ipfs api returns lower case keys
    if "addresses" in id_json and isinstance(id_json["addresses"], list):
        for multiaddr in id_json["addresses"]:
            if ("127.0.0.1" not in multiaddr) and ("ip6" not in multiaddr):
                logger.warning(f"returning {multiaddr}")
                return multiaddr

    # py-ipfs api returns uppercase keys
    if "Addresses" in id_json and isinstance(id_json["Addresses"], list):
        for multiaddr in id_json["Addresses"]:
            if ("127.0.0.1" not in multiaddr) and ("ip6" not in multiaddr):
                logger.warning(f"returning {multiaddr}")
                return multiaddr
    return None


def get_ipfs_info_from_cnode_endpoint(url, self_multiaddr):
    id_url = urljoin(url, "ipfs_peer_info")
    data = {"caller_ipfs_id": self_multiaddr}
    resp = requests.get(id_url, timeout=5, params=data)
    json_resp = resp.json()["data"]
    valid_multiaddr = get_valid_multiaddr_from_id_json(json_resp)
    if valid_multiaddr is None:
        raise Exception("Failed to find valid multiaddr")
    return valid_multiaddr


def update_ipfs_peers_from_user_endpoint(update_task, cnode_url_list):
    logger = logging.getLogger(__name__)
    if cnode_url_list is None:
        return
    redis = update_task.redis
    cnode_entries = cnode_url_list.split(",")
    interval = int(update_task.shared_config["discprov"]["peer_refresh_interval"])
    for cnode_url in cnode_entries:
        if cnode_url == "":
            continue
        try:
            multiaddr = get_ipfs_info_from_cnode_endpoint(
                cnode_url, None  # update_task.ipfs_client.ipfs_id_multiaddr()
            )
            update_task.ipfs_client.connect_peer(multiaddr)
            redis.set(cnode_url, multiaddr, interval)
        except Exception as e:  # pylint: disable=broad-except
            logger.warning(f"Error connecting to {cnode_url}, {e}")


HASH_MIN_LENGTH = 5
HASH_SALT = "azowernasdfoia"

hashids = Hashids(min_length=5, salt=HASH_SALT)


def encode_int_id(id: int):
    return cast(str, hashids.encode(id))


def decode_string_id(id: str) -> Optional[int]:
    # Returns a tuple
    decoded = hashids.decode(id)
    if not decoded:
        return None
    return decoded[0]


def create_track_route_id(title, handle):
    """
    Constructs a track's route_id from an unsanitized title and handle.
    Resulting route_ids are of the shape `<handle>/<sanitized_title>`.
    """
    sanitized_title = title.encode("utf-8", "ignore").decode("utf-8", "ignore")
    # Strip out invalid character
    sanitized_title = re.sub(
        r"!|%|#|\$|&|\'|\(|\)|&|\*|\+|,|\/|:|;|=|\?|@|\[|\]|\x00", "", sanitized_title
    )

    # Convert whitespaces to dashes
    sanitized_title = re.sub(r"\s+", "-", sanitized_title)

    # Convert multiple dashes to single dashes
    sanitized_title = re.sub(r"-+", "-", sanitized_title)

    # Lowercase it
    sanitized_title = sanitized_title.lower()

    # Lowercase the handle
    sanitized_handle = handle.lower()

    return f"{sanitized_handle}/{sanitized_title}"


def create_track_slug(title, track_id, collision_id=0):
    """Converts the title of a track into a URL-friendly 'slug'

    Strips special characters, replaces spaces with dashes, converts to
    lowercase, and appends a collision_id if non-zero.

    If the sanitized title is entirely escaped (empty string), use the
    hashed track_id.

    Example:
    (Title="My Awesome Track!", collision_id=2) => "my-awesome-track-2"
    """
    sanitized_title = title.encode("utf-8", "ignore").decode("utf-8", "ignore")
    # Strip out invalid character
    sanitized_title = re.sub(
        r"!|%|#|\$|&|\'|\(|\)|&|\*|\+|,|\/|:|;|=|\?|@|\[|\]|\x00|\^|\.",
        "",
        sanitized_title,
    )

    # Convert whitespaces to dashes
    sanitized_title = re.sub(r"\s+", "-", sanitized_title.strip())
    sanitized_title = re.sub(r"-+", "-", sanitized_title)

    sanitized_title = sanitized_title.lower()
    # This means that the entire title was sanitized away, use the id
    # for the slug.
    if not sanitized_title:
        sanitized_title = encode_int_id(track_id)

    if collision_id > 0:
        sanitized_title = f"{sanitized_title}-{collision_id}"

    return sanitized_title


# Validates the existance of arguments within a request.
# req_args is a map, expected_args is a list of string arguments expected to be present in the map.
def validate_arguments(req_args, expected_args):
    if req_args is None:
        raise exceptions.ArgumentError("No arguments present.")
    all_exist = reduce((lambda acc, cur: cur in req_args and acc), expected_args, True)
    if not all_exist:
        raise exceptions.ArgumentError("Not all required arguments exist.")


# Subclass JSONEncoder to format dates in strict isoformat.
# Otherwise, it can behave differently on diffeent systems.
class DateTimeEncoder(JSONEncoder):
    def default(self, o):  # pylint: disable=method-hidden
        if isinstance(o, (datetime.date, datetime.datetime)):
            return o.isoformat()
        return super().default(o)


def time_method(func):
    @functools.wraps(func)
    def wrapper(*args, **kargs):
        tick = time.perf_counter()
        result = func(*args, **kargs)
        tock = time.perf_counter()
        elapsed = tock - tick
        logger = logging.getLogger(__name__)
        logger.info(f"TIME_METHOD Function={func.__name__} Elapsed={elapsed:0.6f}s")
        return result

    return wrapper
