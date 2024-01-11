import {
  SolanaClient,
  CommonStoreContext,
  OpenSeaClient,
  FeatureFlags
} from '@audius/common'
import { setTag, configureScope } from '@sentry/browser'

import * as analytics from 'services/analytics'
import { audioPlayer } from 'services/audio-player'
import { apiClient } from 'services/audius-api-client'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { audiusSdk } from 'services/audius-sdk'
import { env } from 'services/env'
import { explore } from 'services/explore'
import { fingerprintClient } from 'services/fingerprint'
import { localStorage } from 'services/local-storage'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { trackDownload } from 'services/track-download'
import { walletClient } from 'services/wallet-client'
import { isElectron } from 'utils/clientUtil'
import { generatePlaylistArtwork } from 'utils/imageProcessingUtil'
import { getShare } from 'utils/share'

import { reportToSentry } from './errors/reportToSentry'
import { getLineupSelectorForRoute } from './lineup/lineupForRoute'

export const buildStoreContext = ({
  isMobile
}: {
  isMobile: boolean
}): CommonStoreContext => ({
  getLocalStorageItem: async (key: string) =>
    window?.localStorage?.getItem(key),
  setLocalStorageItem: async (key: string, value: string) =>
    window?.localStorage?.setItem(key, value),
  removeLocalStorageItem: async (key: string) =>
    window?.localStorage?.removeItem(key),
  // Note: casting return type to Promise<boolean> to maintain pairity with mobile, but
  // it may be best to update mobile to not be async
  getFeatureEnabled: getFeatureEnabled as unknown as (
    flag: FeatureFlags
  ) => Promise<boolean>,
  analytics,
  remoteConfigInstance,
  audiusBackendInstance,
  apiClient,
  fingerprintClient,
  walletClient,
  localStorage,
  isNativeMobile: false,
  isElectron: isElectron(),
  env,
  explore,
  // @ts-ignore js file
  getLineupSelectorForRoute,
  audioPlayer: audioPlayer!,
  solanaClient: new SolanaClient({
    solanaClusterEndpoint: process.env.VITE_SOLANA_CLUSTER_ENDPOINT,
    metadataProgramId: process.env.VITE_METADATA_PROGRAM_ID
  }),
  sentry: { setTag, configureScope },
  reportToSentry,
  trackDownload,
  instagramAppId: process.env.VITE_INSTAGRAM_APP_ID,
  instagramRedirectUrl: process.env.VITE_INSTAGRAM_REDIRECT_URL,
  share: getShare(isMobile),
  openSeaClient: new OpenSeaClient(process.env.VITE_OPENSEA_API_URL as string),
  audiusSdk,
  imageUtils: {
    generatePlaylistArtwork
  },
  isMobile
})
