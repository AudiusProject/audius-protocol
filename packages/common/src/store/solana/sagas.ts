import { put, call } from 'typed-redux-saga'

import { getContext } from '../effects'

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

export const sagas = () => {
  return [watchForFeePayer]
}
