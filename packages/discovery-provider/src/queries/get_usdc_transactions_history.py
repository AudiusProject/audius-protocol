import logging
from typing import List, Optional, TypedDict

from sqlalchemy import asc, desc
from sqlalchemy.orm import Query
from sqlalchemy.orm.session import Session

from src.models.users.usdc_transactions_history import (
    USDCTransactionMethod,
    USDCTransactionsHistory,
    USDCTransactionType,
)
from src.models.users.user import User
from src.models.users.user_bank import USDCUserBankAccount
from src.queries.query_helpers import (
    SortDirection,
    TransactionSortMethod,
    paginate_query,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


class GetUSDCTransactionsCountArgs(TypedDict):
    user_id: int
    transaction_type: Optional[USDCTransactionType]
    transaction_method: Optional[USDCTransactionMethod]
    include_system_transactions: Optional[bool]


class GetUSDCTransactionsArgs(TypedDict):
    user_id: int
    sort_direction: SortDirection
    sort_method: TransactionSortMethod
    transaction_type: Optional[USDCTransactionType]
    transaction_method: Optional[USDCTransactionMethod]
    include_system_transactions: Optional[bool]
    limit: int
    offset: int


USDC_SYSTEM_TRANSACTION_TYPES = [
    USDCTransactionType.prepare_withdrawal,
    USDCTransactionType.recover_withdrawal,
]


# SELECT count(*)
# FROM users
# JOIN usdc_user_bank_accounts ON usdc_user_bank_accounts.ethereum_address = users.wallet
# JOIN usdc_transactions_history ON usdc_transactions_history.user_bank = usdc_user_bank_accounts.bank_account
# WHERE users.user_id = <user_id> AND users.is_current = TRUE


def _get_usdc_transactions_history_count(
    session: Session, args: GetUSDCTransactionsCountArgs
):
    user_id = args.get("user_id")
    transaction_type = args.get("transaction_type", None)
    transaction_method = args.get("transaction_method", None)
    include_system_transactions = args.get("include_system_transactions", False)
    query: Query = (
        session.query(USDCTransactionsHistory)
        .select_from(User)
        .filter(User.user_id == user_id, User.is_current == True)
        .join(
            USDCUserBankAccount,
            USDCUserBankAccount.ethereum_address == User.wallet,
        )
        .join(
            USDCTransactionsHistory,
            USDCTransactionsHistory.user_bank == USDCUserBankAccount.bank_account,
        )
    )
    if transaction_type is not None:
        query = query.filter(
            USDCTransactionsHistory.transaction_type == transaction_type
        )
    if not include_system_transactions:
        query = query.filter(
            USDCTransactionsHistory.transaction_type.notin_(
                USDC_SYSTEM_TRANSACTION_TYPES
            )
        )
    if transaction_method is not None:
        query = query.filter(USDCTransactionsHistory.method == transaction_method)
    count: int = query.count()
    return count


def get_usdc_transactions_history_count(args: GetUSDCTransactionsCountArgs):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        count = _get_usdc_transactions_history_count(session, args)
        return count


# SELECT usdc_transactions_history.*
# FROM users
# JOIN usdc_user_bank_accounts ON usdc_user_bank_accounts.ethereum_address = users.wallet
# JOIN usdc_transactions_history ON usdc_transactions_history.user_bank = usdc_user_bank_accounts.bank_account
# WHERE users.user_id = <user_id> AND users.is_current = TRUE
# ORDER BY usdc_transactions_history.transaction_created_at ASC


def _get_usdc_transactions_history(session: Session, args: GetUSDCTransactionsArgs):
    transaction_type = args.get("transaction_type", None)
    transaction_method = args.get("transaction_method", None)
    sort_method = args.get("sort_method")
    include_system_transactions = args.get("include_system_transactions", False)
    sort_direction = args.get("sort_direction")

    query: Query = (
        session.query(USDCTransactionsHistory)
        .select_from(User)
        .filter(User.user_id == args["user_id"], User.is_current == True)
        .join(USDCUserBankAccount, USDCUserBankAccount.ethereum_address == User.wallet)
        .join(
            USDCTransactionsHistory,
            USDCTransactionsHistory.user_bank == USDCUserBankAccount.bank_account,
        )
    )
    if transaction_type is not None:
        query = query.filter(
            USDCTransactionsHistory.transaction_type == transaction_type
        )
    if not include_system_transactions:
        query = query.filter(
            USDCTransactionsHistory.transaction_type.notin_(
                USDC_SYSTEM_TRANSACTION_TYPES
            )
        )
    if transaction_method is not None:
        query = query.filter(USDCTransactionsHistory.method == transaction_method)

    sort_fn = desc if sort_direction == SortDirection.desc else asc
    if sort_method == TransactionSortMethod.date:
        query = query.order_by(sort_fn(USDCTransactionsHistory.transaction_created_at))
    elif sort_method == TransactionSortMethod.transaction_type:
        query = query.order_by(
            sort_fn(USDCTransactionsHistory.transaction_type),
            desc(USDCTransactionsHistory.transaction_created_at),
        )
    query = paginate_query(query)
    results: List[USDCTransactionsHistory] = query.all()
    return results


def get_usdc_transactions_history(args: GetUSDCTransactionsArgs):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        history = _get_usdc_transactions_history(session, args)
        return helpers.query_result_to_list(history)
