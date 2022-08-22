import { Name, getContext } from '@audius/common'
import { LOCATION_CHANGE } from 'connected-react-router'
import { take } from 'redux-saga/effects'

import { ScreenAnalyticsEvent } from 'services/native-mobile-interface/analytics'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

function* trackLocation() {
  const analytics = yield* getContext('analytics')
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

      // TODO: record screen change analytics on mobile
      // see https://reactnavigation.org/docs/screen-tracking/
      if (NATIVE_MOBILE) {
        const message = new ScreenAnalyticsEvent(pathname)
        message.send()
      } else {
        // Dispatch a track event and then resolve page/screen events with segment
        analytics.track({
          eventName: Name.PAGE_VIEW,
          properties: { route: pathname }
        })
      }
    }
  }
}

export default function sagas() {
  return [trackLocation]
}
