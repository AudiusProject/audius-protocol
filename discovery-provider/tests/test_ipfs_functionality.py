import json
import ipfshttpclient
import pytest  # pylint: disable=unused-import
import time
from pytest_mock import mocker
from chance import chance
from src.utils.ipfs_lib import IPFSClient
from src.utils.helpers import remove_test_file
from src.tasks.metadata import track_metadata_format

def test_ipfs(app):
    def create_generic_metadata_object(track_metadata_format, json_file):
        test_metadata_object = dict(track_metadata_format)
        test_metadata_object["title"] = chance.name()
        test_metadata_object["release_date"] = str(chance.date())
        test_metadata_object["file_type"] = "mp3"
        test_metadata_object["license"] = "HN"
        with open(json_file, "w") as f:
            json.dump(test_metadata_object, f)
        return test_metadata_object

    def add_metadata_object_to_ipfs_node(json_file, api):
        json_res = api.add(json_file)
        metadata_hash = json_res["Hash"]
        return metadata_hash

    def test_cleanup(json_file):
        remove_test_file(json_file)

    def confirm_retrieved_metadata_object_state(test_metadata_object, ipfs_metadata):
        for key, val in test_metadata_object.items():
            assert key in ipfs_metadata
            assert val == ipfs_metadata[key]

    def assert_metadata_retrieval_failure(track_metadata_format, json_file, ipfs_metadata, api):
        with pytest.raises(Exception):
            test_metadata_object = create_generic_metadata_object(track_metadata_format, json_file)
            metadata_hash = add_metadata_object_to_ipfs_node(json_file, api)
            ipfs_metadata = ipfsclient.get_metadata(metadata_hash, track_metadata_format)
            test_cleanup(json_file)


    def assert_metadata_retrieval_success(track_metadata_format, json_file, ipfs_metadata, api):
        test_metadata_object = create_generic_metadata_object(track_metadata_format, json_file)
        metadata_hash = add_metadata_object_to_ipfs_node(json_file, api)
        ipfs_metadata = ipfsclient.get_metadata(metadata_hash, track_metadata_format)
        test_cleanup(json_file)
        confirm_retrieved_metadata_object_state(test_metadata_object, ipfs_metadata)

    def timeout_fetch():
        time.sleep(10)

    json_file = "tests/res/test_ipfs.json"
    ipfs_peer_host = app.config["ipfs"]["host"]
    ipfs_peer_port = app.config["ipfs"]["port"]

    # Instantiate IPFS client from src lib
    ipfsclient = IPFSClient(ipfs_peer_host, ipfs_peer_port)

    test_cleanup(json_file)
    api = ipfshttpclient.connect(f"/dns/{ipfs_peer_host}/tcp/{ipfs_peer_port}/http")
    assert_metadata_retrieval_success(track_metadata_format, json_file, ipfs_metadata, api)

    ipfs_fetch = 'get_metadata_from_ipfs_node'
    gateway_fetch = 'get_metadata_from_gateway'

    def slow_return_metadata():
        time.sleep(3)
        return test_metadata_object

    def return_metadata_immediately():
        return test_metadata_object

    def patch_ipfsclient_method(method_name, replacement_function):
        mocker.patch.object(IPFSClient, method_name)
        IPFSClient.get_metadata_from_gateway.side_effect = replacement_function

    def test_ipfs_metadata_fetch_with_gateway_slow(mocker):
        patch_ipfsclient_method(gateway_fetch, slow_return_metadata)
        patch_ipfsclient_method(ipfs_fetch, return_metadata_immediately)
        assert_metadata_retrieval_success(track_metadata_format, json_file, ipfs_metadata, api)

    def test_ipfs_metadata_fetch_with_ipfs_slow(mocker):
        patch_ipfsclient_method(ipfs_fetch, slow_return_metadata)
        patch_ipfsclient_method(gateway_fetch, return_metadata_immediately)
        assert_metadata_retrieval_success(track_metadata_format, json_file, ipfs_metadata, api)

    def test_ipfs_metadata_fetch_with_ipfs_timeout(mocker):
        patch_ipfsclient_method(ipfs_fetch, timeout_fetch)
        patch_ipfsclient_method(gateway_fetch, return_metadata_immediately)
        assert_metadata_retrieval_success(track_metadata_format, json_file, ipfs_metadata, api)

    def test_ipfs_metadata_fetch_with_gateway_timeout(mocker):
        patch_ipfsclient_method(gateway_fetch, timeout_fetch)
        patch_ipfsclient_method(ipfs_fetch, return_metadata_immediately)
        assert_metadata_retrieval_success(track_metadata_format, json_file, ipfs_metadata, api)

    def test_ipfs_metadata_fetch_with_both_timeout(mocker):
        patch_ipfsclient_method(ipfs_fetch, timeout_fetch)
        patch_ipfsclient_method(gateway_fetch, timeout_fetch)
        assert_metadata_retrieval_failure(track_metadata_format, json_file, ipfs_metadata, api)


