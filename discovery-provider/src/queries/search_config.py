import logging

# Global

# Threshold for lexeme similarity, in [0, 1].
# Lower values are slower and match more rows, higher values are quicker
# but may exclude viable candidates.
min_search_similarity = 0.4

# Playlist and Track Search Weights

# Weight for query similarity against title
search_title_weight = 2
# Weight for query similarity to words in track title (summed)
search_similarity_weight = 5
# Weight for query similarity to track owner's username
search_user_name_weight = 8
# Weight for track reposts.
search_repost_weight = 15
search_title_exact_match_boost = 10
search_handle_exact_match_boost = 15
search_user_name_exact_match_boost = 5

# Users

# Weight for similarity between query and user name
user_name_weight = 0.7
# Weight for user follower count (logged)
user_follower_weight = 0.5
# Boost for exact handle match
user_handle_exact_match_boost = 10

logger = logging.getLogger(__name__)


def set_search_similarity(cursor):
    """
    Sets the search similarity threshold to be used by % operator in queries.
    https://www.postgresql.org/docs/9.6/pgtrgm.html

    Note: set_limit was replaced by pg_trgm.similarity_threshold in PG 9.6.
    https://stackoverflow.com/a/11250001/11435157
    """
    try:
        cursor.execute(
            f"SET pg_trgm.similarity_threshold = {min_search_similarity}"
        )
    except Exception as e:
        logger.error(f"Unable to set similarity_threshold: {e}")
