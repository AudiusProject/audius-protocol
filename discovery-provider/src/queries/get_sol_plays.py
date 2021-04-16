import logging
from sqlalchemy import desc, func
from src.models import Play
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import paginate_query, get_track_play_counts

logger = logging.getLogger(__name__)

# Get single play from table
def get_sol_play(sol_tx_signature):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        base_query = (
            session.query(Play)
            .filter(
                Play.signature == sol_tx_signature
            )
        )
        query_results = base_query.all()
        sol_play = helpers.query_result_to_list(query_results)

    return sol_play


'''
TODO: Recalcute calculateTrackListenMilestones
Below is the distinct N query

select play_item_id from (
    select distinct(play_item_id), max(created_at) from plays group by play_item_id order by max desc limit 40
) as ab;

TODO: Use aggregate_plays instead for the count of each track
^ use get_track_play_count_dict

'''

def get_track_listen_milestones(limit):
    db = get_db_read_replica()
    logger.error("get_track_listen_milestones")

    with db.scoped_session() as session:
        subquery = (
            session.query(
                Play.play_item_id.distinct().label('play_item_id'),
                func.max(Play.created_at).label('max')
            ).group_by(
                Play.play_item_id
            ).order_by(
                desc("max")
            ).limit(
                limit
            ).subquery()
        )

        results = session.query(subquery.c.play_item_id).all()
        # TODO: Now get the number of plays for each of these tracks
        track_ids = [result[0] for result in results]
        track_id_play_counts = get_track_play_counts(session, track_ids)
        logger.error(track_id_play_counts)

    return track_id_play_counts
