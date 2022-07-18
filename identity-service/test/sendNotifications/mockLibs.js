const trackTemplate = (id) => ({
  'blockhash': '0xdebe84fe16960b2b1fe156d12c826257b8ac154581551e38e852bd326bc2b414',
  'blocknumber': 8593023,
  'cover_art': 'QmRwbZUcmCnHsWqiPSJbM36Sa6cuRzNbBoNouCmdPS1osd',
  'cover_art_sizes': null,
  'create_date': null,
  'created_at': '2019-04-29T23:58:50 Z',
  'credits_splits': null,
  'description': null,
  'download': null,
  'field_visibility': null,
  'file_type': null,
  'followee_reposts': [],
  'followee_saves': [],
  'genre': 'Electronic',
  'has_current_user_reposted': false,
  'has_current_user_saved': false,
  'is_current': true,
  'is_delete': false,
  'is_unlisted': false,
  'isrc': null,
  'iswc': null,
  'length': 0,
  'license': 'Attribution CC BY',
  'metadata_multihash': 'QmfRw8catAfbUz81cSEmwtkF5fc2F3YrfeRRasJQprZyDe',
  'mood': 'Sentimental 😢',
  'owner_id': 3,
  'play_count': 216,
  'release_date': 'Mon Apr 29 2019 16:58:04 GMT-0700',
  'remix_of': {
    'tracks': [
      { 'parent_track_id': id + 1 }
    ]
  },
  'repost_count': 3,
  'route_id': 'trealboiiii/th-music',
  'save_count': 3,
  'stem_of': null,
  'tags': 'just,chill,2018,edm',
  'title': `Title, Track id: ${id}`,
  'track_id': id,
  'track_segments': [],
  'updated_at': '2019-04-30T00:02:50 Z'
})

const playlistTemplate = (id) => ({
  'blockhash': '0x2aaaf97be15302f844ca2c3780767e73fcecc980d12331d637d09cccf2eb0419',
  'blocknumber': 17900160,
  'created_at': '2020-10-29T17:54:35 Z',
  'description': 'The Debut release from Vitreous Groove, VBeats Vol. 1 is a collection of jazzy, relaxing hip hop beats. ',
  'followee_reposts': [],
  'followee_saves': [],
  'has_current_user_reposted': false,
  'has_current_user_saved': false,
  'is_album': true,
  'is_current': true,
  'is_delete': false,
  'is_private': false,
  'playlist_contents': {
    'track_ids': [
      {
        'time': 1603994075,
        'track': id + 2
      },
      {
        'time': 1603994075,
        'track': id + 1
      }
    ]
  },
  'playlist_id': id,
  'playlist_image_multihash': null,
  'playlist_image_sizes_multihash': 'QmQTz4HHRxiyueyJDbK799KCo3ZypB8mDEJWWR9jWcFbMr',
  'playlist_name': `PLaylist id: ${id}`,
  'playlist_owner_id': 69054,
  'repost_count': 0,
  'save_count': 0,
  'total_play_count': 2,
  'upc': null,
  'updated_at': '2020-10-29T17:54:45 Z'
})

const userTemplate = (id) => ({
  'album_count': 1,
  'bio': '🌝\n;;',
  'blockhash': '0x4c80f812b585bbb5b57b907a093cc985181435e5359bc4364ba5165274ea01c0',
  'blocknumber': 17802222,
  'cover_photo': null,
  'cover_photo_sizes': 'QmQnJ8uXf886crAticzPGgrfqxq68kAxBXXcK73geFakUo',
  'created_at': '2019-04-29T23:52:55 Z',
  'creator_node_endpoint': 'https://creatornode3.audius.co,,',
  'current_user_followee_follow_count': 0,
  'does_current_user_follow': false,
  'followee_count': 559,
  'follower_count': 655,
  'handle': 'rayjacobson',
  'handle_lc': 'rayjacobson',
  'is_current': true,
  'is_verified': false,
  'location': 'chik fil yay!',
  'metadata_multihash': 'QmXR4Geg4NKtYtp596GenPxsN3NVyGnb1a6ipHmqSkaEHs',
  'name': `user ${id}`,
  'playlist_count': 5,
  'profile_picture': 'QmXBLfsD6G8ALVeTr9A5XXKLCoiFRfoTGqXZmBbz9MoQrd',
  'profile_picture_sizes': null,
  'repost_count': 1183,
  'track_blocknumber': 17311038,
  'track_count': 16,
  'updated_at': '2020-10-23T22:15:25 Z',
  'user_id': id,
  'wallet': '0x7d273271690538cf855e5b3002a0dd8c154bb060'
})

const mockAudiusLibs = {
  Track: {
    getTracks: (limit, offset, ids) => ids.map(id => trackTemplate(id))
  },
  Playlist: {
    getPlaylists: (limit, offset, ids) => ids.map(id => playlistTemplate(id))
  },
  User: {
    getUsers: (limit, offset, ids) => ids.map(id => userTemplate(id))
  }
}

module.exports = mockAudiusLibs
