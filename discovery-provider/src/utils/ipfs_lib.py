# pylint: disable=C0302
import asyncio
import logging
from urllib.parse import urljoin, urlparse

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

    async def get_metadata_async(self, async_session, multihash, gateway_endpoint):
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
            logger.info("IPFSCLIENT | get_metadata_async TimeoutError")
            return None
        except Exception as e:
            logger.info(f"IPFSCLIENT | get_metadata_async Exception - {str(e)}")
            return None


def construct_image_dir_gateway_url(address, CID):
    """Construct the gateway url for an image directory.

    Args:
        args.address - base url of gateway
        args.CID - CID of the image directory
    """
    if not address:
        return None

    return urljoin(address, f"/ipfs/{CID}/original.jpg")
