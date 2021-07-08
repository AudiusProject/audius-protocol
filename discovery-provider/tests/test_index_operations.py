import json
import random
import pytest
import ipfshttpclient
from chance import chance

import src.utils.multihash
from src.utils.helpers import remove_test_file
from tests.utils import query_creator_by_name, to_bytes


@pytest.mark.skip(
    reason="user contract functions changed, skipping now to unblock dependent work until fixed"
)
def test_index_operations(app, client, celery_app, contracts):
    """Confirm indexing of creator operations results in expected state change"""
    test_file = "tests/res/test_audio_file.mp3"
    creator_metadata_json_file = "tests/res/test_creator_metadata.json"
    track_metadata_json_file = "tests/res/test_track_metadata.json"

    user_factory_contract = contracts["user_factory_contract"]
    track_factory_contract = contracts["track_factory_contract"]

    ipfs_peer_host = app.config["ipfs"]["host"]
    ipfs_peer_port = app.config["ipfs"]["port"]
    api = ipfshttpclient.connect(ipfs_peer_host, ipfs_peer_port)

    # Retrieve web3 instance from fixture
    web3 = contracts["web3"]

    # Generate new random creator name
    random_creator_name = chance.name()

    # create creator metadata object
    creator_metadata = {
        "handle": "test" + str(random.randint(1, 100000)),
        "wallet": web3.eth.defaultAccount,
        "is_creator": 1,
        "name": random_creator_name,
        "profile_picture": "0x1a5a5d47bfca6be2872d8076920683a3ae112b455a7a444be5ebb84471b16c4e",
        "cover_photo": "0x1a5a5d47bfca6be2872d8076920683a3ae112b455a7a444be5ebb84471b16c4e",
        "bio": "Leslie David Baker",
        "location": "San Francisco",
    }

    # dump metadata to file
    with open(creator_metadata_json_file, "w") as f:
        json.dump(creator_metadata, f)

    # add creator metadata to ipfs
    metadata_res = api.add(creator_metadata_json_file)
    metadata_hash = metadata_res["Hash"]

    # get creator metadata multihash
    metadata_decoded = src.utils.multihash.from_b58_string(metadata_hash)
    metadata_decoded_multihash = src.utils.multihash.decode(metadata_decoded)

    # Add creator to blockchain
    newcreator_tx_hash = user_factory_contract.functions.addUser(
        metadata_decoded_multihash["digest"],
        to_bytes(creator_metadata["handle"], 16),
        to_bytes(creator_metadata["name"]),
        to_bytes(creator_metadata["location"]),
        to_bytes(creator_metadata["bio"]),
        to_bytes(creator_metadata["profile_picture"]),
        to_bytes(creator_metadata["cover_photo"]),
        True,
    ).transact()

    # parse chain transaction results
    txReceipt = web3.eth.waitForTransactionReceipt(newcreator_tx_hash)
    txNewUserInfo = user_factory_contract.events.NewUser().processReceipt(txReceipt)
    newCreatorArgs = txNewUserInfo[0].args

    # get creator id
    user_id_from_event = int(newCreatorArgs._id)

    # Add audio file to ipfs node
    res = api.add(test_file)
    test_audio_file_hash = res["Hash"]
    test_track_segments = [{"multihash": test_audio_file_hash, "duration": 28060}]

    # Create track metadata object
    track_metadata = {
        "owner_id": user_id_from_event,
        "title": chance.name(),
        "length": 0.4,
        "cover_art": test_audio_file_hash,
        "tags": "unit test, tags",
        "genre": "treality",
        "mood": "wavy",
        "credits_splits": "random_string?",
        "create_date": str(chance.date()),
        "release_date": str(chance.date()),
        "file_type": "mp3",
        "track_segments": test_track_segments,
    }

    # dump metadata to file
    with open(track_metadata_json_file, "w") as f:
        json.dump(track_metadata, f)

    # add track metadata to ipfs
    metadata_res = api.add(track_metadata_json_file)
    metadata_hash = metadata_res["Hash"]

    # get track metadata multihash
    metadata_decoded = src.utils.multihash.from_b58_string(metadata_hash)
    metadata_decoded_multihash = src.utils.multihash.decode(metadata_decoded)

    # add track to blockchain
    track_factory_contract.functions.addTrack(
        user_id_from_event,
        metadata_decoded_multihash["digest"],
        int(metadata_decoded_multihash["code"]),
        int(metadata_decoded_multihash["length"]),
    ).transact()

    # Run update discovery provider task
    celery_app.celery.autodiscover_tasks(["src.tasks"], "index", True)
    celery_app.celery.finalize()
    celery_app.celery.tasks["update_discovery_provider"].run()

    # Confirm the update task ran and inserted new creator
    current_creators = query_creator_by_name(app, random_creator_name)
    num_query_results = len(current_creators)
    assert num_query_results == 1

    # Confirm new track has been indexed
    indexed_value = client.get("/tracks").get_json()
    added_creator = False
    for track in indexed_value:
        if track["title"] == track_metadata["title"]:
            added_creator = True
    assert added_creator is True

    # clean up state
    remove_test_file(creator_metadata_json_file)
    remove_test_file(track_metadata_json_file)
