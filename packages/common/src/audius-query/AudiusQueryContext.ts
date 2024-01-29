import { createContext, useContext } from 'react'

import type { AudiusSdk } from '@audius/sdk'
import type { Dispatch } from 'redux'

import type { AudiusAPIClient } from 'services/audius-api-client'
import { AudiusBackend, Env, RemoteConfigInstance } from 'services/index'

import { ReportToSentryArgs } from '../models'

export type AudiusQueryContextType = {
  apiClient: AudiusAPIClient
  audiusSdk: () => Promise<AudiusSdk>
  audiusBackend: AudiusBackend
  dispatch: Dispatch
  reportToSentry: (args: ReportToSentryArgs) => void
  env: Env
  fetch: typeof fetch
  remoteConfigInstance: RemoteConfigInstance
}

export const AudiusQueryContext = createContext<AudiusQueryContextType>(
  null as any
)

export const useAudiusQueryContext = () => {
  const audiusQueryContext = useContext(AudiusQueryContext)

  if (!audiusQueryContext) {
    throw new Error(
      'useAudiusQueryContext has to be used within <AudiusQueryContext.Provider>'
    )
  }

  return audiusQueryContext
}
