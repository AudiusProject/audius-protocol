import { LOCATION_CHANGE } from 'connected-react-router'
import { take, takeEvery, call } from 'redux-saga/effects'

import { Name } from 'services/analytics'
import { ScreenAnalyticsEvent } from 'services/native-mobile-interface/analytics'
import * as analyticsActions from 'store/analytics/actions'

import { identify, track } from './providers/segment'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

function* trackEventAsync(action: any) {
  const { eventName, callback, options, ...eventProps } = action
  yield call(track, eventName, eventProps, options, callback)
}

function* identifyEventAsync(action: any) {
  yield call(identify, action.handle, action.traits)
}

function* watchTrackEvent() {
  yield takeEvery(analyticsActions.TRACK, trackEventAsync)
}

function* watchIdentifyEvent() {
  yield takeEvery(analyticsActions.IDENTIFY, identifyEventAsync)
}

function* trackLocation() {
  let referrer = window.location.href
  while (true) {
    const {
      payload: {
        location: { href, pathname }
      }
    } = yield take(LOCATION_CHANGE)
    if (pathname) {
      if ((window as any).gtag) {
        ;(window as any).gtag('config', process.env.GA_MEASUREMENT_ID, {
          page_path: pathname
        })
      }

      // Dispatch a track event and then resolve page/screen events with segment
      track(Name.PAGE_VIEW, { route: pathname })

      if (NATIVE_MOBILE) {
        const message = new ScreenAnalyticsEvent(pathname)
        message.send()
      } else if ((window as any).analytics) {
        ;(window as any).analytics.page(null, {
          referrer,
          // Because title is set through the react component hierarchy, this
          // value would be incorrect, so override it to empty.
          title: ''
        })
      }
    }
    referrer = href
  }
}

export default function sagas() {
  return [watchTrackEvent, watchIdentifyEvent, trackLocation]
}
