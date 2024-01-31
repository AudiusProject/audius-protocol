import { call, put, takeEvery } from 'typed-redux-saga'

import { getContext } from '~/store/effects'

import { updateMethod } from './slice'
import { CastMethod, CAST_METHOD } from './types'

/**
 * Sets the initial cast method based on the value in storage
 */
function* setInitialCastMethod() {
  const getLocalStorageItem = yield* getContext('getLocalStorageItem')
  const storageCastMethod = yield* call(getLocalStorageItem, CAST_METHOD)
  let method: CastMethod
  if (storageCastMethod === 'chromecast') {
    method = 'chromecast'
  } else {
    method = 'airplay'
  }
  yield* put(updateMethod({ method, persist: false }))
}

/**
 * Watches for changes to the cast method and updates local storage
 */
function* watchUpdateCastMethod() {
  const setLocalStorageItem = yield* getContext('setLocalStorageItem')
  yield* takeEvery(
    updateMethod.type,
    function* (action: ReturnType<typeof updateMethod>) {
      const { method, persist } = action.payload
      if (persist) {
        setLocalStorageItem(CAST_METHOD, method)
      }
    }
  )
}

export const sagas = () => {
  return [setInitialCastMethod, watchUpdateCastMethod]
}
