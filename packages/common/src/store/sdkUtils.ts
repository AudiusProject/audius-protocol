import { AudiusSdk } from '@audius/sdk'
import { call, getContext } from 'typed-redux-saga'

// These are defined explicitly here to avoid including the entire `storeContext` module
// as that creates some nasty circular dependencies.
type AudiusSDKContext = () => Promise<AudiusSdk>

/** Helper generator that returns a fully-awaited AudiusSDK instance */
export function* getSDK() {
  const audiusSdk = yield* getContext<AudiusSDKContext>('audiusSdk')
  return yield* call(audiusSdk)
}
