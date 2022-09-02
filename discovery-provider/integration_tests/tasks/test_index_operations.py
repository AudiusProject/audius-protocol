import json
import secrets
from contextlib import contextmanager

import ipfshttpclient
import pytest
import src.utils.multihash
from chance import chance
from integration_tests.utils import toBytes
from src.models.indexing.block import Block
from src.models.tracks.track import Track
from src.models.users.user import User
from src.queries.get_skipped_transactions import get_indexing_error
from src.utils.helpers import remove_test_file
from src.utils.indexing_errors import IndexingError
from src.utils.redis_cache import set_json_cached_key
from src.utils.redis_connection import get_redis

INDEXING_ERROR_KEY = "indexing:error"

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
        toBytes(new_user_handle, 16),
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
        "description": "putin sucks",
        "is_unlisted": False,
        "field_visibility": "",
        "license": "",
        "isrc": "",
        "iswc": "",
        "cover_art_sizes": [],
        "tags": "unit test, tags",
        "genre": "treality",
        "mood": "wavy",
        "credits_splits": "random_string?",
        "create_date": str(chance.date()),
        "release_date": str(chance.date()),
        "file_type": "mp3",
        "track_segments": test_track_segments,
        "is_premium": False,
        "premium_conditions": None,
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

    return {
        "new_user_handle": new_user_handle,
        "new_user_id": user_id_from_event,
        "track_metadata": track_metadata,
    }


class MockResponse:
    def __init__(self, json, status):
        self._json = json
        self.status = status

    async def json(self, content_type):
        return self._json

    async def __aexit__(self, exc_type, exc, tb):
        pass

    async def __aenter__(self):
        return self


@pytest.fixture(autouse=True)
def cleanup():
    set_json_cached_key(redis, INDEXING_ERROR_KEY, None)  # clear indexing error

    yield
    remove_test_file(track_metadata_json_file)


def test_index_operations(celery_app, celery_app_contracts, mocker):
    """
    Confirm indexing of user operations results in expected state change
    """
    task = celery_app.celery.tasks["update_discovery_provider"]
    db = task.db
    web3 = celery_app_contracts["web3"]

    seed_data = seed_contract_data(task, celery_app_contracts, web3)
    new_user_handle = seed_data["new_user_handle"]
    new_user_id = seed_data["new_user_id"]

    mocker.patch(
        "src.utils.cid_metadata_client.CIDMetadataClient._get_gateway_endpoints",
        return_value=["https://test-content-node.audius.co"],
        autospec=True,
    )

    mock_response = MockResponse(seed_data["track_metadata"], 200)
    mocker.patch(
        "aiohttp.ClientSession.get",
        return_value=mock_response,
        autospec=True,
    )

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


def test_index_operations_metadata_fetch_error(
    celery_app, celery_app_contracts, mocker
):
    """
    Confirm indexer throws IndexingError when ipfs metadata fetch throws an error
    """
    task = celery_app.celery.tasks["update_discovery_provider"]
    db = task.db
    web3 = celery_app_contracts["web3"]

    # patch ipfs metadata event to raise an exception
    def fetch_metadata_stub(*_, should_fetch_from_replica_set):
        raise Exception("Broken fetch")

    mocker.patch(
        "src.utils.cid_metadata_client.CIDMetadataClient.fetch_metadata_from_gateway_endpoints",
        side_effect=fetch_metadata_stub,
    )

    seed_contract_data(task, celery_app_contracts, web3)

    current_block = None
    latest_block = None
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
    except IndexingError as error:
        error = get_indexing_error(redis)
        errored_block_in_db_results = (
            session.query(Block).filter_by(number=error["blocknumber"]).all()
        )  # should not exist
        errored_block_in_db = len(errored_block_in_db_results) != 0
        # when errored block is in db, it breaks the consensus mechanism
        # for discovery nodes staying in sync
        assert not errored_block_in_db
        assert error["message"] == "Broken fetch"
        assert error["count"] == 1


def test_index_operations_tx_receipts_fetch_error(
    celery_app, celery_app_contracts, mocker
):
    """
    Confirm indexer throws IndexingError when tx receipt fetch throws an error
    """
    task = celery_app.celery.tasks["update_discovery_provider"]
    db = task.db
    web3 = celery_app_contracts["web3"]

    # patch tx receipts fetch event to raise an exception
    def fetch_tx_receipts_stub(self, block):
        raise IndexingError(
            blocknumber=block.number,
            blockhash=web3.toHex(block.hash),
            txhash=None,
            type="tx",
            message="Broken tx receipt fetch",
        )

    mocker.patch(
        "src.tasks.index.fetch_tx_receipts",
        side_effect=fetch_tx_receipts_stub,
        autospec=True,
    )

    seed_contract_data(task, celery_app_contracts, web3)

    current_block = None
    latest_block = None
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
        errored_block_in_db_results = (
            session.query(Block).filter_by(number=error["blocknumber"]).all()
        )  # should not exist
        errored_block_in_db = len(errored_block_in_db_results) != 0
        # when errored block is in db, it breaks the consensus mechanism
        # for discovery nodes staying in sync
        assert not errored_block_in_db
        assert error["message"] == "Broken tx receipt fetch"
        assert error["count"] == 1


def test_index_operations_tx_parse_error(celery_app, celery_app_contracts, mocker):
    """
    Confirm indexer throws IndexingError when the parser throws an error
    """
    task = celery_app.celery.tasks["update_discovery_provider"]
    db = task.db
    web3 = celery_app_contracts["web3"]

    # patch parse track event to raise an exception
    def parse_track_event(*_):
        raise Exception("Broken parser")

    mocker.patch(
        "src.tasks.tracks.parse_track_event",
        side_effect=parse_track_event,
        autospec=True,
    )

    seed_data = seed_contract_data(task, celery_app_contracts, web3)
    mocker.patch(
        "src.utils.cid_metadata_client.CIDMetadataClient._get_gateway_endpoints",
        return_value=["https://test-content-node.audius.co"],
        autospec=True,
    )

    mock_response = MockResponse(seed_data["track_metadata"], 200)
    mocker.patch(
        "aiohttp.ClientSession.get",
        return_value=mock_response,
        autospec=True,
    )
    current_block = None
    latest_block = None
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
        errored_block_in_db_results = (
            session.query(Block).filter_by(number=error["blocknumber"]).all()
        )  # should not exist
        errored_block_in_db = len(errored_block_in_db_results) != 0
        # when errored block is in db, it breaks the consensus mechanism
        # for discovery nodes staying in sync
        assert not errored_block_in_db
        assert error["message"] == "Broken parser"
        assert error["count"] == 1


def test_index_operations_indexing_error_on_commit(
    celery_app, celery_app_contracts, monkeypatch, mocker
):
    """
    Confirm indexer throws IndexingError when db session "commit" throws an error
    """
    task = celery_app.celery.tasks["update_discovery_provider"]
    db = task.db
    web3 = celery_app_contracts["web3"]

    seed_data = seed_contract_data(task, celery_app_contracts, web3)
    mocker.patch(
        "src.utils.cid_metadata_client.CIDMetadataClient._get_gateway_endpoints",
        return_value=["https://test-content-node.audius.co"],
        autospec=True,
    )

    mock_response = MockResponse(seed_data["track_metadata"], 200)
    mocker.patch(
        "aiohttp.ClientSession.get",
        return_value=mock_response,
        autospec=True,
    )

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


def test_index_operations_skip_block(celery_app, celery_app_contracts, mocker):
    """
    Confirm indexer skips block when session commit fails
    """
    task = celery_app.celery.tasks["update_discovery_provider"]
    db = task.db
    web3 = celery_app_contracts["web3"]

    seed_data = seed_contract_data(task, celery_app_contracts, web3)
    mocker.patch(
        "src.utils.cid_metadata_client.CIDMetadataClient._get_gateway_endpoints",
        return_value=["https://test-content-node.audius.co"],
        autospec=True,
    )

    mock_response = MockResponse(seed_data["track_metadata"], 200)
    mocker.patch(
        "aiohttp.ClientSession.get",
        return_value=mock_response,
        autospec=True,
    )

    # patch get_tx_hash_to_skip to raise an exception
    class MockSkipOnlyOneBlock:
        skipped = False
        skipped_block_number = None

        def get_tx_hash_to_skip_stub(self, session, redis):
            if not self.skipped:
                self.skipped_block_number = (
                    session.query(Block).filter_by(is_current=True).first().number
                )
                self.skipped = True
                return "commit"
            else:
                return None

    skip_block_helper = MockSkipOnlyOneBlock()

    mocker.patch(
        "src.tasks.index.get_tx_hash_to_skip",
        side_effect=skip_block_helper.get_tx_hash_to_skip_stub,
        autospec=True,
    )

    seed_contract_data(task, celery_app_contracts, web3)

    current_block = None
    latest_block = None
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
        skipped_block_was_added = (
            len(
                session.query(Block)
                .filter_by(number=skip_block_helper.skipped_block_number)
                .all()
            )
            == 1
        )
        assert skipped_block_was_added
