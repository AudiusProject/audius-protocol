# pylint: disable=C0302
import asyncio
import logging
from urllib.parse import urlparse

import aiohttp
from src.tasks.metadata import track_metadata_format, user_metadata_format
from src.utils.eth_contracts_helpers import fetch_all_registered_content_nodes

logger = logging.getLogger(__name__)


class IPFSClient:
    """Helper class for Audius Discovery Provider + IPFS interaction"""

    def __init__(
        self,
        eth_web3=None,
        shared_config=None,
        redis=None,
        eth_abi_values=None,
    ):
        # logger.warning("IPFSCLIENT | initializing")

        # Fetch list of registered content nodes to use during init.
        # During indexing, if ipfs fetch fails, _cnode_endpoints and user_replica_set are empty
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
                f"IPFSCLIENT | fetch _cnode_endpoints on init got {self._cnode_endpoints}"
            )
        else:
            self._cnode_endpoints = []
            logger.warning("IPFSCLIENT | couldn't fetch _cnode_endpoints on init")

    def update_cnode_urls(self, cnode_endpoints):
        if len(cnode_endpoints):
            logger.info(
                f"IPFSCLIENT | update_cnode_urls with endpoints {cnode_endpoints}"
            )
            self._cnode_endpoints = cnode_endpoints

    def _get_metadata_from_json(default_metadata_fields, resp_json):
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
                    f"IPFSCLIENT | Invalid URL from provided gateway addr - {url}"
                )

            async with async_session.get(url, timeout=2) as resp:
                if resp.status == 200:
                    json_resp = await resp.json(content_type=None)
                    return (multihash, json_resp)
        except asyncio.TimeoutError:
            logger.info("IPFSCLIENT | _get_metadata_async TimeoutError")
            return None
        except Exception as e:
            logger.info(f"IPFSCLIENT | _get_metadata_async Exception - {str(e)}")
            return None

    def _get_gateway_endpoints(
        self, fetch_from_replica_set, user_id, user_to_replica_set
    ):
        if fetch_from_replica_set and user_id and user_id in user_to_replica_set:
            user_replica_set = user_to_replica_set[user_id]
            if not user_replica_set:
                return None
            return user_replica_set.split(",")

        return self._cnode_endpoints

    async def fetch_metadata_from_gateway_endpoints(
        self,
        cid_metadata,
        cids_txhash_set,
        cid_to_user_id,
        user_to_replica_set,
        cid_type,
        fetch_from_replica_set=True,
    ):
        async with aiohttp.ClientSession() as async_session:
            futures = []
            cid_futures_map = {}
            cid_txhash_map = {cid: txhash for cid, txhash in cids_txhash_set}

            for cid in cid_txhash_map:
                if cid in cid_metadata:
                    continue  # already fetched
                user_id = cid_to_user_id[cid]

                gateway_endpoints = self._get_gateway_endpoints(
                    fetch_from_replica_set, user_id, user_to_replica_set
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
                for future in asyncio.as_completed(futures, timeout=5):
                    try:
                        future_result = await future
                    except asyncio.CancelledError:
                        pass  # swallow canceled requests

                    if not future_result:
                        continue

                    cid, metadata_json = future_result

                    metadata_format = (
                        track_metadata_format
                        if cid_type[cid] == "track"
                        else user_metadata_format
                    )

                    formatted_json = self._get_metadata_from_json(
                        metadata_format, metadata_json
                    )

                    if formatted_json != metadata_format:
                        cid_metadata[cid] = formatted_json

                        if len(cid_metadata) == len(cid_txhash_map):
                            break  # fetched all metadata

                        for other_future in cid_futures_map[cid]:
                            if other_future == future:
                                continue
                            other_future.cancel()  # cancel other pending requests
            except asyncio.TimeoutError:
                logger.info("IPFSCLIENT | fetch_cid_metadata TimeoutError")
            except Exception as e:
                logger.info("IPFSCLIENT | Error in fetch cid metadata")
                raise e
