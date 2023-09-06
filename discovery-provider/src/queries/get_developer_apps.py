import logging
from typing import Dict, List, Optional

from sqlalchemy import asc, func, text

from src.models.grants.developer_app import DeveloperApp
from src.models.grants.grant import Grant
from src.utils import db_session
from src.utils.helpers import model_to_dictionary, query_result_to_list

logger = logging.getLogger(__name__)


def get_developer_apps_by_user(user_id: int) -> List[Dict]:
    """
    Returns developer apps belonging to user

    Args:
        id: Int user id

    Returns:
        List of developer apps
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        developer_apps = (
            session.query(DeveloperApp)
            .filter(
                DeveloperApp.user_id == user_id,
                DeveloperApp.is_current == True,
                DeveloperApp.is_delete == False,
            )
            .all()
        )
        return query_result_to_list(developer_apps)


def get_developer_app_by_address(address: str) -> Optional[DeveloperApp]:
    """
    Returns developer app matching given address ("API Key" + 0x prefix)

    Args:
        address: Address of developer app

    Returns:
        developer app
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        developer_app = (
            session.query(DeveloperApp)
            .filter(
                func.lower(DeveloperApp.address) == address.lower(),
                DeveloperApp.is_current == True,
                DeveloperApp.is_delete == False,
            )
            .first()
        )
        if developer_app:
            return model_to_dictionary(developer_app)
        else:
            return None


sql = text(
    """
SELECT
    deveoper_apps.*
    , grants.created_at as grant_created_at
    , grants.updated_at as grand_updated_at
from
    developer_apps
    left join developer_apps on grants.grantee_address = developer_apps.address
where
    grants.is_revoked = false
    and developer_apps.is_delete = false
    and developer_apps.is_current = true
    and grants.is_current = true
    and grants.user_id = :user_id
order by
    grants.updated_at asc;
"""
)


def get_developer_apps_with_grant_for_user(user_id: int) -> List[Dict]:
    """
    Returns developer apps that are authorized to act on user's account

    Args:
        id: Int user id

    Returns:
        List of developer apps
    """

    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        rows = (
            session.query(
                DeveloperApp.address,
                DeveloperApp.name,
                DeveloperApp.description,
                Grant.user_id.label("grantor_user_id"),
                Grant.created_at.label("grant_created_at"),
                Grant.updated_at.label("grant_updated_at"),
            )  # Note: will want to grab Grant permissions too once we have those
            .outerjoin(Grant, Grant.grantee_address == DeveloperApp.address)
            .filter(
                Grant.user_id == user_id,
                Grant.is_revoked == False,
                Grant.is_current == True,
                DeveloperApp.is_current == True,
                DeveloperApp.is_delete == False,
            )
            .order_by(asc(Grant.updated_at))
            .all()
        )
        return [
            {
                "address": row[0],
                "name": row[1],
                "description": row[2],
                "grantor_user_id": row[3],
                "grant_created_at": row[4],
                "grant_updated_at": row[5],
            }
            for row in rows
        ]
