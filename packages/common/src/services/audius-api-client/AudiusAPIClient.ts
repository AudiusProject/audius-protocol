import type { AudiusLibs, Genre, Mood } from '@audius/sdk'

import { ID, StemTrackMetadata, CollectionMetadata } from '../../models'
import {
  SearchKind,
  SearchSortMethod
} from '../../store/pages/search-results/types'
import { decodeHashId, encodeHashId } from '../../utils/hashIds'
import { Nullable, removeNullable } from '../../utils/typeUtils'
import type { AudiusBackend } from '../audius-backend'
import { getEagerDiscprov } from '../audius-backend/eagerLoadUtils'
import { Env } from '../env'
import { LocalStorage } from '../local-storage'
import { StringKeys, RemoteConfigInstance } from '../remote-config'

import * as adapter from './ResponseAdapter'
import { processSearchResults } from './helper'
import {
  APIBlockConfirmation,
  APIPlaylist,
  APIResponse,
  APISearch,
  APISearchAutocomplete,
  APIStem,
  APITrack,
  GetNFTGatedTrackSignaturesResponse,
  GetTipsResponse,
  OpaqueID
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
  trendingPlaylists: (experiment: string | null) =>
    experiment ? `/playlists/trending/${experiment}` : '/playlists/trending',
  playlistUpdates: (userId: OpaqueID) =>
    `/notifications/${userId}/playlist_updates`,
  getPlaylist: (playlistId: OpaqueID) => `/playlists/${playlistId}`,
  getPlaylists: '/playlists',
  getPlaylistByPermalink: (handle: string, slug: string) =>
    `/playlists/by_permalink/${handle}/${slug}`,
  getTrackStreamUrl: (trackId: OpaqueID) => `/tracks/${trackId}/stream`,
  getStems: (trackId: OpaqueID, stemIds?: ID[]) =>
    `/tracks/${trackId}/stems${
      stemIds ? `?stemIds=${stemIds?.join(',')}` : ''
    }`,
  getRemixes: (trackId: OpaqueID) => `/tracks/${trackId}/remixes`,
  getRemixing: (trackId: OpaqueID) => `/tracks/${trackId}/remixing`,
  searchFull: `/search/full`,
  searchAutocomplete: `/search/autocomplete`,
  getReaction: '/reactions',
  getTips: '/tips',
  getNFTGatedTrackSignatures: (userId: OpaqueID) =>
    `/tracks/${userId}/nft-gated-signatures`,
  getPremiumTracks: '/tracks/usdc-purchase'
}

export type QueryParams = {
  [key: string]: string | number | undefined | boolean | string[] | null
}

type GetTrackStreamUrlArgs = {
  id: ID
  currentUserId?: Nullable<ID>
  queryParams: QueryParams
  unlistedArgs?: {
    urlTitle: string
    handle: string
  }
  abortOnUnreachable?: boolean
}

type GetPremiumTracksArgs = {
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

type GetPlaylistsArgs = {
  playlistIds: ID[]
  currentUserId: Nullable<ID>
  abortOnUnreachable?: boolean
}

type GetPlaylistByPermalinkArgs = {
  permalink: string
  currentUserId: Nullable<ID>
}

type GetStemsArgs = {
  trackId: ID
  stemIds?: ID[]
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
  genre?: Genre
  mood?: Mood
  bpmMin?: number
  bpmMax?: number
  key?: string
  isVerified?: boolean
  hasDownloads?: boolean
  isPremium?: boolean
  sortMethod?: SearchSortMethod
}

type GetTrendingPlaylistsArgs = {
  currentUserId: Nullable<ID>
  limit: number
  offset: number
  time: 'week' | 'month' | 'year'
}

export type AssociatedWalletsResponse = {
  wallets: string[]
  sol_wallets: string[]
}

export type GetSocialFeedArgs = QueryParams & {
  filter: string
  with_users?: boolean
  tracks_only?: boolean
  followee_user_ids?: ID[]
  current_user_id?: ID
}

type GetSocialFeedResponse = {}

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

type AudiusAPIClientConfig = {
  audiusBackendInstance: AudiusBackend
  getAudiusLibs: () => Nullable<AudiusLibs>
  overrideEndpoint?: string
  remoteConfigInstance: RemoteConfigInstance
  localStorage: LocalStorage
  env: Env
  waitForLibsInit: () => Promise<unknown>
  appName: string
  apiKey: string
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
  appName: string
  apiKey: string

  constructor({
    audiusBackendInstance,
    getAudiusLibs,
    overrideEndpoint,
    remoteConfigInstance,
    localStorage,
    env,
    waitForLibsInit,
    appName,
    apiKey
  }: AudiusAPIClientConfig) {
    this.audiusBackendInstance = audiusBackendInstance
    this.getAudiusLibs = getAudiusLibs
    this.overrideEndpoint = overrideEndpoint
    this.remoteConfigInstance = remoteConfigInstance
    this.localStorage = localStorage
    this.env = env
    this.waitForLibsInit = waitForLibsInit
    this.appName = appName
    this.apiKey = apiKey
  }

  setIsReachable(isReachable: boolean) {
    this.isReachable = isReachable
  }

  async getTrackStreamUrl(
    {
      id,
      currentUserId,
      queryParams,
      abortOnUnreachable
    }: GetTrackStreamUrlArgs,
    retry = true
  ) {
    const encodedTrackId = this._encodeOrThrow(id)
    const encodedCurrentUserId =
      encodeHashId(currentUserId ?? null) || undefined

    this._assertInitialized()

    const trackUrl = await this._getResponse<APIResponse<string>>(
      FULL_ENDPOINT_MAP.getTrackStreamUrl(encodedTrackId),
      {
        ...queryParams,
        no_redirect: true,
        user_id: encodedCurrentUserId
      },
      retry,
      PathType.VersionPath,
      undefined,
      abortOnUnreachable
    )

    return trackUrl?.data
  }

  async getStems({
    trackId,
    stemIds
  }: GetStemsArgs): Promise<StemTrackMetadata[]> {
    this._assertInitialized()
    const encodedTrackId = this._encodeOrThrow(trackId)
    const response = await this._getResponse<APIResponse<APIStem[]>>(
      FULL_ENDPOINT_MAP.getStems(encodedTrackId, stemIds)
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

  async getPlaylists({
    playlistIds,
    currentUserId,
    abortOnUnreachable
  }: GetPlaylistsArgs) {
    this._assertInitialized()
    const encodedCurrentUserId = encodeHashId(currentUserId)
    const encodedPlaylistIds = playlistIds.map((id) => this._encodeOrThrow(id))

    const params = {
      id: encodedPlaylistIds,
      user_id: encodedCurrentUserId || undefined,
      limit: encodedPlaylistIds.length
    }

    const response = await this._getResponse<APIResponse<APIPlaylist[]>>(
      FULL_ENDPOINT_MAP.getPlaylists,
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
    includePurchaseable,
    genre,
    mood,
    bpmMin,
    bpmMax,
    key,
    isVerified,
    hasDownloads,
    isPremium,
    sortMethod
  }: GetSearchArgs) {
    this._assertInitialized()
    const encodedUserId = encodeHashId(currentUserId)
    const params = {
      user_id: encodedUserId,
      query,
      kind,
      offset,
      limit,
      includePurchaseable,
      genre,
      mood,
      bpm_min: bpmMin,
      bpm_max: bpmMax,
      key,
      is_verified: isVerified,
      has_downloads: hasDownloads,
      is_purchaseable: isPremium,
      sort_method: sortMethod
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
      throw new Error(`Unable to encode id: ${id}`)
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
    const params = Object.entries({
      ...queryParams,
      app_name: this.appName,
      api_key: this.apiKey
    })
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
