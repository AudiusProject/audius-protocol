import json

from sqlalchemy import text
from web3 import Web3
from web3.datastructures import AttributeDict

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.models.users.email import EmailAccess, EncryptedEmail
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import Action, EntityType
from src.utils.db_session import get_db


def ensure_email_access_table_setup(session):
    """Ensure the email_access table has all required columns"""
    # Add is_initial column if it doesn't exist
    session.execute(
        text(
            """
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'email_access' 
                        AND column_name = 'is_initial') THEN
                ALTER TABLE email_access ADD COLUMN is_initial BOOLEAN NOT NULL DEFAULT FALSE;
            END IF;
        END $$;
    """
        )
    )
    session.commit()


def test_index_valid_email(app, mocker):
    """Test indexing valid email operations"""
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, None)

        # Ensure table setup
        with db.scoped_session() as session:
            ensure_email_access_table_setup(session)

        # Updated test data to match new schema
        valid_email_data = {
            "email_owner_user_id": 1,  # Changed from primary_user_id
            "encrypted_email": "encrypted_email_content",
            "access_grants": [  # New format for access grants
                {
                    "receiving_user_id": 2,
                    "grantor_user_id": 1,  # The owner is granting access
                    "encrypted_key": "delegated_key",
                }
            ],
        }

        tx_receipts = {
            "CreateEmailTx": [
                {
                    "args": AttributeDict(
                        {
                            "_entityId": 0,
                            "_entityType": EntityType.ENCRYPTED_EMAIL,
                            "_userId": valid_email_data[
                                "email_owner_user_id"
                            ],  # Updated to use email_owner_user_id
                            "_action": Action.ADD_EMAIL,
                            "_metadata": json.dumps(
                                {"cid": "", "data": valid_email_data}
                            ),
                            "_signer": "user1wallet",
                        }
                    )
                }
            ],
        }

        entity_manager_txs = [
            AttributeDict(
                {"transactionHash": update_task.web3.to_bytes(text=tx_receipt)}
            )
            for tx_receipt in tx_receipts
        ]

        def get_events_side_effect(_, tx_receipt):
            return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

        mocker.patch(
            "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
            side_effect=get_events_side_effect,
            autospec=True,
        )

        entities = {
            "users": [
                {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
                {"user_id": 2, "handle": "user-2", "wallet": "user2wallet"},
                {"user_id": 3, "handle": "user-3", "wallet": "user3wallet"},
            ]
        }

        populate_mock_db(db, entities)

        with db.scoped_session() as session:
            # Index transactions
            entity_manager_update(
                update_task,
                session,
                entity_manager_txs,
                block_number=1,
                block_timestamp=1000000000,
                block_hash=hex(0),
            )

            # Validate db records after create
            encrypted_emails = session.query(EncryptedEmail).all()
            assert len(encrypted_emails) == 1
            email = encrypted_emails[0]
            assert email.email_owner_user_id == valid_email_data["email_owner_user_id"]
            assert email.encrypted_email == "encrypted_email_content"

            # Validate access keys
            access_keys = session.query(EmailAccess).all()
            assert len(access_keys) == 1
            access_key = access_keys[0]
            assert (
                access_key.email_owner_user_id
                == valid_email_data["email_owner_user_id"]
            )
            assert (
                access_key.receiving_user_id
                == valid_email_data["access_grants"][0]["receiving_user_id"]
            )
            assert (
                access_key.grantor_user_id
                == valid_email_data["access_grants"][0]["grantor_user_id"]
            )
            assert (
                access_key.encrypted_key
                == valid_email_data["access_grants"][0]["encrypted_key"]
            )


def test_index_invalid_email(app, mocker):
    """Test indexing invalid email operations"""
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, None)

        # Ensure table setup
        with db.scoped_session() as session:
            ensure_email_access_table_setup(session)

        # Updated invalid test data - missing required fields
        invalid_email_data = {
            "email_owner_user_id": 999,
            # Missing encrypted_email and access_grants fields
        }

        tx_receipts = {
            "CreateEmailTx": [
                {
                    "args": AttributeDict(
                        {
                            "_entityId": 0,
                            "_entityType": EntityType.ENCRYPTED_EMAIL,
                            "_userId": invalid_email_data["email_owner_user_id"],
                            "_action": Action.ADD_EMAIL,
                            "_metadata": json.dumps(
                                {"cid": "", "data": invalid_email_data}
                            ),
                            "_signer": "any_wallet",
                        }
                    )
                }
            ]
        }

        entity_manager_txs = [
            AttributeDict(
                {"transactionHash": update_task.web3.to_bytes(text=tx_receipt)}
            )
            for tx_receipt in tx_receipts
        ]

        def get_events_side_effect(_, tx_receipt):
            return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

        mocker.patch(
            "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
            side_effect=get_events_side_effect,
            autospec=True,
        )

        entities = {
            "users": [
                {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
                {"user_id": 2, "handle": "user-2", "wallet": "user2wallet"},
            ]
        }

        populate_mock_db(db, entities)

        with db.scoped_session() as session:
            # Index transactions
            entity_manager_update(
                update_task,
                session,
                entity_manager_txs,
                block_number=1,
                block_timestamp=1000000000,
                block_hash=hex(0),
            )

            # Validate that no records were created for invalid data
            encrypted_emails = session.query(EncryptedEmail).all()
            assert len(encrypted_emails) == 0

            # Validate no access keys were created
            access_keys = session.query(EmailAccess).all()
            assert len(access_keys) == 0
