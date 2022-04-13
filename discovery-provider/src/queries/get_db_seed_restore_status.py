import logging  # pylint: disable=C0302

import sqlalchemy
from src.utils.config import shared_config
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)

env = shared_config["discprov"]["env"]

# environment to db file md5 hash lookup, these are constants and will not change
env_to_hash_lookup = {"prod": "c785fc03cfc9cca3e8a48226b9cd424b"}

# global variables - will be updated by get_db_seed_restore_status function
has_restored = None
seed_hash = None


def get_db_seed_restore_status():
    global has_restored
    global seed_hash

    # early exit, no need to run this query multiple times since this won't change once the server has booted up
    logger.info(
        f"get_db_seed_restore_status before - has_restored {has_restored}, seed_hash {seed_hash}"
    )
    if has_restored is not None:
        return has_restored, seed_hash

    db = get_db_read_replica()
    with db.scoped_session() as session:
        db_seed_restore_status_query = sqlalchemy.text(
            """
            SELECT md5(cast(array_agg(sorted_hashes."str" ORDER BY sorted_hashes."str" ASC) as text)) FROM (
                SELECT (CAST("user_id" AS VARCHAR) || CAST("blocknumber" AS VARCHAR) || "txhash") as "str"
                FROM "users"
                WHERE "updated_at" BETWEEN '09-01-2021' AND '02-01-2022'
                ORDER BY "user_id" ASC, "blocknumber" ASC, "txhash" ASC
            ) as sorted_hashes;
            """
        )
        db_hash = session.execute(db_seed_restore_status_query).fetchone()[0]

        env_hash = env_to_hash_lookup.get(env, None)
        if env_hash and env_hash == db_hash:
            has_restored = True
        else:
            has_restored = False

        seed_hash = db_hash

        logger.info(
            f"get_db_seed_restore_status after - has_restored {has_restored}, seed_hash {seed_hash}"
        )
        return has_restored, seed_hash
