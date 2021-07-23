import logging
import time
from typing import Tuple, TypedDict, List, Optional, Dict, Set
from redis import Redis
from spl.token.client import Token
from solana.publickey import PublicKey
from solana.rpc.api import Client
from sqlalchemy import and_
from sqlalchemy.orm.session import Session

from src.utils.session_manager import SessionManager
from src.app import eth_abi_values
from src.tasks.celery_app import celery
from src.models import UserBalance, User, AssociatedWallet, UserBankAccount
from src.queries.get_balances import (
    does_user_balance_need_refresh,
    IMMEDIATE_REFRESH_REDIS_PREFIX,
    LAZY_REFRESH_REDIS_PREFIX,
)
from src.utils.redis_constants import user_balances_refresh_last_completion_redis_key
from src.utils.config import shared_config

logger = logging.getLogger(__name__)
audius_token_registry_key = bytes("Token", "utf-8")
audius_staking_registry_key = bytes("StakingProxy", "utf-8")
audius_delegate_manager_registry_key = bytes("DelegateManager", "utf-8")

REDIS_ETH_BALANCE_COUNTER_KEY = "USER_BALANCE_REFRESH_COUNT"

WAUDIO_PROGRAM_ADDRESS = shared_config["solana"]["waudio_program_address"]
WAUDIO_MINT_ADDRESS = shared_config["solana"]["waudio_mint_address"]
WAUDIO_PROGRAM_PUBKEY = (
    PublicKey(WAUDIO_PROGRAM_ADDRESS) if WAUDIO_PROGRAM_ADDRESS else None
)
WAUDIO_MINT_PUBKEY = PublicKey(WAUDIO_MINT_ADDRESS) if WAUDIO_MINT_ADDRESS else None


class UserWalletMetadata(TypedDict):
    owner_wallet: str
    associated_wallets: Optional[List[str]]
    bank_account: Optional[str]

def get_lazy_refresh_user_ids(redis: Redis, session: Session) -> List[int]:
    redis_user_ids = redis.smembers(LAZY_REFRESH_REDIS_PREFIX)
    user_ids = [int(user_id.decode()) for user_id in redis_user_ids]

    user_balances = (
        (session.query(UserBalance)).filter(UserBalance.user_id.in_(user_ids)).all()
    )

    # Filter only user_balances that still need refresh
    needs_refresh: Set[int] = {
        user.user_id
        for user in list(filter(does_user_balance_need_refresh, user_balances))
    }

    # return user id of needs_refresh
    return list(needs_refresh)


def get_immediate_refresh_user_ids(redis: Redis) -> List[int]:
    redis_user_ids = redis.smembers(IMMEDIATE_REFRESH_REDIS_PREFIX)
    return [int(user_id.decode()) for user_id in redis_user_ids]


# *Explanation of user balance caching*
# In an effort to minimize eth calls, we look up users embedded in track metadata once per user,
# and current users (logged in dapp users, who might be changing their balance) on an interval.
# Balance is tracked for both mainnet ethereum AUDIO and mainnet solana wAUDIO
#
# - In populate_user_metadata, look up User_Balance entry in db.
#       If it doesn't exist, return 0, persist a User_Balance row with 0,
#       & enqueue in Redis the user ID for later balance lookup.
# - On track get endpoints, if current_user exists, enqueue balance lookup
#       in Redis.
# - In Solana UserBank indexing (index_user_bank.py) any transfer operation enqueues
#       a refresh for both the sender and reciever UserBank addresses
#
# In this recurring task:
#   - Get all enqueued user balance refresh requests. These are stored in a set, so
#       we don't worry about deduping.
#   - If a given balance is either
#        a) new (created_at == updated_at)
#        b) not new, but stale: last updated prior to (now - threshold)
#     we look up said users, adding User_Balance rows, and removing them from Redis.
#     we check if they have associated_wallets and update those balances as well
#     we check if they have a user_bank_account and update that balance as well
#
#     Enqueued User Ids in Redis that are *not* ready to be refreshed yet are left in the queue
#     for later.
def refresh_user_ids(
    redis: Redis,
    db: SessionManager,
    token_contract,
    delegate_manager_contract,
    staking_contract,
    eth_web3,
    waudio_token
):
    with db.scoped_session() as session:
        lazy_refresh_user_ids = get_lazy_refresh_user_ids(redis, session)
        immediate_refresh_user_ids = get_immediate_refresh_user_ids(redis)

        logger.info(
            f"cache_user_balance.py | Starting refresh with {len(lazy_refresh_user_ids)} "
            f"lazy refresh user_ids: {lazy_refresh_user_ids} and {len(immediate_refresh_user_ids)} "
            f"immediate refresh user_ids: {immediate_refresh_user_ids}"
        )
        all_user_ids = lazy_refresh_user_ids + immediate_refresh_user_ids
        user_ids = list(set(all_user_ids))

        existing_user_balances: List[UserBalance] = (
            (session.query(UserBalance)).filter(UserBalance.user_id.in_(user_ids)).all()
        )
        user_balances = {
            user.user_id: user for user in existing_user_balances
        }

        # Grab the users & associated_wallets we need to refresh
        user_associated_wallet_query: List[Tuple[int, str, str]] = (
            session.query(User.user_id, User.wallet, AssociatedWallet.wallet)
            .outerjoin(
                AssociatedWallet,
                and_(
                    AssociatedWallet.user_id == User.user_id,
                    AssociatedWallet.is_current == True,
                    AssociatedWallet.is_delete == False,
                ),
            )
            .filter(
                User.user_id.in_(user_ids),
                User.is_current == True,
            )
            .all()
        )

        user_bank_accounts_query: List[Tuple[int, str]] = (
            session.query(User.user_id, UserBankAccount.bank_account)
            .join(UserBankAccount, UserBankAccount.ethereum_address == User.wallet)
            .filter(
                User.user_id.in_(user_ids),
                User.is_current == True,
            )
            .all()
        )
        user_id_bank_accounts = dict(user_bank_accounts_query)

        # Combine query results for user bank, associated wallets,
        # and primary owner wallet into a single metadata list
        user_id_metadata: Dict[int, UserWalletMetadata] = {}

        for user in user_associated_wallet_query:
            user_id, user_wallet, associated_wallet = user
            if not user_id in user_id_metadata:
                user_id_metadata[user_id] = {
                    "owner_wallet": user_wallet,
                    "associated_wallets": None,
                    "bank_account": None,
                }
                if user_id in user_id_bank_accounts:
                    user_id_metadata[user_id]["bank_account"] = user_id_bank_accounts[
                        user_id
                    ]
            if associated_wallet:
                user_associated_wallet = user_id_metadata[user_id]["associated_wallets"]
                if user_associated_wallet is not None:
                    user_associated_wallet.append(associated_wallet)
                else:
                    user_id_metadata[user_id]["associated_wallets"] = [
                        associated_wallet
                    ]

        logger.info(
            f"cache_user_balance.py | fetching for {len(user_associated_wallet_query)} users: {user_ids}"
        )

        # Fetch balances
        for user_id, wallets in user_id_metadata.items():
            try:
                owner_wallet = wallets["owner_wallet"]
                owner_wallet = eth_web3.toChecksumAddress(owner_wallet)
                owner_wallet_balance = token_contract.functions.balanceOf(
                    owner_wallet
                ).call()
                associated_balance = 0
                waudio_balance = 0

                if wallets["associated_wallets"] is not None:
                    for wallet in wallets["associated_wallets"]:
                        wallet = eth_web3.toChecksumAddress(wallet)
                        balance = token_contract.functions.balanceOf(wallet).call()
                        delegation_balance = (
                            delegate_manager_contract.functions.getTotalDelegatorStake(
                                wallet
                            ).call()
                        )
                        stake_balance = staking_contract.functions.totalStakedFor(
                            wallet
                        ).call()
                        associated_balance += (
                            balance + delegation_balance + stake_balance
                        )
                if wallets["bank_account"] is not None:
                    if waudio_token is None:
                        logger.error(
                            "cache_user_balance.py | Missing Required SPL Confirguration"
                        )
                    else:
                        bal_info = waudio_token.get_balance(
                            PublicKey(wallets["bank_account"])
                        )
                        waudio_balance = bal_info["result"]["value"]["amount"]

                # update the balance on the user model
                user_balance = user_balances[user_id]
                user_balance.balance = owner_wallet_balance
                user_balance.associated_wallets_balance = str(associated_balance)
                user_balance.waudio = str(waudio_balance)

            except Exception as e:
                logger.error(
                    f"cache_user_balance.py | Error fetching balance for user {user_id}: {(e)}"
                )

        # Commit the new balances
        session.commit()

        # Remove the fetched balances from Redis set
        logger.info(
            f"cache_user_balance.py | Got balances for {len(user_associated_wallet_query)} users, removing from Redis."
        )
        if lazy_refresh_user_ids:
            redis.srem(LAZY_REFRESH_REDIS_PREFIX, *lazy_refresh_user_ids)
        if immediate_refresh_user_ids:
            redis.srem(IMMEDIATE_REFRESH_REDIS_PREFIX, *immediate_refresh_user_ids)


def get_token_address(eth_web3, config):
    eth_registry_address = eth_web3.toChecksumAddress(
        config["eth_contracts"]["registry"]
    )

    eth_registry_instance = eth_web3.eth.contract(
        address=eth_registry_address, abi=eth_abi_values["Registry"]["abi"]
    )

    token_address = eth_registry_instance.functions.getContract(
        audius_token_registry_key
    ).call()

    return token_address


def get_token_contract(eth_web3, config):
    token_address = get_token_address(eth_web3, config)

    audius_token_instance = eth_web3.eth.contract(
        address=token_address, abi=eth_abi_values["AudiusToken"]["abi"]
    )

    return audius_token_instance


def get_delegate_manager_contract(eth_web3):
    eth_registry_address = eth_web3.toChecksumAddress(
        shared_config["eth_contracts"]["registry"]
    )

    eth_registry_instance = eth_web3.eth.contract(
        address=eth_registry_address, abi=eth_abi_values["Registry"]["abi"]
    )

    delegate_manager_address = eth_registry_instance.functions.getContract(
        audius_delegate_manager_registry_key
    ).call()

    delegate_manager_instance = eth_web3.eth.contract(
        address=delegate_manager_address, abi=eth_abi_values["DelegateManager"]["abi"]
    )

    return delegate_manager_instance


def get_staking_contract(eth_web3):
    eth_registry_address = eth_web3.toChecksumAddress(
        shared_config["eth_contracts"]["registry"]
    )

    eth_registry_instance = eth_web3.eth.contract(
        address=eth_registry_address, abi=eth_abi_values["Registry"]["abi"]
    )

    staking_address = eth_registry_instance.functions.getContract(
        audius_staking_registry_key
    ).call()

    staking_instance = eth_web3.eth.contract(
        address=staking_address, abi=eth_abi_values["Staking"]["abi"]
    )

    return staking_instance


def get_audio_token(solana_client: Client):
    if WAUDIO_MINT_PUBKEY is None or WAUDIO_PROGRAM_PUBKEY is None:
        logger.error("cache_user_balance.py | Missing Required SPL Confirguration")
        return None
    waudio_token = Token(
        conn=solana_client,
        pubkey=WAUDIO_MINT_PUBKEY,
        program_id=WAUDIO_PROGRAM_PUBKEY,
        payer=[],  # not making any txs so payer is not required
    )
    return waudio_token


@celery.task(name="update_user_balances", bind=True)
def update_user_balances_task(self):
    """Caches user Audio balances, in wei."""

    db = update_user_balances_task.db
    redis = update_user_balances_task.redis
    eth_web3 = update_user_balances_task.eth_web3
    solana_client = update_user_balances_task.solana_client

    have_lock = False
    update_lock = redis.lock("update_user_balances_lock", timeout=7200)

    try:
        have_lock = update_lock.acquire(blocking=False)

        if have_lock:
            start_time = time.time()

            delegate_manager_inst = get_delegate_manager_contract(eth_web3)
            staking_inst = get_staking_contract(eth_web3)
            token_inst = get_token_contract(eth_web3, update_user_balances_task.shared_config)
            waudio_token = get_audio_token(solana_client)
            refresh_user_ids(
                redis,
                db,
                token_inst,
                delegate_manager_inst,
                staking_inst,
                eth_web3,
                waudio_token,
            )

            end_time = time.time()
            redis.set(user_balances_refresh_last_completion_redis_key, int(end_time))
            logger.info(
                f"cache_user_balance.py | Finished cache_user_balance in {end_time - start_time} seconds"
            )
        else:
            logger.info("cache_user_balance.py | Failed to acquire lock")
    except Exception as e:
        logger.error("cache_user_balance.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
