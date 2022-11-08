import concurrent.futures
import json
import logging
import pathlib
from collections import defaultdict
from typing import Dict, List, Set

from eth_typing import ChecksumAddress
from sqlalchemy.orm.session import Session
from src.models.tracks.track import Track
from src.models.users.user import User
from src.premium_content.premium_content_access_checker import (
    premium_content_access_checker,
)
from src.premium_content.signature import get_authed_premium_content_signature
from src.queries.get_associated_user_wallet import get_associated_user_wallet
from src.utils import db_session, web3_provider
from web3 import Web3

logger = logging.getLogger(__name__)

erc721_abi = None
erc1155_abi = None

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


# Returns premium tracks from given track ids with an nft collection as the premium conditions.
def _get_nft_gated_tracks(track_ids: List[int], session: Session):
    premium_tracks = (
        session.query(Track)
        .filter(
            Track.is_premium == True,
            Track.track_id.in_(track_ids),
            Track.is_current == True,
            Track.is_delete == False,
        )
        .all()
    )
    nft_gated_tracks = list(
        filter(
            lambda track: "nft_collection" in track.premium_conditions, premium_tracks  # type: ignore
        )
    )
    return nft_gated_tracks


def _get_eth_nft_gated_track_signatures(
    user_wallet: str,
    eth_associated_wallets: List[str],
    tracks: List[Track],
    track_token_id_map: Dict[int, List[str]],
):
    track_signature_map = {}

    user_eth_wallets = list(
        map(Web3.toChecksumAddress, eth_associated_wallets + [user_wallet])
    )

    erc721_gated_tracks = list(
        filter(
            lambda track: track.premium_conditions["nft_collection"]["standard"]  # type: ignore
            == "ERC721",
            tracks,
        )
    )

    # Build a map of ERC721 collection address -> track ids
    # so that only one chain call will be made for premium tracks
    # that share the same nft collection gate.
    erc721_collection_track_map = defaultdict(list)
    for track in erc721_gated_tracks:
        contract_address = Web3.toChecksumAddress(
            track.premium_conditions["nft_collection"]["address"]  # type: ignore
        )
        erc721_collection_track_map[contract_address].append(track.track_id)

    erc1155_gated_tracks = list(
        filter(
            lambda track: track.premium_conditions["nft_collection"]["standard"]  # type: ignore
            == "ERC1155",
            tracks,
        )
    )

    # Build a map of ERC1155 collection address -> track ids
    # so that only one chain call will be made for premium tracks
    # that share the same nft collection gate.
    # Also build a map of ERC1155 collection address -> nft token ids
    # so that the balanceOf contract function can be used to check
    # batch ownership of ERC1155 nfts for a given collection.
    erc1155_collection_track_map = defaultdict(list)
    contract_address_token_id_map: Dict[str, Set[int]] = defaultdict(set)
    for track in erc1155_gated_tracks:
        contract_address = Web3.toChecksumAddress(
            track.premium_conditions["nft_collection"]["address"]  # type: ignore
        )
        erc1155_collection_track_map[contract_address].append(track.track_id)
        track_token_id_set = set(map(int, track_token_id_map[track.track_id]))
        contract_address_token_id_map[contract_address] = contract_address_token_id_map[
            contract_address
        ].union(track_token_id_set)

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
                # Generate premium content signatures for tracks whose
                # nft collection is owned by the user.
                if future.result():
                    for track_id in erc721_collection_track_map[contract_address]:
                        track_signature_map[
                            track_id
                        ] = get_authed_premium_content_signature(
                            {
                                "id": track_id,
                                "type": "track",
                                "user_wallet": user_wallet,
                            }
                        )
            except Exception as e:
                logger.error(
                    f"Could not future result for erc721 contract_address {contract_address}. Error: {e}"
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
                # Generate premium content signatures for tracks whose
                # nft collection is owned by the user.
                if future.result():
                    for track_id in erc1155_collection_track_map[contract_address]:
                        track_signature_map[
                            track_id
                        ] = get_authed_premium_content_signature(
                            {
                                "id": track_id,
                                "type": "track",
                                "user_wallet": user_wallet,
                            }
                        )
            except Exception as e:
                logger.error(
                    f"Could not future result for erc1155 contract_address {contract_address}. Error: {e}"
                )

    return track_signature_map


# todo: this will be implemented later
def _get_sol_nft_gated_track_signatures(
    user_wallet: str,
    sol_associated_wallets: List[str],
    tracks: List[Track],
):
    return {}


# Generates a premium content signature for each of the nft-gated tracks.
# Return a map of premium track id -> premium content signature.
def get_nft_gated_premium_track_signatures(
    user_id: int, track_token_id_map: Dict[int, List[str]]
):
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        user_wallet = _get_user_wallet(user_id, session)
        associated_wallets = get_associated_user_wallet({"user_id": user_id})
        if not user_wallet:
            logger.warn(
                f"get_premium_track_signatures.py | get_nft_gated_premium_track_signatures | no wallet for user_id {user_id}"
            )
            return {}

        nft_gated_tracks = _get_nft_gated_tracks(
            list(track_token_id_map.keys()), session
        )
        eth_nft_gated_tracks = list(
            filter(
                lambda track: track["nft_collection"]["chain"] == "eth",
                nft_gated_tracks,
            )
        )
        sol_nft_gated_tracks = list(
            filter(
                lambda track: track["nft_collection"]["chain"] == "sol",
                nft_gated_tracks,
            )
        )
        eth_nft_gated_track_signatures = _get_eth_nft_gated_track_signatures(
            user_wallet=user_wallet,
            eth_associated_wallets=associated_wallets["eth"],
            tracks=eth_nft_gated_tracks,
            track_token_id_map=track_token_id_map,
        )
        sol_nft_gated_track_signatures = _get_sol_nft_gated_track_signatures(
            user_wallet=user_wallet,
            sol_associated_wallets=associated_wallets["sol"],
            tracks=sol_nft_gated_tracks,
        )

        result = {}
        for track_id, signature in eth_nft_gated_track_signatures.items():
            result[track_id] = signature
        for track_id, signature in sol_nft_gated_track_signatures.items():
            result[track_id] = signature

        return result


# Generates a premium content signature for each of the premium tracks.
# Return a map of premium track id -> premium content signature.
def get_premium_track_signatures(user_id: int, track_ids: List[int]):
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        user_wallet = _get_user_wallet(user_id, session)
        if not user_wallet:
            logger.warn(
                f"get_premium_track_signatures.py | get_premium_track_signatures | no wallet for user_id {user_id}"
            )
            return {}

        args = list(
            map(
                lambda track_id: {
                    "user_id": user_id,
                    "premium_content_id": track_id,
                    "premium_content_type": "track",
                },
                track_ids,
            )
        )
        premium_track_batch_access = (
            premium_content_access_checker.check_access_for_batch(session, args)
        )

        if (
            "track" not in premium_track_batch_access
            or user_id not in premium_track_batch_access["track"]
        ):
            return []

        track_access_for_user = premium_track_batch_access["track"][user_id]
        track_ids_with_access = list(
            filter(
                lambda track_id: track_access_for_user[track_id][
                    "does_user_have_access"
                ],
                track_access_for_user.keys(),
            )
        )

        track_signature_map = {}
        for track_id in track_ids_with_access:
            track_signature_map[track_id] = get_authed_premium_content_signature(
                {"id": track_id, "type": "track", "user_wallet": user_wallet}
            )
        return track_signature_map


def _load_abis():
    global erc721_abi
    global erc1155_abi
    ERC721_ABI_PATH = pathlib.Path(__file__).parent / "../abis" / "ERC721.json"
    ERC1155_ABI_PATH = pathlib.Path(__file__).parent / "../abis" / "ERC1155.json"
    with open(ERC721_ABI_PATH) as f721, open(ERC1155_ABI_PATH) as f1155:
        erc721_abi = json.dumps(json.load(f721))
        erc1155_abi = json.dumps(json.load(f1155))


_load_abis()
