import logging

from src.utils.auth_middleware import SIGNATURE_HEADER, MESSAGE_HEADER
from flask_restx import Namespace, Resource, fields
from src.api.v1.helpers import (
    abort_not_found,
    extend_transaction_details,
    make_full_response,
    pagination_parser,
    success_response,
)
from src.queries.get_audio_transactions_history import get_audio_transactions_history
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
transaction_history_parser.add_argument(
    MESSAGE_HEADER,
    required=True,
    description="The data that was signed by the user for signature recovery",
    location="headers"
)
transaction_history_parser.add_argument(
    SIGNATURE_HEADER,
    required=True,
    description="The signature of data, used for signature recovery",
    location="headers"
)


@full_ns.route("", doc=False)
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
            abort_not_found(None, full_ns)
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
