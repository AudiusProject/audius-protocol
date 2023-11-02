import { init } from '@sentry/browser'
import { CaptureConsole } from '@sentry/integrations'

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
    dsn: process.env.VITE_SENTRY_DSN,

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
    },
    beforeSend: (event, hint) => {
      // This code manually adds the exceptionName to the event Fingerprint,
      // which controls how Sentry groups events into issues.
      // More background:
      // https://docs.sentry.io/data-management/event-grouping/sdk-fingerprinting/?platform=javascript
      const exception = hint ? hint.originalException : undefined
      if (!exception) return event

      const exceptionName = exception.toString()
      event.fingerprint = [exceptionName]

      return event
    }
  })
}
