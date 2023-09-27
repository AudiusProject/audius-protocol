import { put, call, take, select } from 'typed-redux-saga'

import { getContext } from '../effects'

import { getFeePayer } from './selectors'
import { setFeePayer } from './slice'

function* watchForFeePayer() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const { feePayer, error } = yield* call(
    audiusBackendInstance.getRandomFeePayer as () => Promise<
      | {
          feePayer: string
          error: undefined
        }
      | { feePayer: undefined; error: boolean }
    >
  )
  if (error) {
    console.error('Could not get fee payer.')
  } else {
    yield put(setFeePayer({ feePayer: feePayer as string }))
  }
}

export function* waitForFeePayer() {
  const feePayer = yield* select(getFeePayer)
  if (!feePayer) {
    yield* take(setFeePayer)
  }
}

export const sagas = () => {
  return [watchForFeePayer]
}
