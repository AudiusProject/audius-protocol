import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals'
import { track } from 'store/analytics/providers/segment'
import { Name } from 'services/analytics'
import { findRoute } from 'utils/route'

// Establish the "initial load" route
const route = findRoute(window.location.pathname)

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
