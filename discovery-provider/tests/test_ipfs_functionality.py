import json
import ipfshttpclient
import pytest  # pylint: disable=unused-import
from chance import chance
from src.utils.ipfs_lib import IPFSClient
from src.utils.helpers import remove_test_file
from src.tasks.metadata import track_metadata_format

# Disabled temporarily, comment below line to enable test
# @pytest.mark.skip(reason="enabled pending ipfs daemon functionality")
def test_ipfs(app):
    json_file = "tests/res/test_ipfs.json"
    ipfs_peer_host = app.config["ipfs"]["host"]
    ipfs_peer_port = app.config["ipfs"]["port"]

    # Instantiate IPFS client from src lib
    ipfsclient = IPFSClient(ipfs_peer_host, ipfs_peer_port)

    remove_test_file(json_file)
    api = ipfshttpclient.connect(f"/dns/{ipfs_peer_host}/tcp/{ipfs_peer_port}/http")

    # Create generic metadata object w/above IPFS multihash
    test_metadata_object = dict(track_metadata_format)
    test_metadata_object["title"] = chance.name()
    test_metadata_object["release_date"] = str(chance.date())
    test_metadata_object["file_type"] = "mp3"
    test_metadata_object["license"] = "HN"
    with open(json_file, "w") as f:
        json.dump(test_metadata_object, f)

    # Add metadata object to ipfs node
    json_res = api.add(json_file)
    metadata_hash = json_res["Hash"]

    # Invoke audius-ipfs
    ipfs_metadata = ipfsclient.get_metadata(metadata_hash, track_metadata_format)
    remove_test_file(json_file)

    # Confirm retrieved metadata object state
    for key, val in test_metadata_object.items():
        assert key in ipfs_metadata
        assert val == ipfs_metadata[key]
