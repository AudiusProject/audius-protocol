from src.utils.elasticdsl import (
    ES_PLAYLISTS,
    ES_USERS,
    esclient,
    hits_by_id,
    pluck_hits,
    populate_user_metadata_es,
)


def get_users_account_es(args):

    wallets = args.get("wallet")
    if isinstance(wallets, str):
        wallets = [wallets]
    wallets = [w.lower() for w in wallets]

    found = esclient.search(
        index=ES_USERS,
        query={"terms": {"wallet": wallets}},
    )

    # kind of strange to populate_user_metadata_es for user with user
    # but this does match what upstream code does
    users = [populate_user_metadata_es(u, u) for u in pluck_hits(found)]
    if not users:
        return

    user = users[0]
    user_id = user["user_id"]

    # saved playlists
    playlists = pluck_hits(
        esclient.search(
            index=ES_PLAYLISTS,
            size=5000,
            source=["playlist_id", "playlist_name", "is_album", "playlist_owner_id"],
            query={
                "bool": {
                    "should": [
                        {"term": {"saved_by": user_id}},
                        {"term": {"playlist_owner_id": user_id}},
                    ]
                }
            },
        )
    )

    playlist_owner_ids = list({p["playlist_owner_id"] for p in playlists})
    user_map = {}
    if playlist_owner_ids:
        user_map = hits_by_id(
            esclient.mget(
                index=ES_USERS,
                ids=playlist_owner_ids,
                source=["user_id", "handle", "is_deactivated"],
            )
        )

    stripped_playlists = []
    for playlist in playlists:
        playlist_owner = user_map[str(playlist["playlist_owner_id"])]
        stripped_playlist = {
            "id": playlist["playlist_id"],
            "name": playlist["playlist_name"],
            "is_album": playlist["is_album"],
            "user": {
                "id": playlist_owner["user_id"],
                "handle": playlist_owner["handle"],
            },
        }
        if playlist_owner["is_deactivated"]:
            stripped_playlist["user"]["is_deactivated"] = True
        stripped_playlists.append(stripped_playlist)
    user["playlists"] = stripped_playlists

    return user
