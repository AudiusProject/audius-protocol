import { createContext, useContext } from 'react'

import type { AudiusSdk } from '@audius/sdk'
import type { Dispatch } from 'redux'
import { getContext } from 'typed-redux-saga'

import type { AuthService, IdentityService } from '~/services/auth'
import {
  AudiusBackend,
  Env,
  FeatureFlags,
  RemoteConfigInstance,
  SolanaWalletService
} from '~/services/index'

import {
  AllTrackingEvents,
  AnalyticsEvent,
  ReportToSentryArgs
} from '../models'

export type AudiusQueryContextType = {
  audiusSdk: () => Promise<AudiusSdk>
  audiusBackend: AudiusBackend
  authService: AuthService
  solanaWalletService: SolanaWalletService
  identityService: IdentityService
  dispatch: Dispatch
  reportToSentry: (args: ReportToSentryArgs) => void
  env: Env
  fetch: typeof fetch
  remoteConfigInstance: RemoteConfigInstance
  getFeatureEnabled: (
    flag: FeatureFlags,
    fallbackFlag?: FeatureFlags
  ) => Promise<boolean> | boolean
  analytics: {
    init: (isMobile: boolean) => Promise<void>
    track: (event: AnalyticsEvent, callback?: () => void) => Promise<void>
    identify: (
      handle: string,
      traits?: Record<string, unknown>,
      options?: Record<string, unknown>,
      callback?: () => void
    ) => Promise<void>
    make: <T extends AllTrackingEvents>(
      event: T
    ) => {
      eventName: string
      properties: any
    }
  }
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
    audiusBackend: yield* getContext<AudiusQueryContextType['audiusBackend']>(
      'audiusBackendInstance'
    ),
    authService: yield* getContext<AudiusQueryContextType['authService']>(
      'authService'
    ),
    identityService: yield* getContext<
      AudiusQueryContextType['identityService']
    >('identityService'),
    audiusSdk: yield* getContext<AudiusQueryContextType['audiusSdk']>(
      'audiusSdk'
    ),
    solanaWalletService: yield* getContext<
      AudiusQueryContextType['solanaWalletService']
    >('solanaWalletService'),
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
    ),
    analytics: yield* getContext<AudiusQueryContextType['analytics']>(
      'analytics'
    )
  }
}
