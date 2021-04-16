from sqlalchemy import desc
from src.models import Play
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import paginate_query

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

select play_item_id from (select distinct(play_item_id), max(created_at) from plays group by play_item_id order by max desc limit 40) as ab;

TODO: Use aggregate_plays instead for the count of each track
^ use get_track_play_count_dict

'''