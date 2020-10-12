import TimeRange from 'models/TimeRange'
import { Nullable, removeNullable } from 'utils/typeUtils'
import { ID } from 'models/common/Identifiers'
import {
  APIActivity,
  APIResponse,
  APITrack,
  APIPlaylist,
  APIUser,
  OpaqueID,
  APIStem,
  APISearch,
  APISearchAutocomplete
} from './types'
import * as adapter from './ResponseAdapter'
import AudiusBackend from 'services/AudiusBackend'
import { getEagerDiscprov } from 'services/audius-backend/eagerLoadUtils'
import { encodeHashId } from 'utils/route/hashIds'
import { StemTrackMetadata } from 'models/Track'
import { SearchKind } from 'containers/search-page/store/types'
import { processSearchResults } from './helper'

const ENDPOINT_MAP = {
  trending: '/tracks/trending',
  following: (userId: OpaqueID) => `/users/${userId}/following`,
  followers: (userId: OpaqueID) => `/users/${userId}/followers`,
  trackRepostUsers: (trackId: OpaqueID) => `/tracks/${trackId}/reposts`,
  trackFavoriteUsers: (trackId: OpaqueID) => `/tracks/${trackId}/favorites`,
  playlistRepostUsers: (playlistId: OpaqueID) =>
    `/playlists/${playlistId}/reposts`,
  playlistFavoriteUsers: (playlistId: OpaqueID) =>
    `/playlists/${playlistId}/favorites`,
  userByHandle: (handle: OpaqueID) => `/users/handle/${handle}`,
  userTracksByHandle: (handle: OpaqueID) => `/users/handle/${handle}/tracks`,
  userFavoritedTracks: (userId: OpaqueID) =>
    `/users/${userId}/favorites/tracks`,
  userRepostsByHandle: (handle: OpaqueID) => `/users/handle/${handle}/reposts`,
  getPlaylist: (playlistId: OpaqueID) => `/playlists/${playlistId}`,
  topGenreUsers: '/users/genre/top',
  getTrack: (trackId: OpaqueID) => `/tracks/${trackId}`,
  getStems: (trackId: OpaqueID) => `/tracks/${trackId}/stems`,
  getRemixes: (trackId: OpaqueID) => `/tracks/${trackId}/remixes`,
  getRemixing: (trackId: OpaqueID) => `/tracks/${trackId}/remixing`,
  searchFull: `/search/full`,
  searchAutocomplete: `/search/autocomplete`
}

const TRENDING_LIMIT = 100

export type GetTrackArgs = {
  id: ID
  currentUserId?: Nullable<ID>
  unlistedArgs?: {
    urlTitle: string
    handle: string
  }
}

type GetTrendingArgs = {
  timeRange?: TimeRange
  offset?: number
  limit?: number
  currentUserId: Nullable<ID>
  genre?: string
}

type GetFollowingArgs = {
  profileUserId: ID
  currentUserId: Nullable<ID>
  offset?: number
  limit?: number
}

type GetFollowersArgs = {
  profileUserId: ID
  currentUserId: Nullable<ID>
  offset?: number
  limit?: number
}

type GetTrackRepostUsersArgs = {
  trackId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
}

type GetTrackFavoriteUsersArgs = {
  trackId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
}

type GetPlaylistRepostUsersArgs = {
  playlistId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
}

type GetPlaylistFavoriteUsersArgs = {
  playlistId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
}

type GetUserByHandleArgs = {
  handle: string
  currentUserId: Nullable<ID>
}

type GetUserTracksByHandleArgs = {
  handle: string
  currentUserId: Nullable<ID>
  sort?: 'date' | 'plays'
  offset?: number
  limit?: number
}

type GetProfileListArgs = {
  profileUserId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
}

type GetTopArtistGenresArgs = {
  genres?: string[]
  limit?: number
  offset?: number
}

type GetUserRepostsByHandleArgs = {
  handle: string
  currentUserId: Nullable<ID>
  offset?: number
  limit?: number
}

type GetPlaylistArgs = {
  playlistId: ID
  currentUserId: Nullable<ID>
}

type GetStemsArgs = {
  trackId: ID
}

type GetRemixesArgs = {
  trackId: ID
  currentUserId: Nullable<ID>
  limit: number
  offset: number
}

type RemixesResponse = {
  tracks: APITrack[]
  count: number
}

type GetRemixingArgs = {
  trackId: ID
  currentUserId: Nullable<ID>
  limit: number
  offset: number
}

type GetSearchArgs = {
  currentUserId: ID
  query: string
  kind: SearchKind
  limit?: number
  offset?: number
}

type InitializationState =
  | { state: 'uninitialized ' }
  | {
      state: 'initialized'
      endpoint: string
    }

class AudiusAPIClient {
  initializationState: InitializationState = { state: 'uninitialized ' }
  overrideEndpoint?: string

  constructor({ overrideEndpoint }: { overrideEndpoint?: string } = {}) {
    this.overrideEndpoint = overrideEndpoint
  }

  async getTrending({
    timeRange = TimeRange.WEEK,
    limit = TRENDING_LIMIT,
    offset = 0,
    currentUserId,
    genre
  }: GetTrendingArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      time: timeRange,
      limit,
      offset,
      user_id: encodedCurrentUserId || undefined,
      genre
    }

    const endpoint = this._constructUrl(ENDPOINT_MAP.trending, params)
    const trendingResponse: APIResponse<APITrack[]> = await this._getResponse(
      endpoint
    )
    const adapted = trendingResponse.data
      .map(adapter.makeTrack)
      .filter(removeNullable)
    return adapted
  }

  async getFollowing({
    currentUserId,
    profileUserId,
    limit,
    offset
  }: GetFollowingArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedProfileUserId = this._encodeOrThrow(profileUserId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }
    const endpoint = this._constructUrl(
      ENDPOINT_MAP.following(encodedProfileUserId),
      params
    )
    const followingResponse: APIResponse<APIUser[]> = await this._getResponse(
      endpoint
    )
    const adapted = followingResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getFollowers({
    currentUserId,
    profileUserId,
    limit,
    offset
  }: GetFollowersArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedProfileUserId = this._encodeOrThrow(profileUserId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }
    const endpoint = this._constructUrl(
      ENDPOINT_MAP.followers(encodedProfileUserId),
      params
    )
    const followersResponse: APIResponse<APIUser[]> = await this._getResponse(
      endpoint
    )
    const adapted = followersResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getTrackRepostUsers({
    currentUserId,
    trackId,
    limit,
    offset
  }: GetTrackRepostUsersArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedTrackId = this._encodeOrThrow(trackId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }
    const endpoint = this._constructUrl(
      ENDPOINT_MAP.trackRepostUsers(encodedTrackId),
      params
    )
    const repostUsers: APIResponse<APIUser[]> = await this._getResponse(
      endpoint
    )
    const adapted = repostUsers.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getTrackFavoriteUsers({
    currentUserId,
    trackId,
    limit,
    offset
  }: GetTrackFavoriteUsersArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedTrackId = this._encodeOrThrow(trackId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }
    const endpoint = this._constructUrl(
      ENDPOINT_MAP.trackFavoriteUsers(encodedTrackId),
      params
    )
    const followingResponse: APIResponse<APIUser[]> = await this._getResponse(
      endpoint
    )
    const adapted = followingResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getPlaylistRepostUsers({
    currentUserId,
    playlistId,
    limit,
    offset
  }: GetPlaylistRepostUsersArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedPlaylistId = this._encodeOrThrow(playlistId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }
    const endpoint = this._constructUrl(
      ENDPOINT_MAP.playlistRepostUsers(encodedPlaylistId),
      params
    )
    const repostUsers: APIResponse<APIUser[]> = await this._getResponse(
      endpoint
    )
    const adapted = repostUsers.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getPlaylistFavoriteUsers({
    currentUserId,
    playlistId,
    limit,
    offset
  }: GetPlaylistFavoriteUsersArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedPlaylistId = this._encodeOrThrow(playlistId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }
    const endpoint = this._constructUrl(
      ENDPOINT_MAP.playlistFavoriteUsers(encodedPlaylistId),
      params
    )
    const followingResponse: APIResponse<APIUser[]> = await this._getResponse(
      endpoint
    )
    const adapted = followingResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getTrack({ id, currentUserId, unlistedArgs }: GetTrackArgs) {
    const encodedTrackId = this._encodeOrThrow(id)
    const encodedCurrentUserId = encodeHashId(currentUserId)

    this._assertInitialized()

    const args = {
      user_id: encodedCurrentUserId,
      url_title: unlistedArgs?.urlTitle,
      handle: unlistedArgs?.handle,
      show_unlisted: !!unlistedArgs
    }

    const endpoint = this._constructUrl(
      ENDPOINT_MAP.getTrack(encodedTrackId),
      args
    )
    const trackResponse: APIResponse<APITrack> = await this._getResponse(
      endpoint
    )
    const adapted = adapter.makeTrack(trackResponse.data)
    return adapted
  }

  async getStems({ trackId }: GetStemsArgs): Promise<StemTrackMetadata[]> {
    this._assertInitialized()
    const encodedTrackId = this._encodeOrThrow(trackId)
    const endpoint = this._constructUrl(ENDPOINT_MAP.getStems(encodedTrackId))
    const response: APIResponse<APIStem[]> = await this._getResponse(endpoint)
    const adapted = response.data
      .map(adapter.makeStemTrack)
      .filter(removeNullable)
    return adapted
  }

  async getRemixes({ trackId, limit, offset, currentUserId }: GetRemixesArgs) {
    this._assertInitialized()
    const encodedTrackId = this._encodeOrThrow(trackId)
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      userId: encodedUserId ?? undefined,
      limit,
      offset
    }
    const endpoint = this._constructUrl(
      ENDPOINT_MAP.getRemixes(encodedTrackId),
      params
    )
    const remixesResponse: APIResponse<RemixesResponse> = await this._getResponse(
      endpoint
    )

    const tracks = remixesResponse.data.tracks.map(adapter.makeTrack)
    return { count: remixesResponse.data.count, tracks }
  }

  async getRemixing({
    trackId,
    limit,
    offset,
    currentUserId
  }: GetRemixingArgs) {
    this._assertInitialized()
    const encodedTrackId = this._encodeOrThrow(trackId)
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      userId: encodedUserId ?? undefined,
      limit,
      offset
    }
    const endpoint = this._constructUrl(
      ENDPOINT_MAP.getRemixing(encodedTrackId),
      params
    )
    const remixingResponse: APIResponse<APITrack[]> = await this._getResponse(
      endpoint
    )
    const tracks = remixingResponse.data.map(adapter.makeTrack)
    return tracks
  }

  async getUserByHandle({ handle, currentUserId }: GetUserByHandleArgs) {
    const encodedCurrentUserId = encodeHashId(currentUserId)
    this._assertInitialized()
    const params = {
      user_id: encodedCurrentUserId || undefined
    }

    const endpoint = this._constructUrl(
      ENDPOINT_MAP.userByHandle(handle),
      params
    )
    const response: APIResponse<APIUser[]> = await this._getResponse(endpoint)
    const adapted = response.data.map(adapter.makeUser).filter(removeNullable)
    return adapted
  }

  async getUserTracksByHandle({
    handle,
    currentUserId,
    sort = 'date',
    limit,
    offset
  }: GetUserTracksByHandleArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      sort,
      limit,
      offset
    }

    const endpoint = this._constructUrl(
      ENDPOINT_MAP.userTracksByHandle(handle),
      params
    )
    const response: APIResponse<APITrack[]> = await this._getResponse(endpoint)
    const adapted = response.data.map(adapter.makeTrack).filter(removeNullable)
    return adapted
  }

  async getFavoritedTracks({
    profileUserId,
    currentUserId,
    limit,
    offset
  }: GetProfileListArgs) {
    this._assertInitialized()
    const encodedUserId = encodeHashId(currentUserId)
    const encodedProfileUserId = this._encodeOrThrow(profileUserId)
    const params = {
      user_id: encodedUserId || undefined,
      limit,
      offset
    }

    const endpoint = this._constructUrl(
      ENDPOINT_MAP.userFavoritedTracks(encodedProfileUserId),
      params
    )

    const response: APIResponse<APIActivity[]> = await this._getResponse(
      endpoint
    )
    const adapted = response.data.map(({ item, ...props }) => ({
      timestamp: props.timestamp,
      track: adapter.makeTrack(item as APITrack)
    }))
    return adapted
  }

  async getUserRepostsByHandle({
    handle,
    currentUserId,
    limit,
    offset
  }: GetUserRepostsByHandleArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }

    const endpoint = this._constructUrl(
      ENDPOINT_MAP.userRepostsByHandle(handle),
      params
    )
    const response: APIResponse<APIActivity[]> = await this._getResponse(
      endpoint
    )
    const adapted = response.data
      .map(adapter.makeActivity)
      .filter(removeNullable)
    return adapted
  }

  async getTopArtistGenres({ genres, limit, offset }: GetTopArtistGenresArgs) {
    this._assertInitialized()

    const params = {
      genre: genres,
      limit,
      offset
    }

    const endpoint = this._constructUrl(ENDPOINT_MAP.topGenreUsers, params)
    const favoritedTrackResponse: APIResponse<
      APIUser[]
    > = await this._getResponse(endpoint)
    const adapted = favoritedTrackResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getPlaylist({ playlistId, currentUserId }: GetPlaylistArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedPlaylistId = this._encodeOrThrow(playlistId)
    const params = {
      user_id: encodedCurrentUserId || undefined
    }

    const endpoint = this._constructUrl(
      ENDPOINT_MAP.getPlaylist(encodedPlaylistId),
      params
    )
    const response: APIResponse<APIPlaylist[]> = await this._getResponse(
      endpoint
    )
    const adapted = response.data
      .map(adapter.makePlaylist)
      .filter(removeNullable)
    return adapted
  }

  async getSearchFull({
    currentUserId,
    query,
    kind,
    offset,
    limit
  }: GetSearchArgs) {
    this._assertInitialized()
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedUserId,
      query,
      kind,
      offset,
      limit
    }

    const endpoint = this._constructUrl(ENDPOINT_MAP.searchFull, params)

    const searchResponse: APIResponse<APISearch> = await this._getResponse(
      endpoint
    )
    const adapted = adapter.adaptSearchResponse(searchResponse)
    return processSearchResults({ searchText: query, ...adapted })
  }

  async getSearchAutocomplete({
    currentUserId,
    query,
    kind,
    offset,
    limit
  }: GetSearchArgs) {
    this._assertInitialized()
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedUserId,
      query,
      kind,
      offset,
      limit
    }

    const endpoint = this._constructUrl(ENDPOINT_MAP.searchAutocomplete, params)

    const searchResponse: APIResponse<APISearchAutocomplete> = await this._getResponse(
      endpoint
    )
    const adapted = adapter.adaptSearchAutocompleteResponse(searchResponse)
    return processSearchResults({ searchText: query, ...adapted })
  }

  init() {
    if (this.initializationState.state === 'initialized') return

    // If override passed, use that and return
    if (this.overrideEndpoint) {
      const endpoint = this._formatEndpoint(this.overrideEndpoint)
      console.debug(`APIClient: Using override endpoint: ${endpoint}`)
      this.initializationState = { state: 'initialized', endpoint: endpoint }
      return
    }

    // Set the state to the eager discprov
    const eagerDiscprov = getEagerDiscprov()
    const fullDiscprov = this._formatEndpoint(eagerDiscprov)
    console.debug(`APIClient: setting to eager discprov: ${fullDiscprov}`)
    this.initializationState = {
      state: 'initialized',
      endpoint: fullDiscprov
    }

    // Listen for libs on chain selection
    AudiusBackend.addDiscoveryProviderSelectionListener((endpoint: string) => {
      const fullEndpoint = this._formatEndpoint(endpoint)
      console.debug(`APIClient: Setting to libs discprov: ${fullEndpoint}`)
      this.initializationState = {
        state: 'initialized',
        endpoint: fullEndpoint
      }
    })
    console.debug('APIClient: Initialized')
  }

  // Helpers

  _assertInitialized() {
    if (this.initializationState.state !== 'initialized')
      throw new Error('AudiusAPIClient must be initialized before use')
  }

  async _getResponse<T>(resource: string): Promise<T> {
    const response = await fetch(resource)
    if (!response.ok) throw new Error(response.statusText)
    return response.json()
  }

  _formatEndpoint(endpoint: string) {
    return `${endpoint}/v1/full`
  }

  _encodeOrThrow(id: ID): OpaqueID {
    const encoded = encodeHashId(id)
    if (!encoded) {
      throw new Error(`Unable to encode id: ${id}`)
    }
    return encoded
  }

  _constructUrl(
    path: string,
    queryParams: {
      [key: string]:
        | string
        | number
        | undefined
        | boolean
        | Array<string>
        | null
    } = {}
  ) {
    if (this.initializationState.state !== 'initialized')
      throw new Error('_constructURL called uninitialized')
    const params = Object.entries(queryParams)
      .filter(p => p[1] !== undefined && p[1] !== null)
      .map(p => {
        if (Array.isArray(p[1])) {
          return p[1].map(val => `${p[0]}=${encodeURIComponent(val)}`).join('&')
        }
        return `${p[0]}=${encodeURIComponent(p[1]!)}`
      })
      .join('&')
    return `${this.initializationState.endpoint}${path}?${params}`
  }
}

const instance = new AudiusAPIClient()

export default instance
