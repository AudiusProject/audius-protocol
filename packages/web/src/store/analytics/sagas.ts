import { Name } from '@audius/common/models'
import { getContext } from '@audius/common/store'
import { LOCATION_CHANGE } from 'connected-react-router'
import { take } from 'redux-saga/effects'

import { env } from 'services/env'

let prevPathname = ''

function* trackLocation() {
  const analytics = yield* getContext('analytics')
  while (true) {
    const {
      payload: {
        location: { pathname, search, ...rest }
      }
    } = yield take(LOCATION_CHANGE)
    if (pathname) {
      if ((window as any).gtag) {
        ;(window as any).gtag('config', env.GA_MEASUREMENT_ID, {
          page_path: pathname
        })
      }
      if ((window as any).adroll) {
        ;(window as any).adroll.track('pageView')
      }

      if (pathname !== prevPathname) {
        prevPathname = pathname
        // Dispatch a track event and then resolve page/screen events with segment
        analytics.track({
          eventName: Name.PAGE_VIEW,
          properties: { route: pathname, queryParams: search, ...rest }
        })
      }
    }
  }
}

export default function sagas() {
  return [trackLocation]
}
