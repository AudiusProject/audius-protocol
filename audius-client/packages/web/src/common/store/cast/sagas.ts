import { takeEvery } from 'redux-saga/effects'
import { call, put } from 'typed-redux-saga'

import { CommonStoreContext } from 'common/store'

import { CastMethod, CAST_METHOD, updateMethod } from './slice'

/**
 * Sets the initial cast method based on the value in storage
 */
const makeSetInitialCastMethod = (ctx: CommonStoreContext) => {
  function* setInitialCastMethod() {
    const storageCastMethod = yield* call(ctx.getLocalStorageItem, CAST_METHOD)
    let method: CastMethod
    if (storageCastMethod === 'chromecast') {
      method = 'chromecast'
    } else {
      method = 'airplay'
    }
    yield put(updateMethod({ method, persist: false }))
  }
  return setInitialCastMethod
}

/**
 * Watches for changes to the cast method and updates local storage
 */
const makeWatchUpdateCastMethod = (ctx: CommonStoreContext) => {
  function* watchUpdateCastMethod() {
    yield takeEvery(
      updateMethod.type,
      function* (action: ReturnType<typeof updateMethod>) {
        const { method, persist } = action.payload
        if (persist) {
          ctx.setLocalStorageItem(CAST_METHOD, method)
        }
      }
    )
  }
  return watchUpdateCastMethod
}

export const sagas = (ctx: CommonStoreContext) => {
  return [makeSetInitialCastMethod(ctx), makeWatchUpdateCastMethod(ctx)]
}
