from src.queries.attestation import get_attestation
from flask_restx import Resource, Namespace, fields, reqparse, abort
from src.utils.redis_cache import cache
from src.api.v1.helpers import decode_with_abort, make_response, success_response
from src.utils.db_session import get_db_read_replica
from src.api.v1.models.challenges import attestation

ns = Namespace("challenges", description="Challenge related operations")

attestation_response = make_response(
    "attestation_reponse", ns, fields.Nested(attestation)
)

attest_route = "/<string:challenge_id>/attest"

attest_parser = reqparse.RequestParser()
attest_parser.add_argument("user_id", required=True)
attest_parser.add_argument("oracle", required=True)
attest_parser.add_argument("specifier", required=True)


@ns.route(attest_route)
class Attest(Resource):
    @ns.marshal_with(attestation_response)
    @cache(ttl_sec=5)
    def get(self, challenge_id: str):
        args = attest_parser.parse_args(strict=True)
        user_id: str = args["user_id"]
        oracle_address: str = args["oracle"]
        specifier: str = args["specifier"]
        decoded_user_id = decode_with_abort(user_id, ns)
        db = get_db_read_replica()
        with db.scoped_session() as session:
            try: 
                attestation_res = get_attestation(
                    session,
                    user_id=decoded_user_id,
                    oracle_address=oracle_address,
                    specifier=specifier,
                    challenge_id=challenge_id,
                )
                return success_response(attestation_res)
            except Exception as e:
                abort(500, e)
