import { Collection } from 'common/models/Collection'
import { Track } from 'common/models/Track'
import { User } from 'common/models/User'

export const getTrackWithFallback = (track: Track | null) => {
  return (
    track || {
      track_id: -1,
      title: '',
      permalink: '',
      repost_count: 0,
      followee_reposts: [],
      followee_saves: [],
      duration: 0,
      save_count: 0,
      has_current_user_reposted: false,
      has_current_user_saved: false,
      play_count: 0,
      is_delete: false,
      is_unlisted: false,
      activity_timestamp: '',
      _co_sign: undefined,
      _cover_art_sizes: {
        '150x150': '',
        '480x480': '',
        '1000x1000': '',
        OVERRIDE: ''
      }
    }
  )
}

export const getCollectionWithFallback = (collection: Collection | null) => {
  return (
    collection || {
      playlist_id: -1,
      playlist_name: '',
      repost_count: 0,
      save_count: 0,
      track_ids: [],
      track_count: 0,
      followee_reposts: [],
      followee_saves: [],
      has_current_user_reposted: false,
      has_current_user_saved: false,
      is_private: true,
      is_album: false,
      is_delete: false,
      activity_timestamp: '',
      _co_sign: undefined,
      playlist_owner_id: -1,
      _cover_art_sizes: {
        '150x150': '',
        '480x480': '',
        '1000x1000': '',
        OVERRIDE: ''
      }
    }
  )
}

export const getUserWithFallback = (user: User | null) => {
  return (
    user || {
      _artist_pick: -1,
      name: '',
      handle: '',
      is_verified: false,
      is_creator: false,
      is_deactivated: false,
      user_id: -1
    }
  )
}
