import logging
from flask_restx import Namespace, Resource, fields
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
from src.api.v1.models.emails import (
    encrypted_email,
    email_encryption_key,
    email_access_key,
    encrypted_emails_response,
    email_encryption_keys_response,
    email_access_keys_response,
)
from src.models.users.email import EncryptedEmail, EmailEncryptionKey, EmailAccessKey
from src.utils.db_session import get_db_read_replica
from src.utils.redis_cache import cache

logger = logging.getLogger(__name__)

ns = Namespace("emails", description="Email related operations")

# Get encrypted emails for a user
@ns.route("/user/<int:user_id>/emails")
class UserEmails(Resource):
    @ns.doc(
        id="Get User Emails",
        description="Get all encrypted emails where the user is either the owner or has primary access",
        params={"user_id": "The user's ID"},
        responses={200: "Success", 400: "Bad Request", 500: "Server Error"},
    )
    @ns.expect(pagination_parser)
    @ns.marshal_with(encrypted_emails_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        args = pagination_parser.parse_args()
        limit = format_limit(args.get("limit"))
        offset = format_offset(args.get("offset"))

        db = get_db_read_replica()
        with db.scoped_session() as session:
            query = session.query(EncryptedEmail).filter(
                or_(
                    EncryptedEmail.email_address_owner_user_id == user_id,
                    EncryptedEmail.primary_access_user_id == user_id,
                )
            )
            emails = query.limit(limit).offset(offset).all()
            return make_response(emails)

# Get encryption key for a user with primary access
@ns.route("/user/<int:user_id>/encryption-key")
class UserEncryptionKey(Resource):
    @ns.doc(
        id="Get User Encryption Key",
        description="Get the encryption key for a user with primary access",
        params={"user_id": "The user's ID"},
        responses={200: "Success", 400: "Bad Request", 404: "Not Found", 500: "Server Error"},
    )
    @ns.marshal_with(email_encryption_key)
    @cache(ttl_sec=5)
    def get(self, user_id):
        db = get_db_read_replica()
        with db.scoped_session() as session:
            key = session.query(EmailEncryptionKey).filter(
                EmailEncryptionKey.primary_access_user_id == user_id
            ).first()
            if not key:
                abort_not_found("Encryption key", user_id)
            return key

# Get access keys for a user with delegated access
@ns.route("/user/<int:user_id>/access-keys")
class UserAccessKeys(Resource):
    @ns.doc(
        id="Get User Access Keys",
        description="Get all access keys where the user has delegated access",
        params={"user_id": "The user's ID"},
        responses={200: "Success", 400: "Bad Request", 500: "Server Error"},
    )
    @ns.expect(pagination_parser)
    @ns.marshal_with(email_access_keys_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        args = pagination_parser.parse_args()
        limit = format_limit(args.get("limit"))
        offset = format_offset(args.get("offset"))

        db = get_db_read_replica()
        with db.scoped_session() as session:
            query = session.query(EmailAccessKey).filter(
                EmailAccessKey.delegated_access_user_id == user_id
            )
            access_keys = query.limit(limit).offset(offset).all()
            return make_response(access_keys)
