import { UserCollectionMetadata, UserTrackMetadata, UserMetadata } from '~/models'
import { removeNullable } from '~/utils'

import * as adapter from './ResponseAdapter'
import { APIResponse, APISearch } from './types'

const SEARCH_MAX_SAVED_RESULTS = 10
const SEARCH_MAX_TOTAL_RESULTS = 50

const AUTOCOMPLETE_MAX_SAVED_RESULTS = 2
const AUTOCOMPLETE_TOTAL_RESULTS = 3

/**
 * Combines two lists by concatting `maxSaved` results from the `savedList` onto the head of `normalList`,
 * ensuring that no item is duplicated in the resulting list (deduped by `uniqueKey`). The final list length is capped
 * at `maxTotal` items.
 */
const combineLists = <T>(
  savedList: Array<T>,
  normalList: Array<T>,
  uniqueKey: string,
  maxSaved: number,
  maxTotal: number
) => {
  const truncatedSavedList = savedList.slice(
    0,
    Math.min(maxSaved, savedList.length)
  )
  const saveListsSet = new Set(truncatedSavedList.map((s) => s[uniqueKey]))
  const filteredList = normalList.filter((n) => !saveListsSet.has(n[uniqueKey]))
  const combinedLists = savedList.concat(filteredList)
  return combinedLists.slice(0, Math.min(maxTotal, combinedLists.length))
}

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
  saved_tracks: savedTracks = [],
  saved_albums: savedAlbums = [],
  saved_playlists: savedPlaylists = [],
  followed_users: followedUsers = [],
  isAutocomplete = false
}: ProcessSearchResultsArgs) => {
  const maxSaved = isAutocomplete
    ? AUTOCOMPLETE_MAX_SAVED_RESULTS
    : SEARCH_MAX_SAVED_RESULTS
  const maxTotal = isAutocomplete
    ? AUTOCOMPLETE_TOTAL_RESULTS
    : SEARCH_MAX_TOTAL_RESULTS
  const combinedTracks = combineLists(
    savedTracks,
    tracks,
    'track_id',
    maxSaved,
    maxTotal
  )
  const combinedAlbums = combineLists(
    savedAlbums,
    albums,
    'playlist_id',
    maxSaved,
    maxTotal
  )
  const combinedPlaylists = combineLists(
    savedPlaylists,
    playlists,
    'playlist_id',
    maxSaved,
    maxTotal
  )
  const combinedUsers = combineLists(
    followedUsers,
    users,
    'user_id',
    maxSaved,
    maxTotal
  )

  return {
    tracks: combinedTracks,
    albums: combinedAlbums,
    playlists: combinedPlaylists,
    users: combinedUsers
  }
}
