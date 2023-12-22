from flask_restx import Namespace, Resource, fields, marshal_with, reqparse

from src.api.v1.helpers import (
    DescriptiveArgument,
    format_dashboard_wallet_user,
    make_response,
    success_response,
)
from src.api.v1.models.dashboard_wallet_user import dashboard_wallet_user
from src.queries.get_dashboard_wallet_users import get_bulk_dashboard_wallet_users
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics

ns = Namespace(
    "dashboard_wallet_users",
    description="Protocol dashboard wallet users related operations",
)

get_dashboard_wallet_users_parser = reqparse.RequestParser(
    argument_class=DescriptiveArgument
)
get_dashboard_wallet_users_parser.add_argument(
    "wallets",
    required=True,
    action="split",
    description="The wallets for which to fetch connected Audius user profiles.",
)

get_dashboard_wallet_users_response = make_response(
    "dashboard_wallet_users_response",
    ns,
    fields.List(fields.Nested(dashboard_wallet_user)),
)


@ns.route("")
class BulkDashboardWalletUsers(Resource):
    @record_metrics
    @ns.doc(
        id="Bulk get dashboard wallet users",
        description="Gets Audius user profiles connected to given dashboard wallet addresses",
        responses={
            200: "Success",
            400: "Bad request",
            404: "No such dashboard wallet",
            500: "Server error",
        },
    )
    @ns.expect(get_dashboard_wallet_users_parser)
    @marshal_with(get_dashboard_wallet_users_response)
    @cache(ttl_sec=5)
    def get(self):
        args = get_dashboard_wallet_users_parser.parse_args()
        wallets_arg = args.get("wallets")
        dashboard_wallet_users = get_bulk_dashboard_wallet_users(wallets_arg)
        dashboard_wallet_users = list(
            map(format_dashboard_wallet_user, dashboard_wallet_users)
        )
        return success_response(dashboard_wallet_users)
