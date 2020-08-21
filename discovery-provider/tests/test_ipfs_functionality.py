import json
import ipfshttpclient
import pytest  # pylint: disable=unused-import
from chance import chance
from src.utils.ipfs_lib import IPFSClient, construct_image_dir_gateway_url
from src.utils.helpers import remove_test_file
from src.tasks.metadata import track_metadata_format

# Disabled temporarily, comment below line to enable test
# @pytest.mark.skip(reason="enabled pending ipfs daemon functionality")
def test_ipfs(app):
    json_file = "tests/res/test_ipfs.json"
    ipfs_peer_host = app.config["ipfs"]["host"]
    ipfs_peer_port = app.config["ipfs"]["port"]

    # Instantiate IPFS client from src lib
    ipfsclient = IPFSClient(ipfs_peer_host, ipfs_peer_port, [])

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
    for key in test_metadata_object:
        assert key in ipfs_metadata
        assert test_metadata_object[key] == ipfs_metadata[key]

# test for ipfs_lib.py, multihash_is_directory
class TestMultihashIsDirectory:
    def test_construct_image_dir_gateway_url(self, app):
        # valid CID used for the rest of this function test
        cid = 'QmZgVbuZXzMQrweB3J864LGkGqUg4R27SXkua5BzTSirmK'
        # passing in a False-y address should return None
        assert construct_image_dir_gateway_url(None, cid) is None

        # passing in a valid CID and address will result in a fully formed url string
        square_gateway_url = construct_image_dir_gateway_url(
            'https://gateway-url.co',
            'QmZgVbuZXzMQrweB3J864LGkGqUg4R27SXkua5BzTSirmK'
        )
        square_gateway_url_correct = f'https://gateway-url.co/ipfs/{cid}/150x150.jpg'
        assert square_gateway_url == square_gateway_url_correct

        # passing in a valid CID and address for a non-square image will result in correct url string
        non_square_gateway_url = construct_image_dir_gateway_url(
            'https://gateway-url.co',
            cid,
            False
        )
        non_square_gateway_url_correct = f'https://gateway-url.co/ipfs/{cid}/640x.jpg'
        assert non_square_gateway_url == non_square_gateway_url_correct

    # Invoke multihash_is_directory with a invalid cid, verify that it throws an 'invalid multihash' error
    def test_invalid_cid(self, app):
        ipfs_peer_host = app.config["ipfs"]["host"]
        ipfs_peer_port = app.config["ipfs"]["port"]

        # Instantiate IPFS client from src lib
        ipfsclient = IPFSClient(ipfs_peer_host, ipfs_peer_port, [])

        try:
            ipfsclient.multihash_is_directory('Qmfake')
        except Exception as e:
            assert 'invalid multihash' in str(e)

    # Invoke multihash_is_directory with cat function handler that returns some other response
    def test_valid_cid_directory(self, app):
        ipfs_peer_host = app.config["ipfs"]["host"]
        ipfs_peer_port = app.config["ipfs"]["port"]

        # Instantiate IPFS client from src lib
        ipfsclient = IPFSClient(ipfs_peer_host, ipfs_peer_port, [])

        # override the cat function in the ipfs api so it returns an Exception
        def cat_handler_dir(cid, s, e, timeout):
            raise Exception('this dag node is a directory')
        ipfsclient._api.cat = cat_handler_dir

        # Invoke audius-ipfs with an invalid cid, verify that it throws an 'invalid multihash' error
        is_directory = ipfsclient.multihash_is_directory('QmVmEZnQr49gDtd7xpcsNdmgrtRTT5Te2x27KbTRPNapqy')
        assert is_directory is True

    # Invoke multihash_is_directory with cat function handler that returns `this dag node is a directory error`
    def test_valid_cid_not_directory(self, app):
        ipfs_peer_host = app.config["ipfs"]["host"]
        ipfs_peer_port = app.config["ipfs"]["port"]

        # Instantiate IPFS client from src lib
        ipfsclient = IPFSClient(ipfs_peer_host, ipfs_peer_port, [])

        # override the cat function in the ipfs api so it returns an Exception
        def cat_handler_not_dir(cid, s, e, timeout):
            return 'not a directory'
        ipfsclient._api.cat = cat_handler_not_dir

        # Invoke audius-ipfs with a invalid cid, verify that it throws an 'invalid multihash' error
        is_directory = ipfsclient.multihash_is_directory('QmVmEZnQr49gDtd7xpcsNdmgrtRTT5Te2x27KbTRPNapqy')
        assert is_directory is False
