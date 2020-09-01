import sqlalchemy

trackTitleWeight = 0.7
userNameWeight = 0.7
playlistNameWeight = 0.7
minSearchSimilarity = 0.1


def set_search_similarity(session):
    """
    Sets the search similarity threshold to be used by % operator in queries.
    https://www.postgresql.org/docs/9.6/pgtrgm.html

    Note: set_limit was replaced by pg_trgm.similarity_threshold in PG 9.6.
    https://stackoverflow.com/a/11250001/11435157
    """
    session.execute(sqlalchemy.text(
        f"SET pg_trgm.similarity_threshold = {minSearchSimilarity}"
    ))
