import { FeatureFlags } from '@audius/common/services'
import { CommonStoreContext } from '@audius/common/store'
import { FetchNFTClient } from '@audius/fetch-nft'
import { setTag, configureScope } from '@sentry/browser'

import * as analytics from 'services/analytics'
import { audioPlayer } from 'services/audio-player'
import { apiClient } from 'services/audius-api-client'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { audiusSdk, authService } from 'services/audius-sdk'
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
  nftClient: new FetchNFTClient({
    openSeaConfig: {
      apiEndpoint: env.OPENSEA_API_URL
    },
    heliusConfig: {
      apiEndpoint: env.HELIUS_DAS_API_URL
    },
    solanaConfig: {
      rpcEndpoint: env.SOLANA_CLUSTER_ENDPOINT,
      metadataProgramId: env.METADATA_PROGRAM_ID
    }
  }),
  sentry: { setTag, configureScope },
  reportToSentry,
  trackDownload,
  instagramAppId: env.INSTAGRAM_APP_ID,
  instagramRedirectUrl: env.INSTAGRAM_REDIRECT_URL,
  share: getShare(isMobile),
  audiusSdk,
  authService,
  imageUtils: {
    generatePlaylistArtwork
  },
  isMobile,
  // @ts-ignore dispatch will be populated in configureStore
  dispatch: undefined
})
