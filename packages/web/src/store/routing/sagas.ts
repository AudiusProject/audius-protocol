import { take } from 'redux-saga/effects'

import { LOCATION_CHANGE } from 'utils/navigation'

enum LocationAction {
  PUSH = 'PUSH',
  POP = 'POP',
  REPLACE = 'REPLACE'
}

if (typeof window !== 'undefined') {
  ;(window as any).locationHistory = []
}

function* trackLocation() {
  while (true) {
    const {
      payload: { location, action }
    } = yield take(LOCATION_CHANGE)
    if (action === LocationAction.POP) {
      ;(window as any).locationHistory.pop()
    } else if (action === LocationAction.REPLACE) {
      const lastIndex = (window as any).locationHistory.length - 1
      ;(window as any).locationHistory[lastIndex] = location
    } else if (action === LocationAction.PUSH) {
      ;(window as any).locationHistory.push(location)
    }
  }
}

const sagas = () => {
  const sagas = [trackLocation]
  return sagas
}

export default sagas
