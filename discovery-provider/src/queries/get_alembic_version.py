from typing import TypedDict, cast

import sqlalchemy
from src.utils import db_session


class AlembicVersion(TypedDict):
    version_num: str


def get_alembic_version() -> AlembicVersion:
    """
    Fetches the alembic version at head from the database
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        version = session.execute(
            sqlalchemy.text(
                """
                SELECT * FROM "alembic_version";
                """
            )
        ).first()
        return cast(AlembicVersion, dict(version))
