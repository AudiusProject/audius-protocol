import { ReactNode } from 'react'

import { AudiusQueryContext } from '@audius/common/audius-query'
import { useDispatch } from 'react-redux'

import * as analytics from 'services/analytics'
import { apiClient } from 'services/audius-api-client'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import {
  audiusSdk,
  authService,
  identityServiceInstance
} from 'services/audius-sdk'
import { env } from 'services/env'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { reportToSentry } from 'store/errors/reportToSentry'

type AudiusQueryProviderProps = {
  children: ReactNode
}

export const AudiusQueryProvider = (props: AudiusQueryProviderProps) => {
  const { children } = props
  const dispatch = useDispatch()
  return (
    <AudiusQueryContext.Provider
      value={{
        apiClient,
        audiusBackend: audiusBackendInstance,
        audiusSdk,
        authService,
        identityService: identityServiceInstance,
        dispatch,
        reportToSentry,
        env,
        fetch,
        remoteConfigInstance,
        getFeatureEnabled,
        analytics
      }}
    >
      {children}
    </AudiusQueryContext.Provider>
  )
}
