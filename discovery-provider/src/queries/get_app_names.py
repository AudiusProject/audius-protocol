import logging
from sqlalchemy import asc

from src.models import AppNameMetrics
from src.utils import db_session

logger = logging.getLogger(__name__)

def get_app_names(args):
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        app_names = (
            session
                .query(AppNameMetrics.application_name)
                .group_by(AppNameMetrics.application_name)
                .order_by(asc(AppNameMetrics.application_name))
                .limit(args.get('limit'))
                .offset(args.get('offset'))
                .all()
        )

        names = [{'name': app_name[0]} for app_name in app_names]
        return names
