UPDATE saves
SET save_type = 'album'
WHERE save_type = 'playlist'
  AND save_item_id IN
    (SELECT playlist_id
     FROM aggregate_playlist
     WHERE is_album );


UPDATE reposts
SET repost_type = 'album'
WHERE repost_type = 'playlist'
  AND repost_item_id IN
    (SELECT playlist_id
     FROM playlists
     WHERE is_album );