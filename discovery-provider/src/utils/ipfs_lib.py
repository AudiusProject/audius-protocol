import logging
import json
import time
from urllib.parse import urlparse
import requests
from requests.exceptions import ReadTimeout
import ipfshttpclient
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
            metadata[parameter] = resp_json.get(parameter) or value
        return metadata

    # pylint: disable=broad-except
    def get_metadata(self, multihash, metadata_format):
        """ Retrieve file from IPFS, validating metadata requirements prior to
            returning an object with no missing entries
        """
        logger.warning(f"IPFSCLIENT | get_metadata - {multihash}")
        api_metadata = metadata_format
        retrieved_from_gateway = False
        retrieved_from_local_node = False
        start_time = time.time()

        try:
            api_metadata = self.get_metadata_from_ipfs_node(
                multihash, metadata_format
            )
            retrieved_from_local_node = api_metadata != metadata_format
        except Exception:
            logger.error(
                f"Failed to retrieve CID from local node, {multihash}", exc_info=True
            )

        try:
            if not retrieved_from_local_node:
                api_metadata = self.get_metadata_from_gateway(multihash, metadata_format)
                retrieved_from_gateway = api_metadata != metadata_format
        except Exception:
            logger.error(
                f"Failed to retrieve CID from gateway, {multihash}", exc_info=True
            )

        retrieved_metadata = (retrieved_from_gateway or retrieved_from_local_node)

        # Raise error if metadata is not retrieved
        # Ensure default values aren not written into database
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
        gateway_endpoints = self._gateway_addresses + self._cnode_endpoints
        logger.warning(f"IPFSCLIENT | get_metadata_from_gateway, \
                combined addresses: {gateway_endpoints}, \
                addresses: {self._gateway_addresses}, \
                cnode_endpoints: {self._cnode_endpoints}")

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
                logger.info(f"IPFSCLIENT | Querying {gateway_query_address}")
                r = requests.get(gateway_query_address, timeout=20)

                # Do not retrieve metadata for error code
                if r.status_code != 200:
                    logger.warning(f"IPFSCLIENT | {gateway_query_address} - {r.status_code}")
                    continue

                # Override with retrieved JSON value
                gateway_metadata_json = self.get_metadata_from_json(
                    metadata_format, r.json()
                )
                # Exit loop if dict is successfully retrieved
                logger.info(
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
            res = self._api.cat(multihash, timeout=20)
            return res
        except:
            logger.error(f"IPFSCLIENT | IPFS cat timed out for CID {multihash}")
            raise  # error is of type ipfshttpclient.exceptions.TimeoutError

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
