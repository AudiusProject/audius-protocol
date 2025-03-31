import { takeEvery, select, getContext } from 'typed-redux-saga'

import * as scrollLockActions from './actions'
import { getScrollLockCount } from './selectors'

const ROOT_ID = 'root'
const SCROLL_LOCK_CLASS = 'scrollLock'
const MOBILE_CLASS = 'isMobile'

function* incrementScrollCount() {
  const lockCount = yield* select(getScrollLockCount)
  const isMobile = yield* getContext('isMobile')
  if (lockCount === 1) {
    const el = document.getElementById(ROOT_ID)
    if (!el) return
    el.style.top = `-${window.pageYOffset}px`
    el.classList.add(SCROLL_LOCK_CLASS)
    if (isMobile) {
      el.classList.add(MOBILE_CLASS)
    }
  }
}

function* decrementScrollCount() {
  const lockCount = yield* select(getScrollLockCount)
  const isMobile = yield* getContext('isMobile')
  if (lockCount === 0) {
    const el = document.getElementById(ROOT_ID)
    if (!el) return
    el.classList.remove(SCROLL_LOCK_CLASS)
    if (isMobile) {
      el.classList.remove(MOBILE_CLASS)
    }
    const scrollTop = parseInt(el.style.top!, 10) || 0
    el.style.removeProperty('top')
    if (window.scrollTo) window.scrollTo({ top: -1 * scrollTop })
  }
}

function* watchDecrement() {
  yield* takeEvery(scrollLockActions.DECREMENT_COUNT, decrementScrollCount)
}

function* watchIncrement() {
  yield* takeEvery(scrollLockActions.INCREMENT_COUNT, incrementScrollCount)
}

export default function sagas() {
  return [watchDecrement, watchIncrement]
}
