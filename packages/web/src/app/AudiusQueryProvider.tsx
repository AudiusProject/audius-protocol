import { ReactNode } from 'react'

import { AudiusQueryContext } from '@audius/common/audius-query'
import { createMigrationChecker } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { apiClient } from 'services/audius-api-client'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { audiusSdk } from 'services/audius-sdk'
import { env } from 'services/env'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { reportToSentry } from 'store/errors/reportToSentry'

type AudiusQueryProviderProps = {
  children: ReactNode
}

const checkSDKMigration = createMigrationChecker({
  remoteConfigInstance,
  reportToSentry
})

export const AudiusQueryProvider = (props: AudiusQueryProviderProps) => {
  const { children } = props
  const dispatch = useDispatch()
  return (
    <AudiusQueryContext.Provider
      value={{
        apiClient,
        audiusBackend: audiusBackendInstance,
        audiusSdk,
        checkSDKMigration,
        dispatch,
        reportToSentry,
        env,
        fetch,
        remoteConfigInstance,
        getFeatureEnabled
      }}
    >
      {children}
    </AudiusQueryContext.Provider>
  )
}
