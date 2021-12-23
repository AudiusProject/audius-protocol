import json
import time

import ipfshttpclient
import pytest
from chance import chance
from src.tasks.metadata import track_metadata_format
from src.utils.helpers import remove_test_file as cleanup_test
from src.utils.ipfs_lib import IPFSClient

IPFS_FETCH = "get_metadata_from_ipfs_node"
GATEWAY_FETCH = "get_metadata_from_gateway"
JSON_FILE = "integration_tests/res/test_ipfs.json"


# Helpers
def get_ipfs_client(app):
    ipfs_peer_host = app.config["ipfs"]["host"]
    ipfs_peer_port = app.config["ipfs"]["port"]
    ipfsclient = IPFSClient(ipfs_peer_host, ipfs_peer_port)
    return ipfsclient


def get_ipfs_api(app):
    ipfs_peer_host = app.config["ipfs"]["host"]
    ipfs_peer_port = app.config["ipfs"]["port"]
    api = ipfshttpclient.connect(f"/dns/{ipfs_peer_host}/tcp/{ipfs_peer_port}/http")
    return api


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


def confirm_retrieved_metadata_object_state(test_metadata_object, ipfs_metadata):
    for key, val in test_metadata_object.items():
        assert key in ipfs_metadata
        assert val == ipfs_metadata[key]


def assert_metadata_retrieval_failure(app, track_metadata_format, json_file):
    ipfsclient = get_ipfs_client(app)
    api = get_ipfs_api(app)
    with pytest.raises(Exception):
        metadata_hash = add_metadata_object_to_ipfs_node(json_file, api)
        ipfsclient.get_metadata(metadata_hash, track_metadata_format)
    cleanup_test(json_file)


def assert_metadata_retrieval_success(
    app, track_metadata_format, test_metadata_object, json_file
):
    ipfsclient = get_ipfs_client(app)
    api = get_ipfs_api(app)
    metadata_hash = add_metadata_object_to_ipfs_node(json_file, api)
    ipfs_metadata = ipfsclient.get_metadata(metadata_hash, track_metadata_format)
    confirm_retrieved_metadata_object_state(test_metadata_object, ipfs_metadata)
    cleanup_test(json_file)


def timeout_fetch(test_metadata_object):
    def fn(*args):
        time.sleep(20)

    return fn


def slow_return_metadata(test_metadata_object):
    def fn(*args):
        time.sleep(3)
        return test_metadata_object

    return fn


def return_metadata_immediately(test_metadata_object):
    def fn(*args):
        time.sleep(0)
        return test_metadata_object

    return fn


def patch_ipfsclient_method(mocker, method_name, replacement_function):
    mocker.patch(
        f"src.utils.ipfs_lib.IPFSClient.{method_name}",
        side_effect=replacement_function,
        autospec=True,
    )


# Tests
def test_base_case(app):
    test_metadata_object = create_generic_metadata_object(
        track_metadata_format, JSON_FILE
    )
    assert_metadata_retrieval_success(
        app, track_metadata_format, test_metadata_object, JSON_FILE
    )


def test_ipfs_metadata_fetch_with_gateway_slow(app, mocker):
    test_metadata_object = create_generic_metadata_object(
        track_metadata_format, JSON_FILE
    )
    patch_ipfsclient_method(
        mocker, GATEWAY_FETCH, slow_return_metadata(test_metadata_object)
    )
    patch_ipfsclient_method(
        mocker, IPFS_FETCH, return_metadata_immediately(test_metadata_object)
    )
    assert_metadata_retrieval_success(
        app, track_metadata_format, test_metadata_object, JSON_FILE
    )


def test_ipfs_metadata_fetch_with_ipfs_slow(app, mocker):
    test_metadata_object = create_generic_metadata_object(
        track_metadata_format, JSON_FILE
    )
    patch_ipfsclient_method(
        mocker, IPFS_FETCH, slow_return_metadata(test_metadata_object)
    )
    patch_ipfsclient_method(
        mocker, GATEWAY_FETCH, return_metadata_immediately(test_metadata_object)
    )
    assert_metadata_retrieval_success(
        app, track_metadata_format, test_metadata_object, JSON_FILE
    )


def test_ipfs_metadata_fetch_with_ipfs_timeout(app, mocker):
    test_metadata_object = create_generic_metadata_object(
        track_metadata_format, JSON_FILE
    )
    patch_ipfsclient_method(mocker, IPFS_FETCH, timeout_fetch(test_metadata_object))
    patch_ipfsclient_method(
        mocker, GATEWAY_FETCH, return_metadata_immediately(test_metadata_object)
    )
    assert_metadata_retrieval_success(
        app, track_metadata_format, test_metadata_object, JSON_FILE
    )


def test_ipfs_metadata_fetch_with_gateway_timeout(app, mocker):
    test_metadata_object = create_generic_metadata_object(
        track_metadata_format, JSON_FILE
    )
    patch_ipfsclient_method(mocker, GATEWAY_FETCH, timeout_fetch(test_metadata_object))
    patch_ipfsclient_method(
        mocker, IPFS_FETCH, return_metadata_immediately(test_metadata_object)
    )
    assert_metadata_retrieval_success(
        app, track_metadata_format, test_metadata_object, JSON_FILE
    )


def test_ipfs_metadata_fetch_with_both_timeout(app, mocker):
    test_metadata_object = create_generic_metadata_object(
        track_metadata_format, JSON_FILE
    )
    patch_ipfsclient_method(mocker, IPFS_FETCH, timeout_fetch(test_metadata_object))
    patch_ipfsclient_method(mocker, GATEWAY_FETCH, timeout_fetch(test_metadata_object))
    assert_metadata_retrieval_failure(app, track_metadata_format, JSON_FILE)
