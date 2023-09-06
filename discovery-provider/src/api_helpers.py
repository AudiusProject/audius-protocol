import asyncio
import datetime
import json
import logging
import re

import requests

# pylint: disable=no-name-in-module
from eth_account.messages import encode_defunct
from flask import jsonify
from web3 import Web3
from web3.auto import w3

from src.queries.get_health import get_latest_chain_block_set_if_nx
from src.queries.get_sol_plays import get_sol_play_health_info

# pylint: disable=R0401
from src.utils import helpers, web3_provider
from src.utils.config import shared_config
from src.utils.get_all_other_nodes import get_all_healthy_content_nodes_cached
from src.utils.redis_connection import get_redis
from src.utils.redis_constants import most_recent_indexed_block_redis_key
from src.utils.rendezvous import RendezvousHash

redis_conn = get_redis()
web3_connection = web3_provider.get_web3()
logger = logging.getLogger(__name__)
disc_prov_version = helpers.get_discovery_provider_version()


# Subclass JSONEncoder
class DateTimeEncoder(json.JSONEncoder):
    # Override the default method
    def default(self, o):  # pylint: disable=E0202
        if isinstance(o, (datetime.date, datetime.datetime)):
            # the Z is required in JS date format
            return o.isoformat() + " Z"
        return json.JSONEncoder.default(self, o)


def error_response(error, error_code=500):
    return jsonify({"success": False, "error": error}), error_code


# Create a response dict with metadata, data, signature, and timestamp
def success_response(
    response_entity=None, status=200, to_json=True, sign_response=True, extras={}
):
    starting_response_dictionary = {"data": response_entity, **extras}
    response_dictionary = response_dict_with_metadata(
        starting_response_dictionary, sign_response
    )
    response = jsonify(response_dictionary) if to_json else response_dictionary
    return response, status


# Create a response dict with metadata fields of success, latest_indexed_block, latest_chain_block,
# version, and owner_wallet
def response_dict_with_metadata(response_dictionary, sign_response):
    response_dictionary["success"] = True

    # Include block difference information
    latest_indexed_block = redis_conn.get(most_recent_indexed_block_redis_key)
    latest_chain_block, _ = get_latest_chain_block_set_if_nx(
        redis_conn, web3_connection
    )
    response_dictionary["latest_indexed_block"] = (
        int(latest_indexed_block) if latest_indexed_block else None
    )
    response_dictionary["latest_chain_block"] = (
        int(latest_chain_block) if latest_chain_block else None
    )

    # Include plays slot difference information
    play_info = get_sol_play_health_info(redis_conn, datetime.datetime.utcnow())
    play_db_tx = play_info["tx_info"]["db_tx"]
    play_chain_tx = play_info["tx_info"]["chain_tx"]
    response_dictionary["latest_indexed_slot_plays"] = (
        play_db_tx["slot"] if play_db_tx else None
    )
    response_dictionary["latest_chain_slot_plays"] = (
        play_chain_tx["slot"] if play_chain_tx else None
    )

    response_dictionary["version"] = disc_prov_version
    response_dictionary["signer"] = shared_config["delegate"]["owner_wallet"]

    if sign_response:
        # generate timestamp with format HH:MM:SS.sssZ
        timestamp = datetime.datetime.now().isoformat(timespec="milliseconds") + "Z"
        response_dictionary["timestamp"] = timestamp

        signature = generate_signature(response_dictionary)
        response_dictionary["signature"] = signature

    return response_dictionary


# Generate signature and timestamp using data
def generate_signature(data):
    # convert sorted dictionary to string with no white spaces
    to_sign_str = json.dumps(
        data,
        sort_keys=True,
        ensure_ascii=False,
        separators=(",", ":"),
        cls=DateTimeEncoder,
    )

    # generate hash for if data contains unicode chars
    to_sign_hash = Web3.keccak(text=to_sign_str).hex()

    # generate SignableMessage for sign_message()
    encoded_to_sign = encode_defunct(hexstr=to_sign_hash)

    # sign to get signature
    signed_message = w3.eth.account.sign_message(
        encoded_to_sign, private_key=shared_config["delegate"]["private_key"]
    )
    return signed_message.signature.hex()


# Accepts raw data with timestamp key and relevant fields, converts data to hash, and recovers the wallet
def recover_wallet(data, signature):
    json_dump = json.dumps(
        data,
        sort_keys=True,
        ensure_ascii=False,
        separators=(",", ":"),
        cls=DateTimeEncoder,
    )

    # generate hash for if data contains unicode chars
    to_recover_hash = Web3.keccak(text=json_dump).hex()

    encoded_to_recover = encode_defunct(hexstr=to_recover_hash)
    recovered_wallet = w3.eth.account.recover_message(
        encoded_to_recover, signature=signature
    )

    return recovered_wallet


def init_rendezvous(user, cid):
    if not cid:
        return ""
    healthy_nodes = get_all_healthy_content_nodes_cached(redis_conn)
    if not healthy_nodes:
        logger.error(
            f"No healthy Content Nodes found for fetching cid for {user.user_id}: {cid}"
        )
        return ""

    return RendezvousHash(
        *[re.sub("/$", "", node["endpoint"].lower()) for node in healthy_nodes]
    )


def get_primary_endpoint(user, cid):
    rendezvous = init_rendezvous(user, cid)
    if not rendezvous:
        return ""
    return rendezvous.get(cid)


def get_n_primary_endpoints(user, cid, n):
    rendezvous = init_rendezvous(user, cid)
    if not rendezvous:
        return ""
    return rendezvous.get_n(n, cid)


PROFILE_PICTURE_SIZES = ["150x150", "480x480", "1000x1000"]
PROFILE_COVER_PHOTO_SIZES = ["640x", "2000x"]
COVER_ART_SIZES = ["150x150", "480x480", "1000x1000"]


async def fetch_url(url):
    loop = asyncio.get_event_loop()
    future = loop.run_in_executor(None, requests.get, url)
    response = await future
    return response


async def race_requests(urls, timeout):
    tasks = [asyncio.create_task(fetch_url(url)) for url in urls]
    done, pending = await asyncio.wait(
        tasks, return_when=asyncio.ALL_COMPLETED, timeout=timeout
    )
    for task in done:
        response = task.result()
        if response.status_code == 200:
            return response
    raise Exception(f"No 200 responses for urls {urls}")


# Get cids corresponding to each transcoded variant for the given upload_id.
# Cache upload_id -> cids mappings.
def get_image_cids(user, upload_id, variants):
    if not upload_id:
        return {}
    try:
        image_cids = {}
        if upload_id.startswith("Qm"):
            # Legacy path - no need to query content nodes for image variant cids
            image_cids = {variant: f"{upload_id}/{variant}.jpg" for variant in variants}
        else:
            redis_key = f"image_cids:{upload_id}"
            image_cids = redis_conn.hgetall(redis_key)
            if image_cids:
                image_cids = {
                    variant.decode("utf-8"): cid.decode("utf-8")
                    for variant, cid in image_cids.items()
                }
            else:
                # Query content for the transcoded cids corresponding to this upload id and
                # cache upload_id -> { variant: cid, ... }
                endpoints = get_n_primary_endpoints(user, upload_id, 3)
                urls = list(
                    map(lambda endpoint: f"{endpoint}/uploads/{upload_id}", endpoints)
                )

                # Race requests in a new event loop
                new_loop = asyncio.new_event_loop()
                asyncio.set_event_loop(new_loop)
                resp = new_loop.run_until_complete(race_requests(urls, 1))
                new_loop.close()

                resp.raise_for_status()
                image_cids = resp.json().get("results", {})
                if not image_cids:
                    return image_cids

                image_cids = {
                    variant.strip(".jpg"): cid for variant, cid in image_cids.items()
                }
                redis_conn.hset(redis_key, mapping=image_cids)
                redis_conn.expire(redis_key, 86400)  # 24 hour ttl
        return image_cids
    except Exception as e:
        logger.error(f"Exception fetching image cids for id: {upload_id}: {e}")
        return {}
