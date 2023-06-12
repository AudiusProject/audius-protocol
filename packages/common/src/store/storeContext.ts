import type { AudiusSdk } from '@audius/sdk'

import { AnalyticsEvent, LineupState, Track } from '../models'
import { AudioPlayer } from '../services/audio-player'
import { AudiusAPIClient } from '../services/audius-api-client'
import { AudiusBackend } from '../services/audius-backend'
import { Env } from '../services/env'
import { Explore } from '../services/explore'
import { FingerprintClient } from '../services/fingerprint'
import { LocalStorage } from '../services/local-storage'
import { OpenSeaClient } from '../services/opensea-client'
import { FeatureFlags, RemoteConfigInstance } from '../services/remote-config'
import { SolanaClient } from '../services/solana-client'
import { TrackDownload } from '../services/track-download'
import { WalletClient } from '../services/wallet-client'

import { CommonState } from './reducers'

export type CommonStoreContext = {
  getLocalStorageItem: (key: string) => Promise<string | null>
  setLocalStorageItem: (key: string, value: string) => Promise<void>
  removeLocalStorageItem: (key: string) => Promise<void>
  getFeatureEnabled: (
    flag: FeatureFlags,
    fallbackFlag?: FeatureFlags
  ) => Promise<boolean>
  analytics: {
    init: () => Promise<void>
    track: (event: AnalyticsEvent, callback?: () => void) => Promise<void>
    identify: (
      handle: string,
      traits?: Record<string, unknown>,
      options?: Record<string, unknown>,
      callback?: () => void
    ) => Promise<void>
  }
  remoteConfigInstance: RemoteConfigInstance
  audiusBackendInstance: AudiusBackend
  apiClient: AudiusAPIClient
  fingerprintClient: FingerprintClient<any>
  walletClient: WalletClient
  localStorage: LocalStorage
  isNativeMobile: boolean
  isElectron: boolean
  env: Env
  explore: Explore
  // A helper that returns the appropriate lineup selector for the current
  // route or screen.
  getLineupSelectorForRoute?: () => (state: CommonState) => LineupState<Track>
  audioPlayer: AudioPlayer
  solanaClient: SolanaClient
  sentry: {
    setTag: (key: string, value: string) => void
    configureScope: (fn: (scope: { setUser: any }) => void) => void
  }
  trackDownload: TrackDownload
  instagramAppId?: string
  instagramRedirectUrl?: string
  share: (url: string, message?: string) => Promise<void> | void
  openSeaClient: OpenSeaClient
  audiusSdk: () => Promise<AudiusSdk>
  imageUtils: {
    createPlaylistArtwork: (
      urls: string[]
    ) => Promise<{ file: File; url: string }>
  }
}
