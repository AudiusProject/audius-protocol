# track/playlist metadata
repost_count = 'repost_count' # integer - total repost count of given track/playlist
save_count = 'save_count' # integer - total save count of given track/playlist
has_current_user_reposted = 'has_current_user_reposted' # boolean - has current user reposted given track/playlist
has_current_user_saved = 'has_current_user_saved' # boolean - has current user saved given track/playlist
followee_reposts = 'followee_reposts' # array - followees of current user that have reposted given track/playlist
play_count = 'play_count' # integer - total number of plays for a given track

# user metadata
user_id = 'user_id' # integer - unique id of a user
follower_count = 'follower_count' # integer - total follower count of given user
followee_count = 'followee_count' # integer - total followee count of given user
playlist_count = 'playlist_count' # integer - total count of playlists created by given user
album_count = 'album_count' # integer - total count of albums created by given user (0 for all non-creators)
track_count = 'track_count' # integer - total count of tracks created by given user
repost_count = 'repost_count' # integer - total count of reposts by given user
track_blocknumber = 'track_blocknumber' # integer - blocknumber of latest track for user
# current user specific
does_current_user_follow = 'does_current_user_follow' # boolean - does current user follow given user
current_user_followee_follow_count = 'current_user_followee_follow_count' # integer - number of followees of current user that also follow given user

# feed metadata
activity_timestamp = 'activity_timestamp' # string - timestamp of relevant activity on underlying object,
                                          # used for sorting

track_owner_follower_count = 'track_owner_follower_count'
track_owner_id = 'track_owner_id'
track_id = 'track_id'
listen_counts = 'listen_counts'

tracks = 'tracks'
albums = 'albums'
playlists = 'playlists'

# notifications metadata
notification_type = 'type'
notification_type_follow = 'Follow'
notification_type_favorite = 'Favorite'
notification_type_repost = 'Repost'
notification_type_create = 'Create'

notification_blocknumber = 'blocknumber'
notification_initiator = 'initiator'
notification_metadata = 'metadata'
notification_timestamp = 'timestamp'
notification_entity_type = 'entity_type'
notification_entity_id = 'entity_id'
notification_entity_owner_id = 'entity_owner_id'
notification_collection_content = 'collection_content'

notification_follower_id = 'follower_user_id'
notification_followee_id = 'followee_user_id'

notification_repost_counts = 'repost_counts'
notification_favorite_counts = 'favorite_counts'
