import { AllEffect, CallEffect, GetContextEffect } from 'redux-saga/effects'
import {
  all,
  call,
  getContext as getContextBase,
  SagaGenerator
} from 'typed-redux-saga'

import { CommonStoreContext } from './storeContext'
import { compareSDKResponse } from '~/utils/sdkMigrationUtils'

export const getContext = <Prop extends keyof CommonStoreContext>(
  prop: Prop
): SagaGenerator<CommonStoreContext[Prop], GetContextEffect> =>
  getContextBase(prop)

/** Helper generator that returns a fully-awaited AudiusSDK instance */
export function* getSDK() {
  const audiusSdk = yield* getContext('audiusSdk')
  return yield* call(audiusSdk)
}

/** Accepts two `call()` effects, runs them in parallel, compares the results and
 * returns them.
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
  compareSDKResponse({ legacy, migrated }, endpointName)
  return { legacy, migrated }
}
