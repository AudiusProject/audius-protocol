# pylint: disable=C0302
import asyncio
import logging
from typing import Dict, KeysView, Set, Tuple
from urllib.parse import urlparse

import aiohttp
from pyrsistent import m
from src.tasks.metadata import (
    playlist_metadata_format,
    track_metadata_format,
    user_metadata_format,
)
from src.utils.eth_contracts_helpers import fetch_all_registered_content_nodes

logger = logging.getLogger(__name__)

GET_METADATA_TIMEOUT_SECONDS = 2
GET_METADATA_ALL_GATEWAY_TIMEOUT_SECONDS = 5


class CIDMetadataClient:
    """Helper class for Audius Discovery Provider + CID Metadata interaction"""

    def __init__(
        self,
        eth_web3=None,
        shared_config=None,
        redis=None,
        eth_abi_values=None,
    ):
        # Fetch list of registered content nodes to use during init.
        # During indexing, if cid metadata fetch fails, _cnode_endpoints and user_replica_set are empty
        # it might fail to find content and throw an error. To prevent race conditions between
        # indexing starting and this getting populated, run this on init in the instance
        # in the celery worker
        if eth_web3 and shared_config and redis and eth_abi_values:
            self._cnode_endpoints = list(
                fetch_all_registered_content_nodes(
                    eth_web3, shared_config, redis, eth_abi_values
                )
            )
            logger.warning(
                f"CIDMetadataClient | fetch _cnode_endpoints on init got {self._cnode_endpoints}"
            )
        else:
            self._cnode_endpoints = []
            logger.warning(
                "CIDMetadataClient | couldn't fetch _cnode_endpoints on init"
            )

    def update_cnode_urls(self, cnode_endpoints):
        if len(cnode_endpoints):
            logger.info(
                f"CIDMetadataClient | update_cnode_urls with endpoints {cnode_endpoints}"
            )
            self._cnode_endpoints = cnode_endpoints

    def _get_metadata_from_json(self, default_metadata_fields, resp_json):
        metadata = {}
        for parameter, value in default_metadata_fields.items():
            metadata[parameter] = (
                resp_json.get(parameter) if resp_json.get(parameter) != None else value
            )
        return metadata

    async def _get_metadata_async(self, async_session, multihash, gateway_endpoint):
        url = gateway_endpoint + "/ipfs/" + multihash
        # Skip URL if invalid
        try:
            validate_url = urlparse(url)
            if not validate_url.scheme:
                raise Exception(
                    f"CIDMetadataClient | Invalid URL from provided gateway addr - {url}"
                )

            logger.info(f"newcontract | fetching {multihash} from {url}")
            async with async_session.get(
                url, timeout=GET_METADATA_TIMEOUT_SECONDS
            ) as resp:
                if resp.status == 200:
                    json_resp = await resp.json(content_type=None)
                    return (multihash, json_resp)
        except asyncio.TimeoutError:
            logger.info(
                f"CIDMetadataClient | _get_metadata_async TimeoutError fetching gateway address - {url}"
            )
            return None
        except Exception as e:
            logger.info(f"CIDMetadataClient | _get_metadata_async Exception - {str(e)}")
            return None

    def _get_gateway_endpoints(
        self,
        should_fetch_from_replica_set: bool,
        user_id: int,
        user_to_replica_set: Dict[int, str],
    ):
        if should_fetch_from_replica_set and user_id and user_id in user_to_replica_set:
            user_replica_set = user_to_replica_set.get(user_id)
            if not user_replica_set:
                return None
            return user_replica_set.split(",")

        return self._cnode_endpoints

    async def _fetch_metadata_from_gateway_endpoints(
        self,
        fetched_cids: KeysView[str],
        cids_txhash_set: Set[Tuple[str, str]],
        cid_to_user_id: Dict[str, int],
        user_to_replica_set: Dict[int, str],
        cid_type: Dict[str, str],
        should_fetch_from_replica_set: bool = True,
    ) -> Dict[str, Dict]:
        """Fetch CID metadata from gateway endpoints and update cid_metadata dict.

        fetched_cids -- CIDs already successfully fetched
        cids_txhash_set -- set of cids that we want metadata for
        user_to_replica_set -- dict of user id -> replica set
        cid_type -- dict of cid -> cid type
        should_fetch_from_replica_set -- boolean for if fetch should be from replica set only
        """

        cid_metadata = {}

        async with aiohttp.ClientSession() as async_session:
            futures = []
            cid_futures_map: Dict[str, set] = {}

            for cid, _ in cids_txhash_set:
                if cid in fetched_cids:
                    continue  # already fetched
                user_id = cid_to_user_id[cid]

                gateway_endpoints = self._get_gateway_endpoints(
                    should_fetch_from_replica_set, user_id, user_to_replica_set
                )
                if not gateway_endpoints:
                    continue  # skip if user replica set is empty

                for gateway_endpoint in gateway_endpoints:
                    future = asyncio.ensure_future(
                        self._get_metadata_async(async_session, cid, gateway_endpoint)
                    )
                    if cid not in cid_futures_map:
                        cid_futures_map[cid] = set()
                    cid_futures_map[cid].add(future)
                    futures.append(future)

            try:
                for future in asyncio.as_completed(
                    futures, timeout=GET_METADATA_ALL_GATEWAY_TIMEOUT_SECONDS
                ):
                    try:
                        future_result = await future
                    except asyncio.CancelledError:
                        pass  # swallow canceled requests

                    if not future_result:
                        continue

                    cid, metadata_json = future_result

                    # # TODO add playlist type
                    # metadata_format = (
                    #     track_metadata_format
                    #     if cid_type[cid] == "track"
                    #     else user_metadata_format
                    # )
                    metadata_format = None
                    if cid_type[cid] == "track":
                        metadata_format = track_metadata_format
                    elif cid_type[cid] == "user":
                        metadata_format = user_metadata_format
                    elif cid_type[cid] == "playlist_data":
                        metadata_format = playlist_metadata_format
                    else:
                        raise Exception(f"Unknown metadata type ${cid_type[cid]}")

                    formatted_json = self._get_metadata_from_json(
                        metadata_format, metadata_json
                    )

                    if formatted_json != metadata_format:
                        cid_metadata[cid] = formatted_json

                        if len(fetched_cids) + len(cid_metadata) == len(
                            cids_txhash_set
                        ):
                            break  # fetched all metadata

                        for other_future in cid_futures_map[cid]:
                            if other_future == future:
                                continue
                            other_future.cancel()  # cancel other pending requests

            except asyncio.TimeoutError:
                logger.info(
                    "CIDMetadataClient | fetch_metadata_from_gateway_endpoints TimeoutError"
                )
            except Exception as e:
                logger.info("CIDMetadataClient | Error in fetch cid metadata")
                raise e
        return cid_metadata

    # Used in POA indexing
    def fetch_metadata_from_gateway_endpoints(
        self,
        fetched_cids: KeysView[str],
        cids_txhash_set: Set[Tuple[str, str]],
        cid_to_user_id: Dict[str, int],
        user_to_replica_set: Dict[int, str],
        cid_type: Dict[str, str],
        should_fetch_from_replica_set: bool = True,
    ):
        return asyncio.run(
            self._fetch_metadata_from_gateway_endpoints(
                fetched_cids,
                cids_txhash_set,
                cid_to_user_id,
                user_to_replica_set,
                cid_type,
                should_fetch_from_replica_set,
            )
        )

    # Used in SOL indexing
    async def async_fetch_metadata_from_gateway_endpoints(
        self,
        cids_txhash_set: Set[Tuple[str, str]],
        cid_to_user_id: Dict[str, int],
        user_to_replica_set: Dict[int, str],
        cid_type: Dict[str, str],
    ) -> Dict[str, Dict]:
        cid_metadata: Dict[str, Dict] = {}

        # first attempt - fetch all CIDs from replica set
        try:

            cid_metadata.update(
                await self._fetch_metadata_from_gateway_endpoints(
                    cid_metadata.keys(),
                    cids_txhash_set,
                    cid_to_user_id,
                    user_to_replica_set,
                    cid_type,
                    should_fetch_from_replica_set=True,
                )
            )
        except asyncio.TimeoutError:
            # swallow exception on first attempt fetching from replica set
            pass

        # second attempt - fetch missing CIDs from other cnodes
        if len(cid_metadata) != len(cids_txhash_set):
            cid_metadata.update(
                await self._fetch_metadata_from_gateway_endpoints(
                    cid_metadata.keys(),
                    cids_txhash_set,
                    cid_to_user_id,
                    user_to_replica_set,
                    cid_type,
                    should_fetch_from_replica_set=False,
                )
            )

        if cid_type and len(cid_metadata) != len(cid_type.keys()):
            missing_cids_msg = f"Did not fetch all CIDs - missing {[set(cid_type.keys()) - set(cid_metadata.keys())]} CIDs"
            raise Exception(missing_cids_msg)

        return cid_metadata
