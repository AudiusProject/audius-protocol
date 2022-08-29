import json

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

    found = esclient.search(
        index=ES_USERS,
        query={"terms": {"wallet": wallets}},
    )

    # kind of strange to populate_user_metadata_es for user with user
    # but this does match what upstream code does
    users = [populate_user_metadata_es(u, u) for u in pluck_hits(found)]
    user_ids = [u["user_id"] for u in users]
    if not users:
        return

    # saved playlists
    playlists = pluck_hits(
        esclient.search(
            index=ES_PLAYLISTS,
            size=5000,
            query={
                "bool": {
                    "should": [
                        {"terms": {"saved_by": user_ids}},
                        {"terms": {"playlist_owner_id": user_ids}},
                    ]
                }
            },
        )
    )

    playlist_owner_ids = list({p["playlist_owner_id"] for p in playlists})
    user_map = {}
    if playlist_owner_ids:
        user_map = hits_by_id(esclient.mget(index=ES_USERS, ids=playlist_owner_ids))

    for user in users:
        user_id = user["user_id"]
        stripped_playlists = []
        my_playlists = [
            p
            for p in playlists
            if p["playlist_owner_id"] == user_id or user_id in p["saved_by"]
        ]
        for playlist in my_playlists:
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

    return users[0]


if __name__ == "__main__":
    user = get_users_account_es(
        {"wallet": "0x7d273271690538cf855e5b3002a0dd8c154bb060"}
    )
    print(json.dumps(user, indent=2))

    user = get_users_account_es({"wallet": "0xNotFound"})
    print(json.dumps(user, indent=2))
