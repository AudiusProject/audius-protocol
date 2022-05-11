from flask_restx import Namespace, Resource, fields, marshal_with, reqparse
from src.api.v1.helpers import (
    DescriptiveArgument,
    extend_reaction,
    make_response,
    success_response,
)
from src.api.v1.models.reactions import reaction
from src.queries.reactions import get_reactions
from src.utils.db_session import get_db_read_replica
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics

ns = Namespace("reactions", description="Reaction related operations")

get_reactions_parser = reqparse.RequestParser(argument_class=DescriptiveArgument)
get_reactions_parser.add_argument(
    "type", required=True, description="The type of reactions for which to query."
)
get_reactions_parser.add_argument(
    "tx_id",
    required=True,
    action="append",
    description="The `reacted_to` transaction id(s) of the reactions in question.",
)

get_reactions_response = make_response(
    "reactions", ns, fields.List(fields.Nested(reaction))
)


@ns.route("", doc=False)
class BulkReactions(Resource):
    @record_metrics
    @ns.doc(
        id="Bulk get Reactions",
        description="Gets reactions by transaction_id and type",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(get_reactions_parser)
    @marshal_with(get_reactions_response)
    @cache(ttl_sec=5)
    def get(self):
        args = get_reactions_parser.parse_args()
        tx_ids, type = args.get("tx_id"), args.get("type")
        db = get_db_read_replica()
        with db.scoped_session() as session:
            reactions = get_reactions(session, tx_ids, type)
            reactions = list(map(extend_reaction, reactions))
            return success_response(reactions)
