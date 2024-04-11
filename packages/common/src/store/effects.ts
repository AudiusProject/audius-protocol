import { AllEffect, CallEffect, GetContextEffect } from 'redux-saga/effects'
import {
  all,
  call,
  getContext as getContextBase,
  SagaGenerator
} from 'typed-redux-saga'

import { ErrorLevel } from '~/models/ErrorReporting'
import { FeatureFlags } from '~/services'
import {
  compareSDKResponse,
  SDKMigrationFailedError
} from '~/utils/sdkMigrationUtils'

import { CommonStoreContext } from './storeContext'

export const getContext = <Prop extends keyof CommonStoreContext>(
  prop: Prop
): SagaGenerator<CommonStoreContext[Prop], GetContextEffect> =>
  getContextBase(prop)

/** Helper generator that returns a fully-awaited AudiusSDK instance */
export function* getSDK() {
  const audiusSdk = yield* getContext('audiusSdk')
  return yield* call(audiusSdk)
}

/** This effect is used to shadow a migration without affecting the return value.
 * It will run two effects in parallel to fetch the legacy and migrated responses,
 * compare the results, log the diff, and then return the legacy value. Errors thrown
 * by the effect for the migrated response will be caught to avoid bugs in the migrated
 * code from causing errors.
 */
export function* checkSDKMigration<T extends object>({
  legacy: legacyCall,
  migrated: migratedCall,
  endpointName
}: {
  legacy: SagaGenerator<T, CallEffect<T>>
  migrated: SagaGenerator<T, CallEffect<T>>
  endpointName: string
}) {
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const reportToSentry = yield* getContext('reportToSentry')

  if (!getFeatureEnabled(FeatureFlags.SDK_MIGRATION_SHADOWING)) {
    return yield* legacyCall
  }

  // TODO: Add feature flagging for running the shadow
  const [legacy, migrated] = yield* all([
    legacyCall,
    call(function* settle() {
      try {
        return yield* migratedCall
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
    yield* call(reportToSentry, {
      error,
      level: ErrorLevel.Warning,
      additionalInfo: {
        legacyValue: error.legacyValue,
        migratedValue: error.migratedValue
      },
      tags: { endpointName: error.endpointName }
    })
  }
  return legacy
}
