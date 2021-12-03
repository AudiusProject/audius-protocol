import json
import secrets
import ipfshttpclient
from chance import chance
from src.models.models import Block, Track, User
from src.utils.db_session import get_db
import src.utils.multihash
from src.utils.helpers import remove_test_file
from tests.utils import to_bytes


def test_index_operations(app, celery_app, contracts):
    """Confirm indexing of creator operations results in expected state change"""
    with app.app_context():
        db = get_db()

    test_file = "tests/res/test_audio_file.mp3"
    track_metadata_json_file = "tests/res/test_track_metadata.json"

    user_factory_contract = contracts["user_factory_contract"]
    track_factory_contract = contracts["track_factory_contract"]

    ipfs_peer_host = app.config["ipfs"]["host"]
    ipfs_peer_port = app.config["ipfs"]["port"]
    ipfs = ipfshttpclient.connect(f"/dns/{ipfs_peer_host}/tcp/{ipfs_peer_port}/http")

    # Retrieve web3 instance from fixture
    web3 = contracts["web3"]
    chain_id = web3.net.version

    # Give the user some randomness so repeat tests can succeed
    new_user_handle = 'troybarnes' + secrets.token_hex(2)
    new_user_nonce = '0x' + secrets.token_hex(32)

    new_user_signature_data = {
        "types": {
            "EIP712Domain": [
                { "name": 'name', "type": 'string' },
                { "name": 'version', "type": 'string' },
                { "name": 'chainId', "type": 'uint256' },
                { "name": 'verifyingContract', "type": 'address' }
            ],
            "AddUserRequest": [
                { "name": 'handle', "type": 'bytes16' },
                { "name": 'nonce', "type": 'bytes32' }
            ]
        },
        "domain": {
            "name": "User Factory",
            "version": "1",
            "chainId": chain_id,
            "verifyingContract": user_factory_contract.address
        },
        "primaryType": "AddUserRequest",
        "message": {
            "handle": new_user_handle,
            "nonce": new_user_nonce
        }
    }
    new_user_signature = web3.eth.signTypedData(
        web3.eth.defaultAccount,
        new_user_signature_data
    )

    # Add creator to blockchain
    new_user_tx_hash = user_factory_contract.functions.addUser(
        web3.eth.defaultAccount,
        to_bytes(new_user_handle, 16),
        new_user_nonce,
        new_user_signature
    ).transact()

    # parse chain transaction results
    tx_receipt = web3.eth.waitForTransactionReceipt(new_user_tx_hash)
    tx_new_user_info = user_factory_contract.events.AddUser().processReceipt(tx_receipt)
    new_user_args = tx_new_user_info[0].args
    user_id_from_event = int(new_user_args._userId)

    # Add audio file to ipfs node
    res = ipfs.add(test_file)
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
    metadata_res = ipfs.add(track_metadata_json_file)
    metadata_hash = metadata_res["Hash"]

    # get track metadata multihash
    metadata_decoded = src.utils.multihash.from_b58_string(metadata_hash)
    metadata_decoded_multihash = src.utils.multihash.decode(metadata_decoded)
    print(metadata_decoded_multihash)

    new_track_nonce = '0x' + secrets.token_hex(32)
    new_track_multihash_digest = '0x' + metadata_decoded_multihash['digest'].hex()
    new_track_multihash_hash_fn = int(metadata_decoded_multihash['code'])
    new_track_multihash_size = int(metadata_decoded_multihash['length'])

    new_track_signature_data = {
        "types": {
            "EIP712Domain": [
                { "name": 'name', "type": 'string' },
                { "name": 'version', "type": 'string' },
                { "name": 'chainId', "type": 'uint256' },
                { "name": 'verifyingContract', "type": 'address' }
            ],
            "AddTrackRequest": [
                { "name": "trackOwnerId", "type": "uint" },
                { "name": "multihashDigest", "type": "bytes32" },
                { "name": "multihashHashFn", "type": "uint8" },
                { "name": "multihashSize", "type": "uint8" },
                { "name": "nonce", "type": "bytes32" }
            ]
        },
        "domain": {
            "name": "Track Factory",
            "version": "1",
            "chainId": chain_id,
            "verifyingContract": track_factory_contract.address
        },
        "primaryType": "AddTrackRequest",
        "message": {
            "trackOwnerId": user_id_from_event,
            "multihashDigest": new_track_multihash_digest,
            "multihashHashFn": new_track_multihash_hash_fn,
            "multihashSize": new_track_multihash_size,
            "nonce": new_track_nonce
        }
    }

    new_track_signature = web3.eth.signTypedData(
        web3.eth.defaultAccount,
        new_track_signature_data
    )

    # add track to blockchain
    track_factory_contract.functions.addTrack(
        user_id_from_event,
        new_track_multihash_digest,
        new_track_multihash_hash_fn,
        new_track_multihash_size,
        new_track_nonce,
        new_track_signature
    ).transact()

    # Run update discovery provider task
    celery_app.celery.autodiscover_tasks(["src.tasks"], "index", True)
    celery_app.celery.finalize()

    with db.scoped_session() as session:
        # Catch up the indexer
        current_block_query = session.query(Block).filter_by(is_current=True).all()
        current_block = current_block_query[0].number if len(current_block_query) > 0 else 0
        latest_block = web3.eth.getBlock("latest", True)
        while current_block < latest_block.number:
            # Process a bunch of blocks to make sure we covered everything
            celery_app.celery.tasks["update_discovery_provider"].run()
            current_block_query = session.query(Block).filter_by(is_current=True).all()
            current_block = current_block_query[0].number if len(current_block_query) > 0 else 0

        # Make sure the data we added is there
        users = (
            session.query(User)
            .filter(User.handle == new_user_handle)
            .all()
        )
        tracks = (
            session.query(Track)
            .filter(Track.owner_id == user_id_from_event)
            .all()
        )

        assert len(users) > 0
        assert len(tracks) > 0

    # clean up state
    remove_test_file(track_metadata_json_file)
