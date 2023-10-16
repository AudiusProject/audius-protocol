import logging
from typing import List, TypedDict

from sqlalchemy import asc, desc
from sqlalchemy.orm import Query
from sqlalchemy.orm.session import Session

from src.models.users.audio_transactions_history import AudioTransactionsHistory
from src.models.users.user import User
from src.models.users.user_bank import UserBankAccount
from src.queries.query_helpers import (
    SortDirection,
    TransactionSortMethod,
    paginate_query,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


class GetAudioTransactionsArgs(TypedDict):
    user_id: int
    sort_direction: SortDirection
    sort_method: TransactionSortMethod
    limit: int
    offset: int


# SELECT count(*)
# FROM users
# JOIN user_bank_accounts ON user_bank_accounts.ethereum_address = users.wallet
# JOIN audio_transactions_history ON audio_transactions_history.user_bank = user_bank_accounts.bank_account
# WHERE users.user_id = <user_id> AND users.is_current = TRUE


def _get_audio_transactions_history_count(session: Session, user_id: int):
    query: Query = (
        session.query(AudioTransactionsHistory)
        .select_from(User)
        .filter(User.user_id == user_id, User.is_current == True)
        .join(UserBankAccount, UserBankAccount.ethereum_address == User.wallet)
        .join(
            AudioTransactionsHistory,
            AudioTransactionsHistory.user_bank == UserBankAccount.bank_account,
        )
    )
    count: int = query.count()
    return count


def get_audio_transactions_history_count(user_id: int):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        count = _get_audio_transactions_history_count(session, user_id)
        return count


# SELECT audio_transactions_history.*
# FROM users
# JOIN user_bank_accounts ON user_bank_accounts.ethereum_address = users.wallet
# JOIN audio_transactions_history ON audio_transactions_history.user_bank = user_bank_accounts.bank_account
# WHERE users.user_id = <user_id> AND users.is_current = TRUE
# ORDER BY audio_transactions_history.transaction_created_at ASC


def _get_audio_transactions_history(session: Session, args: GetAudioTransactionsArgs):
    query: Query = (
        session.query(AudioTransactionsHistory)
        .select_from(User)
        .filter(User.user_id == args["user_id"], User.is_current == True)
        .join(UserBankAccount, UserBankAccount.ethereum_address == User.wallet)
        .join(
            AudioTransactionsHistory,
            AudioTransactionsHistory.user_bank == UserBankAccount.bank_account,
        )
    )
    sort_method = args.get("sort_method")
    sort_direction = args.get("sort_direction")
    sort_fn = desc if sort_direction == SortDirection.desc else asc
    if sort_method == TransactionSortMethod.date:
        query = query.order_by(sort_fn(AudioTransactionsHistory.transaction_created_at))
    elif sort_method == TransactionSortMethod.transaction_type:
        query = query.order_by(
            sort_fn(AudioTransactionsHistory.transaction_type),
            desc(AudioTransactionsHistory.transaction_created_at),
        )
    query = paginate_query(query)
    results: List[AudioTransactionsHistory] = query.all()
    return results


def get_audio_transactions_history(args: GetAudioTransactionsArgs):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        history = _get_audio_transactions_history(session, args)
        return helpers.query_result_to_list(history)
