import asyncio
import concurrent.futures
import logging
import struct
from collections import defaultdict
from typing import List, cast

import base58
from solders.pubkey import Pubkey

from src.gated_content.signature import get_gated_content_signature_for_user_wallet
from src.helius_client.helius_client import helius_client
from src.models.tracks.track import Track
from src.solana.solana_client_manager import SolanaClientManager
from src.solana.solana_helpers import METADATA_PROGRAM_ID_PK
from src.utils.config import shared_config

logger = logging.getLogger(__name__)

solana_client_manager = None


# Extended and simplified based on the reference links below
# https://docs.metaplex.com/programs/token-metadata/accounts#metadata
# https://github.com/metaplex-foundation/python-api/blob/441c2ba9be76962d234d7700405358c72ee1b35b/metaplex/metadata.py#L123
def _unpack_metadata_account_for_metaplex_nft(data):
    assert data[0] == 4
    i = 1  # key
    i += 32  # update authority
    i += 32  # mint
    i += 36  # name
    i += 14  # symbol
    i += 204  # uri
    i += 2  # seller fee basis points
    has_creator = data[i]
    i += 1  # whether has creators
    if has_creator:
        creator_len = struct.unpack("<I", data[i : i + 4])[0]
        i += 4  # num creators
        for _ in range(creator_len):
            i += 32  # creator address
            i += 1  # creator verified
            i += 1  # creator share
    i += 1  # primary sale happened
    i += 1  # is mutable
    has_edition_nonce = data[i]
    i += 1
    if has_edition_nonce:
        i += 1  # edition nonce
    has_token_standard = data[i]
    i += 1
    if has_token_standard:
        i += 1  # token standard
    has_collection = data[i]
    if not has_collection:
        return {"collection": None}

    i += 1  # whether has collection
    collection_verified = bool(data[i])
    i += 1  # collection verified
    collection_key = base58.b58encode(
        bytes(struct.unpack("<" + "B" * 32, data[i : i + 32]))
    )
    return {"collection": {"verified": collection_verified, "key": collection_key}}


def _get_metadata_account(mint_address: str):
    return Pubkey.find_program_address(
        [
            b"metadata",
            bytes(METADATA_PROGRAM_ID_PK),
            bytes(Pubkey.from_string(mint_address)),
        ],
        METADATA_PROGRAM_ID_PK,
    )[0]


def _get_token_account_info(token_account):
    return token_account.account.data.parsed["info"]


def _decode_metadata_account(metadata_account):
    try:
        account_info = solana_client_manager.get_account_info_json_parsed(
            metadata_account
        )
        if not account_info:
            return None
        return account_info.data
    except Exception as e:
        logger.error(
            f"Could not decode metadata account {metadata_account}. Error: {e}"
        )
        return None


async def _wrap_decode_metadata_account(metadata_account):
    loop = asyncio.get_running_loop()
    with concurrent.futures.ThreadPoolExecutor(max_workers=100) as pool:
        result = await loop.run_in_executor(
            pool, _decode_metadata_account, metadata_account
        )
        return result


async def _decode_metadata_accounts_async(metadata_accounts):
    datas = await asyncio.gather(*map(_wrap_decode_metadata_account, metadata_accounts))
    return datas


# - Fetch and parse token accounts from given wallets to get the mint addresses
# - Filter out token accounts with positive amounts and whose decimal places are not 0
# - Find the metadata PDAs for the mint addresses
# - Get the account infos for the PDAs if they exist
# - Unpack the chain metadatas from the account infos
# - Verify that the nft is from a verified collection whose mint address is the same as that passed into the function
# - If so, then user owns nft from that collection
def _does_user_own_metaplex_collection(
    collection_mint_address: str, user_sol_wallets: List[str]
):
    if not solana_client_manager:
        return False

    for wallet in user_sol_wallets:
        try:
            token_accounts = (
                solana_client_manager.get_token_accounts_by_owner_json_parsed(
                    Pubkey.from_string(wallet)
                )
            )
            nft_token_accounts = list(
                filter(
                    lambda item: _get_token_account_info(item)["tokenAmount"]["amount"]
                    != "0"
                    and _get_token_account_info(item)["tokenAmount"]["decimals"] == 0,
                    token_accounts,
                )
            )
            nft_mints = list(
                map(
                    lambda item: _get_token_account_info(item)["mint"],
                    nft_token_accounts,
                )
            )
            metadata_accounts = list(map(_get_metadata_account, nft_mints))
            datas = asyncio.run(_decode_metadata_accounts_async(metadata_accounts))
            datas = list(filter(lambda data: data is not None, datas))
            metadatas = list(map(_unpack_metadata_account_for_metaplex_nft, datas))
            collections = list(map(lambda metadata: metadata["collection"], metadatas))
            has_collection_mint_address = list(
                filter(
                    lambda collection: collection
                    and collection["verified"]
                    and collection["key"].decode() == collection_mint_address,
                    collections,
                )
            )
            if has_collection_mint_address:
                return True
        except Exception as e:
            logger.error(
                f"Could not get metaplex metadata for nft collection {collection_mint_address} and user wallet {wallet}. Error: {e}"
            )
    return False


def _does_wallet_own_helius_collection(nft, wallet: str, collection_address: str):
    ownership = nft.get("ownership", {})
    owner = ownership.get("owner")
    if owner != wallet:
        return False
    grouping = nft.get("grouping", [])
    found_collection = any(
        map(
            lambda group: group.get("group_key") == "collection"
            and group.get("group_value") == collection_address,
            grouping,
        )
    )
    return found_collection


def _does_user_own_helius_collection(
    collection_mint_address: str, user_sol_wallets: List[str]
):
    for wallet in user_sol_wallets:
        try:
            nfts = helius_client.get_nfts_for_wallet(wallet)
            if not nfts:
                continue
            does_wallet_own_nft_collection = any(
                filter(
                    lambda nft: _does_wallet_own_helius_collection(
                        nft, wallet, collection_mint_address
                    ),
                    nfts,
                )
            )
            if does_wallet_own_nft_collection:
                return True
        except Exception as e:
            logger.error(
                f"Could not get helius metadata for nft collection {collection_mint_address} and user wallet {wallet}. Error: {e}"
            )
    return False


def _does_user_own_sol_nft_collection(
    collection_mint_address: str, user_sol_wallets: List[str], with_fallback=True
):
    if _does_user_own_helius_collection(collection_mint_address, user_sol_wallets):
        return True
    if with_fallback:
        return _does_user_own_metaplex_collection(
            collection_mint_address, user_sol_wallets
        )
    return False


def get_sol_nft_gated_track_signatures(
    user_wallet: str,
    sol_associated_wallets: List[str],
    tracks: List[Track],
    user_id: int,
):
    track_signature_map = {}
    track_cid_to_id_map = {}
    track_id_to_original_cid_map = {}

    # Build a map of collection mint address -> track ids
    # so that only one chain call will be made for gated tracks
    # that share the same nft collection gate.
    collection_track_map = defaultdict(list)
    for track in tracks:
        collection_mint_address = track.stream_conditions["nft_collection"]["address"]  # type: ignore
        collection_track_map[collection_mint_address].append(track.track_cid)
        track_cid_to_id_map[track.track_cid] = track.track_id
        track_id_to_original_cid_map[track.track_id] = track.orig_file_cid

    with concurrent.futures.ThreadPoolExecutor() as executor:
        # Check ownership of nfts from collections from given collection mint addresses,
        # using all user sol wallets, and generate signatures for corresponding tracks.
        future_to_collection_mint_address_map = {
            executor.submit(
                _does_user_own_sol_nft_collection,
                collection_mint_address,
                sol_associated_wallets,
            ): collection_mint_address
            for collection_mint_address in list(collection_track_map.keys())
        }
        for future in concurrent.futures.as_completed(
            future_to_collection_mint_address_map
        ):
            collection_mint_address = future_to_collection_mint_address_map[future]
            try:
                # Generate gated content signatures for tracks whose
                # nft collection is owned by the user.
                if future.result():
                    for track_cid in collection_track_map[collection_mint_address]:
                        track_id = track_cid_to_id_map[track_cid]
                        original_cid = track_id_to_original_cid_map[track_id]
                        mp3_signature = get_gated_content_signature_for_user_wallet(
                            {
                                "track_id": track_id,
                                "track_cid": cast(str, track_cid),
                                "type": "track",
                                "user_wallet": user_wallet,
                                "user_id": user_id,
                                "is_gated": True,
                            }
                        )
                        original_signature = (
                            get_gated_content_signature_for_user_wallet(
                                {
                                    "track_id": track_id,
                                    "track_cid": cast(str, original_cid),
                                    "type": "track",
                                    "user_wallet": user_wallet,
                                    "user_id": user_id,
                                    "is_gated": True,
                                }
                            )
                        )
                        track_signature_map[track_id] = {
                            "mp3": mp3_signature,
                            "original": original_signature,
                        }
            except Exception as e:
                logger.error(
                    f"Could not get future result for collection_mint_address {collection_mint_address}. Error: {e}"
                )

    return track_signature_map


def _init_solana_client_manager():
    global solana_client_manager
    solana_client_manager = SolanaClientManager(shared_config["solana"]["endpoint"])


_init_solana_client_manager()
