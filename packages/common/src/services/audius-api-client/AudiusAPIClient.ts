import type { AudiusBackend } from '../audius-backend'
import { getEagerDiscprov } from '../audius-backend/eagerLoadUtils'
import { Env } from '../env'
import { LocalStorage } from '../local-storage'
import { RemoteConfigInstance } from '../remote-config'

enum PathType {
  RootPath = '',
  VersionPath = '/v1',
  VersionFullPath = '/v1/full'
}

export type QueryParams = {
  [key: string]: string | number | undefined | boolean | string[] | null
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

type AudiusAPIClientConfig = {
  audiusBackendInstance: AudiusBackend
  overrideEndpoint?: string
  remoteConfigInstance: RemoteConfigInstance
  localStorage: LocalStorage
  env: Env
  appName: string
  apiKey: string
}

export class AudiusAPIClient {
  initializationState: InitializationState = {
    state: 'uninitialized'
  }

  audiusBackendInstance: AudiusBackend
  overrideEndpoint?: string
  remoteConfigInstance: RemoteConfigInstance
  localStorage: LocalStorage
  env: Env
  isReachable?: boolean = true
  appName: string
  apiKey: string

  constructor({
    audiusBackendInstance,
    overrideEndpoint,
    remoteConfigInstance,
    localStorage,
    env,
    appName,
    apiKey
  }: AudiusAPIClientConfig) {
    this.audiusBackendInstance = audiusBackendInstance
    this.overrideEndpoint = overrideEndpoint
    this.remoteConfigInstance = remoteConfigInstance
    this.localStorage = localStorage
    this.env = env
    this.appName = appName
    this.apiKey = apiKey
  }

  setIsReachable(isReachable: boolean) {
    this.isReachable = isReachable
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
  _formatPath(pathType: PathType, path: string) {
    return `${pathType}${path}`
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
