import { LOCATION_CHANGE } from 'connected-react-router'
import { take } from 'redux-saga/effects'

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
      payload: { location, action, isFirstRendering }
    } = yield take(LOCATION_CHANGE)
    if (isFirstRendering) {
      ;(window as any).locationHistory.push(location)
    } else if (action === LocationAction.POP) {
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
