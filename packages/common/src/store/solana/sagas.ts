import { AudiusSdk } from '@audius/sdk'
import { put, call } from 'typed-redux-saga'

import { getContext } from '../effects'
import { getSDK } from '../sdkUtils'

import { setFeePayer } from './slice'

function* watchForFeePayer() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const sdk = yield* getSDK()
  const { feePayer, error } = yield* call(
    audiusBackendInstance.getRandomFeePayer as (args: {
      sdk: AudiusSdk
    }) => Promise<
      | {
          feePayer: string
          error: undefined
        }
      | { feePayer: undefined; error: boolean }
    >,
    { sdk }
  )
  if (error) {
    console.error('Could not get fee payer.')
  } else {
    yield put(setFeePayer({ feePayer: feePayer as string }))
  }
}

export const sagas = () => {
  return [watchForFeePayer]
}
