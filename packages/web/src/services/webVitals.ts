import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals'

import { Name } from 'services/analytics'
import { track } from 'store/analytics/providers/segment'
import { findRoute, getPathname } from 'utils/route'

// Establish the "initial load" route
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
