from src.queries.search_es import search_es_full


def test_search(args):
    print("\n\n==========", args)
    found = search_es_full(args)
    search_type = args.get("kind", "all")

    def print_tracks(title, tracks):
        print(f"\n[ {title} ]")
        for track in tracks:
            print(
                "   ",
                [
                    track["user"]["handle"],
                    track["user"]["name"],
                    track["title"],
                    f"{track['repost_count']} reposts",
                    f"{track['user']['follower_count']} followers",
                    f"{track.get('_score')} score",
                ],
            )

    def print_users(title, users):
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
        print_tracks("tracks", found["tracks"])
        print_tracks("saved tracks", found["saved_tracks"])
    if search_type == "users" or search_type == "all":

        print_users("users", found["users"])
        print_users("followed_users", found["followed_users"])


test_search(
    {
        "query": "isaac pho",
        "limit": 4,
        "is_auto_complete": True,
    }
)


# test_search(
#     {
#         "query": "isaac pho",
#         "limit": 4,
#         "is_auto_complete": True,
#     }
# )
# test_search(
#     {
#         "query": "isaac photo",
#         "limit": 4,
#         "current_user_id": 1,
#         "is_auto_complete": False,
#     }
# )
# test_search(
#     {
#         "query": "RAC wat",
#         "limit": 4,
#         "current_user_id": 1,
#         "is_auto_complete": True,
#     }
# )
# test_search(
#     {
#         "query": "RAC water",
#         "limit": 4,
#         "current_user_id": 1,
#         "is_auto_complete": False,
#     }
# )

# test_search(
#     {
#         "query": "deadmau",
#         "limit": 4,
#         "current_user_id": 1,
#         "is_auto_complete": False,
#     }
# )

# # should have disclosure at the top
# test_search(
#     {
#         "query": "waterfal",
#         "limit": 10,
#         "current_user_id": 1,
#         "is_auto_complete": True,
#     }
# )

# test_search(
#     {
#         "query": "closer 2 u ray",
#         "limit": 4,
#         "current_user_id": 1,
#         "is_auto_complete": True,
#     }
# )
# test_search(
#     {
#         "query": "raymont",
#         "limit": 4,
#         "current_user_id": 1,
#         "is_auto_complete": True,
#     }
# )

# test_search(
#     {
#         "query": "low",
#         "limit": 4,
#         "current_user_id": 14,
#         "is_auto_complete": True,
#     }
# )

# test_search(
#     {
#         "query": "stereosteve guitar",
#         "limit": 4,
#         "current_user_id": 1,
#         "is_auto_complete": True,
#     }
# )

# test_search(
#     {
#         "query": "skrillex",
#         "limit": 4,
#         "current_user_id": 1,
#         "is_auto_complete": True,
#     }
# )

# test_search(
#     {
#         "query": "camo",
#         "limit": 4,
#         "is_auto_complete": True,
#     }
# )

# test_search(
#     {
#         "query": "that looks good",
#         "limit": 4,
#         "current_user_id": 1,
#         "is_auto_complete": True,
#     }
# )

# test_search(
#     {
#         "query": "fall in love",
#         "limit": 4,
#         "current_user_id": 1,
#         "is_auto_complete": True,
#     }
# )

# test_search(
#     {
#         "query": "only yesterday",
#         "limit": 4,
#         "current_user_id": 1,
#         "is_auto_complete": True,
#     }
# )

# test_search(
#     {
#         "query": "with music",
#         "limit": 4,
#         "current_user_id": 1,
#         "is_auto_complete": True,
#     }
# )

# test_search(
#     {
#         "query": "all night",
#         "limit": 4,
#         "current_user_id": 1,
#         "is_auto_complete": True,
#     }
# )

# test_search(
#     {
#         "query": "one and only",
#         "limit": 4,
#         "current_user_id": 1,
#         "is_auto_complete": True,
#     }
# )

print("\n\n")
