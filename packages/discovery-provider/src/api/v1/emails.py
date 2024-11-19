import logging
from flask_restx import Namespace, Resource, fields, reqparse
from sqlalchemy import and_, or_

from src.api.v1.helpers import (
    abort_not_found,
    current_user_parser,
    get_current_user_id,
    make_response,
    success_response,
    pagination_parser,
    format_limit,
    format_offset,
)
from src.api.v1.models.emails import email, emails_response
from src.models.users.email import Email
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)

ns = Namespace("emails", description="Email related operations")


# Get all emails with pagination
@ns.route("/all")
class AllEmails(Resource):
    @ns.doc(
        id="Get All Emails",
        description="Get all emails with pagination support",
        responses={200: "Success", 400: "Bad Request", 500: "Server Error"},
    )
    @ns.expect(pagination_parser)
    @ns.marshal_with(emails_response)
    def get(self):
        args = pagination_parser.parse_args()
        limit = format_limit(args.get("limit"))
        offset = format_offset(args.get("offset"))

        db = get_db_read_replica()
        with db.scoped_session() as session:
            # Get all emails with pagination
            emails = session.query(Email).limit(limit).offset(offset).all()

            return success_response(
                {
                    "data": [
                        {
                            "encrypted_email": e.encrypted_email,
                            "user_id": e.user_id,
                            "decryptor_user_id": e.decryptor_user_id,
                        }
                        for e in emails
                    ]
                }
            )


# Get emails for current user
@ns.route("/me")
class UserEmails(Resource):
    @ns.doc(
        id="Get User Emails",
        description="Get all emails associated with the current user",
        responses={200: "Success", 400: "Bad Request", 500: "Server Error"},
    )
    @ns.expect(current_user_parser)
    @ns.marshal_with(emails_response)
    def get(self):
        args = current_user_parser.parse_args()
        current_user_id = get_current_user_id(args)

        db = get_db_read_replica()
        with db.scoped_session() as session:
            # Get emails where the current user is the decryptor
            emails = (
                session.query(Email)
                .filter(Email.decryptor_user_id == current_user_id)
                .all()
            )

            return success_response(
                {
                    "data": [
                        {
                            "encrypted_email": e.encrypted_email,
                            "user_id": e.user_id,
                            "decryptor_user_id": e.decryptor_user_id,
                        }
                        for e in emails
                    ]
                }
            )
