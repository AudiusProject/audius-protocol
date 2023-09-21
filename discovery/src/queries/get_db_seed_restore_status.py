import sqlalchemy

from src.utils.config import shared_config
from src.utils.db_session import get_db_read_replica

env = shared_config["discprov"]["env"]

# environment to db file md5 hash lookup, these are constants and will not change
env_to_hash_lookup = {"prod": "c785fc03cfc9cca3e8a48226b9cd424b"}


def get_db_seed_restore_status():
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
        has_restored = False
        seed_hash = db_hash

        if env_hash and env_hash == db_hash:
            has_restored = True

        return has_restored, seed_hash
