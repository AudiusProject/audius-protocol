import type { AudiusLibs, Genre, Mood } from '@audius/sdk'

import { ID } from '../../models'
import {
  SearchKind,
  SearchSortMethod
} from '../../store/pages/search-results/types'
import { decodeHashId, encodeHashId } from '../../utils/hashIds'
import { Nullable } from '../../utils/typeUtils'
import type { AudiusBackend } from '../audius-backend'
import { getEagerDiscprov } from '../audius-backend/eagerLoadUtils'
import { Env } from '../env'
import { LocalStorage } from '../local-storage'
import { RemoteConfigInstance } from '../remote-config'

import * as adapter from './ResponseAdapter'
import { processSearchResults } from './helper'
import {
  APIBlockConfirmation,
  APIResponse,
  APISearch,
  APISearchAutocomplete,
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
  blockConfirmation: '/block_confirmation'
}

const FULL_ENDPOINT_MAP = {
  playlistUpdates: (userId: OpaqueID) =>
    `/notifications/${userId}/playlist_updates`,
  searchFull: `/search/full`,
  searchAutocomplete: `/search/autocomplete`
}

export type QueryParams = {
  [key: string]: string | number | undefined | boolean | string[] | null
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
