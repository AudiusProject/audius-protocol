import {
  UserCollectionMetadata,
  UserTrackMetadata,
  UserMetadata
} from '~/models'
import { removeNullable } from '~/utils'

import * as adapter from './ResponseAdapter'
import { APIResponse, APISearch } from './types'

const SEARCH_MAX_TOTAL_RESULTS = 50

const AUTOCOMPLETE_TOTAL_RESULTS = 3

type ProcessSearchResultsArgs = {
  tracks?: UserTrackMetadata[]
  albums?: UserCollectionMetadata[]
  playlists?: UserCollectionMetadata[]
  users?: UserMetadata[]
  saved_tracks?: UserTrackMetadata[]
  saved_albums?: UserCollectionMetadata[]
  saved_playlists?: UserCollectionMetadata[]
  followed_users?: UserMetadata[]
  searchText?: string | null
  isAutocomplete?: boolean
}

export const adaptSearchResponse = (searchResponse: APIResponse<APISearch>) => {
  return {
    tracks:
      searchResponse.data.tracks
        ?.map(adapter.makeTrack)
        .filter(removeNullable) ?? undefined,
    saved_tracks:
      searchResponse.data.saved_tracks
        ?.map(adapter.makeTrack)
        .filter(removeNullable) ?? undefined,
    users:
      searchResponse.data.users?.map(adapter.makeUser).filter(removeNullable) ??
      undefined,
    followed_users:
      searchResponse.data.followed_users
        ?.map(adapter.makeUser)
        .filter(removeNullable) ?? undefined,
    playlists:
      searchResponse.data.playlists
        ?.map(adapter.makePlaylist)
        .filter(removeNullable) ?? undefined,
    saved_playlists:
      searchResponse.data.saved_playlists
        ?.map(adapter.makePlaylist)
        .filter(removeNullable) ?? undefined,
    albums:
      searchResponse.data.albums
        ?.map(adapter.makePlaylist)
        .filter(removeNullable) ?? undefined,
    saved_albums:
      searchResponse.data.saved_albums
        ?.map(adapter.makePlaylist)
        .filter(removeNullable) ?? undefined
  }
}
export const processSearchResults = async ({
  tracks = [],
  albums = [],
  playlists = [],
  users = [],
  isAutocomplete = false
}: ProcessSearchResultsArgs) => {
  const maxTotal = isAutocomplete
    ? AUTOCOMPLETE_TOTAL_RESULTS
    : SEARCH_MAX_TOTAL_RESULTS

  return {
    tracks: tracks.slice(0, Math.min(maxTotal, tracks.length)),
    albums: albums.slice(0, Math.min(maxTotal, albums.length)),
    playlists: playlists.slice(0, Math.min(maxTotal, playlists.length)),
    users: users.slice(0, Math.min(maxTotal, users.length))
  }
}
