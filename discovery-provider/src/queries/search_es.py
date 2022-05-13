from src.utils.elasticdsl import esclient, pluck_hits


def search_es_full(args: dict):
    if not esclient:
        raise Exception("esclient is None")

    # taken from search_queries.py
    search_str = args.get("query")
    current_user_id = args.get("current_user_id")

    dsl = {
        "function_score": {
            "query": {
                "bool": {
                    "must": [
                        {
                            "multi_match": {
                                "query": search_str,
                                "fields": [
                                    "title^2",
                                    "artist.name",
                                    "artist.handle",
                                ],
                                "type": "cross_fields",
                            }
                        },
                        {"term": {"is_unlisted": {"value": False}}},
                    ],
                    "should": [
                        {"term": {"saved_by": {"value": current_user_id}}},
                        {"term": {"reposted_by": {"value": current_user_id}}},
                    ],
                }
            },
            "field_value_factor": {
                "field": "repost_count",
                "factor": 1.2,
                "modifier": "log1p",
            },
        }
    }

    found = esclient.search(index="tracks", query=dsl)
    return {"tracks": pluck_hits(found)}
