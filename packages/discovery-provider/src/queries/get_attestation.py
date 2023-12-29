from datetime import datetime
from typing import Tuple

import pytz
from eth_keys import keys
from eth_utils.conversions import to_bytes
from hexbytes import HexBytes
from solders.pubkey import Pubkey
from sqlalchemy.orm.session import Session
from sqlalchemy.sql.elements import and_
from web3 import Web3

from src.models.rewards.challenge import Challenge
from src.models.rewards.challenge_disbursement import ChallengeDisbursement
from src.models.rewards.user_challenge import UserChallenge
from src.models.users.user import User
from src.queries.get_disbursed_challenges_amount import (
    get_disbursed_challenges_amount,
    get_weekly_pool_window_start,
)
from src.solana.constants import WAUDIO_DECIMALS
from src.tasks.index_oracles import (
    get_oracle_addresses_from_chain,
    oracle_addresses_key,
)
from src.utils.config import shared_config
from src.utils.get_all_other_nodes import get_all_discovery_nodes_cached
from src.utils.redis_connection import get_redis

REWARDS_MANAGER_ACCOUNT = shared_config["solana"]["rewards_manager_account"]
REWARDS_MANAGER_ACCOUNT_PUBLIC_KEY = None
if REWARDS_MANAGER_ACCOUNT:
    REWARDS_MANAGER_ACCOUNT_PUBLIC_KEY = Pubkey.from_string(REWARDS_MANAGER_ACCOUNT)
DATETIME_FORMAT_STRING = "%Y-%m-%d %H:%M:%S.%f+00"


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
        return f"{self.challenge_id}:{self.challenge_specifier}"

    def _get_encoded_amount(self):
        amt = int(self.amount) * 10**WAUDIO_DECIMALS
        return amt.to_bytes(8, byteorder="little")

    def get_attestation_bytes(self):
        user_bytes = to_bytes(hexstr=self.user_address)
        oracle_bytes = to_bytes(hexstr=self.oracle_address)
        combined_id_bytes = to_bytes(text=self._get_combined_id())
        amount_bytes = self._get_encoded_amount()
        items = [user_bytes, amount_bytes, combined_id_bytes, oracle_bytes]
        joined = to_bytes(text="_").join(items)
        return joined


# Define custom error strings
CHALLENGE_INCOMPLETE = "CHALLENGE_INCOMPLETE"
ALREADY_DISBURSED = "ALREADY_DISBURSED"
INVALID_ORACLE = "INVALID_ORACLE"
MISSING_CHALLENGES = "MISSING_CHALLENGES"
INVALID_INPUT = "INVALID_INPUT"
USER_NOT_FOUND = "USER_NOT_FOUND"
POOL_EXHAUSTED = "POOL_EXHAUSTED"
WAIT_FOR_COOLDOWN = "WAIT_FOR_COOLDOWN"


class AttestationError(Exception):
    pass


def is_valid_oracle(address: str) -> bool:
    redis = get_redis()
    oracle_addresses = redis.get(oracle_addresses_key)
    if oracle_addresses:
        oracle_addresses = oracle_addresses.decode().split(",")
    else:
        oracle_addresses = get_oracle_addresses_from_chain(redis)
    return address in oracle_addresses


def sign_attestation(attestation_bytes: bytes, private_key: str):
    k = keys.PrivateKey(HexBytes(private_key))
    to_sign_hash = Web3.keccak(attestation_bytes)
    sig = k.sign_msg_hash(to_sign_hash)
    return sig.to_hex()


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
    not able to be created.
    """
    if not user_id or not challenge_id or not oracle_address:
        raise AttestationError(INVALID_INPUT)

    # First, validate the oracle adddress
    if not is_valid_oracle(oracle_address):
        raise AttestationError(INVALID_ORACLE)

    challenges_and_disbursements: Tuple[
        UserChallenge, Challenge, ChallengeDisbursement
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

    if not challenges_and_disbursements:
        raise AttestationError(MISSING_CHALLENGES)
    user_challenge, challenge, disbursement = (
        challenges_and_disbursements[0],
        challenges_and_disbursements[1],
        challenges_and_disbursements[2],
    )
    if not user_challenge.is_complete:
        raise AttestationError(CHALLENGE_INCOMPLETE)
    if disbursement:
        raise AttestationError(ALREADY_DISBURSED)
    now_utc = datetime.now(pytz.UTC)
    if challenge.cooldown_days:
        time_passed = now_utc - user_challenge.created_at
        if time_passed.days < challenge.cooldown_days:
            raise AttestationError(WAIT_FOR_COOLDOWN)
    if challenge.weekly_pool:
        disbursed_amount = get_disbursed_challenges_amount(
            session, challenge.id, get_weekly_pool_window_start(now_utc)
        )
        if disbursed_amount + user_challenge.amount > challenge.weekly_pool:
            raise AttestationError(POOL_EXHAUSTED)

    # Get the users's eth address
    user_eth_address = (
        session.query(User.wallet)
        .filter(
            User.is_current == True,
            User.user_id == user_id,
            User.is_deactivated == False,
        )
        .one_or_none()
    )
    if not user_eth_address:
        raise AttestationError(USER_NOT_FOUND)
    user_address = str(user_eth_address[0])

    attestation = Attestation(
        amount=str(user_challenge.amount),
        oracle_address=oracle_address,
        user_address=user_address,
        challenge_id=challenge.id,
        challenge_specifier=user_challenge.specifier,
    )

    attestation_bytes = attestation.get_attestation_bytes()
    signed_attestation: str = sign_attestation(
        attestation_bytes, shared_config["delegate"]["private_key"]
    )
    return (
        shared_config["delegate"]["owner_wallet"],
        signed_attestation,
    )


ADD_SENDER_MESSAGE_PREFIX = "add"


def verify_discovery_node_exists_on_chain(new_sender_address: str) -> bool:
    redis = get_redis()
    nodes = get_all_discovery_nodes_cached(redis)
    wallets = set([d["delegateOwnerWallet"] for d in nodes] if nodes else [])
    return new_sender_address in wallets


def get_create_sender_attestation(new_sender_address: str) -> Tuple[str, str]:
    """
    Returns a owner_wallet, signed_attestation tuple,
    or throws an error explaining why the sender attestation was
    not able to be created.
    """
    if not REWARDS_MANAGER_ACCOUNT_PUBLIC_KEY:
        raise Exception("No Rewards Manager Account initialized")

    is_valid = verify_discovery_node_exists_on_chain(new_sender_address)
    if not is_valid:
        raise Exception(f"Expected {new_sender_address} to be registered on chain")

    items = [
        to_bytes(text=ADD_SENDER_MESSAGE_PREFIX),
        # Solana PubicKey should be coerced to bytes using the pythonic bytes
        bytes(REWARDS_MANAGER_ACCOUNT_PUBLIC_KEY),
        to_bytes(hexstr=new_sender_address),
    ]
    attestation_bytes = to_bytes(text="").join(items)
    signed_attestation: str = sign_attestation(
        attestation_bytes, shared_config["delegate"]["private_key"]
    )
    owner_wallet = shared_config["delegate"]["owner_wallet"]
    return owner_wallet, signed_attestation
