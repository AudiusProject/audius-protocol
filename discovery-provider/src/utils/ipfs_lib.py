import logging
import json
import time
from urllib.parse import urlparse, urljoin
import requests
from requests.exceptions import ReadTimeout
import ipfshttpclient
from cid import make_cid
from src.utils.helpers import get_valid_multiaddr_from_id_json

logger = logging.getLogger(__name__)


class IPFSClient:
    """ Helper class for Audius Discovery Provider + IPFS interaction """

    def __init__(self, ipfs_peer_host, ipfs_peer_port, gateway_addresses):
        self._api = ipfshttpclient.connect(f"/dns/{ipfs_peer_host}/tcp/{ipfs_peer_port}/http")
        self._gateway_addresses = gateway_addresses
        self._cnode_endpoints = None
        self._ipfsid = self._api.id()
        self._multiaddr = get_valid_multiaddr_from_id_json(self._ipfsid)

    def get_metadata_from_json(self, metadata_format, resp_json):
        metadata = {}
        for parameter, value in metadata_format.items():
            metadata[parameter] = resp_json.get(parameter) if resp_json.get(parameter) != None else value
        return metadata

    # pylint: disable=broad-except
    def get_metadata(self, multihash, metadata_format):
        """ Retrieve file from IPFS, validating metadata requirements prior to
            returning an object with no missing entries
        """
        logger.warning(f"IPFSCLIENT | get_metadata - {multihash}")
        api_metadata = metadata_format
        retrieved_from_local_node = False
        retrieved_from_gateway = False
        start_time = time.time()

        # First try to retrieve from local ipfs node.
        try:
            api_metadata = self.get_metadata_from_ipfs_node(multihash, metadata_format)
            retrieved_from_local_node = (api_metadata != metadata_format)
        except Exception:
            logger.error(f"Failed to retrieve CID from local node, {multihash}", exc_info=True)

        # Else, try to retrieve from gateways.
        if not retrieved_from_local_node:
            try:
                api_metadata = self.get_metadata_from_gateway(multihash, metadata_format)
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
        logger.info(f"IPFSCLIENT | get_metadata --- {duration} seconds ---")

        return api_metadata

    def get_metadata_from_gateway(self, multihash, metadata_format):
        # Default return initial metadata format
        gateway_metadata_json = metadata_format
        logger.warning(f"IPFSCLIENT | get_metadata_from_gateway, {multihash}")
        gateway_endpoints = self._cnode_endpoints
        logger.warning(f"IPFSCLIENT | get_metadata_from_gateway, \
                \ncombined addresses: {gateway_endpoints}, \
                \ncnode_endpoints: {self._cnode_endpoints}, \
                \naddresses: {self._gateway_addresses}")

        for address in gateway_endpoints:
            gateway_query_address = "%s/ipfs/%s" % (address, multihash)

            # Skip URL if invalid
            validate_url = urlparse(gateway_query_address)
            if not validate_url.scheme:
                logger.info(
                    f"IPFSCLIENT | Invalid URL from provided gateway addr - "
                    f"provided host: {address} CID address:{gateway_query_address}"
                )
                continue

            try:
                logger.warning(f"IPFSCLIENT | Querying {gateway_query_address}")
                r = requests.get(gateway_query_address, timeout=3)

                # Do not retrieve metadata for error code
                if r.status_code != 200:
                    logger.warning(f"IPFSCLIENT | {gateway_query_address} - {r.status_code}")
                    continue

                # Override with retrieved JSON value
                gateway_metadata_json = self.get_metadata_from_json(
                    metadata_format, r.json()
                )
                # Exit loop if dict is successfully retrieved
                logger.warning(
                    f"IPFSCLIENT | Retrieved {multihash} from {gateway_query_address}"
                )
                return gateway_metadata_json
            except ReadTimeout:
                logger.error(
                    f"IPFSCLIENT | Failed to retrieve CID from {gateway_query_address}"
                )
                continue
            except Exception as e:
                logger.error(
                    f"IPFSCLIENT | Unknown exception retrieving from {gateway_query_address}",
                    exc_info=True,
                )
                if "No file found" not in str(e):
                    raise e

        raise Exception(
            f"IPFSCLIENT | Failed to retrieve CID {multihash} from gateway"
        )

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

    def multihash_is_directory(self, multihash, is_square=True):
        """Given a profile picture or cover photo CID, determine if it's a
        directory or a regular file CID

        self - class self
        multihash - CID to check if directory
        is_square - flag to toggle between square and non-square images
                    user cover photo is the only is_square=False image,
                    everything else is square
        """
        # Check if the multihash is valid
        if not self.cid_is_valid(multihash):
            raise Exception(f'invalid multihash {multihash}')

        # First attempt to cat multihash locally.
        try:
            # If cat successful, multihash is not directory.
            self._api.cat(multihash, 0, 1, timeout=3)
            return False
        except Exception as e:  # pylint: disable=W0703
            if "this dag node is a directory" in str(e):
                logger.warning(f"IPFSCLIENT | Found directory {multihash}")
                return True

        # Attempt to retrieve from cnode gateway endpoints.
        gateway_endpoints = self._cnode_endpoints
        for address in gateway_endpoints:
            # First, query as dir.
            gateway_query_address = construct_image_dir_gateway_url(address, multihash)
            r = None
            if gateway_query_address:
                try:
                    logger.warning(f"IPFSCLIENT | Querying {gateway_query_address}")
                    r = requests.get(gateway_query_address, timeout=3)
                except Exception as e:
                    logger.warning(f"Failed to query {gateway_query_address} with error {e}")

            if r is not None:
                try:
                    json_resp = r.json()
                    # Gateway will return "no link named" error if dir  but no file named 150x150.jpg exists in dir.
                    if 'error' in json_resp and 'no link named' in json_resp['error']:
                        logger.warning(f"IPFSCLIENT | Found directory {gateway_query_address}")
                        return True
                except Exception as e:
                    logger.warning(f"IPFSCLIENT | Failed to deserialize json for {multihash} for error {e}")

                # Success non-json response indicates image in dir
                if r.status_code == 200:
                    logger.warning(f"IPFSCLIENT | Returned image at {gateway_query_address}")
                    return True

            # Else, query as non-dir image
            gateway_query_address = urljoin(address, f"/ipfs/{multihash}")
            r = None
            try:
                logger.warning(f"IPFSCLIENT | Querying {gateway_query_address}")
                r = requests.get(gateway_query_address, timeout=3)
            except Exception as e:
                logger.warning(f"Failed to query {gateway_query_address}, {e}")

            # Successful non-json response indicates image, not directory
            if r is not None and r.status_code == 200:
                logger.warning(f"IPFSCLIENT | Returned image at {gateway_query_address}")
                return False

        raise Exception(f"Failed to determine multihash status, {multihash}")

    def connect_peer(self, peer):
        try:
            if peer in self._ipfsid['Addresses']:
                return
            r = self._api.swarm.connect(peer)
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
            return False

def construct_image_dir_gateway_url(address, CID, is_square=True):
    """Construct the gateway url for an image directory.

    address - base url of gateway
    CID - CID of the image directory
    is_square - flag to toggle between square and non-square images
                square images are generally profile pictures while
                is_square=False is cover photos
    """
    if not address:
        return None

    image_file_name = '150x150.jpg' if is_square else '640x.jpg'
    return urljoin(address, f"/ipfs/{CID}/{image_file_name}")
