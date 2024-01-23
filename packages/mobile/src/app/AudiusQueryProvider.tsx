import type { ReactNode } from 'react'

import { AudiusQueryContext } from '@audius/common'

import { apiClient } from 'app/services/audius-api-client'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { env } from 'app/services/env'
import { remoteConfigInstance } from 'app/services/remote-config'
import { audiusSdk } from 'app/services/sdk/audius-sdk'
import { store } from 'app/store'
import { reportToSentry } from 'app/utils/reportToSentry'

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
