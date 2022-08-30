import { SolanaClient } from 'services/solana-client'

import { AnalyticsEvent, LineupState, Track } from '../models'
import { AudioPlayer } from '../services/audio-player'
import { AudiusAPIClient } from '../services/audius-api-client'
import { AudiusBackend } from '../services/audius-backend'
import { Env } from '../services/env'
import { Explore } from '../services/explore'
import { FingerprintClient } from '../services/fingerprint'
import { LocalStorage } from '../services/local-storage'
import { FeatureFlags, RemoteConfigInstance } from '../services/remote-config'
import { WalletClient } from '../services/wallet-client'

import { CommonState } from './reducers'

export type CommonStoreContext = {
  getLocalStorageItem: (key: string) => Promise<string | null>
  setLocalStorageItem: (key: string, value: string) => Promise<void>
  getFeatureEnabled: (
    flag: FeatureFlags
  ) => Promise<boolean | null> | boolean | null
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
  fingerprintClient: FingerprintClient
  walletClient: WalletClient
  localStorage: LocalStorage
  isNativeMobile: boolean
  env: Env
  explore: Explore
  // A helper that returns the appropriate lineup selector for the current
  // route or screen.
  getLineupSelectorForRoute?: () => (state: CommonState) => LineupState<Track>
  audioPlayer: AudioPlayer
  solanaClient: SolanaClient
}
