import { createContext, useContext } from 'react'

import type { AudiusSdk } from '@audius/sdk'
import type { Dispatch } from 'redux'
import { getContext } from 'typed-redux-saga'

import type { AudiusAPIClient } from '~/services/audius-api-client'
import {
  AudiusBackend,
  Env,
  FeatureFlags,
  RemoteConfigInstance
} from '~/services/index'

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
  getFeatureEnabled: (
    flag: FeatureFlags,
    fallbackFlag?: FeatureFlags
  ) => Promise<boolean> | boolean
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

export function* getAudiusQueryContext(): Generator<
  any,
  AudiusQueryContextType,
  any
> {
  // We can't use common typed `getContext` here because of circular dependency
  return {
    apiClient: yield* getContext<AudiusQueryContextType['apiClient']>(
      'apiClient'
    ),
    audiusBackend: yield* getContext<AudiusQueryContextType['audiusBackend']>(
      'audiusBackendInstance'
    ),
    audiusSdk: yield* getContext<AudiusQueryContextType['audiusSdk']>(
      'audiusSdk'
    ),
    dispatch: yield* getContext<AudiusQueryContextType['dispatch']>('dispatch'),
    env: yield* getContext<AudiusQueryContextType['env']>('env'),
    fetch,
    getFeatureEnabled: yield* getContext<
      AudiusQueryContextType['getFeatureEnabled']
    >('getFeatureEnabled'),
    remoteConfigInstance: yield* getContext<
      AudiusQueryContextType['remoteConfigInstance']
    >('remoteConfigInstance'),
    reportToSentry: yield* getContext<AudiusQueryContextType['reportToSentry']>(
      'reportToSentry'
    )
  }
}
