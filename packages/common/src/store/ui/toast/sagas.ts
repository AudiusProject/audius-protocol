import { put, takeEvery, delay } from 'typed-redux-saga'

import { uuid } from '~/utils/uid'

import { registerToast, dismissToast, toast } from './slice'
import { ToastAction } from './types'

const TOAST_TIMEOUT = 3000

function* handleToast(action: ToastAction) {
  const { timeout = TOAST_TIMEOUT, ...toastConfig } = action.payload
  const toast = { ...toastConfig, key: uuid() }
  yield* put(registerToast(toast))
  yield delay(timeout)
  yield* put(dismissToast({ key: toast.key }))
}

function* watchHandleToast() {
  yield* takeEvery(toast, handleToast)
}

export default function sagas() {
  return [watchHandleToast]
}
