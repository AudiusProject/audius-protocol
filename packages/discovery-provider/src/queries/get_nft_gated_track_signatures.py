import asyncio
import concurrent.futures
import json
import logging
import pathlib
import struct
from collections import defaultdict
from typing import Dict, List, Set, cast

import base58
from eth_typing import ChecksumAddress
from solders.pubkey import Pubkey
from sqlalchemy.orm.session import Session
from web3 import Web3

from src.gated_content.signature import get_gated_content_signature_for_user_wallet
from src.models.tracks.track import Track
from src.models.users.user import User
from src.queries.get_associated_user_wallet import get_associated_user_wallet
from src.solana.solana_client_manager import SolanaClientManager
from src.solana.solana_helpers import METADATA_PROGRAM_ID_PK
from src.utils import db_session, web3_provider
from src.utils.config import shared_config

logger = logging.getLogger(__name__)

erc721_abi = None
erc1155_abi = None

solana_client_manager = None

eth_web3 = web3_provider.get_eth_web3()


def _get_user_wallet(user_id: int, session: Session):
    user_wallet = (
        session.query(User.wallet)
        .filter(
            User.user_id == user_id,
            User.is_current == True,
        )
        .one_or_none()
    )
    return user_wallet[0] if user_wallet else None


def _does_user_own_erc721_nft_collection(
    contract_address: str, user_eth_wallets: List[ChecksumAddress]
):
    for wallet in user_eth_wallets:
        try:
            contract = eth_web3.eth.contract(address=contract_address, abi=erc721_abi)
            nft_balance = contract.functions.balanceOf(wallet).call()
            if int(nft_balance) > 0:
                return True
        except Exception as e:
            logger.error(
                f"Could not get nft balance for erc721 nft collection {contract_address} and user wallet {wallet}. Error: {e}"
            )
    return False


def _does_user_own_erc1155_nft_collection(
    contract_address: str, user_eth_wallets: List[ChecksumAddress], token_ids: List[int]
):
    for wallet in user_eth_wallets:
        try:
            contract = eth_web3.eth.contract(address=contract_address, abi=erc1155_abi)
            nft_balances = contract.functions.balanceOfBatch(
                [wallet] * len(token_ids), token_ids
            ).call()
            positive_nft_balances = list(
                filter(lambda nft_balance: int(nft_balance) > 0, nft_balances)
            )
            if len(positive_nft_balances) > 0:
                return True
        except Exception as e:
            logger.error(
                f"Could not get nft balance for erc1155 nft collection {contract_address} and user wallet {wallet}. Error: {e}"
            )
    return False


def _get_tracks(track_ids: List[int], session: Session):
    return (
        session.query(Track)
        .filter(
            Track.track_id.in_(track_ids),
            Track.is_current == True,
            Track.is_delete == False,
        )
        .all()
    )


# Returns gated tracks from given track ids with an nft collection as the gated conditions.
def _get_nft_gated_tracks(track_ids: List[int], session: Session):
    return list(
        filter(
            lambda track: track.is_stream_gated
            and track.stream_conditions != None
            and "nft_collection" in track.stream_conditions,
            _get_tracks(track_ids, session),
        )
    )


def _get_eth_nft_gated_track_signatures(
    user_wallet: str,
    eth_associated_wallets: List[str],
    tracks: List[Track],
    track_token_id_map: Dict[int, List[str]],
    user_id: int,
):
    track_signature_map = {}
    track_cid_to_id_map = {}

    user_eth_wallets = list(
        map(Web3.to_checksum_address, eth_associated_wallets + [user_wallet])
    )

    erc721_gated_tracks = list(
        filter(
            lambda track: track.stream_conditions["nft_collection"]["standard"]  # type: ignore
            == "ERC721",
            tracks,
        )
    )

    # Build a map of ERC721 collection address -> track ids
    # so that only one chain call will be made for gated tracks
    # that share the same nft collection gate.
    erc721_collection_track_map = defaultdict(list)
    for track in erc721_gated_tracks:
        contract_address = Web3.to_checksum_address(
            track.stream_conditions["nft_collection"]["address"]  # type: ignore
        )
        erc721_collection_track_map[contract_address].append(track.track_cid)
        track_cid_to_id_map[track.track_cid] = track.track_id

    erc1155_gated_tracks = list(
        filter(
            lambda track: track.stream_conditions["nft_collection"]["standard"]  # type: ignore
            == "ERC1155",
            tracks,
        )
    )

    # Build a map of ERC1155 collection address -> track ids
    # so that only one chain call will be made for gated tracks
    # that share the same nft collection gate.
    # Also build a map of ERC1155 collection address -> nft token ids
    # so that the balanceOf contract function can be used to check
    # batch ownership of ERC1155 nfts for a given collection.
    erc1155_collection_track_map = defaultdict(list)
    contract_address_token_id_map: Dict[str, Set[int]] = defaultdict(set)
    for track in erc1155_gated_tracks:
        contract_address = Web3.to_checksum_address(
            track.stream_conditions["nft_collection"]["address"]  # type: ignore
        )
        erc1155_collection_track_map[contract_address].append(track.track_cid)
        track_token_id_set = set(map(int, track_token_id_map[track.track_id]))
        contract_address_token_id_map[contract_address] = contract_address_token_id_map[
            contract_address
        ].union(track_token_id_set)
        track_cid_to_id_map[track.track_cid] = track.track_id

    with concurrent.futures.ThreadPoolExecutor() as executor:
        # Check ownership of nfts from erc721 collections from given contract addresses,
        # using all user eth wallets, and generate signatures for corresponding tracks.
        future_to_erc721_contract_address_map = {
            executor.submit(
                _does_user_own_erc721_nft_collection, contract_address, user_eth_wallets
            ): contract_address
            for contract_address in list(erc721_collection_track_map.keys())
        }
        for future in concurrent.futures.as_completed(
            future_to_erc721_contract_address_map
        ):
            contract_address = future_to_erc721_contract_address_map[future]
            try:
                # Generate gated content signatures for tracks whose
                # nft collection is owned by the user.
                if future.result():
                    for track_cid in erc721_collection_track_map[contract_address]:
                        track_id = track_cid_to_id_map[track_cid]
                        track_signature_map[
                            track_id
                        ] = get_gated_content_signature_for_user_wallet(
                            {
                                "track_id": track_id,
                                "track_cid": track_cid,
                                "type": "track",
                                "user_wallet": user_wallet,
                                "user_id": user_id,
                                "is_gated": True,
                            }
                        )
            except Exception as e:
                logger.error(
                    f"Could not get future result for erc721 contract_address {contract_address}. Error: {e}"
                )

        # Check ownership of nfts from erc1155 collections from given contract addresses,
        # using all user eth wallets, and generate signatures for corresponding tracks.
        future_to_erc1155_contract_address_map = {
            executor.submit(
                _does_user_own_erc1155_nft_collection,
                contract_address,
                user_eth_wallets,
                list(contract_address_token_id_map[contract_address]),
            ): contract_address
            for contract_address in list(erc1155_collection_track_map.keys())
        }
        for future in concurrent.futures.as_completed(
            future_to_erc1155_contract_address_map
        ):
            contract_address = future_to_erc1155_contract_address_map[future]
            try:
                # Generate gated content signatures for tracks whose
                # nft collection is owned by the user.
                if future.result():
                    for track_cid in erc1155_collection_track_map[contract_address]:
                        track_id = track_cid_to_id_map[track_cid]
                        track_signature_map[
                            track_id
                        ] = get_gated_content_signature_for_user_wallet(
                            {
                                "track_id": track_id,
                                "track_cid": track_cid,
                                "type": "track",
                                "user_wallet": user_wallet,
                                "user_id": user_id,
                                "is_gated": True,
                            }
                        )
            except Exception as e:
                logger.error(
                    f"Could not get future result for erc1155 contract_address {contract_address}. Error: {e}"
                )

    return track_signature_map


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


# - Fet and parse token accounts from given wallets to get the mint addresses
# - Filter out token accounts with positive amounts and whose decimal places are not 0
# - Find the metadata PDAs for the mint addresses
# - Get the account infos for the PDAs if they exist
# - Unpack the chain metadatas from the account infos
# - Verify that the nft is from a verified collection whose mint address is the same as that passed into the function
# - If so, then user owns nft from that collection
def _does_user_own_sol_nft_collection(
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
                f"Could not get nft balance for nft collection {collection_mint_address} and user wallet {wallet}. Error: {e}"
            )
    return False


def _get_sol_nft_gated_track_signatures(
    user_wallet: str,
    sol_associated_wallets: List[str],
    tracks: List[Track],
    user_id: int,
):
    track_signature_map = {}
    track_cid_to_id_map = {}

    # Build a map of collection mint address -> track ids
    # so that only one chain call will be made for gated tracks
    # that share the same nft collection gate.
    collection_track_map = defaultdict(list)
    for track in tracks:
        collection_mint_address = track.stream_conditions["nft_collection"]["address"]  # type: ignore
        collection_track_map[collection_mint_address].append(track.track_cid)
        track_cid_to_id_map[track.track_cid] = track.track_id

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
                        track_signature_map[
                            track_id
                        ] = get_gated_content_signature_for_user_wallet(
                            {
                                "track_id": track_id,
                                "track_cid": cast(str, track_cid),
                                "type": "track",
                                "user_wallet": user_wallet,
                                "user_id": user_id,
                                "is_gated": True,
                            }
                        )
            except Exception as e:
                logger.error(
                    f"Could not get future result for collection_mint_address {collection_mint_address}. Error: {e}"
                )

    return track_signature_map


# Generates a gated content signature for each of the nft-gated tracks.
# Return a map of gated track id -> gated content signature.
def get_nft_gated_track_signatures(
    user_id: int, track_token_id_map: Dict[int, List[str]]
):
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        user_wallet = _get_user_wallet(user_id, session)
        associated_wallets = get_associated_user_wallet({"user_id": user_id})
        if not user_wallet:
            logger.warn(
                f"get_nft_gated_track_signatures.py | get_nft_gated_track_signatures | no wallet for user_id {user_id}"
            )
            return {}

        nft_gated_tracks = _get_nft_gated_tracks(
            list(track_token_id_map.keys()), session
        )
        eth_nft_gated_tracks = list(
            filter(
                lambda track: track.stream_conditions["nft_collection"]["chain"]
                == "eth",
                nft_gated_tracks,
            )
        )
        sol_nft_gated_tracks = list(
            filter(
                lambda track: track.stream_conditions["nft_collection"]["chain"]
                == "sol",
                nft_gated_tracks,
            )
        )
        eth_nft_gated_track_signatures = _get_eth_nft_gated_track_signatures(
            user_wallet=user_wallet,
            eth_associated_wallets=associated_wallets["eth"],
            tracks=eth_nft_gated_tracks,
            track_token_id_map=track_token_id_map,
            user_id=user_id,
        )
        sol_nft_gated_track_signatures = _get_sol_nft_gated_track_signatures(
            user_wallet=user_wallet,
            sol_associated_wallets=associated_wallets["sol"],
            tracks=sol_nft_gated_tracks,
            user_id=user_id,
        )

        result = {}
        for track_id, signature in eth_nft_gated_track_signatures.items():
            result[track_id] = signature
        for track_id, signature in sol_nft_gated_track_signatures.items():
            result[track_id] = signature

        return result


def _load_abis():
    global erc721_abi
    global erc1155_abi
    ERC721_ABI_PATH = pathlib.Path(__file__).parent / "../abis" / "ERC721.json"
    ERC1155_ABI_PATH = pathlib.Path(__file__).parent / "../abis" / "ERC1155.json"
    with open(ERC721_ABI_PATH) as f721, open(ERC1155_ABI_PATH) as f1155:
        erc721_abi = json.dumps(json.load(f721))
        erc1155_abi = json.dumps(json.load(f1155))


def _init_solana_client_manager():
    global solana_client_manager
    solana_client_manager = SolanaClientManager(shared_config["solana"]["endpoint"])


_load_abis()
_init_solana_client_manager()
