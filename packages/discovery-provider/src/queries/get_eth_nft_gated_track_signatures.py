import concurrent.futures
import json
import logging
import pathlib
from collections import defaultdict
from typing import Dict, List, Set

from eth_typing import ChecksumAddress
from web3 import Web3

from src.gated_content.signature import get_gated_content_signature_for_user_wallet
from src.models.tracks.track import Track
from src.utils import web3_provider

logger = logging.getLogger(__name__)

erc721_abi = None
erc1155_abi = None

eth_web3 = web3_provider.get_eth_web3()


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


def get_eth_nft_gated_track_signatures(
    user_wallet: str,
    eth_associated_wallets: List[str],
    tracks: List[Track],
    track_token_id_map: Dict[int, List[str]],
    user_id: int,
):
    track_signature_map = {}
    track_cid_to_id_map = {}
    track_id_to_original_cid_map = {}

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
        track_id_to_original_cid_map[track.track_id] = track.orig_file_cid

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
        track_id_to_original_cid_map[track.track_id] = track.orig_file_cid

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
                        original_cid = track_id_to_original_cid_map[track_id]
                        mp3_signature = get_gated_content_signature_for_user_wallet(
                            {
                                "track_id": track_id,
                                "track_cid": track_cid,
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
                                    "track_cid": original_cid,
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
                        original_cid = track_id_to_original_cid_map[track_id]
                        mp3_signature = get_gated_content_signature_for_user_wallet(
                            {
                                "track_id": track_id,
                                "track_cid": track_cid,
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
                                    "track_cid": original_cid,
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
                    f"Could not get future result for erc1155 contract_address {contract_address}. Error: {e}"
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
