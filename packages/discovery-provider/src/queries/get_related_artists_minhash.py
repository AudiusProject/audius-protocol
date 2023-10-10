import datetime

from datasketch import MinHash, MinHashLSHForest
from psycopg2.extras import execute_values
from sqlalchemy.orm import Session

top_k = 100
num_perm = 256

# was 200 before, but since mh.count() is aprox.
# and we filter on >= 200 in get_related_artists query
# set to 150 here
MIN_FOLLOWER_REQUIREMENT = 150


def build_minhash(session: Session):
    engine = session.get_bind()
    connection = engine.raw_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            select
                followee_user_id,
                array_agg(follower_user_id)
            from follows
            join aggregate_user on followee_user_id = aggregate_user.user_id
            where is_current and not is_delete
            and track_count > 0
            group by 1
            """
        )

        forest = MinHashLSHForest(num_perm=num_perm)

        user_mh = {}
        follower_counts = {}

        for user_id, follower_ids in cursor:
            ids = [str(id).encode("utf8") for id in follower_ids]
            mh = MinHash(num_perm=num_perm)
            mh.update_batch(ids)

            user_mh[user_id] = mh
            follower_counts[user_id] = len(follower_ids)
            forest.add(user_id, mh)
        forest.index()
        return (user_mh, forest)

    finally:
        connection.commit()
        connection.close()


def update_related_artist_minhash(session: Session):
    (user_mh, forest) = build_minhash(session)

    engine = session.get_bind()
    connection = engine.raw_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("truncate table related_artists;")

        for user_id, mh in user_mh.items():
            if mh.count() < MIN_FOLLOWER_REQUIREMENT:
                continue

            # overfetch with rescore to improve accuracy:
            # http://ekzhu.com/datasketch/lshforest.html#tips-for-improving-accuracy
            similar = forest.query(mh, top_k * 5)
            created_at = datetime.datetime.now()

            rows = []
            for other_id in similar:
                if other_id == user_id:
                    continue
                mh2 = user_mh[other_id]

                # default datasketch score would come from jaccard estimation
                # score = mh.jaccard(mh2)

                # this attempts to match previous formula
                # https://github.com/AudiusProject/audius-protocol/blob/ddda462014ecdfd588f2834d07bf0a6066c56487/discovery-provider/src/queries/get_related_artists.py#L95-L98
                union = MinHash.union(mh, mh2)
                intersection_size = mh.count() + mh2.count() - union.count()
                score = intersection_size * intersection_size / mh2.count()

                rows.append((user_id, other_id, score, created_at))

            rows = sorted(rows, key=lambda x: x[2], reverse=True)[:top_k]

            insert_query = "insert into related_artists (user_id, related_artist_user_id, score, created_at) values %s"
            execute_values(cursor, insert_query, rows, template=None, page_size=100000)

    finally:
        connection.commit()
        connection.close()
