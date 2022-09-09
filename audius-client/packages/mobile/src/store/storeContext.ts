import type { CommonStoreContext } from '@audius/common'
import { SolanaClient } from '@audius/common'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Sentry from '@sentry/react-native'
import Config from 'react-native-config'

import * as analytics from 'app/services/analytics'
import { audioPlayer } from 'app/services/audio-player'
import { apiClient } from 'app/services/audius-api-client'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { cognito } from 'app/services/cognito'
import { env } from 'app/services/env'
import { explore } from 'app/services/explore'
import { fingerprintClient } from 'app/services/fingerprint'
import { localStorage } from 'app/services/local-storage'
import {
  getFeatureEnabled,
  remoteConfigInstance
} from 'app/services/remote-config'
import { trackDownload } from 'app/services/track-download'
import { walletClient } from 'app/services/wallet-client'
import share from 'app/utils/share'

export const storeContext: CommonStoreContext = {
  getLocalStorageItem: async (key) => AsyncStorage.getItem(key),
  setLocalStorageItem: async (key, value) => AsyncStorage.setItem(key, value),
  getFeatureEnabled,
  analytics,
  remoteConfigInstance,
  audiusBackendInstance,
  apiClient,
  fingerprintClient,
  walletClient,
  localStorage,
  isNativeMobile: true,
  isElectron: false,
  env,
  explore,
  solanaClient: new SolanaClient({
    solanaClusterEndpoint: Config.SOLANA_CLUSTER_ENDPOINT,
    metadataProgramId: Config.METADATA_PROGRAM_ID
  }),
  sentry: Sentry,
  // Shim in main, but defined in native-reloaded branch
  audioPlayer,
  cognito,
  trackDownload,
  share: (url, message) => share({ url, message })
}
