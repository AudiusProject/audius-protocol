import type { ReactNode } from 'react'

import { AudiusQueryContext } from '@audius/common/audius-query'

import { env } from 'app/env'
import * as analytics from 'app/services/analytics'
import { apiClient } from 'app/services/audius-api-client'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import {
  getFeatureEnabled,
  remoteConfigInstance
} from 'app/services/remote-config'
import { audiusSdk } from 'app/services/sdk/audius-sdk'
import { authService } from 'app/services/sdk/auth'
import { store } from 'app/store'
import { reportToSentry } from 'app/utils/reportToSentry'
import { identityServiceInstance } from 'app/services/sdk/identity'

type AudiusQueryProviderProps = {
  children: ReactNode
}

export const audiusQueryContext = {
  apiClient,
  audiusBackend: audiusBackendInstance,
  audiusSdk,
  authService,
  identityService: identityServiceInstance,
  dispatch: store.dispatch,
  reportToSentry,
  env,
  fetch,
  remoteConfigInstance,
  getFeatureEnabled,
  analytics
}

export const AudiusQueryProvider = (props: AudiusQueryProviderProps) => {
  const { children } = props
  return (
    <AudiusQueryContext.Provider value={audiusQueryContext}>
      {children}
    </AudiusQueryContext.Provider>
  )
}
