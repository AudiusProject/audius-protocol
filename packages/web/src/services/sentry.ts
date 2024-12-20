import { DoubleKeys } from '@audius/common/services'
import * as Sentry from '@sentry/browser'

import packageJson from '../../package.json'

import { env } from './env'
import { remoteConfigInstance } from './remote-config/remote-config-instance'
const { version: appVersion } = packageJson

const analyticsBlacklist = [
  'google-analytics',
  'stats.g',
  'fullstory',
  'amplitude',
  'mixpanel',
  'mouseflow'
]

const MAX_BREADCRUMBS = 300

export const initializeSentry = async () => {
  await remoteConfigInstance.waitForRemoteConfig()
  Sentry.init({
    dsn: env.SENTRY_DSN,
    transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
    ignoreErrors:
      process.env.VITE_SENTRY_DISABLED === 'true' ? [/.*/] : undefined,

    // Use our semantic release version for release tracking
    release: appVersion,

    integrations: [
      // Pull extra fields off error objects
      Sentry.extraErrorDataIntegration(),
      // Capture a session recording
      Sentry.replayIntegration({})
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
    // This is the sample rate for healthy sessions without errors - set to 0 since we only care about errors
    replaysSessionSampleRate: 0,
    // This is a sample rate specific to when errors occur. We want to see 100% of them
    replaysOnErrorSampleRate: Number(
      remoteConfigInstance.getRemoteVar(
        DoubleKeys.SENTRY_REPLAY_ERROR_SAMPLE_RATE
      ) ?? 0
    )
  })

  Sentry.setTag('commit_sha', process.env.VITE_CURRENT_GIT_SHA)
  Sentry.setTag('platform', 'web')
}
