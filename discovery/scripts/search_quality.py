"""

This search quality script is an end to end "smoke test"
that is meant to be run against production data in an ES index.

It does searches for existing production data like "deadmau5"
to ensure that results are ranking as expected.

When making changes to search algo you should add new asserts
and make sure existing asserts don't break.

To run it is a bit manual atm because of the production data requirements.
Here is what I do:

* spin up a "sandbox" production machine using --seed option in audius-docker-compose
  wait for everything to be indexed.

* edit `discovery/docker-compose.yml` to expose ES port 9200:

        +    ports:
        +      - "9200:9200"

* get the "internal" GCP IP address for sandbox machine (e.g. 10.x.x.x)

    export audius_elasticsearch_url=http://10.x.y.z:9200

* verify working and indexes + aliases exist:

    curl $audius_elasticsearch_url/_cat/indices
    curl $audius_elasticsearch_url/_cat/aliases

* finally, run the script:

    PYTHONPATH=. python scripts/search_quality.py 

If you want to focus on a specific search, specify a filter as second arg:

    PYTHONPATH=. python scripts/search_quality.py stereo

"""

import sys

from src.queries.search_es import search_es_full

filter = ""
if len(sys.argv) == 2:
    filter = sys.argv[1].lower()
    print("filter:", filter)


def test_search(args, asserts=None):
    if filter and filter not in args["query"].lower():
        return

    print("\n\n==========", args)
    found = search_es_full(args)
    search_type = args.get("kind", "all")
    asserts = asserts or {}

    def print_entity(title):
        entities = found.get(title)
        if not entities:
            return
        print(f"\n[ {title} ]")

        for entity in entities:
            print(
                "   ",
                [
                    entity["suggest"],
                    f"{entity['repost_count']} reposts",
                    f"{entity['user']['follower_count']} followers",
                    f"{entity.get('_score')} score",
                ],
            )

        # assert stuff
        expected = asserts.get(title, [])
        actual = [user["suggest"] for user in entities]
        for idx, (want, got) in enumerate(zip(expected, actual)):
            assert (
                want == got
            ), f"title: {title}, query: {args['query']}, idx: {idx}, wanted: '{want}', got: '{got}'"

    def print_users(title):
        users = found[title]

        if not users:
            return

        print(f"\n[ {title} ]")

        for user in users:
            print(
                "   ",
                [
                    user["suggest"],
                    f"{user.get('follower_count')} followers",
                    f"{user.get('is_verified')} verified",
                    f"{user.get('_score')} score",
                ],
            )

        # assert stuff
        expected = asserts.get(title, [])
        actual = [user["suggest"] for user in users]
        for idx, (want, got) in enumerate(zip(expected, actual)):
            assert (
                want == got
            ), f"query: {args['query']}, idx: {idx}, wanted: '{want}', got: '{got}'"

    if search_type == "tracks" or search_type == "all":
        print_entity("tracks")
        print_entity("saved_tracks")
    if search_type == "users" or search_type == "all":
        print_users("users")
        print_users("followed_users")
    if search_type == "playlists" or search_type == "all":
        print_entity("playlists")
        print_entity("saved_playlists")
    if search_type == "albums" or search_type == "all":
        print_entity("albums")
        print_entity("saved_albums")


test_search({"query": "space fm lido", "limit": 3, "kind": "tracks"})

# misspell
test_search(
    {"query": "issac solo", "limit": 3, "kind": "users"},
    {"users": ["isaacsolo Isaac Solo"]},
)


test_search(
    {
        "query": "the cycle of change",
        "limit": 4,
        "is_auto_complete": True,
    }
)


test_search(
    {
        "query": "isaac pho",
        "limit": 4,
        "is_auto_complete": True,
    },
    {
        "tracks": ["you took that photo isaacsolo Isaac Solo"],
    },
)

test_search(
    {
        "query": "RAC wat",
        "limit": 4,
        "current_user_id": 1,
        "is_auto_complete": True,
    },
    {
        "tracks": ["Water Dungeon RAC RAC"],
    },
)

test_search(
    {
        "query": "RAC water",
        "limit": 4,
        "current_user_id": 1,
        "is_auto_complete": False,
    },
    {
        "tracks": ["Water Dungeon RAC RAC"],
    },
)

test_search(
    {
        "query": "deadmau",
        "limit": 4,
        "current_user_id": 1,
        "is_auto_complete": False,
    },
    {
        "users": ["deadmau5 deadmau5"],
    },
)

test_search(
    {
        "query": "waterfal",
        "limit": 10,
        "current_user_id": 1,
        "is_auto_complete": True,
    },
    {
        "tracks": ["Waterfall disclosure Disclosure"],
    },
)

test_search(
    {
        "query": "closer 2 u ray",
        "limit": 4,
        "current_user_id": 1,
        "is_auto_complete": True,
    },
    {
        "tracks": ["Closer 2 U (feat. Manila Killa) slowmagic Slow Magic"],
        "saved_tracks": ["Closer 2 U (feat. Manila Killa) slowmagic Slow Magic"],
    },
)
test_search(
    {
        "query": "raymont",
        "limit": 4,
        "current_user_id": 1,
        "is_auto_complete": True,
    },
    {"users": ["rayjacobson raymont"]},
)

test_search(
    {
        "query": "low",
        "limit": 4,
        "current_user_id": 14,
        "is_auto_complete": True,
    }
)

test_search(
    {
        "query": "stereosteve guitar",
        "limit": 4,
        "current_user_id": 1,
        "is_auto_complete": True,
    },
    {
        "tracks": ["Sunny Side of the Street stereosteve stereosteve"],
        "saved_tracks": ["Sunny Side of the Street stereosteve stereosteve"],
    },
)

test_search(
    {
        "query": "guitar garbage",
        "limit": 4,
        "current_user_id": 1,
        "is_auto_complete": True,
    },
    {
        # still comes in second place... but I'm okay with that :(
        # "tracks": ["Guitar Garbage stereosteve stereosteve"],
    },
)

test_search(
    {
        "query": "skrillex",
        "limit": 4,
        "current_user_id": 1,
        "is_auto_complete": True,
    },
    {
        "users": ["Skrillex Skrillex"],
    },
)

test_search(
    {
        "query": "camo",
        "limit": 4,
        "is_auto_complete": True,
    },
    {"users": ["camouflybeats camoufly 🌟"]},
)

test_search(
    {
        "query": "zouai",
        "limit": 4,
        "is_auto_complete": True,
    }
)

test_search(
    {
        "query": "los xl",
        "limit": 4,
        "is_auto_complete": True,
    },
    {
        "users": ["LosXL Los XL"],
    },
)

test_search(
    {
        "query": "death to soundcloud",
        "limit": 4,
        "kind": "tracks",
        "is_auto_complete": True,
    },
    {
        "tracks": ["Death To Soundcloud kidbuu Kid Buu"],
    },
)

test_search(
    {
        "query": "glacier cave",
        "limit": 4,
        "kind": "tracks",
        "is_auto_complete": True,
    }
)

test_search(
    {
        "query": "stereo steve",
        "limit": 4,
        "kind": "users",
        "is_auto_complete": True,
    },
    # {
    #     "users": "stereosteve",
    # },
)

test_search(
    {
        "query": "stereo steve",
        "limit": 4,
        "kind": "users",
        "is_auto_complete": True,
    },
    # {
    #     "users": "stereosteve",
    # },
)

# Dillon Francis

test_search(
    {
        "query": "Dillon Francis",
        "limit": 4,
        "kind": "users",
        "is_auto_complete": True,
    },
    {
        "users": "DillonFrancis dillonfrancis",
    },
)

print("\n\n")
