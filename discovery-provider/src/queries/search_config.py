import logging

trackTitleWeight = 0.7
userNameWeight = 0.7
playlistNameWeight = 0.7
minSearchSimilarity = 0.3


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
            f"SET pg_trgm.similarity_threshold = {minSearchSimilarity}"
        )
    except Exception as e:
        logger.error(f"Unable to set similarity_threshold: {e}")
