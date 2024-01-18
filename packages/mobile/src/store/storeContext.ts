import type { CommonStoreContext } from '@audius/common'
import { OpenSeaClient, SolanaClient } from '@audius/common'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Sentry from '@sentry/react-native'
import { env } from 'app/env'

import * as analytics from 'app/services/analytics'
import { audioPlayer } from 'app/services/audio-player'
import { apiClient } from 'app/services/audius-api-client'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { explore } from 'app/services/explore'
import { fingerprintClient } from 'app/services/fingerprint'
import { localStorage } from 'app/services/local-storage'
import {
  getFeatureEnabled,
  remoteConfigInstance
} from 'app/services/remote-config'
import { audiusSdk } from 'app/services/sdk/audius-sdk'
import { trackDownload } from 'app/services/track-download'
import { walletClient } from 'app/services/wallet-client'
import { generatePlaylistArtwork } from 'app/utils/generatePlaylistArtwork'
import { reportToSentry } from 'app/utils/reportToSentry'
import share from 'app/utils/share'

export const storeContext: CommonStoreContext = {
  getLocalStorageItem: async (key) => AsyncStorage.getItem(key),
  setLocalStorageItem: async (key, value) => AsyncStorage.setItem(key, value),
  removeLocalStorageItem: async (key) => AsyncStorage.removeItem(key),
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
    solanaClusterEndpoint: env.SOLANA_CLUSTER_ENDPOINT,
    metadataProgramId: env.METADATA_PROGRAM_ID
  }),
  sentry: Sentry,
  reportToSentry,
  // Shim in main, but defined in native-reloaded branch
  audioPlayer,
  trackDownload,
  instagramAppId: env.INSTAGRAM_APP_ID,
  instagramRedirectUrl: env.INSTAGRAM_REDIRECT_URL,
  share: (url: string, message?: string) => share({ url, message }),
  openSeaClient: new OpenSeaClient(env.OPENSEA_API_URL!),
  audiusSdk,
  imageUtils: {
    generatePlaylistArtwork
  }
}
