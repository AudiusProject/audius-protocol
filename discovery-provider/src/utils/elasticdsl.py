import os

from elasticsearch import Elasticsearch

es_url = os.getenv("ES_URL", "http://elasticsearch:9200")
esclient = Elasticsearch(es_url)


def listify(things):
    if isinstance(things, list):
        return [str(t) for t in things]
    return [str(things)]


def hits(found):
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
]


def omit_indexed_fields(doc):
    for key in omit_keys:
        if key in doc:
            del doc[key]
    return doc
