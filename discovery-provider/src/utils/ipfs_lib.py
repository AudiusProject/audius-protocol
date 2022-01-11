import concurrent.futures
import json
import logging
import time
from urllib.parse import urljoin, urlparse
import random

import ipfshttpclient
import requests
from src.utils.helpers import get_valid_multiaddr_from_id_json

# from src.tasks.index_network_peers import get_peers

logger = logging.getLogger(__name__)
NEW_BLOCK_TIMEOUT_SECONDS = 5


class IPFSClient:
    """Helper class for Audius Discovery Provider + IPFS interaction"""

    def __init__(self, ipfs_peer_host, ipfs_peer_port):
        self._api = ipfshttpclient.connect(
            f"/dns/{ipfs_peer_host}/tcp/{ipfs_peer_port}/http"
        )
        self._id = random.randrange(1, 1000)
        logger.info(f"IPFSCLIENT {hex(id(self))} {self._id} | init @ {ipfs_peer_host}:{ipfs_peer_port}")
        # self._cnode_endpoints = get_peers()
        self._cnode_endpoints = []
        self._ipfsid = self._api.id()
        self._multiaddr = get_valid_multiaddr_from_id_json(self._ipfsid)

    def get_peer_info(self):
        return self._ipfsid

    def get_metadata_from_json(self, default_metadata_fields, resp_json):
        metadata = {}
        for parameter, value in default_metadata_fields.items():
            metadata[parameter] = (
                resp_json.get(parameter) if resp_json.get(parameter) != None else value
            )
        return metadata

    def force_clear_queue_and_stop_task_execution(self, executor):
        logger.info(
            "IPFSCLIENT | force_clear_queue_and_stop_task_execution - Clearing queue for executor..."
        )
        executor._threads.clear()
        concurrent.futures.thread._threads_queues.clear()

    # pylint: disable=broad-except
    def get_metadata(self, multihash, default_metadata_fields, user_replica_set=None):
        """Retrieve file from IPFS or gateway, validating metadata requirements prior to
        returning an object with no missing entries
        """
        logger.warning(f"IPFSCLIENT  {hex(id(self))} {self._id}| get_metadata - {multihash}")
        api_metadata = default_metadata_fields
        retrieved_from_gateway = False
        retrieved_from_ipfs_node = False
        start_time = time.time()

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            metadata_futures = {}
            metadata_futures[
                executor.submit(
                    self.get_metadata_from_ipfs_node, multihash, default_metadata_fields
                )
            ] = "metadata_from_ipfs_node"
            metadata_futures[
                executor.submit(
                    self.get_metadata_from_gateway,
                    multihash,
                    default_metadata_fields,
                    user_replica_set,
                )
            ] = "metadata_from_gateway"
            for get_metadata_future in concurrent.futures.as_completed(
                metadata_futures, timeout=NEW_BLOCK_TIMEOUT_SECONDS
            ):
                metadata_fetch_source = metadata_futures[get_metadata_future]
                try:
                    api_metadata = get_metadata_future.result()
                    retrieved = api_metadata != default_metadata_fields
                    if retrieved:
                        logger.info(
                            f"IPFSCLIENT  {hex(id(self))} {self._id}| retrieved metadata successfully, \
                            {api_metadata}, \
                            source: {metadata_fetch_source}"
                        )
                        if metadata_fetch_source == "metadata_from_gateway":
                            retrieved_from_gateway = True
                        else:
                            retrieved_from_ipfs_node = True
                        self.force_clear_queue_and_stop_task_execution(executor)
                        break  # use first returned result
                except Exception as e:
                    logger.error(
                        f"IPFSCLIENT  {hex(id(self))} {self._id}| ipfs_lib.py | \
                        ERROR in metadata_futures parallel processing \
                        generated {e}, multihash: {multihash}, source: {metadata_fetch_source}",
                        exc_info=True,
                    )

        retrieved_metadata = retrieved_from_gateway or retrieved_from_ipfs_node
        # Raise error if metadata is not retrieved.
        # Ensure default values are not written into database.
        if not retrieved_metadata:
            logger.error(
                f"IPFSCLIENT  {hex(id(self))} {self._id}| Retrieved metadata: {retrieved_metadata}. "
                f"retrieved from gateway : {retrieved_from_gateway}, "
                f"retrieved from local node : {retrieved_from_ipfs_node}"
            )
            logger.error(api_metadata)
            logger.error(default_metadata_fields)
            raise Exception(
                f"IPFSCLIENT  {hex(id(self))} {self._id}| Failed to retrieve metadata. Using default values for {multihash}"
            )

        duration = time.time() - start_time
        logger.info(
            f"IPFSCLIENT  {hex(id(self))} {self._id}| get_metadata ${multihash} {duration} seconds \
                | from ipfs:{retrieved_from_ipfs_node} |from gateway:{retrieved_from_gateway}"
        )

        return api_metadata

    # Retrieve a metadata object
    def load_metadata_url(self, url, max_timeout):
        # Skip URL if invalid
        validate_url = urlparse(url)
        if not validate_url.scheme:
            raise Exception(
                f"IPFSCLIENT  {hex(id(self))} {self._id}| Invalid URL from provided gateway addr - {url}"
            )
        r = requests.get(url, timeout=max_timeout)
        return r

    def query_ipfs_metadata_json(self, gateway_ipfs_urls, default_metadata_fields):
        formatted_json = None
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            # Start the load operations and mark each future with its URL
            future_to_url = {
                executor.submit(
                    self.load_metadata_url, url, NEW_BLOCK_TIMEOUT_SECONDS
                ): url
                for url in gateway_ipfs_urls
            }
            for future in concurrent.futures.as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    r = future.result()
                    if r.status_code != 200:
                        logger.warning(
                            f"IPFSCLIENT  {hex(id(self))} {self._id}| {url} - {r.status_code}"
                        )
                        raise Exception("Invalid status_code")
                    # Override with retrieved JSON value
                    formatted_json = self.get_metadata_from_json(
                        default_metadata_fields, r.json()
                    )
                    # Exit loop if dict is successfully retrieved
                    logger.warning(f"IPFSCLIENT  {hex(id(self))} {self._id}| Retrieved from {url}")
                    self.force_clear_queue_and_stop_task_execution(executor)
                    break
                except Exception as exc:
                    logger.error(
                        f"IPFSClient  {hex(id(self))} {self._id}| {url} generated an exception: {exc}"
                    )
        return formatted_json

    def get_metadata_from_gateway(
        self, multihash, default_metadata_fields, user_replica_set=None
    ):
        """Args:
        args.user_replica_set - comma-separated string of user's replica urls
        """

        # Default return initial metadata format
        gateway_metadata_json = default_metadata_fields
        logger.warning(
            f"IPFSCLIENT  {hex(id(self))} {self._id}| get_metadata_from_gateway, {multihash} replica set: {user_replica_set}"
        )
        gateway_endpoints = self._cnode_endpoints

        # first attempt to first fetch metadata from user replica set, if provided & non-empty
        if user_replica_set and isinstance(user_replica_set, str):
            user_replicas = user_replica_set.split(",")
            try:
                query_urls = [
                    "%s/ipfs/%s" % (addr, multihash) for addr in user_replicas
                ]
                data = self.query_ipfs_metadata_json(
                    query_urls, default_metadata_fields
                )
                if data is None:
                    raise Exception()
                return data
            except Exception:
                logger.error(
                    "IPFSCLIENT | get_metadata_from_gateway \
                        \nfailed to fetch metadata from user replica gateways"
                )
                # Remove replica set from gateway endpoints before querying
                gateway_endpoints = list(
                    filter(
                        lambda endpoint: endpoint not in user_replicas,
                        gateway_endpoints,
                    )
                )

        logger.warning(
            f"IPFSCLIENT  {hex(id(self))} {self._id}| get_metadata_from_gateway, \
                \ncombined addresses: {gateway_endpoints}, \
                \ncnode_endpoints: {self._cnode_endpoints}"
        )

        query_urls = ["%s/ipfs/%s" % (addr, multihash) for addr in gateway_endpoints]
        data = self.query_ipfs_metadata_json(query_urls, default_metadata_fields)
        if data is None:
            raise Exception(
                f"IPFSCLIENT  {hex(id(self))} {self._id}| Failed to retrieve CID {multihash} from gateway"
            )
        gateway_metadata_json = data
        return gateway_metadata_json

    def get_metadata_from_ipfs_node(self, multihash, default_metadata_fields):
        logger.warning(
            f"IPFSCLIENT  {hex(id(self))} {self._id}| get_metadata_from_ipfs_node, {multihash}"
        )
        try:
            res = self.cat(multihash)
            resp_val = json.loads(res)

            # If an invalid response object is retrieved return empty values and log error
            if not isinstance(resp_val, dict):
                raise Exception(
                    f"IPFSCLIENT  {hex(id(self))} {self._id}| Expected dict type for {multihash}, received {resp_val}"
                )

        except ValueError as e:
            # Return default format if deserialization fails
            logger.error(
                f"IPFSCLIENT  {hex(id(self))} {self._id}| Failed to deserialize response for {multihash}. {e}"
            )
            raise e
        except Exception as e:
            logger.error(
                f"IPFSCLIENT  {hex(id(self))} {self._id}| Local Node Unknown exception retrieving {multihash}. {e}"
            )
            raise e

        logger.info(f"IPFSCLIENT  {hex(id(self))} {self._id}| Retrieved {multihash} from ipfs node")
        return self.get_metadata_from_json(default_metadata_fields, resp_val)

    def cat(self, multihash):
        try:
            res = self._api.cat(multihash, timeout=1)
            return res
        except:
            logger.error(
                f"IPFSCLIENT  {hex(id(self))} {self._id}| IPFS cat timed out after 1s for CID {multihash}"
            )
            raise  # error is of type ipfshttpclient.exceptions.TimeoutError

    def connect_peer(self, peer):
        try:
            if peer in self._ipfsid["Addresses"]:
                return
            r = self._api.swarm.connect(peer, timeout=3)
            logger.info(r)
        except Exception as e:
            logger.error("IPFSCLIENT | IPFS Failed to update peer")
            logger.error(e)

    def update_cnode_urls(self, cnode_endpoints):
        logger.info(
            f"IPFSCLIENT  {hex(id(self))} {self._id}| update_cnode_urls with endpoints {cnode_endpoints}"
        )
        if len(cnode_endpoints):
            self._cnode_endpoints = cnode_endpoints

    def ipfs_id_multiaddr(self):
        return self._multiaddr


def construct_image_dir_gateway_url(address, CID):
    """Construct the gateway url for an image directory.

    Args:
        args.address - base url of gateway
        args.CID - CID of the image directory
    """
    if not address:
        return None

    return urljoin(address, f"/ipfs/{CID}/original.jpg")
