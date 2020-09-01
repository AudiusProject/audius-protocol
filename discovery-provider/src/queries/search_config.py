import sqlalchemy

trackTitleWeight = 0.7
userNameWeight = 0.7
playlistNameWeight = 0.7
minSearchSimilarity = 0.1


def set_search_similarity(session):
    """
    Sets the search similarity threshold to be used by % operator in queries.
    """
    session.execute(sqlalchemy.text(
        f"SET pg_trgm.similarity_threshold = {minSearchSimilarity}"
    ))
