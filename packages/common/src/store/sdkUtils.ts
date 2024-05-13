import { AudiusSdk } from '@audius/sdk'
import { AllEffect, CallEffect } from 'redux-saga/effects'
import { all, call, getContext, SagaGenerator } from 'typed-redux-saga'
import { iterator as isIterator } from '@redux-saga/is'

import { ErrorLevel, ReportToSentryArgs } from '~/models/ErrorReporting'
import { FeatureFlags } from '~/services/remote-config/feature-flags'
import {
  compareSDKResponse,
  SDKMigrationFailedError
} from '~/utils/sdkMigrationUtils'

// These are defined explicitly here to avoid including the entire `storeContext` module
// as that creates some nasty circular dependencies.
type AudiusSDKContext = () => Promise<AudiusSdk>
type GetFeatureEnabledContext = (
  flag: FeatureFlags,
  fallbackFlag?: FeatureFlags
) => Promise<boolean>
type ReportToSentryContext = (args: ReportToSentryArgs) => void

/** Helper generator that returns a fully-awaited AudiusSDK instance */
export function* getSDK() {
  const audiusSdk = yield* getContext<AudiusSDKContext>('audiusSdk')
  return yield* call(audiusSdk)
}

/** This effect is used to shadow a migration without affecting the return value.
 * It will run two effects in parallel to fetch the legacy and migrated responses,
 * compare the results, log the diff, and then return the legacy value. Errors thrown
 * by the effect for the migrated response will be caught to avoid bugs in the migrated
 * code from causing errors.
 * NOTE: Should always be called from within a saga.
 */
export function* checkSDKMigration<T extends object>({
  legacy: legacyCall,
  migrated: migratedCall,
  endpointName
}: {
  legacy: SagaGenerator<T, CallEffect<T>> | CallEffect<T>
  migrated: SagaGenerator<T, CallEffect<T>> | CallEffect<T>
  endpointName: string
}): SagaGenerator<T> {
  const getFeatureEnabled = yield* getContext<GetFeatureEnabledContext>(
    'getFeatureEnabled'
  )
  const reportToSentry = yield* getContext<ReportToSentryContext>(
    'reportToSentry'
  )

  if (!getFeatureEnabled(FeatureFlags.SDK_MIGRATION_SHADOWING)) {
    // Yield control if it's a generator, otherwise let middleware handle it
    // @ts-ignore
    return isIterator(legacyCall) ? yield* legacyCall : yield legacyCall
  }

  const [legacy, migrated] = yield* all([
    legacyCall,
    call(function* settle() {
      try {
        // Yield control if it's a generator, otherwise let middleware handle it
        return isIterator(migratedCall)
          ? yield* migratedCall
          : // @ts-ignore
            yield migratedCall
      } catch (e) {
        return e instanceof Error ? e : new Error(`${e}`)
      }
    })
  ]) as SagaGenerator<T[], AllEffect<CallEffect<T>>>

  try {
    compareSDKResponse({ legacy, migrated }, endpointName)
  } catch (e) {
    const error =
      e instanceof SDKMigrationFailedError
        ? e
        : new SDKMigrationFailedError({
            endpointName,
            innerMessage: `Unknown error: ${e}`,
            legacyValue: legacy,
            migratedValue: migrated
          })
    console.warn('SDK Migration failed', error)
    yield* call(reportToSentry, {
      error,
      level: ErrorLevel.Warning,
      additionalInfo: {
        diff: JSON.stringify(error.diff, null, 2),
        legacyValue: JSON.stringify(error.legacyValue, null, 2),
        migratedValue: JSON.stringify(error.migratedValue, null, 2)
      },
      tags: { endpointName: error.endpointName }
    })
  }
  return legacy
}
