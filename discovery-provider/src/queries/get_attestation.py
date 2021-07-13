from typing import List, Tuple

from web3 import Web3
from web3.auto import w3
from eth_account.messages import encode_defunct

from sqlalchemy.orm.session import Session
from sqlalchemy.sql.elements import and_
from src.models.models import (
    Challenge,
    ChallengeDisbursement,
    User,
    UserChallenge,
)
from src.utils.config import shared_config


class Attestation:
    """Represents DN attesting to a user completing a given challenge"""

    def __init__(
        self,
        *,
        amount: str,
        oracle_address: str,
        user_address: str,
        challenge_id: str,
        challenge_specifier: str,
    ):
        self.amount = amount
        self.oracle_address = oracle_address
        self.challenge_id = challenge_id
        self.user_address = user_address
        self.challenge_specifier = challenge_specifier

    def __repr__(self):
        # Format:
        # recipient + "_" + amount + "_" + ID (challengeId + specifier) + "_" + oracle_address
        return "_".join(
            [
                self.user_address,
                self.amount,
                self._get_combined_id(),
                self.oracle_address,
            ]
        )

    def _get_combined_id(self):
        return f"{self.challenge_id}::{self.challenge_specifier}"


# Define custom error strings
CHALLENGE_INCOMPLETE = "CHALLENGE_INCOMPLETE"
ALREADY_DISBURSED = "ALREADY_DISBURSED"
INVALID_ORACLE = "INVALID_ORACLE"
MISSING_CHALLENGES = "MISSING_CHALLENGES"
INVALID_INPUT = "INVALID_INPUT"


class AttestationError(Exception):
    pass


def is_valid_oracle(address: str):
    # TODO: flesh this out, refresh oracle addresses [AUD-729]
    default_oracle_address = shared_config["discprov"]["default_oracle_address"]
    return address == default_oracle_address


def sign_attestation(attestation_str: str, private_key: str):
    to_sign_hash = Web3.keccak(text=attestation_str).hex()
    encoded_to_sign = encode_defunct(hexstr=to_sign_hash)
    signed_message = w3.eth.account.sign_message(
        encoded_to_sign, private_key=private_key
    )
    return signed_message.signature.hex()


def get_attestation(
    session: Session,
    *,
    challenge_id: str,
    user_id: int,
    oracle_address: str,
    specifier: str,
):
    """
    Returns a owner_wallet, signed_attestation tuple,
    or throws an error explaining why the attestation was
    not able to be created."""
    if not user_id or not challenge_id or not oracle_address:
        raise AttestationError(INVALID_INPUT)

    # First, validate the oracle adddress
    if not is_valid_oracle(oracle_address):
        raise AttestationError(INVALID_ORACLE)

    challenges_and_disbursements: List[
        Tuple[UserChallenge, Challenge, ChallengeDisbursement]
    ] = (
        session.query(UserChallenge, Challenge, ChallengeDisbursement)
        .join(Challenge, Challenge.id == UserChallenge.challenge_id)
        # Need to do outerjoin because some challenges
        # may not have disbursements
        .outerjoin(
            ChallengeDisbursement,
            and_(
                ChallengeDisbursement.specifier == UserChallenge.specifier,
                ChallengeDisbursement.challenge_id == UserChallenge.challenge_id,
            ),
        )
        .filter(
            UserChallenge.user_id == user_id,
            UserChallenge.challenge_id == challenge_id,
            UserChallenge.specifier == specifier,
        )
    ).one_or_none()

    if not len(challenges_and_disbursements) == 1:
        raise AttestationError(MISSING_CHALLENGES)
    user_challenge, challenge, disbursement = (
        challenges_and_disbursements[0][0],
        challenges_and_disbursements[0][1],
        challenges_and_disbursements[0][2],
    )
    if not user_challenge.is_complete:
        raise AttestationError(CHALLENGE_INCOMPLETE)
    if disbursement:
        raise AttestationError(ALREADY_DISBURSED)

    # Get the users's eth address
    user_eth_address = (
        session.query(User.wallet)
        .filter(
            User.is_current == True,
            User.user_id == user_id,
        )
        .one_or_none()
    )
    if not user_eth_address:
        raise Exception("Unexpectedly missing eth_address")
    user_eth_address = str(user_eth_address[0])

    attestation = Attestation(
        amount=challenge.amount,
        oracle_address=oracle_address,
        user_address=user_eth_address,
        challenge_id=challenge.id,
        challenge_specifier=user_challenge.specifier,
    )

    signed_attestation: str = sign_attestation(
        repr(attestation), shared_config["delegate"]["private_key"]
    )
    return (shared_config["delegate"]["owner_wallet"], signed_attestation)
