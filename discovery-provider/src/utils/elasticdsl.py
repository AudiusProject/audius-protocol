import os

from elasticsearch import Elasticsearch

es_url = os.getenv("ES_URL", "http://elasticsearch:9200")
esclient = Elasticsearch(es_url)

ES_PLAYLISTS = "playlists1"
ES_REPOSTS = "reposts1"
ES_SAVES = "saves1"
ES_TRACKS = "tracks1"
ES_USERS = "users1"


def listify(things):
    if isinstance(things, list):
        return [str(t) for t in things]
    return [str(things)]


def pluck_hits(found):
    return [h["_source"] for h in found["hits"]["hits"]]


def docs_and_ids(found, id_set=False):
    docs = []
    ids = []
    for hit in found["hits"]["hits"]:
        docs.append(hit["_source"])
        ids.append(hit["_id"])
    if id_set:
        ids = set(ids)
    return docs, ids


def hits_by_id(found):
    return {h["_id"]: h["_source"] for h in found["hits"]["hits"]}


omit_keys = [
    # user index
    "following_ids",
    "follower_ids",
    "tracks",
    # track index
    "reposted_by",
    "saved_by",
    # saves + reposts
    "item_key",
]


def omit_indexed_fields(doc):
    for key in omit_keys:
        if key in doc:
            del doc[key]
    if "tags" in doc and isinstance(doc["tags"], list):
        doc["tags"] = ",".join(doc["tags"])
    return doc
