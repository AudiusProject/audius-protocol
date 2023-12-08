import { Name } from '@audius/common'
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals'

import { track } from 'services/analytics/amplitude'
import { findRoute, getPathname } from 'utils/route'
import { Location } from 'history'

// Establish the "initial load" route
export const initWebVitals = (location: Location) => {
  const route = findRoute(getPathname(location))

  const sendToAnalytics = ({
    name,
    delta
  }: {
    name: string
    delta: number
  }) => {
    console.info(name, delta)
    track(Name.WEB_VITALS, {
      metric: name,
      value: delta,
      route
    })
  }

  // See https://web.dev/vitals/
  getCLS(sendToAnalytics)
  getFID(sendToAnalytics)
  getLCP(sendToAnalytics)
  getFCP(sendToAnalytics)
  getTTFB(sendToAnalytics)
}
