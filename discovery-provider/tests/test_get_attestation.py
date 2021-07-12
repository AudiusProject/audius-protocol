import pytest

from web3 import Web3
from web3.auto import w3
from eth_account.messages import encode_defunct

from src.queries.attestation import (
    AttestationError,
    get_attestation,
)
from src.utils.db_session import get_db
from src.utils.config import shared_config

from tests.test_get_challenges import setup_db


def test_get_attestation(app):
    with app.app_context():
        db = get_db()
        with db.scoped_session() as session:
            setup_db(session)

            # Tests:
            # - Happy path
            # - No user_challenge
            # - No disbursement
            # - Invalid oracle
            oracle_address: str = shared_config["discprov"]["default_oracle_address"]

            delegate_owner_wallet, signature = get_attestation(
                session,
                user_id=1,
                challenge_id="boolean_challenge_2",
                oracle_address=oracle_address,
                specifier="1",
            )

            # Test happy path

            # confirm the attestation is what we think it should be
            config_owner_wallet = shared_config["delegate"]["owner_wallet"]
            # Ensure we returned the correct owner wallet
            assert delegate_owner_wallet == config_owner_wallet
            # Ensure we can derive the owner wallet from the signed stringified attestation
            attestation_str = f"0xFakeWallet_5_boolean_challenge_2::1_{oracle_address}"
            attest_hex = Web3.keccak(text=attestation_str).hex()
            encoded = encode_defunct(hexstr=attest_hex)
            recovered_pubkey = w3.eth.account.recover_message(
                encoded, signature=signature
            )
            assert recovered_pubkey == config_owner_wallet

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

            # Test with bad bot oracle
            with pytest.raises(AttestationError):
                get_attestation(
                    session,
                    user_id=1,
                    challenge_id="boolean_challenge_2",
                    oracle_address="wrong_oracle_address",
                    specifier="1",
                )
