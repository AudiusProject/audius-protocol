import { Name } from '@audius/common'
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals'

import { track } from 'services/analytics/amplitude'
import { findRoute, getPathname } from 'utils/route'

// Establish the "initial load" route

// TODO: Fix remaining getPathname(), doesMatchRoute, pushUniqueRoute
const route = findRoute(getPathname())

const sendToAnalytics = ({ name, delta }: { name: string; delta: number }) => {
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
