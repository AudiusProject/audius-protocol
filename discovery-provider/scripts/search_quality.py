from src.queries.search_es import search_es_full


def test_search(args):
    print("\n\n==========", args)
    found = search_es_full(args)
    search_type = args.get("kind", "all")

    def print_entity(title, entities):
        if not entities:
            return
        print(f"\n[ {title} ]")
        for entity in entities:
            print(
                "   ",
                [
                    entity["user"]["handle"],
                    entity["user"]["name"],
                    entity.get("title") or entity.get("playlist_name"),
                    f"{entity['repost_count']} reposts",
                    f"{entity['user']['follower_count']} followers",
                    f"{entity.get('_score')} score",
                ],
            )

    def print_users(title, users):
        if not users:
            return
        print(f"\n[ {title} ]")
        for user in users:
            print(
                "   ",
                [
                    user["handle"],
                    user["name"],
                    f"{user.get('follower_count')} followers",
                    f"{user.get('is_verified')} verified",
                    f"{user.get('_score')} score",
                ],
            )

    if search_type == "tracks" or search_type == "all":
        print_entity("tracks", found["tracks"])
        print_entity("saved tracks", found["saved_tracks"])
    if search_type == "users" or search_type == "all":
        print_users("users", found["users"])
        print_users("followed_users", found["followed_users"])
    if search_type == "playlists" or search_type == "all":
        print_entity("playlists", found["playlists"])
        print_entity("saved_playlists", found["saved_playlists"])
    if search_type == "albums" or search_type == "all":
        print_entity("albums", found["albums"])
        print_entity("saved_albums", found["saved_albums"])


test_search({"query": "space fm lido", "limit": 3, "kind": "tracks"})

test_search({"query": "issac solo", "limit": 3, "kind": "users"})  # misspell


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
    }
)

test_search(
    {
        "query": "RAC wat",
        "limit": 4,
        "current_user_id": 1,
        "is_auto_complete": True,
    }
)
test_search(
    {
        "query": "RAC water",
        "limit": 4,
        "current_user_id": 1,
        "is_auto_complete": False,
    }
)

test_search(
    {
        "query": "deadmau",
        "limit": 4,
        "current_user_id": 1,
        "is_auto_complete": False,
    }
)

# should have disclosure at the top
test_search(
    {
        "query": "waterfal",
        "limit": 10,
        "current_user_id": 1,
        "is_auto_complete": True,
    }
)

test_search(
    {
        "query": "closer 2 u ray",
        "limit": 4,
        "current_user_id": 1,
        "is_auto_complete": True,
    }
)
test_search(
    {
        "query": "raymont",
        "limit": 4,
        "current_user_id": 1,
        "is_auto_complete": True,
    }
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
    }
)

test_search(
    {
        "query": "skrillex",
        "limit": 4,
        "current_user_id": 1,
        "is_auto_complete": True,
    }
)

test_search(
    {
        "query": "camo",
        "limit": 4,
        "is_auto_complete": True,
    }
)

test_search(
    {
        "query": "zouai",
        "limit": 4,
        "is_auto_complete": True,
    }
)

print("\n\n")
