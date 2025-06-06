import { ReactNode } from 'react'

import { QueryContext } from '@audius/common/api'
import { FetchNFTClient } from '@audius/fetch-nft'
import { useDispatch } from 'react-redux'

import * as analytics from 'services/analytics'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import {
  audiusSdk,
  authService,
  identityService,
  solanaWalletService
} from 'services/audius-sdk'
import { env } from 'services/env'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { reportToSentry } from 'store/errors/reportToSentry'
import { generatePlaylistArtwork } from 'utils/imageProcessingUtil'

type AudiusQueryProviderProps = {
  children: ReactNode
}

export const AudiusQueryProvider = (props: AudiusQueryProviderProps) => {
  const { children } = props
  const dispatch = useDispatch()
  return (
    <QueryContext.Provider
      value={{
        audiusBackend: audiusBackendInstance,
        audiusSdk,
        authService,
        identityService,
        solanaWalletService,
        dispatch,
        reportToSentry,
        env,
        fetch,
        remoteConfigInstance,
        getFeatureEnabled,
        analytics,
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
        imageUtils: {
          generatePlaylistArtwork
        }
      }}
    >
      {children}
    </QueryContext.Provider>
  )
}
