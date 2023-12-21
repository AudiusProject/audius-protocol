# track/playlist metadata
repost_count = "repost_count"  # integer - total repost count of given track/playlist
save_count = "save_count"  # integer - total save count of given track/playlist
play_count = "play_count"  # integer - total play count of given track
total_play_count = "total_play_count"  # integer - total play count of a given playlist
# boolean - has current user reposted given track/playlist
has_current_user_reposted = "has_current_user_reposted"
# boolean - has current user saved given track/playlist
has_current_user_saved = "has_current_user_saved"
# array - followees of current user that have reposted given track/playlist
followee_reposts = "followee_reposts"
# array - followees of current user that have saved given track/playlist
followee_saves = "followee_saves"
# json - determines stream and download access for current user
access = "access"
# represents the signature for track access
# todo: remove once clients catch up and no longer use this field
premium_content_signature = "premium_content_signature"

# remix track specific
remix_of = "remix_of"  # dictionary - contains an array of parent track ids
# boolean - does the remix track author repost the track
has_remix_author_reposted = "has_remix_author_reposted"
# boolean - does the remix track author favorite the track
has_remix_author_saved = "has_remix_author_saved"

# user metadata
user_id = "user_id"  # integer - unique id of a user
follower_count = "follower_count"  # integer - total follower count of given user
followee_count = "followee_count"  # integer - total followee count of given user
# integer - total count of playlists created by given user
playlist_count = "playlist_count"
# integer - total count of albums created by given user (0 for all non-creators)
album_count = "album_count"
track_count = "track_count"  # integer - total count of tracks created by given user
# integer - total count of tracks saves created by given user
track_save_count = "track_save_count"
created_at = "created_at"  # datetime - time track was created
repost_count = "repost_count"  # integer - total count of reposts by given user
# integer - blocknumber of latest track for user
track_blocknumber = "track_blocknumber"
windowed_repost_count = "windowed_repost_count"
windowed_save_count = "windowed_save_count"
balance = "balance"
total_balance = "total_balance"
# human-readable form of total_balance
total_audio_balance = "total_audio_balance"
associated_wallets_balance = "associated_wallets_balance"
associated_sol_wallets_balance = "associated_sol_wallets_balance"
waudio_balance = "waudio_balance"
erc_wallet = "erc_wallet"
spl_wallet = "spl_wallet"
supporter_count = "supporter_count"
supporting_count = "supporting_count"

# current user specific
# boolean - does current user follow given user
does_current_user_follow = "does_current_user_follow"
# boolean - does current user subscribe to given user
does_current_user_subscribe = "does_current_user_subscribe"
# integer - number of followees of current user that also follow given user
current_user_followee_follow_count = "current_user_followee_follow_count"
# boolean - has current user tipped given user
does_current_user_support = "does_current_user_support"
# boolean - has given user tipped current user
does_support_current_user = "does_support_current_user"

# feed
# string - timestamp of relevant activity on underlying object, used for sorting
activity_timestamp = "activity_timestamp"

track_owner_follower_count = "track_owner_follower_count"
track_owner_id = "track_owner_id"
track_id = "track_id"
playlist_id = "playlist_id"
owner_id = "owner_id"
listen_counts = "listen_counts"

tracks = "tracks"
albums = "albums"
playlists = "playlists"
user = "user"

# notifications metadata
notification_type = "type"
notification_type_follow = "Follow"
notification_type_favorite = "Favorite"
notification_type_repost = "Repost"
notification_type_create = "Create"
notification_type_remix_create = "RemixCreate"
notification_type_remix_cosign = "RemixCosign"
notification_type_playlist_update = "PlaylistUpdate"
notification_type_tier_change = "TierChange"
notification_type_add_track_to_playlist = "AddTrackToPlaylist"

notification_blocknumber = "blocknumber"
notification_initiator = "initiator"
notification_metadata = "metadata"
notification_timestamp = "timestamp"
notification_entity_type = "entity_type"
notification_entity_id = "entity_id"
notification_entity_owner_id = "entity_owner_id"
notification_collection_content = "collection_content"

notification_remix_parent_track_user_id = "remix_parent_track_user_id"
notification_remix_parent_track_id = "remix_parent_track_id"

notification_follower_id = "follower_user_id"
notification_followee_id = "followee_user_id"

notification_repost_counts = "repost_counts"
notification_favorite_counts = "favorite_counts"

notification_playlist_update_timestamp = "playlist_update_timestamp"
notification_playlist_update_users = "playlist_update_users"

notification_tier = "tier"

# solana notification metadata
solana_notification_type = "type"
solana_notification_type_challenge_reward = "ChallengeReward"
solana_notification_type_listen_milestone = "MilestoneListen"
solana_notification_type_supporter_rank_up = "SupporterRankUp"
solana_notification_type_tip = "Tip"
solana_notification_type_reaction = "Reaction"

solana_notification_slot = "slot"
solana_notification_timestamp = "timestamp"
solana_notification_initiator = "initiator"
solana_notification_metadata = "metadata"

solana_notification_challenge_id = "challenge_id"
solana_notification_threshold = "threshold"
solana_notification_tip_rank = "rank"
solana_notification_tip_amount = "amount"
solana_notification_tip_signature = "tx_signature"
solana_notification_tip_sender_id = "tip_sender_id"

solana_notification_reaction_type = "reaction_type"
solana_notification_reaction_type_tip = "tip"
solana_notification_reaction_reacted_to_entity = "reacted_to_entity"
solana_notification_reaction_reaction_value = "reaction_value"


# Trending
owner_follower_count = "owner_follower_count"

# User subscribers metadata
subscriber_ids = "subscriber_ids"
