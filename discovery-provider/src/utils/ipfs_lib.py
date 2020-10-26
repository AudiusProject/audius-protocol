import logging
import json
import time
import concurrent.futures
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

    # Retrieve a single page and report the URL and contents
    def load_url(self, url, max_timeout):
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
            future_to_url = {executor.submit(self.load_url, url, 5): url for url in gateway_ipfs_urls}
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
                    logger.error('IPFSClient | %r generated an exception: %s' % (url, exc))
        return formatted_json

    def get_metadata_from_gateway(self, multihash, metadata_format):
        # Default return initial metadata format
        gateway_metadata_json = metadata_format
        logger.warning(f"IPFSCLIENT | get_metadata_from_gateway, {multihash}")
        gateway_endpoints = self._cnode_endpoints
        logger.warning(f"IPFSCLIENT | get_metadata_from_gateway, \
                \ncombined addresses: {gateway_endpoints}, \
                \ncnode_endpoints: {self._cnode_endpoints}, \
                \naddresses: {self._gateway_addresses}")

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

    def multihash_is_directory(self, multihash):
        """Given a profile picture or cover photo CID, determine if it's a
        directory or a regular file CID

        Args:
            args.self - class self
            args.multihash - CID to check if directory
        """
        # Check if the multihash is valid
        if not self.cid_is_valid(multihash):
            raise Exception(f'invalid multihash {multihash}')

        # First, attempt to cat multihash locally via IPFS.
        try:
            # If cat successful, multihash is not directory.
            self._api.cat(multihash, 0, 1, timeout=3)
            return False
        except Exception as e:  # pylint: disable=W0703
            if "this dag node is a directory" in str(e):
                logger.warning(f"IPFSCLIENT | Found directory {multihash}")
                return True

        # If not found via IPFS, attempt to retrieve from cnode gateway endpoints.
        gateway_endpoints = self._cnode_endpoints
        for address in gateway_endpoints:
            # First, query as dir.
            gateway_query_address = construct_image_dir_gateway_url(address, multihash)
            r = None
            if gateway_query_address:
                try:
                    logger.warning(f"IPFSCLIENT | Querying {gateway_query_address}")
                    # use a HEAD request instead of a GET so we can just get the status code without the
                    # actual image file, which we don't need
                    r = requests.head(gateway_query_address, timeout=3)
                except Exception as e:
                    logger.warning(f"Failed to query {gateway_query_address} with error {e}")

            if r is not None:
                # Success non-json response indicates image in dir
                if r.status_code == 200:
                    logger.warning(f"IPFSCLIENT | Returned image at {gateway_query_address}")
                    return True

                # If not a success code, try to parse the json and see if it contains an error
                try:
                    json_resp = r.json()
                    # Gateway will return "no link named" error if dir but no file named
                    # with filename (original.jpg, 150x150.jpg) exists in dir.
                    if 'error' in json_resp and 'no link named' in json_resp['error']:
                        logger.warning(f"IPFSCLIENT | Found directory {gateway_query_address}")
                        return True
                except Exception as e:
                    logger.warning(f"IPFSCLIENT | Failed to deserialize json for {gateway_query_address} for error {e}")

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
