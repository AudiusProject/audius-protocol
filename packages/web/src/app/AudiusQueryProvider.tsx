import { ReactNode } from 'react'

import { AudiusQueryContext } from '@audius/common'

import { apiClient } from 'services/audius-api-client'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { audiusSdk } from 'services/audius-sdk'
import { env } from 'services/env'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { store } from 'store/configureStore'
import { reportToSentry } from 'store/errors/reportToSentry'

type AudiusQueryProviderProps = {
  children: ReactNode
}

export const audiusQueryContext = {
  apiClient,
  audiusBackend: audiusBackendInstance,
  audiusSdk,
  dispatch: store.dispatch,
  reportToSentry,
  env,
  fetch,
  remoteConfigInstance
}

export const AudiusQueryProvider = (props: AudiusQueryProviderProps) => {
  const { children } = props
  return (
    <AudiusQueryContext.Provider value={audiusQueryContext}>
      {children}
    </AudiusQueryContext.Provider>
  )
}
