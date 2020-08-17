/** Helper Sagas */

import { delay, eventChannel, END } from 'redux-saga'
import { all, call, put, select, take, takeEvery } from 'redux-saga/effects'
import { push as pushRoute } from 'connected-react-router'
import { SIGN_UP_PAGE } from './route'
import { getAccountUser } from 'store/account/selectors'
import {
  updateRouteOnExit,
  showRequiresAccountModal
} from 'containers/sign-on/store/actions'

/**
 * Calls the provided array of calls in batches with delayMs milliseconds between each batch.
 * @param {Array<Function*>} calls
 * @param {number} batchSize
 * @param {number} delayMs
 */
export function* batchYield(calls, batchSize, delayMs) {
  let remainingCalls = calls
  while (remainingCalls.length > 0) {
    yield all(remainingCalls.slice(0, batchSize))
    remainingCalls = remainingCalls.slice(batchSize)
    yield delay(delayMs)
  }
}

/**
 * Takes a channel that yields the value of a Redux action, waits for it to yield and then
 * dispatches the action.
 * @param {Object} channel
 */
export function* actionChannelDispatcher(channel) {
  while (true) {
    const action = yield take(channel)
    yield put(action)
  }
}

export function* channelCanceller(channel, action) {
  yield take(action)
  channel.close()
}

/**
 * Waits for the selector to return a truthy value.
 * @param {function} selector
 * @param {object} args passed on to the selector
 * @param {(v: any) => bool} customCheck special check to run rather than checking truthy-ness
 */
export function* waitForValue(selector, args = {}, customCheck = () => true) {
  let value = yield select(selector, args)
  while (!value || !customCheck(value)) {
    yield take()
    value = yield select(selector, args)
  }
  return value
}

function doEveryImpl(millis, times) {
  return eventChannel(emitter => {
    const iv = setInterval(() => {
      times -= 1
      if (times > 0) {
        emitter(times)
      } else {
        emitter(END)
      }
    }, millis)
    return () => {
      clearInterval(iv)
    }
  })
}

/**
 * Repeatedly calls a saga/async function on an interval for a set number of times.
 * @param {number} millis
 * @param {number} times
 * @param {function *} fn
 */
export function* doEvery(millis, times, fn) {
  const chan = yield call(doEveryImpl, millis, times)
  yield takeEvery(chan, fn)
}

/**
 * Checks if the user is signed in with an account.
 * If they are signed in, `fn` is invoked, otherwise, the
 * user is directed to the sign-up page.
 * @param {function *} fn
 * @param {string=} route optional route to go to on closing the sign up page/modal
 */
export function requiresAccount(fn, route) {
  return function* (...args) {
    const account = yield select(getAccountUser)
    if (!account) {
      if (route) yield put(updateRouteOnExit(route))
      yield put(pushRoute(SIGN_UP_PAGE))
      yield put(showRequiresAccountModal())
    } else {
      return yield call(fn, ...args)
    }
  }
}
