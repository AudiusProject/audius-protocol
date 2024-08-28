import { full } from '@audius/sdk'

import {
  UserTrackMetadata,
  UserCollectionMetadata,
  UserMetadata
} from '~/models'

import { userCollectionMetadataFromSDK } from './collection'
import { userTrackMetadataFromSDK } from './track'
import { userMetadataFromSDK } from './user'
import { transformAndCleanList } from './utils'

type SearchResults = {
  tracks: UserTrackMetadata[]
  saved_tracks: UserTrackMetadata[]
  users: UserMetadata[]
  followed_users: UserMetadata[]
  playlists: UserCollectionMetadata[]
  saved_playlists: UserCollectionMetadata[]
  albums: UserCollectionMetadata[]
  saved_albums: UserCollectionMetadata[]
}

export const searchResultsFromSDK = (
  input?: full.SearchModel
): SearchResults => {
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

export const AUTOCOMPLETE_TOTAL_RESULTS = 3

export const limitAutocompleteResults = (
  results: SearchResults,
  maxResults: number = AUTOCOMPLETE_TOTAL_RESULTS
): SearchResults => {
  return Object.keys(results).reduce((acc, key) => {
    acc[key] = results[key].slice(0, Math.min(maxResults, results[key].length))
    return acc
  }, {} as SearchResults)
}
