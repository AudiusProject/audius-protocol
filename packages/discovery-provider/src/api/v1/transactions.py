import logging

from flask_restx import Namespace, Resource, fields, reqparse

from src.api.v1.helpers import (
    DescriptiveArgument,
    abort_bad_request_param,
    abort_forbidden,
    abort_unauthorized,
    add_auth_headers_to_parser,
    decode_with_abort,
    extend_transaction_details,
    make_full_response,
    pagination_parser,
    success_response,
)
from src.api.v1.users import full_ns as full_user_ns
from src.models.users.usdc_transactions_history import (
    USDCTransactionMethod,
    USDCTransactionType,
)
from src.queries.get_audio_transactions_history import (
    get_audio_transactions_history,
    get_audio_transactions_history_count,
)
from src.queries.get_usdc_transactions_history import (
    get_usdc_transactions_history,
    get_usdc_transactions_history_count,
)
from src.queries.query_helpers import SortDirection, TransactionSortMethod
from src.utils.auth_middleware import auth_middleware

from .models.transactions import transaction_details

logger = logging.getLogger(__name__)

full_ns = Namespace(
    "transactions", description="Full transaction history related operations"
)

transaction_history_response = make_full_response(
    "transaction_history_response",
    full_ns,
    fields.List(fields.Nested(transaction_details)),
)


transaction_history_parser = pagination_parser.copy()
transaction_history_parser.add_argument(
    "sort_method",
    required=False,
    description="The sort method",
    type=str,
    choices=TransactionSortMethod._member_names_,
    default=TransactionSortMethod.date,
)
transaction_history_parser.add_argument(
    "sort_direction",
    required=False,
    description="The sort direction",
    type=str,
    choices=SortDirection._member_names_,
    default=SortDirection.desc,
)

add_auth_headers_to_parser(transaction_history_parser)


@full_user_ns.route("/<string:id>/transactions/audio")
class GetTransactionHistory(Resource):
    @full_user_ns.doc(
        id="""Get Audio Transactions""",
        description="""Gets the user's $AUDIO transaction history within the App""",
        params={"id": "A User ID"},
    )
    @full_user_ns.expect(transaction_history_parser)
    @full_user_ns.marshal_with(transaction_history_response)
    @auth_middleware()
    def get(self, id, authed_user_id=None):
        user_id = decode_with_abort(id, full_user_ns)
        return self._get(user_id, authed_user_id)

    def _get(self, user_id, authed_user_id=None):
        if authed_user_id is None:
            abort_unauthorized(full_user_ns)
        elif authed_user_id != user_id:
            abort_forbidden(full_user_ns)
        args = transaction_history_parser.parse_args()
        sort_method = args.get("sort_method", TransactionSortMethod.date)
        sort_direction = args.get("sort_direction", SortDirection.desc)
        transactions = get_audio_transactions_history(
            {
                "user_id": authed_user_id,
                "sort_method": sort_method,
                "sort_direction": sort_direction,
            }
        )
        return success_response(list(map(extend_transaction_details, transactions)))


@full_ns.route("")
class LegacyGetTransactionHistory(GetTransactionHistory):
    @full_ns.doc(
        id="""Get Audio Transaction History""",
        deprecated=True,
    )
    @full_ns.expect(transaction_history_parser)
    @full_ns.marshal_with(transaction_history_response)
    @auth_middleware()
    def get(self, authed_user_id=None):
        """Gets the user's $AUDIO transaction history within the App

        Deprecated: Use `/users/{id}/transactions/audio` or `sdk.full.users.getAudioTransactions()` instead.
        """
        return self._get(authed_user_id, authed_user_id)


transaction_history_count_response = make_full_response(
    "transaction_history_count_response", full_ns, fields.Integer()
)

transaction_history_count_parser = reqparse.RequestParser(
    argument_class=DescriptiveArgument
)
add_auth_headers_to_parser(transaction_history_count_parser)


@full_user_ns.route("/<string:id>/transactions/audio/count")
class GetTransactionHistoryCount(Resource):
    @full_user_ns.doc(
        id="""Get Audio Transaction Count""",
        description="""Gets the count of the user's $AUDIO transaction history within the App""",
        params={"id": "A User ID"},
    )
    @full_user_ns.expect(transaction_history_count_parser)
    @full_user_ns.marshal_with(transaction_history_count_response)
    @auth_middleware()
    def get(self, id, authed_user_id=None):
        user_id = decode_with_abort(id, full_ns)
        if authed_user_id is None:
            abort_unauthorized(full_user_ns)
        elif authed_user_id != user_id:
            abort_forbidden(full_user_ns)
        transactions_count = get_audio_transactions_history_count(authed_user_id)
        response = success_response(transactions_count)
        return response


@full_ns.route("/count")
class LegacyGetTransactionHistoryCount(Resource):
    @full_ns.doc(
        id="""Get Audio Transaction History Count""",
        deprecated=True,
    )
    @full_ns.expect(transaction_history_count_parser)
    @full_ns.marshal_with(transaction_history_count_response)
    @auth_middleware()
    def get(self, authed_user_id=None):
        """Gets the count of the user's $AUDIO transaction history within the App.

        Deprecated: Use `/users/{id}/transactions/audio/count` or `sdk.full.users.getAudioTransactionCount()` instead.
        """
        if authed_user_id is None:
            abort_bad_request_param(None, full_ns)
        transactions_count = get_audio_transactions_history_count(authed_user_id)
        response = success_response(transactions_count)
        return response


def add_transaction_history_filters(parser: reqparse.RequestParser):
    parser.add_argument(
        "type",
        required=False,
        description="Filters the type of transactions to show",
        type=str,
        choices=USDCTransactionType._member_names_,
        default=None,
    )
    parser.add_argument(
        "include_system_transactions",
        required=False,
        description="Include intermediate system transactions in the results",
        type=bool,
        default=False,
    )
    parser.add_argument(
        "method",
        required=False,
        description="Filters the method (sent/received) of transactions to show",
        type=str,
        choices=USDCTransactionMethod._member_names_,
        default=None,
    )


usdc_transaction_history_parser = transaction_history_parser.copy()
add_transaction_history_filters(usdc_transaction_history_parser)


@full_user_ns.route("/<string:id>/transactions/usdc")
class GetUSDCTransactionHistory(Resource):
    @full_user_ns.doc(
        id="""Get USDC Transactions""",
        description="""Gets the user's $USDC transaction history within the App""",
        params={"id": "A User ID"},
    )
    @full_user_ns.expect(usdc_transaction_history_parser)
    @full_user_ns.marshal_with(transaction_history_response)
    @auth_middleware()
    def get(self, id, authed_user_id=None):
        user_id = decode_with_abort(id, full_ns)
        if authed_user_id is None:
            abort_unauthorized(full_user_ns)
        elif authed_user_id != user_id:
            abort_forbidden(full_user_ns)
        args = usdc_transaction_history_parser.parse_args()
        sort_method = args.get("sort_method", TransactionSortMethod.date)
        sort_direction = args.get("sort_direction", SortDirection.desc)
        transactions = get_usdc_transactions_history(
            {
                "user_id": authed_user_id,
                "sort_method": sort_method,
                "sort_direction": sort_direction,
                "include_system_transactions": args.get(
                    "include_system_transactions", False
                ),
                "transaction_type": args.get("type", None),
                "transaction_method": args.get("method", None),
            }
        )
        return success_response(list(map(extend_transaction_details, transactions)))


usdc_transaction_history_count_parser = reqparse.RequestParser(
    argument_class=DescriptiveArgument
)
add_transaction_history_filters(usdc_transaction_history_count_parser)
add_auth_headers_to_parser(usdc_transaction_history_count_parser)


@full_user_ns.route("/<string:id>/transactions/usdc/count")
class GetUSDCTransactionHistoryCount(Resource):
    @full_user_ns.doc(
        id="""Get USDC Transaction Count""",
        description="""Gets the count of the user's $USDC transaction history within the App""",
        params={"id": "A User ID"},
    )
    @full_user_ns.expect(usdc_transaction_history_count_parser)
    @full_user_ns.marshal_with(transaction_history_count_response)
    @auth_middleware()
    def get(self, id, authed_user_id=None):
        user_id = decode_with_abort(id, full_ns)
        if authed_user_id is None:
            abort_unauthorized(full_user_ns)
        elif authed_user_id != user_id:
            abort_forbidden(full_user_ns)
        args = usdc_transaction_history_count_parser.parse_args()
        transactions_count = get_usdc_transactions_history_count(
            {
                "user_id": authed_user_id,
                "transaction_type": args.get("type", None),
                "transaction_method": args.get("method", None),
            }
        )
        response = success_response(transactions_count)
        return response
