from src.queries.get_challenges import get_challenges_and_disbursements

from sqlalchemy.sql.elements import and_
from src.models.models import (
    Challenge,
    ChallengeDisbursement,
    User,
    UserBalance,
    UserChallenge,
)
from typing import NewType, TypedDict, List, Tuple
from src.utils.config import shared_config
from web3 import Web3
from web3.auto import w3
from eth_account.messages import encode_defunct

from sqlalchemy.orm.session import Session


class Attestation:
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

    def stringify(self):
        # Format:
        # recipient + "_" + amount + "_" + ID (challengeId + specifier) + "_" + bot_oracle
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


# Define custom errors
class ChallengeIncomplete(Exception):
    """Could not attest because challenge incomplete"""


class ChallengeAlreadyDisbursed(Exception):
    """Could not attest because already disbursed"""


class InvalidOracle(Exception):
    """Unexpected invalid oracle address"""


class GetAttestationArgs(TypedDict):
    challenge_id: str
    user_id: int
    session: Session
    oracle_address: str


def is_valid_oracle(address: str):
    # TODO: flesh this out
    return True


def sign_attestation(attestation_str: str, private_key: str):
    to_sign_hash = Web3.keccak(text=attestation_str).hex()
    encoded_to_sign = encode_defunct(hex_str=to_sign_hash)
    signed_message = w3.eth.account.sign_message(
        encoded_to_sign, private_key=private_key
    )
    return signed_message.signature.hex()


def get_attestation(args: GetAttestationArgs):
    # Algorithm:
    #   - Check that the challenge is finished, and not yet disbursed
    session, user_id, challenge_id, oracle_address = (
        args["session"],
        args["user_id"],
        args["challenge_id"],
        args["oracle_address"],
    )
    if not user_id or not challenge_id or not oracle_address:
        raise Exception("Missing args")

    # First, validate the oracle adddress
    if not is_valid_oracle(oracle_address):
        raise InvalidOracle

    challenges_and_disbursements: List[
        Tuple[UserChallenge, Challenge, ChallengeDisbursement]
    ] = (
        session.query(UserChallenge, Challenge, ChallengeDisbursement)
        .join(Challenge, Challenge.challenge_id == UserChallenge.challenge_id)
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
            UserChallenge.user_id == user_id, UserChallenge.challenge_id == challenge_id
        )
    ).all()

    if not len(challenges_and_disbursements) == 1:
        raise Exception("Unexpected challenges length")
    user_challenge, challenge, disbursement = (
        challenges_and_disbursements[0][0],
        challenges_and_disbursements[0][1],
        challenges_and_disbursements[0][2],
    )
    if not user_challenge.is_complete:
        raise ChallengeIncomplete()
    if disbursement:
        raise ChallengeAlreadyDisbursed

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
        raise Exception("Missing eth address")
    user_eth_address = str(user_eth_address[0])

    # TOOD: where does oracle address come from??
    attestation = Attestation(
        amount=challenge.amount,
        oracle_address=oracle_address,
        user_address=user_eth_address,
        challenge_id=challenge.id,
        challenge_specifier=user_challenge.specifier,
    )

    signed_attestation: str = sign_attestation(
        attestation.stringify(), shared_config["delegate"]["private_key"]
    )
    return (shared_config["delegate"]["owner_wallet"], signed_attestation)
