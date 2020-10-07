import TimeRange from 'models/TimeRange'
import { removeNullable } from 'utils/typeUtils'
import { ID } from 'models/common/Identifiers'
import {
  APIActivity,
  APIResponse,
  APITrack,
  APIPlaylist,
  APIUser
} from './types'
import * as adapter from './ResponseAdapter'
import AudiusBackend from 'services/AudiusBackend'
import { getEagerDiscprov } from 'services/audius-backend/eagerLoadUtils'
import { encodeHashId } from 'utils/route/hashIds'

const ENDPOINT_MAP = {
  trending: '/tracks/trending',
  following: (userId: string) => `/users/${userId}/following`,
  followers: (userId: string) => `/users/${userId}/followers`,
  trackRepostUsers: (trackId: string) => `/tracks/${trackId}/reposts`,
  trackFavoriteUsers: (trackId: string) => `/tracks/${trackId}/favorites`,
  playlistRepostUsers: (playlistId: string) =>
    `/playlists/${playlistId}/reposts`,
  playlistFavoriteUsers: (playlistId: string) =>
    `/playlists/${playlistId}/favorites`,
  userByHandle: (handle: string) => `/users/handle/${handle}`,
  userTracksByHandle: (handle: string) => `/users/handle/${handle}/tracks`,
  userFavoritedTracks: (userId: string) => `/users/${userId}/favorites/tracks`,
  userRepostsByHandle: (handle: string) => `/users/handle/${handle}/reposts`,
  getPlaylist: (playlistId: string) => `/playlists/${playlistId}`,
  topGenreUsers: '/users/genre/top'
}

const TRENDING_LIMIT = 100

type GetTrendingArgs = {
  timeRange?: TimeRange
  offset?: number
  limit?: number
  currentUserId: ID | null
  genre?: string
}

type GetFollowingArgs = {
  profileUserId: ID
  currentUserId: ID | null
  offset?: number
  limit?: number
}

type GetFollowersArgs = {
  profileUserId: ID
  currentUserId: ID | null
  offset?: number
  limit?: number
}

type GetTrackRepostUsersArgs = {
  trackId: ID
  currentUserId: ID | null
  limit?: number
  offset?: number
}

type GetTrackFavoriteUsersArgs = {
  trackId: ID
  currentUserId: ID | null
  limit?: number
  offset?: number
}

type GetPlaylistRepostUsersArgs = {
  playlistId: ID
  currentUserId: ID | null
  limit?: number
  offset?: number
}

type GetPlaylistFavoriteUsersArgs = {
  playlistId: ID
  currentUserId: ID | null
  limit?: number
  offset?: number
}

type GetUserByHandleArgs = {
  handle: string
  currentUserId: ID | null
}

type GetUserTracksByHandleArgs = {
  handle: string
  currentUserId: ID | null
  sort?: 'date' | 'plays'
  offset?: number
  limit?: number
}

type GetProfileListArgs = {
  profileUserId: ID
  currentUserId: ID | null
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
  currentUserId: ID | null
  offset?: number
  limit?: number
}

type GetPlaylistArgs = {
  playlistId: ID
  currentUserId: ID | null
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
    const encodedProfileUserId = encodeHashId(profileUserId)
    if (!encodedProfileUserId) {
      throw new Error(`Unable to encode profile user id: ${profileUserId}`)
    }
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
    const encodedProfileUserId = encodeHashId(profileUserId)
    if (!encodedProfileUserId) {
      throw new Error(`Unable to encode profile user id: ${profileUserId}`)
    }
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
    const encodedTrackId = encodeHashId(trackId)
    if (!encodedTrackId) {
      throw new Error(`Unable to encode profile user id: ${trackId}`)
    }
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
    const encodedTrackId = encodeHashId(trackId)
    if (!encodedTrackId) {
      throw new Error(`Unable to encode profile user id: ${trackId}`)
    }
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
    const encodedPlaylistId = encodeHashId(playlistId)
    if (!encodedPlaylistId) {
      throw new Error(`Unable to encode profile user id: ${playlistId}`)
    }
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
    const encodedPlaylistId = encodeHashId(playlistId)
    if (!encodedPlaylistId) {
      throw new Error(`Unable to encode profile user id: ${playlistId}`)
    }
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
    const encodedProfileUserId = encodeHashId(profileUserId)
    if (!encodedProfileUserId) {
      throw new Error(`Unable to encode profile user id: ${profileUserId}`)
    }
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
    const encodedPlaylistId = encodeHashId(playlistId)
    if (!encodedPlaylistId) {
      throw new Error(`Unable to encode profile user id: ${playlistId}`)
    }
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

  _constructUrl(
    path: string,
    queryParams: {
      [key: string]: string | number | undefined | null | Array<string>
    }
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

const instance = new AudiusAPIClient({
  overrideEndpoint: 'http://localhost:5000'
})

export default instance
