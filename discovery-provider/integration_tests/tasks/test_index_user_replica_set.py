from datetime import datetime

from integration_tests.challenges.index_helpers import (
    AttrDict,
    CIDMetadataClient,
    UpdateTask,
)
from src.challenges.challenge_event_bus import setup_challenge_bus
from src.models.indexing.block import Block
from src.models.indexing.skipped_transaction import (
    SkippedTransaction,
    SkippedTransactionLevel,
)
from src.models.indexing.ursm_content_node import UrsmContentNode
from src.models.users.user import User
from src.tasks.user_replica_set import user_replica_set_state_update
from src.utils.db_session import get_db
from web3 import Web3

block_hash = b"0x8f19da326900d171642af08e6770eedd83509c6c44f6855c98e6a752844e2521"


def test_user_replica_set_indexing_skip_tx(app, mocker):
    """Tests that URSM indexing skips cursed txs without throwing an error and are able to process other tx in block"""
    with app.app_context():
        db = get_db()
        cid_metadata_client = CIDMetadataClient({})
        web3 = Web3()
        challenge_event_bus = setup_challenge_bus()
        update_task = UpdateTask(cid_metadata_client, web3, challenge_event_bus)

    class TestUserReplicaSetTransaction:
        pass

    blessed_user_tx_hash = (
        "0x34004dfaf5bb7cf9998eaf387b877d72d198c6508608e309df3f89e57def4db3"
    )
    blessed_user_tx = TestUserReplicaSetTransaction()
    blessed_user_tx.transactionHash = update_task.web3.toBytes(
        hexstr=blessed_user_tx_hash
    )
    cursed_user_tx_hash = (
        "0x5fe51d735309d3044ae30055ad29101018a1a399066f6c53ea23800225e3a3be"
    )
    cursed_user_tx = TestUserReplicaSetTransaction()
    cursed_user_tx.transactionHash = update_task.web3.toBytes(
        hexstr=cursed_user_tx_hash
    )
    blessed_cnode_tx_hash = (
        "0x42c66d0542383f06e22ef6a235ddba238050d85562bcbd18667c9711c1daee72"
    )
    blessed_cnode_tx = TestUserReplicaSetTransaction()
    blessed_cnode_tx.transactionHash = update_task.web3.toBytes(
        hexstr=blessed_cnode_tx_hash
    )
    cursed_cnode_tx_hash = (
        "0xa022761e229302abc2490f8bdc7ec0e642916b0f5cbc2908ccd49498243c1806"
    )
    cursed_cnode_tx = TestUserReplicaSetTransaction()
    cursed_cnode_tx.transactionHash = update_task.web3.toBytes(
        hexstr=cursed_cnode_tx_hash
    )
    test_block_number = 25278765
    test_block_timestamp = 1
    test_block_hash = update_task.web3.toHex(block_hash)
    test_user_replica_set_mgr_txs = [
        cursed_user_tx,
        blessed_user_tx,
        cursed_cnode_tx,
        blessed_cnode_tx,
    ]
    test_timestamp = datetime.utcfromtimestamp(test_block_timestamp)
    test_wallet = "0x0birbchickemcatlet"
    blessed_user_record = User(
        blockhash=test_block_hash,
        blocknumber=test_block_number,
        txhash=blessed_user_tx_hash,
        user_id=1,
        name="tobey maguire",
        is_current=True,
        updated_at=test_timestamp,
        created_at=test_timestamp,
    )
    cursed_user_record = User(
        blockhash=test_block_hash,
        blocknumber=test_block_number,
        txhash=cursed_user_tx_hash,
        user_id=2,
        name="birb",
        is_current=None,
        updated_at=test_timestamp,
        created_at=None,
    )
    blessed_content_node_record = UrsmContentNode(
        blockhash=test_block_hash,
        blocknumber=test_block_number,
        txhash=blessed_cnode_tx_hash,
        is_current=True,
        cnode_sp_id=1,
        delegate_owner_wallet=test_wallet,
        owner_wallet=test_wallet,
        created_at=test_timestamp,
    )
    cursed_content_node_record = UrsmContentNode(
        blockhash=test_block_hash,
        blocknumber=test_block_number,
        txhash=cursed_cnode_tx_hash,
        is_current=None,
        cnode_sp_id=2,
        delegate_owner_wallet=test_wallet,
        created_at=None,
    )

    mocker.patch(
        "src.tasks.user_replica_set.lookup_user_record",
        side_effect=[cursed_user_record, blessed_user_record],
        autospec=True,
    )
    mocker.patch(
        "src.tasks.user_replica_set.lookup_ursm_cnode",
        side_effect=[cursed_content_node_record, blessed_content_node_record],
        autospec=True,
    )
    mocker.patch(
        "src.tasks.user_replica_set.get_endpoint_string_from_sp_ids",
        return_value="http://localhost:4001,http://localhost:4002,",
        autospec=True,
    )
    mocker.patch(
        "src.tasks.user_replica_set.get_ursm_cnode_endpoint",
        return_value="http://localhost:4001,http://localhost:4002,",
        autospec=True,
    )
    mocker.patch(
        # because we do not have the real contract set up in the test
        # we mock the return value of this fn w events parsed from an imaginary tx
        "src.tasks.user_replica_set.get_user_replica_set_mgr_tx",
        side_effect=[
            [
                {
                    "args": AttrDict(
                        {
                            "_userId": cursed_user_record.user_id,
                            "_primaryId": 1,
                            "_secondaryIds": [2, 3, 4],
                            "_signer": "mobey taguire",
                        }
                    )
                },
            ],  # first tx receipt - update replica set
            [],  # first tx receipt - update content node
            [
                {
                    "args": AttrDict(
                        {
                            "_userId": blessed_user_record.user_id,
                            "_primaryId": 1,
                            "_secondaryIds": [2, 3, 4],
                            "_signer": "dirsten kunst",
                        }
                    )
                },
            ],  # second tx receipt - update replica set
            [],  # second tx receipt - update content node
            [],  # third tx receipt - update replica set
            [
                {
                    "args": AttrDict(
                        {
                            "_cnodeSpId": cursed_content_node_record.cnode_sp_id,
                            "_cnodeDelegateOwnerWallet": test_wallet,
                            "_cnodeOwnerWallet": test_wallet,
                            "_proposer1DelegateOwnerWallet": test_wallet,
                            "_proposer2DelegateOwnerWallet": test_wallet,
                            "_proposer3DelegateOwnerWallet": test_wallet,
                            "_proposerSpIds": [1, 2],
                        }
                    )
                },
            ],  # third tx receipt - update content node
            [],  # fourth tx receipt - update replica set
            [
                {
                    "args": AttrDict(
                        {
                            "_cnodeSpId": blessed_content_node_record.cnode_sp_id,
                            "_cnodeDelegateOwnerWallet": test_wallet,
                            "_cnodeOwnerWallet": test_wallet,
                            "_proposer1DelegateOwnerWallet": test_wallet,
                            "_proposer2DelegateOwnerWallet": test_wallet,
                            "_proposer3DelegateOwnerWallet": test_wallet,
                            "_proposerSpIds": [1, 2],
                        }
                    )
                },
            ],  # fourth tx receipt - update content node
        ],
        autospec=True,
    )

    test_ipfs_metadata = {}

    with db.scoped_session() as session:
        try:
            current_block = Block(
                blockhash=test_block_hash,
                parenthash=test_block_hash,
                number=test_block_number,
                is_current=True,
            )
            session.add(current_block)
            (total_changes, updated_user_ids_set) = user_replica_set_state_update(
                update_task,
                update_task,
                session,
                test_user_replica_set_mgr_txs,
                test_block_number,
                test_block_timestamp,
                block_hash,
                test_ipfs_metadata,
            )
            assert len(updated_user_ids_set) == 1
            assert list(updated_user_ids_set)[0] == blessed_user_record.user_id
            assert total_changes == 2
            assert (
                session.query(SkippedTransaction)
                .filter(
                    SkippedTransaction.txhash == cursed_cnode_tx_hash,
                    SkippedTransaction.level == SkippedTransactionLevel.node,
                )
                .first()
            )
            assert (
                session.query(SkippedTransaction)
                .filter(
                    SkippedTransaction.txhash == cursed_user_tx_hash,
                    SkippedTransaction.level == SkippedTransactionLevel.node,
                )
                .first()
            )
            assert (
                session.query(User)
                .filter(User.user_id == blessed_user_record.user_id)
                .first()
            )
            assert (
                session.query(User)
                .filter(User.user_id == cursed_user_record.user_id)
                .first()
            ) == None
            assert (
                session.query(UrsmContentNode)
                .filter(
                    UrsmContentNode.cnode_sp_id
                    == blessed_content_node_record.cnode_sp_id
                )
                .first()
            )
            assert (
                session.query(UrsmContentNode)
                .filter(
                    UrsmContentNode.cnode_sp_id
                    == cursed_content_node_record.cnode_sp_id
                )
                .first()
            ) == None
        except Exception:
            assert False
