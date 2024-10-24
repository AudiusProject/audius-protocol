import type { ReactNode } from 'react'

import { AudiusQueryContext } from '@audius/common/audius-query'
import { createGetWalletAddresses } from '@audius/common/services'

import { env } from 'app/env'
import * as analytics from 'app/services/analytics'
import { apiClient } from 'app/services/audius-api-client'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { localStorage } from 'app/services/local-storage'
import {
  getFeatureEnabled,
  remoteConfigInstance
} from 'app/services/remote-config'
import { audiusSdk } from 'app/services/sdk/audius-sdk'
import { hedgehogInstance } from 'app/services/sdk/hedgehog'
import { store } from 'app/store'
import { reportToSentry } from 'app/utils/reportToSentry'

type AudiusQueryProviderProps = {
  children: ReactNode
}

const getWalletAddresses = createGetWalletAddresses({
  localStorage,
  hedgehogInstance
})

export const audiusQueryContext = {
  apiClient,
  audiusBackend: audiusBackendInstance,
  audiusSdk,
  dispatch: store.dispatch,
  reportToSentry,
  env,
  fetch,
  getWalletAddresses,
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
