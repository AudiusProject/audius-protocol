import logging

from flask_restx import Namespace, Resource, fields, reqparse
from src.api.v1.helpers import (
    DescriptiveArgument,
    abort_bad_request_param,
    add_auth_headers_to_parser,
    extend_transaction_details,
    make_full_response,
    pagination_parser,
    success_response,
)
from src.queries.get_audio_transactions_history import (
    get_audio_transactions_history,
    get_audio_transactions_history_count,
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


@full_ns.route("")
class GetTransactionHistory(Resource):
    @full_ns.doc(
        id="""Get Audio Transaction History""",
        description="""Gets the user's $AUDIO transaction history within the App""",
    )
    @full_ns.expect(transaction_history_parser)
    @full_ns.marshal_with(transaction_history_response)
    @auth_middleware()
    def get(self, authed_user_id=None):
        if authed_user_id is None:
            abort_bad_request_param(None, full_ns)
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


transaction_history_count_response = make_full_response(
    "transaction_history_count_response", full_ns, fields.Integer()
)

transaction_history_count_parser = reqparse.RequestParser(
    argument_class=DescriptiveArgument
)
add_auth_headers_to_parser(transaction_history_count_parser)


@full_ns.route("/count")
class GetTransactionHistoryCount(Resource):
    @full_ns.doc(
        id="""Get Audio Transaction History Count""",
        description="""Gets the count of the user's $AUDIO transaction history within the App""",
    )
    @full_ns.expect(transaction_history_count_parser)
    @full_ns.marshal_with(transaction_history_count_response)
    @auth_middleware()
    def get(self, authed_user_id=None):
        if authed_user_id is None:
            abort_bad_request_param(None, full_ns)
        transactions_count = get_audio_transactions_history_count(authed_user_id)
        response = success_response(transactions_count)
        return response
