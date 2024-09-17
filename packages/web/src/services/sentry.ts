import * as Sentry from '@sentry/browser'

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
  Sentry.init({
    dsn: env.SENTRY_DSN,
    transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),

    // Need to give Sentry a version so it can
    // associate stacktraces with sourcemaps
    release: process.env.VITE_CURRENT_GIT_SHA,

    integrations: [
      // Pull extra fields off error objects
      Sentry.extraErrorDataIntegration(),
      // Catch failed network requests
      Sentry.httpClientIntegration(),
      // Capture console.errors in sentry
      Sentry.captureConsoleIntegration({ levels: ['error'] }),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false
      })
    ],
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.

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
        const url = hint.xhr.__sentry_xhr_v3__.url
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
