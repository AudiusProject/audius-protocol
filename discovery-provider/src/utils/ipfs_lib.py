import logging
import json
import time
import concurrent.futures
from urllib.parse import urlparse, urljoin
import requests
import ipfshttpclient
from cid import make_cid

from src.utils.helpers import get_valid_multiaddr_from_id_json

logger = logging.getLogger(__name__)



class IPFSClient:
    """ Helper class for Audius Discovery Provider + IPFS interaction """

    def __init__(self, ipfs_peer_host, ipfs_peer_port):
        self._api = ipfshttpclient.connect(f"/dns/{ipfs_peer_host}/tcp/{ipfs_peer_port}/http")
        self._cnode_endpoints = []
        self._ipfsid = self._api.id()
        self._multiaddr = get_valid_multiaddr_from_id_json(self._ipfsid)

    def get_metadata_from_json(self, metadata_format, resp_json):
        metadata = {}
        for parameter, value in metadata_format.items():
            metadata[parameter] = resp_json.get(parameter) if resp_json.get(parameter) != None else value
        return metadata

    # pylint: disable=broad-except
    def get_metadata(self, multihash, metadata_format, user_replica_set=None):
        """ Retrieve file from IPFS, validating metadata requirements prior to
            returning an object with no missing entries
        """
        logger.warning(f"IPFSCLIENT | get_metadata - {multihash}")
        api_metadata = metadata_format
        retrieved_from_local_node = False
        retrieved_from_gateway = False
        start_time = time.time()

        # # First try to retrieve from local ipfs node.
        # try:
        #     api_metadata = self.get_metadata_from_ipfs_node(multihash, metadata_format)
        #     retrieved_from_local_node = (api_metadata != metadata_format)
        # except Exception:
        #     logger.error(f"Failed to retrieve CID from local node, {multihash}", exc_info=True)

        # Else, try to retrieve from gateways.
        if not retrieved_from_local_node:
            try:
                api_metadata = self.get_metadata_from_gateway(multihash, metadata_format, user_replica_set)
                retrieved_from_gateway = (api_metadata != metadata_format)
            except Exception:
                logger.error(f"Failed to retrieve CID from gateway, {multihash}", exc_info=True)

        retrieved_metadata = (retrieved_from_gateway or retrieved_from_local_node)

        # Raise error if metadata is not retrieved.
        # Ensure default values are not written into database.
        if not retrieved_metadata:
            logger.error(
                f"IPFSCLIENT | Retrieved metadata: {retrieved_metadata}. "
                f"retrieved from gateway : {retrieved_from_gateway}, "
                f"retrieved from local node : {retrieved_from_local_node}"
            )
            logger.error(api_metadata)
            logger.error(metadata_format)
            raise Exception(f"IPFSCLIENT | Failed to retrieve metadata. Using default values for {multihash}")

        duration = time.time() - start_time
        logger.info(
            f"IPFSCLIENT | get_metadata ${multihash} {duration} seconds \
                | from ipfs:{retrieved_from_local_node} |from gateway:{retrieved_from_gateway}"
        )

        return api_metadata

    # Retrieve a metadata object
    def load_metadata_url(self, url, max_timeout):
        # Skip URL if invalid
        validate_url = urlparse(url)
        if not validate_url.scheme:
            raise Exception(f"IPFSCLIENT | Invalid URL from provided gateway addr - {url}")
        r = requests.get(url, timeout=max_timeout)
        return r

    def query_ipfs_metadata_json(self, gateway_ipfs_urls, metadata_format):
        formatted_json = None
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            # Start the load operations and mark each future with its URL
            future_to_url = {executor.submit(self.load_metadata_url, url, 5): url for url in gateway_ipfs_urls}
            for future in concurrent.futures.as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    r = future.result()
                    if r.status_code != 200:
                        logger.warning(f"IPFSCLIENT | {url} - {r.status_code}")
                        raise Exception("Invalid status_code")
                    # Override with retrieved JSON value
                    formatted_json = self.get_metadata_from_json(
                        metadata_format, r.json()
                    )
                    # Exit loop if dict is successfully retrieved
                    logger.warning(f"IPFSCLIENT | Retrieved from {url}")
                    break
                except Exception as exc:
                    logger.error(f"IPFSClient | {url} generated an exception: {exc}")
        return formatted_json

    def get_metadata_from_gateway(self, multihash, metadata_format, user_replica_set=None):
        # Default return initial metadata format
        gateway_metadata_json = metadata_format
        logger.warning(f"IPFSCLIENT | get_metadata_from_gateway, {multihash} replica set: {user_replica_set}")
        gateway_endpoints = self._cnode_endpoints

        # first attempt to first fetch metadata from user replica set, if provided & non-empty
        if (user_replica_set and isinstance(user_replica_set, str)):
            user_replicas = user_replica_set.split(",")
            try:
                query_urls = ["%s/ipfs/%s" % (addr, multihash) for addr in user_replicas]
                data = self.query_ipfs_metadata_json(query_urls, metadata_format)
                if data is None:
                    raise Exception()
                return data
            except Exception:
                # Remove replica set from gateway endpoints before querying
                gateway_endpoints = list(filter(lambda endpoint: endpoint not in user_replicas, gateway_endpoints))

        logger.warning(f"IPFSCLIENT | get_metadata_from_gateway, \
                \ncombined addresses: {gateway_endpoints}, \
                \ncnode_endpoints: {self._cnode_endpoints}")

        query_urls = ["%s/ipfs/%s" % (addr, multihash) for addr in gateway_endpoints]
        data = self.query_ipfs_metadata_json(query_urls, metadata_format)
        if data is None:
            raise Exception(
                f"IPFSCLIENT | Failed to retrieve CID {multihash} from gateway"
            )
        gateway_metadata_json = data
        return gateway_metadata_json

    def get_metadata_from_ipfs_node(self, multihash, metadata_format):
        try:
            res = self.cat(multihash)
            resp_val = json.loads(res)

            # If an invalid response object is retrieved return empty values and log error
            if not isinstance(resp_val, dict):
                raise Exception(
                    f"IPFSCLIENT | Expected dict type for {multihash}, received {resp_val}"
                )

        except ValueError as e:
            # Return default format if deserialization fails
            logger.error(
                f"IPFSCLIENT | Failed to deserialize response for {multihash}. {e}"
            )
            raise e
        except Exception as e:
            logger.error(
                f"IPFSCLIENT | Local Node Unknown exception retrieving {multihash}. {e}"
            )
            raise e

        logger.info(f"IPFSCLIENT | Retrieved {multihash} from ipfs node")
        return self.get_metadata_from_json(metadata_format, resp_val)

    def cat(self, multihash):
        try:
            res = self._api.cat(multihash, timeout=3)
            return res
        except:
            logger.error(f"IPFSCLIENT | IPFS cat timed out for CID {multihash}")
            raise  # error is of type ipfshttpclient.exceptions.TimeoutError

    def connect_peer(self, peer):
        try:
            if peer in self._ipfsid['Addresses']:
                return
            r = self._api.swarm.connect(peer, timeout=3)
            logger.info(r)
        except Exception as e:
            logger.error(f"IPFSCLIENT | IPFS Failed to update peer")
            logger.error(e)

    def update_cnode_urls(self, cnode_endpoints):
        self._cnode_endpoints = cnode_endpoints

    def ipfs_id_multiaddr(self):
        return self._multiaddr

    def cid_is_valid(self, cid):
        if not cid:
            return False

        try:
            make_cid(cid)
            return True
        except Exception as e:
            logger.error(f'IPFSCLIENT | Error in cid_is_valid {str(e)}')
            return False

def construct_image_dir_gateway_url(address, CID):
    """Construct the gateway url for an image directory.

    Args:
        args.address - base url of gateway
        args.CID - CID of the image directory
    """
    if not address:
        return None

    return urljoin(address, f"/ipfs/{CID}/original.jpg")
