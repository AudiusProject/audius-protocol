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
    ignoreErrors:
      process.env.VITE_SENTRY_DISABLED === 'true' ? [/.*/] : undefined,

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
      // Capture a session recording
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false
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
        const url = hint.xhr.__sentry_xhr_v3__.url
        const isAnalyticsRequest = analyticsBlacklist.some(
          (term) => url.search(term) !== -1
        )
        if (isAnalyticsRequest) {
          return null
        }
      }
      return breadCrumb
    },
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,
    // If the entire session is not sampled, use the below sample rate to sample
    // sessions when an error occurs.
    replaysOnErrorSampleRate: 1.0
  })
}
