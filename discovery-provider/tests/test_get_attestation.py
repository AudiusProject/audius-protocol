from src.queries.attestation import get_attestation
from tests.test_get_challenges import setup_db
from src.utils.db_session import get_db


def test_get_attestation(app):
    with app.app_context():
        db = get_db()
        with db.scoped_session() as session:
            setup_db(session)

            # TO TEST
            # - Happy path
            # - No user_challenge
            # - No disbursement
            # - Invalid oracle
            # - No oracle provided, no challenge, no user_id
            oracle_address: str = "TEST_ADDRESS"

            res = get_attestation(
                {
                    "user_id": 1,
                    "challenge_id": "boolean_challenge_1",
                    "oracle_address": oracle_address,
                    "session": session,
                }
            )
