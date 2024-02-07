import type { AudiusLibs } from '@audius/sdk'

import {
  ID,
  TimeRange,
  StemTrackMetadata,
  CollectionMetadata
} from '../../models'
import { SearchKind } from '../../store/pages/search-results/types'
import { decodeHashId, encodeHashId } from '../../utils/hashIds'
import { Nullable, removeNullable } from '../../utils/typeUtils'
import { AuthHeaders } from '../audius-backend'
import type { AudiusBackend } from '../audius-backend'
import { getEagerDiscprov } from '../audius-backend/eagerLoadUtils'
import { Env } from '../env'
import { LocalStorage } from '../local-storage'
import { IntKeys, StringKeys, RemoteConfigInstance } from '../remote-config'

import * as adapter from './ResponseAdapter'
import { processSearchResults } from './helper'
import {
  APIActivity,
  APIBlockConfirmation,
  APIFavorite,
  APIPlaylist,
  APIResponse,
  APISearch,
  APISearchAutocomplete,
  APIStem,
  APITrack,
  APIUser,
  GetNFTGatedTrackSignaturesResponse,
  GetTipsResponse,
  OpaqueID,
  SupporterResponse,
  SupportingResponse
} from './types'

// TODO: declare this at the root and use actual audiusLibs type
declare global {
  interface Window {
    audiusLibs: AudiusLibs
  }
}

enum PathType {
  RootPath = '',
  VersionPath = '/v1',
  VersionFullPath = '/v1/full'
}

const ROOT_ENDPOINT_MAP = {
  feed: `/feed`,
  healthCheck: '/health_check',
  blockConfirmation: '/block_confirmation',
  getCollectionMetadata: '/playlists'
}

const FULL_ENDPOINT_MAP = {
  trending: (experiment: string | null) =>
    experiment ? `/tracks/trending/${experiment}` : '/tracks/trending',
  trendingIds: (experiment: string | null) =>
    experiment ? `/tracks/trending/ids/${experiment}` : '/tracks/trending/ids',
  trendingUnderground: (experiment: string | null) =>
    experiment
      ? `/tracks/trending/underground/${experiment}`
      : '/tracks/trending/underground',
  trendingPlaylists: (experiment: string | null) =>
    experiment ? `/playlists/trending/${experiment}` : '/playlists/trending',
  recommended: '/tracks/recommended',
  remixables: '/tracks/remixables',
  following: (userId: OpaqueID) => `/users/${userId}/following`,
  followers: (userId: OpaqueID) => `/users/${userId}/followers`,
  trackRepostUsers: (trackId: OpaqueID) => `/tracks/${trackId}/reposts`,
  trackFavoriteUsers: (trackId: OpaqueID) => `/tracks/${trackId}/favorites`,
  playlistRepostUsers: (playlistId: OpaqueID) =>
    `/playlists/${playlistId}/reposts`,
  playlistFavoriteUsers: (playlistId: OpaqueID) =>
    `/playlists/${playlistId}/favorites`,
  playlistUpdates: (userId: OpaqueID) =>
    `/notifications/${userId}/playlist_updates`,
  getUser: (userId: OpaqueID) => `/users/${userId}`,
  userByHandle: (handle: OpaqueID) => `/users/handle/${handle}`,
  userTracksByHandle: (handle: OpaqueID) => `/users/handle/${handle}/tracks`,
  userAiTracksByHandle: (handle: OpaqueID) =>
    `/users/handle/${handle}/tracks/ai_attributed`,
  userFavoritedTracks: (userId: OpaqueID) =>
    `/users/${userId}/favorites/tracks`,
  userRepostsByHandle: (handle: OpaqueID) => `/users/handle/${handle}/reposts`,
  getRelatedArtists: (userId: OpaqueID) => `/users/${userId}/related`,
  getPlaylist: (playlistId: OpaqueID) => `/playlists/${playlistId}`,
  getPlaylistByPermalink: (handle: string, slug: string) =>
    `/playlists/by_permalink/${handle}/${slug}`,
  topGenreUsers: '/users/genre/top',
  topArtists: '/users/top',
  getTrack: (trackId: OpaqueID) => `/tracks/${trackId}`,
  getTracks: () => `/tracks`,
  getTrackByHandleAndSlug: `/tracks`,
  getStems: (trackId: OpaqueID) => `/tracks/${trackId}/stems`,
  getRemixes: (trackId: OpaqueID) => `/tracks/${trackId}/remixes`,
  getRemixing: (trackId: OpaqueID) => `/tracks/${trackId}/remixing`,
  searchFull: `/search/full`,
  searchAutocomplete: `/search/autocomplete`,
  getUserTrackHistory: (userId: OpaqueID) => `/users/${userId}/history/tracks`,
  getUserSupporter: (userId: OpaqueID, supporterUserId: OpaqueID) =>
    `/users/${userId}/supporters/${supporterUserId}`,
  getUserSupporting: (userId: OpaqueID, supporterUserId: OpaqueID) =>
    `/users/${userId}/supporting/${supporterUserId}`,
  getReaction: '/reactions',
  getSupporting: (userId: OpaqueID) => `/users/${userId}/supporting`,
  getSupporters: (userId: OpaqueID) => `/users/${userId}/supporters`,
  getTips: '/tips',
  getNFTGatedTrackSignatures: (userId: OpaqueID) =>
    `/tracks/${userId}/nft-gated-signatures`,
  getPremiumTracks: '/tracks/usdc-purchase'
}

const ENDPOINT_MAP = {
  associatedWallets: '/users/associated_wallets',
  associatedWalletUserId: '/users/id',
  userChallenges: (userId: OpaqueID) => `/users/${userId}/challenges`,
  userFavorites: (userId: OpaqueID) => `/users/${userId}/favorites`,
  userTags: (userId: OpaqueID) => `/users/${userId}/tags`,
  undisbursedUserChallenges: `/challenges/undisbursed`
}

const TRENDING_LIMIT = 100

export type QueryParams = {
  [key: string]: string | number | undefined | boolean | string[] | null
}

type GetTrackArgs = {
  id: ID
  currentUserId?: Nullable<ID>
  unlistedArgs?: {
    urlTitle: string
    handle: string
  }
  abortOnUnreachable?: boolean
}

type GetTracksArgs = {
  ids: ID[]
  currentUserId: Nullable<ID>
}

type GetTrackByHandleAndSlugArgs = {
  handle: string
  slug: string
  currentUserId: Nullable<ID>
}

type PaginationArgs = {
  limit?: number
  offset?: number
}

type CurrentUserIdArg = { currentUserId: Nullable<ID> }

type GetTopArtistsArgs = PaginationArgs & CurrentUserIdArg

type GetTrendingArgs = {
  timeRange?: TimeRange
  offset?: number
  limit?: number
  currentUserId: Nullable<ID>
  genre: Nullable<string>
}

type GetTrendingUndergroundArgs = {
  offset?: number
  limit?: number
  currentUserId: Nullable<ID>
}

type GetTrendingIdsArgs = {
  limit?: number
  genre?: Nullable<string>
}

type GetRecommendedArgs = {
  genre: Nullable<string>
  exclusionList: number[]
  currentUserId: Nullable<ID>
}

type GetRemixablesArgs = {
  limit?: number
  currentUserId: Nullable<ID>
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

type GetUserArgs = {
  userId: ID
  currentUserId: Nullable<ID>
  abortOnUnreachable?: boolean
}

type GetUserByHandleArgs = {
  handle: string
  currentUserId: Nullable<ID>
  retry?: boolean
}

type GetUserTracksByHandleArgs = {
  handle: string
  currentUserId: Nullable<ID>
  sort?: 'date' | 'plays'
  offset?: number
  limit?: number
  getUnlisted: boolean
}

type GetUserAiTracksByHandleArgs = {
  handle: string
  currentUserId: Nullable<ID>
  sort?: 'date' | 'plays'
  offset?: number
  limit?: number
  getUnlisted: boolean
}

type GetPremiumTracksArgs = {
  currentUserId: Nullable<ID>
  offset?: number
  limit?: number
}

type GetRelatedArtistsArgs = PaginationArgs & {
  userId: ID
}

type GetFavoritesArgs = {
  currentUserId: ID
  limit?: number
}

type GetProfileListArgs = {
  profileUserId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
  query?: string
  sortMethod?: string
  sortDirection?: string
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

type GetCollectionMetadataArgs = {
  collectionId: ID
  currentUserId: ID
  abortOnUnreachable?: boolean
}

type GetPlaylistArgs = {
  playlistId: ID
  currentUserId: Nullable<ID>
  abortOnUnreachable?: boolean
}

type GetPlaylistByPermalinkArgs = {
  permalink: string
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
  currentUserId: Nullable<ID>
  query: string
  kind?: SearchKind
  limit?: number
  offset?: number
  includePurchaseable?: boolean
}

type TrendingIdsResponse = {
  week: { id: string }[]
  month: { id: string }[]
  year: { id: string }[]
  allTime: { id: string }[]
}

export type TrendingIds = {
  week: ID[]
  month: ID[]
  year: ID[]
  allTime: ID[]
}

type GetTrendingPlaylistsArgs = {
  currentUserId: Nullable<ID>
  limit: number
  offset: number
  time: 'week' | 'month' | 'year'
}

type GetAssociatedWalletsArgs = {
  userID: number
}

export type AssociatedWalletsResponse = {
  wallets: string[]
  sol_wallets: string[]
}

type GetAssociatedWalletUserIDArgs = {
  address: string
}

type AssociatedWalletUserIdResponse = {
  user_id: Nullable<ID>
}

type GetUserChallengesArgs = {
  userID: number
}

type UserChallengesResponse = [
  {
    challenge_id: string
    user_id: string
    specifier: string
    is_complete: boolean
    is_active: boolean
    is_disbursed: boolean
    current_step_count: number
    max_steps: number
    challenge_type: string
    amount: string
    disbursed_amount: number
    metadata: object
  }
]

type UndisbursedUserChallengesResponse = [
  {
    challenge_id: string
    user_id: string
    specifier: string
    amount: string
    completed_blocknumber: number
    handle: string
    wallet: string
    created_at: string
  }
]

export type GetSocialFeedArgs = QueryParams & {
  filter: string
  with_users?: boolean
  tracks_only?: boolean
  followee_user_ids?: ID[]
  current_user_id?: ID
}

type GetSocialFeedResponse = {}

type GetUserTrackHistoryArgs = {
  userId: ID
  currentUserId: Nullable<ID>
  limit?: number
  offset?: number
  sortMethod?: string
}

type GetReactionArgs = {
  reactedToIds: string[]
}

type GetReactionResponse = [
  {
    reaction_value: string
    reaction_type: string
    sender_user_id: string
    reacted_to: string
  }
]

export type GetSupportingArgs = {
  userId: ID
  limit?: number
  offset?: number
}

export type GetSupportersArgs = {
  userId: ID
  limit?: number
  offset?: number
}

export type GetTipsArgs = {
  userId: ID
  limit?: number
  offset?: number
  receiverMinFollowers?: number
  receiverIsVerified?: boolean
  currentUserFollows?: 'sender' | 'receiver' | 'sender_or_receiver'
  uniqueBy?: 'sender' | 'receiver'
  minSlot?: number
  maxSlot?: number
  txSignatures?: string[]
}

export type GetNFTGatedTrackSignaturesArgs = {
  userId: ID
  trackMap: {
    [id: ID]: string[]
  }
}

type InitializationState =
  | { state: 'uninitialized' }
  | {
      state: 'initialized'
      endpoint: string
      // Requests are dispatched via APIClient rather than libs
      type: 'manual'
    }
  | {
      state: 'initialized'
      endpoint: string
      // Requests are dispatched and handled via libs
      type: 'libs'
    }

const emptySearchResponse: APIResponse<APISearch> = {
  data: {
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

type GetUserSupporterArgs = {
  userId: ID
  supporterUserId: ID
  currentUserId: Nullable<ID>
}

type AudiusAPIClientConfig = {
  audiusBackendInstance: AudiusBackend
  getAudiusLibs: () => Nullable<AudiusLibs>
  overrideEndpoint?: string
  remoteConfigInstance: RemoteConfigInstance
  localStorage: LocalStorage
  env: Env
  waitForLibsInit: () => Promise<unknown>
}

export class AudiusAPIClient {
  initializationState: InitializationState = {
    state: 'uninitialized'
  }

  audiusBackendInstance: AudiusBackend
  getAudiusLibs: () => Nullable<AudiusLibs>
  overrideEndpoint?: string
  remoteConfigInstance: RemoteConfigInstance
  localStorage: LocalStorage
  env: Env
  isReachable?: boolean = true
  waitForLibsInit: () => Promise<unknown>

  constructor({
    audiusBackendInstance,
    getAudiusLibs,
    overrideEndpoint,
    remoteConfigInstance,
    localStorage,
    env,
    waitForLibsInit
  }: AudiusAPIClientConfig) {
    this.audiusBackendInstance = audiusBackendInstance
    this.getAudiusLibs = getAudiusLibs
    this.overrideEndpoint = overrideEndpoint
    this.remoteConfigInstance = remoteConfigInstance
    this.localStorage = localStorage
    this.env = env
    this.waitForLibsInit = waitForLibsInit
  }

  setIsReachable(isReachable: boolean) {
    this.isReachable = isReachable
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
      genre: genre || undefined
    }
    const experiment = this.remoteConfigInstance.getRemoteVar(
      StringKeys.TRENDING_EXPERIMENT
    )
    const trendingResponse = await this._getResponse<APIResponse<APITrack[]>>(
      FULL_ENDPOINT_MAP.trending(experiment),
      params
    )

    if (!trendingResponse) return []

    const adapted = trendingResponse.data
      .map(adapter.makeTrack)
      .filter(removeNullable)
    return adapted
  }

  async getTrendingUnderground({
    limit = TRENDING_LIMIT,
    offset = 0,
    currentUserId
  }: GetTrendingUndergroundArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      limit,
      offset,
      user_id: encodedCurrentUserId
    }
    const experiment = this.remoteConfigInstance.getRemoteVar(
      StringKeys.UNDERGROUND_TRENDING_EXPERIMENT
    )
    const trendingResponse = await this._getResponse<APIResponse<APITrack[]>>(
      FULL_ENDPOINT_MAP.trendingUnderground(experiment),
      params
    )

    if (!trendingResponse) return []

    const adapted = trendingResponse.data
      .map(adapter.makeTrack)
      .filter(removeNullable)
    return adapted
  }

  async getTrendingIds({ genre, limit }: GetTrendingIdsArgs) {
    this._assertInitialized()
    const params = {
      limit,
      genre: genre || undefined
    }
    const experiment = this.remoteConfigInstance.getRemoteVar(
      StringKeys.TRENDING_EXPERIMENT
    )
    const trendingIdsResponse = await this._getResponse<
      APIResponse<TrendingIdsResponse>
    >(FULL_ENDPOINT_MAP.trendingIds(experiment), params)
    if (!trendingIdsResponse) {
      return {
        week: [],
        month: [],
        year: [],
        allTime: []
      }
    }

    const timeRanges = Object.keys(trendingIdsResponse.data) as TimeRange[]
    const res = timeRanges.reduce(
      (acc: TrendingIds, timeRange: TimeRange) => {
        acc[timeRange] = trendingIdsResponse.data[timeRange]
          .map(adapter.makeTrackId)
          .filter(Boolean) as ID[]
        return acc
      },
      {
        week: [],
        month: [],
        year: [],
        allTime: []
      }
    )
    return res
  }

  async getRecommended({
    genre,
    exclusionList,
    currentUserId
  }: GetRecommendedArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      genre,
      limit:
        this.remoteConfigInstance.getRemoteVar(IntKeys.AUTOPLAY_LIMIT) || 10,
      exclusion_list:
        exclusionList.length > 0 ? exclusionList.map(String) : undefined,
      user_id: encodedCurrentUserId || undefined
    }
    const recommendedResponse = await this._getResponse<
      APIResponse<APITrack[]>
    >(FULL_ENDPOINT_MAP.recommended, params)

    if (!recommendedResponse) return []

    const adapted = recommendedResponse.data
      .map(adapter.makeTrack)
      .filter(removeNullable)
    return adapted
  }

  async getRemixables({ limit = 25, currentUserId }: GetRemixablesArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      limit,
      user_id: encodedCurrentUserId || undefined,
      with_users: true
    }
    const remixablesResponse = await this._getResponse<APIResponse<APITrack[]>>(
      FULL_ENDPOINT_MAP.remixables,
      params
    )

    if (!remixablesResponse) return []

    const adapted = remixablesResponse.data
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

    const followingResponse = await this._getResponse<APIResponse<APIUser[]>>(
      FULL_ENDPOINT_MAP.following(encodedProfileUserId),
      params
    )
    if (!followingResponse) return []
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

    const followersResponse = await this._getResponse<APIResponse<APIUser[]>>(
      FULL_ENDPOINT_MAP.followers(encodedProfileUserId),
      params
    )

    if (!followersResponse) return []

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

    const repostUsers: Nullable<APIResponse<APIUser[]>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.trackRepostUsers(encodedTrackId),
        params
      )

    if (!repostUsers) return []

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

    const followingResponse = await this._getResponse<APIResponse<APIUser[]>>(
      FULL_ENDPOINT_MAP.trackFavoriteUsers(encodedTrackId),
      params
    )

    if (!followingResponse) return []

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

    const repostUsers: Nullable<APIResponse<APIUser[]>> =
      await this._getResponse(
        FULL_ENDPOINT_MAP.playlistRepostUsers(encodedPlaylistId),
        params
      )

    if (!repostUsers) return []

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

    const followingResponse = await this._getResponse<APIResponse<APIUser[]>>(
      FULL_ENDPOINT_MAP.playlistFavoriteUsers(encodedPlaylistId),
      params
    )

    if (!followingResponse) return []

    const adapted = followingResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getTrack(
    { id, currentUserId, unlistedArgs, abortOnUnreachable }: GetTrackArgs,
    retry = true
  ) {
    const encodedTrackId = this._encodeOrThrow(id)
    const encodedCurrentUserId = encodeHashId(currentUserId ?? null)

    this._assertInitialized()

    const args = {
      user_id: encodedCurrentUserId,
      url_title: unlistedArgs?.urlTitle,
      handle: unlistedArgs?.handle,
      show_unlisted: !!unlistedArgs
    }

    const trackResponse = await this._getResponse<APIResponse<APITrack>>(
      FULL_ENDPOINT_MAP.getTrack(encodedTrackId),
      args,
      retry,
      undefined,
      undefined,
      abortOnUnreachable
    )

    if (!trackResponse) return null
    const adapted = adapter.makeTrack(trackResponse.data)
    return adapted
  }

  async getTracks({ ids, currentUserId }: GetTracksArgs) {
    this._assertInitialized()
    const encodedTrackIds = ids.map((id) => this._encodeOrThrow(id))
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      id: encodedTrackIds,
      user_id: encodedCurrentUserId || undefined,
      limit: encodedTrackIds.length
    }

    const trackResponse = await this._getResponse<APIResponse<APITrack[]>>(
      FULL_ENDPOINT_MAP.getTracks(),
      params,
      true
    )
    if (!trackResponse) {
      return null
    }
    const adapted = trackResponse.data
      .map((track) => adapter.makeTrack(track))
      .filter(removeNullable)
    return adapted
  }

  async getTrackByHandleAndSlug({
    handle,
    slug,
    currentUserId
  }: GetTrackByHandleAndSlugArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      handle,
      slug,
      user_id: encodedCurrentUserId || undefined
    }

    const trackResponse = await this._getResponse<APIResponse<APITrack>>(
      FULL_ENDPOINT_MAP.getTrackByHandleAndSlug,
      params,
      true
    )
    if (!trackResponse) {
      return null
    }
    return adapter.makeTrack(trackResponse.data)
  }

  async getStems({ trackId }: GetStemsArgs): Promise<StemTrackMetadata[]> {
    this._assertInitialized()
    const encodedTrackId = this._encodeOrThrow(trackId)
    const response = await this._getResponse<APIResponse<APIStem[]>>(
      FULL_ENDPOINT_MAP.getStems(encodedTrackId)
    )

    if (!response) return []

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

    const remixesResponse = await this._getResponse<
      APIResponse<RemixesResponse>
    >(FULL_ENDPOINT_MAP.getRemixes(encodedTrackId), params)

    if (!remixesResponse) return { count: 0, tracks: [] }

    const tracks = remixesResponse.data.tracks
      .map(adapter.makeTrack)
      .filter(removeNullable)
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

    const remixingResponse = await this._getResponse<APIResponse<APITrack[]>>(
      FULL_ENDPOINT_MAP.getRemixing(encodedTrackId),
      params
    )

    if (!remixingResponse) return []

    const tracks = remixingResponse.data.map(adapter.makeTrack)
    return tracks
  }

  async getUser({ userId, currentUserId, abortOnUnreachable }: GetUserArgs) {
    const encodedUserId = this._encodeOrThrow(userId)
    const encodedCurrentUserId = encodeHashId(currentUserId)
    this._assertInitialized()
    const params = {
      user_id: encodedCurrentUserId || undefined
    }

    const response = await this._getResponse<APIResponse<APIUser[]>>(
      FULL_ENDPOINT_MAP.getUser(encodedUserId),
      params,
      undefined,
      undefined,
      undefined,
      abortOnUnreachable
    )

    if (!response) return []

    const adapted = response.data.map(adapter.makeUser).filter(removeNullable)
    return adapted
  }

  async getUserByHandle({
    handle,
    currentUserId,
    retry = true
  }: GetUserByHandleArgs) {
    const encodedCurrentUserId = encodeHashId(currentUserId)
    this._assertInitialized()
    const params = {
      user_id: encodedCurrentUserId || undefined
    }

    const response = await this._getResponse<APIResponse<APIUser[]>>(
      FULL_ENDPOINT_MAP.userByHandle(handle),
      params,
      retry
    )

    if (!response) return []

    const adapted = response.data.map(adapter.makeUser).filter(removeNullable)
    return adapted
  }

  async getUserTracksByHandle({
    handle,
    currentUserId,
    sort = 'date',
    limit,
    offset,
    getUnlisted
  }: GetUserTracksByHandleArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      sort,
      limit,
      offset
    }

    let headers = {}
    if (encodedCurrentUserId && getUnlisted) {
      const { data, signature } = await this.audiusBackendInstance.signData()
      headers = {
        [AuthHeaders.Message]: data,
        [AuthHeaders.Signature]: signature
      }
    }

    const response = await this._getResponse<APIResponse<APITrack[]>>(
      FULL_ENDPOINT_MAP.userTracksByHandle(handle),
      params,
      true,
      PathType.VersionFullPath,
      headers
    )

    if (!response) return []

    const adapted = response.data.map(adapter.makeTrack).filter(removeNullable)
    return adapted
  }

  async getUserAiTracksByHandle({
    handle,
    currentUserId,
    sort = 'date',
    limit,
    offset,
    getUnlisted
  }: GetUserAiTracksByHandleArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      sort,
      limit,
      offset
    }

    let headers = {}
    if (encodedCurrentUserId && getUnlisted) {
      const { data, signature } = await this.audiusBackendInstance.signData()
      headers = {
        [AuthHeaders.Message]: data,

        [AuthHeaders.Signature]: signature
      }
    }

    const response = await this._getResponse<APIResponse<APITrack[]>>(
      FULL_ENDPOINT_MAP.userAiTracksByHandle(handle),
      params,
      true,
      PathType.VersionFullPath,
      headers
    )

    if (!response) return []

    const adapted = response.data.map(adapter.makeTrack).filter(removeNullable)
    return adapted
  }

  async getPremiumTracks({
    currentUserId,
    limit,
    offset
  }: GetPremiumTracksArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset
    }

    const response = await this._getResponse<APIResponse<APITrack[]>>(
      FULL_ENDPOINT_MAP.getPremiumTracks,
      params,
      true,
      PathType.VersionFullPath
    )

    if (!response) return []

    const adapted = response.data.map(adapter.makeTrack).filter(removeNullable)
    return adapted
  }

  async getFavorites({ currentUserId, limit }: GetFavoritesArgs) {
    this._assertInitialized()
    const encodedUserId = encodeHashId(currentUserId)
    const params = { user_id: encodedUserId, limit }
    const response = await this._getResponse<APIResponse<APIFavorite[]>>(
      ENDPOINT_MAP.userFavorites(encodedUserId),
      params,
      true,
      PathType.VersionPath
    )
    if (!response) return null
    const { data } = response
    return data.map(adapter.makeFavorite).filter(removeNullable)
  }

  async getFavoritedTracks({
    profileUserId,
    currentUserId,
    limit,
    offset,
    query,
    sortMethod,
    sortDirection
  }: GetProfileListArgs) {
    this._assertInitialized()
    const encodedUserId = encodeHashId(currentUserId)
    const encodedProfileUserId = this._encodeOrThrow(profileUserId)
    const params = {
      user_id: encodedUserId || undefined,
      limit,
      offset,
      ...(query && { query }),
      ...(sortMethod && { sort_method: sortMethod }),
      ...(sortDirection && { sort_direction: sortDirection })
    }

    const response = await this._getResponse<APIResponse<APIActivity[]>>(
      FULL_ENDPOINT_MAP.userFavoritedTracks(encodedProfileUserId),
      params
    )

    if (!response) return null

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

    const response = await this._getResponse<APIResponse<APIActivity[]>>(
      FULL_ENDPOINT_MAP.userRepostsByHandle(handle),
      params
    )

    if (!response) return []

    const adapted = response.data
      .map(adapter.makeActivity)
      .filter(removeNullable)
    return adapted
  }

  async getRelatedArtists({ userId, offset, limit }: GetRelatedArtistsArgs) {
    this._assertInitialized()
    const encodedUserId = this._encodeOrThrow(userId)
    const response = await this._getResponse<APIResponse<APIUser[]>>(
      FULL_ENDPOINT_MAP.getRelatedArtists(encodedUserId),
      { offset, limit }
    )
    if (!response) return []
    const adapted = response.data.map(adapter.makeUser).filter(removeNullable)
    return adapted
  }

  async getTopArtistGenres({ genres, limit, offset }: GetTopArtistGenresArgs) {
    this._assertInitialized()

    const params = {
      genre: genres,
      limit,
      offset
    }

    const favoritedTrackResponse = await this._getResponse<
      APIResponse<APIUser[]>
    >(FULL_ENDPOINT_MAP.topGenreUsers, params)

    if (!favoritedTrackResponse) return []

    const adapted = favoritedTrackResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getTopArtists({ limit, offset, currentUserId }: GetTopArtistsArgs) {
    this._assertInitialized()
    const encodedUserId = encodeHashId(currentUserId)

    const params = {
      limit,
      offset,
      user_id: encodedUserId
    }

    const topArtistsResponse = await this._getResponse<APIResponse<APIUser[]>>(
      FULL_ENDPOINT_MAP.topArtists,
      params
    )

    if (!topArtistsResponse) return []

    const adapted = topArtistsResponse.data
      .map(adapter.makeUser)
      .filter(removeNullable)
    return adapted
  }

  async getCollectionMetadata({
    collectionId,
    currentUserId,
    abortOnUnreachable
  }: GetCollectionMetadataArgs) {
    this._assertInitialized()

    const headers = { 'X-User-ID': currentUserId.toString() }
    const params = { playlist_id: collectionId }
    const response = await this._getResponse<APIResponse<CollectionMetadata[]>>(
      ROOT_ENDPOINT_MAP.getCollectionMetadata,
      params,
      false,
      PathType.RootPath,
      headers,
      abortOnUnreachable
    )
    return response?.data?.[0]
  }

  async getPlaylist({
    playlistId,
    currentUserId,
    abortOnUnreachable
  }: GetPlaylistArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedPlaylistId = this._encodeOrThrow(playlistId)
    const params = {
      user_id: encodedCurrentUserId || undefined
    }

    const response = await this._getResponse<APIResponse<APIPlaylist[]>>(
      FULL_ENDPOINT_MAP.getPlaylist(encodedPlaylistId),
      params,
      undefined,
      undefined,
      undefined,
      abortOnUnreachable
    )

    if (!response) return []

    const adapted = response.data
      .map(adapter.makePlaylist)
      .filter(removeNullable)
    return adapted
  }

  async getPlaylistByPermalink({
    permalink,
    currentUserId
  }: GetPlaylistByPermalinkArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedCurrentUserId || undefined
    }
    const splitPermalink = permalink.split('/')
    if (splitPermalink.length !== 4) {
      throw Error(
        'Permalink formatted incorrectly. Should follow /<handle>/playlist/<slug> format.'
      )
    }
    const [, handle, , slug] = splitPermalink
    const response = await this._getResponse<APIResponse<APIPlaylist[]>>(
      FULL_ENDPOINT_MAP.getPlaylistByPermalink(handle, slug),
      params
    )

    if (!response) return []

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
    limit,
    includePurchaseable
  }: GetSearchArgs) {
    this._assertInitialized()
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedUserId,
      query,
      kind,
      offset,
      limit,
      includePurchaseable
    }

    const searchResponse =
      (await this._getResponse<APIResponse<APISearch>>(
        FULL_ENDPOINT_MAP.searchFull,
        params
      )) ?? emptySearchResponse

    const adapted = adapter.adaptSearchResponse(searchResponse)
    return processSearchResults(adapted)
  }

  async getSearchAutocomplete({
    currentUserId,
    query,
    kind,
    offset,
    limit,
    includePurchaseable
  }: GetSearchArgs) {
    this._assertInitialized()
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedUserId,
      query,
      kind,
      offset,
      limit,
      includePurchaseable
    }

    const searchResponse =
      (await this._getResponse<APIResponse<APISearchAutocomplete>>(
        FULL_ENDPOINT_MAP.searchAutocomplete,
        params
      )) ?? emptySearchResponse
    const adapted = adapter.adaptSearchAutocompleteResponse(searchResponse)
    return processSearchResults({
      isAutocomplete: true,
      ...adapted
    })
  }

  async getTrendingPlaylists({
    currentUserId,
    time,
    limit,
    offset
  }: GetTrendingPlaylistsArgs) {
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedUserId,
      limit,
      offset,
      time
    }

    const experiment = this.remoteConfigInstance.getRemoteVar(
      StringKeys.PLAYLIST_TRENDING_EXPERIMENT
    )
    const response = await this._getResponse<APIResponse<APIPlaylist[]>>(
      FULL_ENDPOINT_MAP.trendingPlaylists(experiment),
      params
    )

    if (!response) return []
    const adapted = response.data
      .map(adapter.makePlaylist)
      .filter(removeNullable)
    return adapted
  }

  async getAssociatedWallets({ userID }: GetAssociatedWalletsArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(userID)
    const params = { id: encodedCurrentUserId }
    const associatedWallets: Nullable<APIResponse<AssociatedWalletsResponse>> =
      await this._getResponse(
        ENDPOINT_MAP.associatedWallets,
        params,
        true,
        PathType.VersionPath
      )

    if (!associatedWallets) return null
    return associatedWallets.data
  }

  async getAssociatedWalletUserId({ address }: GetAssociatedWalletUserIDArgs) {
    this._assertInitialized()
    const params = { associated_wallet: address }

    const userID: Nullable<APIResponse<AssociatedWalletUserIdResponse>> =
      await this._getResponse(
        ENDPOINT_MAP.associatedWalletUserId,
        params,
        true,
        PathType.VersionPath
      )

    if (!userID) return null
    const encodedUserId = userID.data.user_id
    return encodedUserId ? decodeHashId(encodedUserId.toString()) : null
  }

  getUserChallenges = async ({ userID }: GetUserChallengesArgs) => {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(userID)
    if (encodedCurrentUserId === null) return null // throw error

    const params = { id: encodedCurrentUserId }

    const userChallenges: Nullable<APIResponse<UserChallengesResponse>> =
      await this._getResponse(
        ENDPOINT_MAP.userChallenges(encodedCurrentUserId),
        params,
        true,
        PathType.VersionPath
      )

    if (!userChallenges) return null
    // DN may have amount as a string
    const challenges = userChallenges.data.map((challenge) => {
      return {
        ...challenge,
        amount: Number(challenge.amount)
      }
    })
    return challenges
  }

  getUserTags = async ({ userId }: { userId: ID }) => {
    const encodedUserId = encodeHashId(userId)
    return await this._getResponse<APIResponse<string[]>>(
      ENDPOINT_MAP.userTags(encodedUserId),
      undefined,
      false,
      PathType.VersionPath
    )
  }

  getUndisbursedUserChallenges = async ({ userID }: { userID: ID }) => {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(userID)
    if (encodedCurrentUserId === null) return null // throw error

    const params = { user_id: encodedCurrentUserId }

    const undisbursedUserChallenges: Nullable<
      APIResponse<UndisbursedUserChallengesResponse>
    > = await this._getResponse(
      ENDPOINT_MAP.undisbursedUserChallenges,
      params,
      true /* retry */,
      PathType.VersionPath
    )

    if (!undisbursedUserChallenges) return null
    // DN may have amount as a string
    const challenges = undisbursedUserChallenges.data.map((challenge) => {
      return {
        ...challenge,
        amount: Number(challenge.amount)
      }
    })
    return challenges
  }

  async getBlockConfirmation(
    blockhash: string,
    blocknumber: number
  ): Promise<
    | {
        block_found: boolean
        block_passed: boolean
      }
    | {}
  > {
    const response = await this._getResponse<APIResponse<APIBlockConfirmation>>(
      ROOT_ENDPOINT_MAP.blockConfirmation,
      { blockhash, blocknumber },
      true,
      PathType.RootPath
    )
    if (!response) return {}
    return response.data
  }

  async getSocialFeed({
    offset,
    limit,
    with_users,
    filter,
    tracks_only,
    followee_user_ids,
    current_user_id
  }: GetSocialFeedArgs) {
    this._assertInitialized()
    const headers = current_user_id
      ? {
          'X-User-ID': current_user_id.toString()
        }
      : undefined
    const response = await this._getResponse<
      APIResponse<GetSocialFeedResponse>
    >(
      ROOT_ENDPOINT_MAP.feed,
      {
        offset,
        limit,
        with_users,
        filter,
        tracks_only,
        followee_user_id: followee_user_ids
          ? followee_user_ids.map((id) => id.toString())
          : undefined
      },
      true,
      PathType.RootPath,
      headers
    )
    if (!response) return null
    return response.data
  }

  async getUserTrackHistory({
    currentUserId,
    userId,
    offset = 0,
    limit = 100,
    sortMethod
  }: GetUserTrackHistoryArgs) {
    const encodedUserId = this._encodeOrThrow(userId)
    const encodedCurrentUserId = encodeHashId(currentUserId)
    this._assertInitialized()
    const params = {
      user_id: encodedCurrentUserId || undefined,
      limit,
      offset,
      sort_method: sortMethod
    }

    const response = await this._getResponse<APIResponse<APIActivity[]>>(
      FULL_ENDPOINT_MAP.getUserTrackHistory(encodedUserId),
      params
    )

    if (!response) return []

    const adapted = response.data.map(({ item, ...props }) => ({
      timestamp: props.timestamp,
      track: adapter.makeTrack(item as APITrack)
    }))
    return adapted
  }

  async getUserSupporter({
    currentUserId,
    userId,
    supporterUserId
  }: GetUserSupporterArgs) {
    const encodedUserId = this._encodeOrThrow(userId)
    const encodedSupporterUserId = this._encodeOrThrow(supporterUserId)
    const encodedCurrentUserId = encodeHashId(currentUserId)
    this._assertInitialized()
    const params = {
      user_id: encodedCurrentUserId || undefined
    }

    const response = await this._getResponse<APIResponse<SupporterResponse>>(
      FULL_ENDPOINT_MAP.getUserSupporter(encodedUserId, encodedSupporterUserId),
      params
    )
    return response ? response.data : null
  }

  async getReaction({ reactedToIds }: GetReactionArgs) {
    const params = {
      reacted_to_ids: reactedToIds
    }
    const response = await this._getResponse<APIResponse<GetReactionResponse>>(
      FULL_ENDPOINT_MAP.getReaction,
      params,
      false,
      PathType.VersionFullPath,
      {},
      true
    ) // Perform without retries, using 'split' approach for multiple query params

    if (!response || !response.data.length) return null

    const adapted = response.data.map((item) => ({
      reactionValue: parseInt(item.reaction_value),
      reactionType: item.reaction_type,
      senderUserId: decodeHashId(item.sender_user_id),
      reactedTo: item.reacted_to
    }))[0]

    return adapted
  }

  async getSupporting({ userId, limit = 25, offset = 0 }: GetSupportingArgs) {
    const encodedUserId = this._encodeOrThrow(userId)
    this._assertInitialized()
    const params = {
      limit,
      offset
    }

    const response = await this._getResponse<APIResponse<SupportingResponse[]>>(
      FULL_ENDPOINT_MAP.getSupporting(encodedUserId),
      params
    )
    return response ? response.data : null
  }

  async getSupporters({ userId, limit = 25, offset = 0 }: GetSupportersArgs) {
    const encodedUserId = this._encodeOrThrow(userId)
    this._assertInitialized()
    const params = {
      limit,
      offset
    }

    const response = await this._getResponse<APIResponse<SupporterResponse[]>>(
      FULL_ENDPOINT_MAP.getSupporters(encodedUserId),
      params
    )
    return response ? response.data : null
  }

  async getTips({
    userId,
    limit,
    offset,
    receiverMinFollowers,
    receiverIsVerified,
    currentUserFollows,
    uniqueBy,
    minSlot,
    maxSlot,
    txSignatures
  }: GetTipsArgs) {
    const encodedUserId = this._encodeOrThrow(userId)
    this._assertInitialized()
    const params = {
      user_id: encodedUserId,
      limit,
      offset,
      receiver_min_followers: receiverMinFollowers,
      receiver_is_verififed: receiverIsVerified,
      current_user_follows: currentUserFollows,
      unique_by: uniqueBy,
      min_slot: minSlot,
      max_slot: maxSlot,
      tx_signatures: txSignatures
    }

    const response = await this._getResponse<APIResponse<GetTipsResponse[]>>(
      FULL_ENDPOINT_MAP.getTips,
      params
    )
    if (response && response.data) {
      return response.data
        .map((u) => {
          const sender = adapter.makeUser(u.sender)
          const receiver = adapter.makeUser(u.receiver)
          // Should never happen
          if (!sender && receiver) return null

          return {
            ...u,
            sender: adapter.makeUser(u.sender)!,
            receiver: adapter.makeUser(u.receiver)!,
            // Hack alert:
            // Don't show followee supporters yet, because they take too
            // long to load in (requires a subsequent call to DN)
            // followee_supporter_ids: u.followee_supporters.map(({ user_id }) =>
            //   decodeHashId(user_id)
            // )
            followee_supporter_ids: []
          }
        })
        .filter(removeNullable)
    }
    return null
  }

  async getNFTGatedTrackSignatures({
    userId,
    trackMap
  }: GetNFTGatedTrackSignaturesArgs) {
    if (!Object.keys(trackMap).length) return null

    const encodedUserId = this._encodeOrThrow(userId)
    this._assertInitialized()

    // To avoid making a POST request and thereby introducing a new pattern in the DN,
    // we build a param string that represents the info we need to verify nft collection ownership.
    // The trackMap is a map of track ids -> token ids.
    // If the nft collection is not ERC1155, then there are no token ids.
    // We append the track ids and token ids as query params, making sure they're the same length
    // so that DN knows which token ids belong to which track ids.
    // Example:
    // trackMap: { 1: [1, 2], 2: [], 3: [1]}
    // query params: '?track_ids=1&token_ids=1-2&track_ids=2&token_ids=&track_ids=3&token_ids=1'
    const trackIdParams: string[] = []
    const tokenIdParams: string[] = []
    Object.keys(trackMap).forEach((trackId) => {
      trackIdParams.push(trackId)
      tokenIdParams.push(trackMap[trackId].join('-'))
    })
    const params = {
      track_ids: trackIdParams,
      token_ids: tokenIdParams
    }

    const response = await this._getResponse<
      APIResponse<GetNFTGatedTrackSignaturesResponse>
    >(FULL_ENDPOINT_MAP.getNFTGatedTrackSignatures(encodedUserId), params)
    return response ? response.data : null
  }

  async getPlaylistUpdates(userId: number) {
    type ApiPlaylistUpdate = {
      playlist_id: string
      updated_at: string
      last_seen_at: string
    }
    type PlaylistUpdatesResponse = { playlist_updates: ApiPlaylistUpdate[] }
    const response = await this._getResponse<
      APIResponse<PlaylistUpdatesResponse>
    >(FULL_ENDPOINT_MAP.playlistUpdates(encodeHashId(userId)))
    const playlistUpdates = response?.data?.playlist_updates

    if (!playlistUpdates) {
      return null
    }

    return playlistUpdates.map((playlistUpdate) => ({
      ...playlistUpdate,
      playlist_id: decodeHashId(playlistUpdate.playlist_id) as number
    }))
  }

  async init() {
    if (this.initializationState.state === 'initialized') return

    // If override passed, use that and return
    if (this.overrideEndpoint) {
      console.debug(
        `APIClient: Using override endpoint: ${this.overrideEndpoint}`
      )
      this.initializationState = {
        state: 'initialized',
        endpoint: this.overrideEndpoint,
        type: 'manual'
      }
      return
    }

    // Set the state to the eager discprov
    const eagerDiscprov = await getEagerDiscprov(this.localStorage, this.env)
    if (eagerDiscprov) {
      console.debug(`APIClient: setting to eager discprov: ${eagerDiscprov}`)
      this.initializationState = {
        state: 'initialized',
        endpoint: eagerDiscprov,
        type: 'manual'
      }
    }

    // Listen for libs on chain selection
    this.audiusBackendInstance.addDiscoveryProviderSelectionListener(
      (endpoint: string | null) => {
        if (endpoint) {
          console.debug(`APIClient: Setting to libs discprov: ${endpoint}`)
          this.initializationState = {
            state: 'initialized',
            endpoint,
            type: 'libs'
          }
        } else {
          console.warn('APIClient: No libs discprov endpoint')
        }
      }
    )

    console.debug('APIClient: Initialized')
  }

  makeUrl = (
    path: string,
    queryParams: QueryParams = {},
    pathType: PathType = PathType.VersionPath
  ) => {
    const formattedPath = this._formatPath(pathType, path)
    return this._constructUrl(formattedPath, queryParams)
  }

  // Helpers

  _assertInitialized() {
    if (this.initializationState.state !== 'initialized')
      throw new Error('AudiusAPIClient must be initialized before use')
  }

  async _getResponse<T>(
    path: string,
    params: QueryParams = {},
    retry = false,
    pathType: PathType = PathType.VersionFullPath,
    headers?: { [key: string]: string },
    splitArrayParams = false,
    abortOnUnreachable = true
  ): Promise<Nullable<T>> {
    if (this.initializationState.state !== 'initialized')
      throw new Error('_getResponse called uninitialized')

    // If not reachable, abort
    if (!this.isReachable && abortOnUnreachable) {
      console.debug(`APIClient: Not reachable, aborting request`)
      return null
    }

    // If a param has a null value, remove it
    const sanitizedParams = Object.keys(params).reduce((acc, cur) => {
      const val = params[cur]
      if (val === null || val === undefined) return acc
      return { ...acc, [cur]: val }
    }, {})

    const formattedPath = this._formatPath(pathType, path)
    const audiusLibs = this.getAudiusLibs()

    if (audiusLibs && this.initializationState.type === 'libs') {
      const data = await audiusLibs.discoveryProvider?._makeRequest(
        {
          endpoint: formattedPath,
          queryParams: sanitizedParams,
          headers
        },
        retry
      )
      if (!data) return null
      // TODO: Type boundaries of API
      return { data } as any
    }

    // Initialization type is manual. Make requests with fetch and handle failures.
    const resource = this._constructUrl(
      formattedPath,
      sanitizedParams,
      splitArrayParams
    )
    try {
      const response = await fetch(resource, { headers })
      if (!response.ok) {
        throw new Error(response.statusText)
      }
      return response.json()
    } catch (e) {
      // Something went wrong with the request and we should wait for the libs
      // initialization state if needed before retrying
      if (this.initializationState.type === 'manual') {
        await this.waitForLibsInit()
        this.initializationState = {
          type: 'libs',
          state: 'initialized',
          endpoint: this.initializationState.endpoint
        }
      }
      return this._getResponse(path, sanitizedParams, retry, pathType)
    }
  }

  _formatPath(pathType: PathType, path: string) {
    return `${pathType}${path}`
  }

  _encodeOrThrow(id: ID): OpaqueID {
    const encoded = encodeHashId(id)
    if (!encoded) {
      return 'abc'
      // throw new Error(`Unable to encode id: ${id}`)
    }
    return encoded
  }

  _constructUrl(
    path: string,
    queryParams: QueryParams = {},
    splitArrayParams = false
  ) {
    if (this.initializationState.state !== 'initialized')
      throw new Error('_constructURL called uninitialized')
    const params = Object.entries(queryParams)
      .filter((p) => p[1] !== undefined && p[1] !== null)
      .map((p) => {
        if (Array.isArray(p[1])) {
          if (splitArrayParams) {
            // If we split, join in the form of
            // ?key=val1,val2,val3...
            return `${p[0]}=${p[1]
              .map((val) => encodeURIComponent(val))
              .join(',')}`
          } else {
            // Otherwise, join in the form of
            // ?key=val1&key=val2&key=val3...
            return p[1]
              .map((val) => `${p[0]}=${encodeURIComponent(val)}`)
              .join('&')
          }
        }
        return `${p[0]}=${encodeURIComponent(p[1]!)}`
      })
      .join('&')
    return `${this.initializationState.endpoint}${path}?${params}`
  }
}
