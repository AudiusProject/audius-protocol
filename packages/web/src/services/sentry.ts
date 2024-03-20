import { init } from '@sentry/browser'
import { CaptureConsole } from '@sentry/integrations'

import { env } from './env'

const analyticsBlacklist = [
  'google-analytics',
  'stats.g',
  'fullstory',
  'amplitude',
  'mixpanel',
  'mouseflow'
]

const MAX_BREADCRUMBS = 300

export const initializeSentry = () => {
  init({
    dsn: env.SENTRY_DSN,
    ignoreErrors: navigator.userAgent === 'probers' ? [/.*/] : undefined,

    // Need to give Sentry a version so it can
    // associate stacktraces with sourcemaps
    release: process.env.VITE_CURRENT_GIT_SHA,

    // Capture console.errors in sentry
    integrations: [
      new CaptureConsole({
        levels: ['error']
      })
    ],

    normalizeDepth: 5,
    maxBreadcrumbs: MAX_BREADCRUMBS,
    beforeBreadcrumb: (breadCrumb, hint) => {
      // filter out info and debug logs
      if (
        (breadCrumb.level === 'info' || breadCrumb.level === 'debug') &&
        breadCrumb.category === 'console'
      ) {
        return null
      }
      // filter out analytics events
      if (hint && hint.xhr) {
        const url = hint.xhr.__sentry_xhr__.url
        const isAnalyticsRequest = analyticsBlacklist.some(
          (term) => url.search(term) !== -1
        )
        if (isAnalyticsRequest) {
          return null
        }
      }
      return breadCrumb
    }
  })
}
