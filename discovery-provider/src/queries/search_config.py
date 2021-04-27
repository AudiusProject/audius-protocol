import logging

# Global

# Threshold for lexeme similarity, in [0, 1].
# Lower values are slower and match more rows, higher values are quicker
# but may exclude viable candidates.
min_search_similarity = 0.4

# Tracks

# Weight for query similarity against title
track_title_weight = 0.7
# Weight for query similarity to words in track title (summed)
track_similarity_weight = 5
# Weight for query similarity to track owner's username
track_user_name_weight = 8
# Weight for track reposts.
track_repost_weight = 10
track_title_exact_match_boost = 5
track_handle_exact_match_boost = 20
track_user_name_exact_match_boost = 5

# Playlists

# Weight for playlist reposts
playlist_repost_weight = 20
# Weight for similarity between query and playlist owner username
playlist_user_name_weight = 8
# Weight for similarity between query and playlist name
playlist_name_weight = 2
playlist_name_exact_match_boost = 5
playlist_handle_exact_match_boost = 10
playlist_user_name_exact_match_boost = 5

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
