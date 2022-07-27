import { Name } from '@audius/common'
import { LOCATION_CHANGE } from 'connected-react-router'
import { take, takeEvery, call } from 'redux-saga/effects'

import { ScreenAnalyticsEvent } from 'services/native-mobile-interface/analytics'
import * as analyticsActions from 'store/analytics/actions'

import * as analyticsProvider from './providers'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

function* trackEventAsync(action: any) {
  const { eventName, callback, ...eventProps } = action
  yield call(analyticsProvider.track, eventName, eventProps, callback)
}

function* identifyEventAsync(action: any) {
  yield call(analyticsProvider.identify, action.handle, action.traits)
}

function* watchTrackEvent() {
  yield takeEvery(analyticsActions.TRACK, trackEventAsync)
}

function* watchIdentifyEvent() {
  yield takeEvery(analyticsActions.IDENTIFY, identifyEventAsync)
}

function* initProviders() {
  if (!NATIVE_MOBILE) {
    yield call(analyticsProvider.init)
  }
}

function* trackLocation() {
  while (true) {
    const {
      payload: {
        location: { pathname }
      }
    } = yield take(LOCATION_CHANGE)
    if (pathname) {
      if ((window as any).gtag) {
        ;(window as any).gtag('config', process.env.GA_MEASUREMENT_ID, {
          page_path: pathname
        })
      }
      if ((window as any).adroll) {
        ;(window as any).adroll.track('pageView')
      }

      if (NATIVE_MOBILE) {
        const message = new ScreenAnalyticsEvent(pathname)
        message.send()
      } else {
        // Dispatch a track event and then resolve page/screen events with segment
        analyticsProvider.track(Name.PAGE_VIEW, { route: pathname })
      }
    }
  }
}

export default function sagas() {
  return [initProviders, watchTrackEvent, watchIdentifyEvent, trackLocation]
}
