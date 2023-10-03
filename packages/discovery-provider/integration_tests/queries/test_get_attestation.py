from unittest.mock import patch

import pytest
from eth_keys import keys
from eth_utils.conversions import to_bytes
from hexbytes import HexBytes
from solders.pubkey import Pubkey
from web3 import Web3

from integration_tests.queries.test_get_challenges import setup_db
from src.queries.get_attestation import (
    ADD_SENDER_MESSAGE_PREFIX,
    REWARDS_MANAGER_ACCOUNT,
    Attestation,
    AttestationError,
    get_attestation,
    get_create_sender_attestation,
)
from src.tasks.index_oracles import oracle_addresses_key
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

REDIS_URL = shared_config["redis"]["url"]
redis_handle = get_redis()


def test_get_attestation(app):
    with app.app_context():
        db = get_db()
        with db.scoped_session() as session:
            setup_db(session)

            # Tests:
            # - Happy path
            # - No user_challenge
            # - Challenge not finished
            # - No disbursement
            # - Invalid oracle
            oracle_address = "0x32a10e91820fd10366AC363eD0DEa40B2e598D22"
            redis_handle.set(oracle_addresses_key, oracle_address)

            delegate_owner_wallet, signature = get_attestation(
                session,
                user_id=1,
                challenge_id="boolean_challenge_2",
                oracle_address=oracle_address,
                specifier="1",
            )

            attestation = Attestation(
                amount="5",
                oracle_address=oracle_address,
                user_address="0x38C68fF3926bf4E68289672F75ee1543117dD9B3",
                challenge_id="boolean_challenge_2",
                challenge_specifier="1",
            )

            # Test happy path

            # confirm the attestation is what we think it should be
            config_owner_wallet = shared_config["delegate"]["owner_wallet"]
            config_private_key = shared_config["delegate"]["private_key"]

            # Ensure we returned the correct owner wallet
            assert delegate_owner_wallet == config_owner_wallet

            # Ensure we can derive the owner wallet from the signed stringified attestation
            attestation_bytes = attestation.get_attestation_bytes()
            to_sign_hash = Web3.keccak(attestation_bytes)
            private_key = keys.PrivateKey(HexBytes(config_private_key))
            public_key = keys.PublicKey.from_private(private_key)
            signture_bytes = to_bytes(hexstr=signature)
            msg_signature = keys.Signature(signature_bytes=signture_bytes, vrs=None)

            recovered_pubkey = public_key.recover_from_msg_hash(
                message_hash=to_sign_hash, signature=msg_signature
            )

            assert (
                Web3.to_checksum_address(recovered_pubkey.to_address())
                == config_owner_wallet
            )

            # Test no matching user challenge
            with pytest.raises(AttestationError):
                get_attestation(
                    session,
                    user_id=1,
                    challenge_id="boolean_challenge_2",
                    oracle_address=oracle_address,
                    specifier="xyz",
                )

            # Test challenge not finished
            with pytest.raises(AttestationError):
                get_attestation(
                    session,
                    user_id=1,
                    challenge_id="boolean_challenge_3",
                    oracle_address=oracle_address,
                    specifier="1",
                )

            # Test challenge already disbursed
            with pytest.raises(AttestationError):
                get_attestation(
                    session,
                    user_id=1,
                    challenge_id="boolean_challenge_1",
                    oracle_address=oracle_address,
                    specifier="1",
                )

            # Test with bad AAO
            with pytest.raises(AttestationError):
                get_attestation(
                    session,
                    user_id=1,
                    challenge_id="boolean_challenge_2",
                    oracle_address="wrong_oracle_address",
                    specifier="1",
                )


@pytest.fixture
def patch_get_all_other_nodes():
    with patch(
        "src.queries.get_attestation.get_all_other_discovery_nodes_wallets_cached",
        return_value=["0x94e140D27F3d5EE9EcA0109A71CcBa0109964DCa"],
    ):
        yield


def test_get_create_sender_attestation(app, patch_get_all_other_nodes):
    new_sender_address = "0x94e140D27F3d5EE9EcA0109A71CcBa0109964DCa"
    owner_wallet, sender_attestation = get_create_sender_attestation(new_sender_address)

    # confirm the attestation is what we think it should be
    config_owner_wallet = shared_config["delegate"]["owner_wallet"]
    config_private_key = shared_config["delegate"]["private_key"]

    # Ensure we returned the correct owner wallet
    assert owner_wallet == config_owner_wallet

    # Ensure we can derive the owner wallet from the signed stringified attestation
    items = [
        to_bytes(text=ADD_SENDER_MESSAGE_PREFIX),
        bytes(Pubkey.from_string(REWARDS_MANAGER_ACCOUNT)),
        to_bytes(hexstr=new_sender_address),
    ]
    attestation_bytes = to_bytes(text="").join(items)
    to_sign_hash = Web3.keccak(attestation_bytes)
    private_key = keys.PrivateKey(HexBytes(config_private_key))
    public_key = keys.PublicKey.from_private(private_key)
    signture_bytes = to_bytes(hexstr=sender_attestation)
    msg_signature = keys.Signature(signature_bytes=signture_bytes, vrs=None)

    recovered_pubkey = public_key.recover_from_msg_hash(
        message_hash=to_sign_hash, signature=msg_signature
    )

    assert (
        Web3.to_checksum_address(recovered_pubkey.to_address()) == config_owner_wallet
    )


def test_get_create_sender_attestation_not_registered(app, patch_get_all_other_nodes):
    new_sender_address = "0x04e140D27F3d5EE9EcA0109A71CcBa0109964DCa"
    with pytest.raises(
        Exception,
        match=r"Expected 0x04e140D27F3d5EE9EcA0109A71CcBa0109964DCa to be registered on chain",
    ):
        get_create_sender_attestation(new_sender_address)
