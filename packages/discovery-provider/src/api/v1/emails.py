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
from src.api.v1.models.emails import (
    encrypted_email,
    email_encryption_key,
    email_grantee_key,
    encrypted_emails_response,
    email_encryption_keys_response,
    email_grantee_keys_response,
)
from src.models.emails.encrypted_emails import EncryptedEmail
from src.models.emails.email_encryption_keys import EmailEncryptionKey
from src.models.emails.email_grantee_keys import EmailGranteeKey
from src.utils.db_session import get_db_read_replica
from src.utils.redis_cache import cache

logger = logging.getLogger(__name__)

ns = Namespace("emails", description="Email related operations")

# Get encrypted emails for a seller
@ns.route("/seller/<int:seller_id>/emails")
class SellerEmails(Resource):
    @ns.doc(
        id="Get Seller Emails",
        description="Get all encrypted emails for a seller",
        params={"seller_id": "The seller's user ID"},
        responses={200: "Success", 400: "Bad Request", 500: "Server Error"},
    )
    @ns.expect(pagination_parser)
    @ns.marshal_with(encrypted_emails_response)
    @cache(ttl_sec=5)
    def get(self, seller_id):
        args = pagination_parser.parse_args()
        limit = format_limit(args.get("limit"))
        offset = format_offset(args.get("offset"))

        db = get_db_read_replica()
        with db.scoped_session() as session:
            emails = (
                session.query(EncryptedEmail)
                .filter(EncryptedEmail.seller_user_id == seller_id)
                .limit(limit)
                .offset(offset)
                .all()
            )
            return success_response({"data": emails})

# Get encryption key for a seller
@ns.route("/seller/<int:seller_id>/key")
class SellerKey(Resource):
    @ns.doc(
        id="Get Seller Key",
        description="Get the encryption key for a seller",
        params={"seller_id": "The seller's user ID"},
        responses={200: "Success", 400: "Bad Request", 404: "Not Found", 500: "Server Error"},
    )
    @ns.marshal_with(email_encryption_keys_response)
    @cache(ttl_sec=5)
    def get(self, seller_id):
        db = get_db_read_replica()
        with db.scoped_session() as session:
            key = (
                session.query(EmailEncryptionKey)
                .filter(EmailEncryptionKey.seller_user_id == seller_id)
                .first()
            )
            if not key:
                abort_not_found("Seller key", "seller_id", seller_id)
            return success_response({"data": [key]})

# Get grantee keys for a seller
@ns.route("/seller/<int:seller_id>/grantees")
class SellerGranteeKeys(Resource):
    @ns.doc(
        id="Get Seller Grantee Keys",
        description="Get all grantee keys for a seller",
        params={"seller_id": "The seller's user ID"},
        responses={200: "Success", 400: "Bad Request", 500: "Server Error"},
    )
    @ns.expect(pagination_parser)
    @ns.marshal_with(email_grantee_keys_response)
    @cache(ttl_sec=5)
    def get(self, seller_id):
        args = pagination_parser.parse_args()
        limit = format_limit(args.get("limit"))
        offset = format_offset(args.get("offset"))

        db = get_db_read_replica()
        with db.scoped_session() as session:
            grantee_keys = (
                session.query(EmailGranteeKey)
                .filter(EmailGranteeKey.seller_user_id == seller_id)
                .limit(limit)
                .offset(offset)
                .all()
            )
            return success_response({"data": grantee_keys})

# Get grantee keys for a grantee
@ns.route("/grantee/<int:grantee_id>/keys")
class GranteeKeys(Resource):
    @ns.doc(
        id="Get Grantee Keys",
        description="Get all encryption keys granted to a grantee",
        params={"grantee_id": "The grantee's user ID"},
        responses={200: "Success", 400: "Bad Request", 500: "Server Error"},
    )
    @ns.expect(pagination_parser)
    @ns.marshal_with(email_grantee_keys_response)
    @cache(ttl_sec=5)
    def get(self, grantee_id):
        args = pagination_parser.parse_args()
        limit = format_limit(args.get("limit"))
        offset = format_offset(args.get("offset"))

        db = get_db_read_replica()
        with db.scoped_session() as session:
            grantee_keys = (
                session.query(EmailGranteeKey)
                .filter(EmailGranteeKey.grantee_user_id == grantee_id)
                .limit(limit)
                .offset(offset)
                .all()
            )
            return success_response({"data": grantee_keys})
