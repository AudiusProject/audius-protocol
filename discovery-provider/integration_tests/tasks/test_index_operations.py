from contextlib import contextmanager
import json
import secrets
import pytest
import ipfshttpclient
from chance import chance
from integration_tests.utils import to_bytes
from src.models.models import Block, Track, User
from src.queries.get_skipped_transactions import get_indexing_error
import src.utils.multihash
from src.utils.helpers import remove_test_file
from src.utils.indexing_errors import IndexingError
from src.utils.redis_connection import get_redis

redis = get_redis()

test_file = "integration_tests/res/test_audio_file.mp3"
track_metadata_json_file = "integration_tests/res/test_track_metadata.json"


def seed_contract_data(task, contracts, web3):
    user_factory_contract = contracts["user_factory_contract"]
    track_factory_contract = contracts["track_factory_contract"]

    ipfs_peer_host = task.shared_config["ipfs"]["host"]
    ipfs_peer_port = task.shared_config["ipfs"]["port"]
    ipfs = ipfshttpclient.connect(f"/dns/{ipfs_peer_host}/tcp/{ipfs_peer_port}/http")

    # Retrieve web3 instance from fixture
    chain_id = web3.net.version

    # Give the user some randomness so repeat tests can succeed
    new_user_handle = "troybarnes" + secrets.token_hex(2)
    new_user_nonce = "0x" + secrets.token_hex(32)

    new_user_signature_data = {
        "types": {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"},
            ],
            "AddUserRequest": [
                {"name": "handle", "type": "bytes16"},
                {"name": "nonce", "type": "bytes32"},
            ],
        },
        "domain": {
            "name": "User Factory",
            "version": "1",
            "chainId": chain_id,
            "verifyingContract": user_factory_contract.address,
        },
        "primaryType": "AddUserRequest",
        "message": {"handle": new_user_handle, "nonce": new_user_nonce},
    }
    new_user_signature = web3.eth.signTypedData(
        web3.eth.defaultAccount, new_user_signature_data
    )

    # Add creator to blockchain
    new_user_tx_hash = user_factory_contract.functions.addUser(
        web3.eth.defaultAccount,
        to_bytes(new_user_handle, 16),
        new_user_nonce,
        new_user_signature,
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

    new_track_nonce = "0x" + secrets.token_hex(32)
    new_track_multihash_digest = "0x" + metadata_decoded_multihash["digest"].hex()
    new_track_multihash_hash_fn = int(metadata_decoded_multihash["code"])
    new_track_multihash_size = int(metadata_decoded_multihash["length"])

    new_track_signature_data = {
        "types": {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"},
            ],
            "AddTrackRequest": [
                {"name": "trackOwnerId", "type": "uint"},
                {"name": "multihashDigest", "type": "bytes32"},
                {"name": "multihashHashFn", "type": "uint8"},
                {"name": "multihashSize", "type": "uint8"},
                {"name": "nonce", "type": "bytes32"},
            ],
        },
        "domain": {
            "name": "Track Factory",
            "version": "1",
            "chainId": chain_id,
            "verifyingContract": track_factory_contract.address,
        },
        "primaryType": "AddTrackRequest",
        "message": {
            "trackOwnerId": user_id_from_event,
            "multihashDigest": new_track_multihash_digest,
            "multihashHashFn": new_track_multihash_hash_fn,
            "multihashSize": new_track_multihash_size,
            "nonce": new_track_nonce,
        },
    }

    new_track_signature = web3.eth.signTypedData(
        web3.eth.defaultAccount, new_track_signature_data
    )

    # add track to blockchain
    track_factory_contract.functions.addTrack(
        user_id_from_event,
        new_track_multihash_digest,
        new_track_multihash_hash_fn,
        new_track_multihash_size,
        new_track_nonce,
        new_track_signature,
    ).transact()

    return {"new_user_handle": new_user_handle, "new_user_id": user_id_from_event}


@pytest.fixture(autouse=True)
def cleanup():
    yield
    remove_test_file(track_metadata_json_file)


def test_index_operations(celery_app, celery_app_contracts):
    """
    Confirm indexing of user operations results in expected state change
    """
    task = celery_app.celery.tasks["update_discovery_provider"]
    db = task.db
    web3 = celery_app_contracts["web3"]

    seed_data = seed_contract_data(task, celery_app_contracts, web3)
    new_user_handle = seed_data["new_user_handle"]
    new_user_id = seed_data["new_user_id"]

    with db.scoped_session() as session:
        # Catch up the indexer
        current_block_query = session.query(Block).filter_by(is_current=True).all()
        current_block = (
            current_block_query[0].number if len(current_block_query) > 0 else 0
        )
        latest_block = web3.eth.getBlock("latest", True)
        while current_block < latest_block.number:
            # Process a bunch of blocks to make sure we covered everything
            task.run()
            current_block_query = session.query(Block).filter_by(is_current=True).all()
            current_block = (
                current_block_query[0].number if len(current_block_query) > 0 else 0
            )

        # Make sure the data we added is there
        users = session.query(User).filter(User.handle == new_user_handle).all()
        tracks = session.query(Track).filter(Track.owner_id == new_user_id).all()

        assert len(users) > 0
        assert len(tracks) > 0


def test_index_operations_indexing_error(celery_app, celery_app_contracts, monkeypatch):
    """
    Confirm indexer throws IndexingError when the parser throws an error
    """
    task = celery_app.celery.tasks["update_discovery_provider"]
    db = task.db
    web3 = celery_app_contracts["web3"]

    # Monkeypatch parse track event to raise an exception
    def parse_track_event(*_):
        raise Exception("Broken parser")

    monkeypatch.setattr(src.tasks.tracks, "parse_track_event", parse_track_event)

    seed_contract_data(task, celery_app_contracts, web3)

    try:
        with db.scoped_session() as session:
            # Catch up the indexer
            current_block_query = session.query(Block).filter_by(is_current=True).all()
            current_block = (
                current_block_query[0].number if len(current_block_query) > 0 else 0
            )
            latest_block = web3.eth.getBlock("latest", True)
            while current_block < latest_block.number:
                # Process a bunch of blocks to make sure we covered everything
                task.run()
                current_block_query = (
                    session.query(Block).filter_by(is_current=True).all()
                )
                current_block = (
                    current_block_query[0].number if len(current_block_query) > 0 else 0
                )
        assert False
    except IndexingError:
        error = get_indexing_error(redis)
        assert error["message"] == "Broken parser"
        assert error["count"] == 1


def test_index_operations_indexing_error_on_commit(
    celery_app, celery_app_contracts, monkeypatch
):
    """
    Confirm indexer throws IndexingError when db session "commit" throws an error
    """
    task = celery_app.celery.tasks["update_discovery_provider"]
    db = task.db
    web3 = celery_app_contracts["web3"]

    seed_contract_data(task, celery_app_contracts, web3)

    # Mock out the session manager so we can trick session.commit
    # into throwing when manually called
    @contextmanager
    def mock_scoped_session(db):
        session = db._session_factory()
        # Don't mock out the implicit commit
        # at the end of a `with db.scoped_session as session` context.
        implicit_commit = session.commit

        def _raise():
            raise Exception("Broken session.commit")

        session.commit = _raise
        try:
            yield session
            implicit_commit()
        except:
            session.rollback()
            raise
        finally:
            session.close()

    monkeypatch.setattr(
        src.utils.session_manager.SessionManager, "scoped_session", mock_scoped_session
    )

    try:
        with db.scoped_session() as session:
            # Catch up the indexer
            current_block_query = session.query(Block).filter_by(is_current=True).all()
            current_block = (
                current_block_query[0].number if len(current_block_query) > 0 else 0
            )
            latest_block = web3.eth.getBlock("latest", True)
            while current_block < latest_block.number:
                # Process a bunch of blocks to make sure we covered everything
                task.run()
                current_block_query = (
                    session.query(Block).filter_by(is_current=True).all()
                )
                current_block = (
                    current_block_query[0].number if len(current_block_query) > 0 else 0
                )
        assert False
    except IndexingError:
        error = get_indexing_error(redis)
        assert error["message"] == "Broken session.commit"
        assert error["txhash"] == "commit"
