import * as Sentry from '@sentry/browser'
import User from 'models/User'

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
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,

    // Need to give Sentry a version so it can
    // associate stacktraces with sourcemaps
    release: process.env.REACT_APP_CURRENT_GIT_SHA,

    maxBreadcrumbs: MAX_BREADCRUMBS,
    beforeBreadcrumb: (breadCrumb, hint) => {
      // filter out analytics events
      if (hint && hint.xhr) {
        const url = hint.xhr.__sentry_xhr__.url
        const isAnalyticsRequest = analyticsBlacklist.some(
          term => url.search(term) !== -1
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

export const setSentryUser = (user: User) => {
  Sentry.configureScope(currentScope => {
    currentScope.setUser({
      id: `${user.user_id}`,
      username: user.handle,
      isVerified: user.is_verified,
      trackCount: user.track_count
    })
  })
}
