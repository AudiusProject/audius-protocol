import { full } from '@audius/sdk'

import { userCollectionMetadataFromSDK } from './collection'
import { userTrackMetadataFromSDK } from './track'
import { userMetadataFromSDK } from './user'
import { transformAndCleanList } from './utils'

export const searchResultsFromSDK = (input?: full.SearchModel) => {
  return input
    ? {
        tracks: transformAndCleanList(input.tracks, userTrackMetadataFromSDK),
        saved_tracks: transformAndCleanList(
          input.savedTracks,
          userTrackMetadataFromSDK
        ),
        users: transformAndCleanList(input.users, userMetadataFromSDK),
        followed_users: transformAndCleanList(
          input.followedUsers,
          userMetadataFromSDK
        ),
        playlists: transformAndCleanList(
          input.playlists,
          userCollectionMetadataFromSDK
        ),
        saved_playlists: transformAndCleanList(
          input.savedPlaylists ?? [],
          userCollectionMetadataFromSDK
        ),
        albums: transformAndCleanList(
          input.albums,
          userCollectionMetadataFromSDK
        ),
        saved_albums: transformAndCleanList(
          input.savedAlbums,
          userCollectionMetadataFromSDK
        )
      }
    : {
        users: [],
        followed_users: [],
        tracks: [],
        saved_tracks: [],
        playlists: [],
        saved_playlists: [],
        saved_albums: [],
        albums: []
      }
}
