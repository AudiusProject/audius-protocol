import { env } from 'process'

import * as Sentry from '@sentry/react-native'

import packageJson from '../../package.json'

const { version: appVersion } = packageJson

export const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true
})

export const initSentry = () => {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    integrations: [
      navigationIntegration,
      Sentry.reactNativeTracingIntegration()
    ],
    enableUserInteractionTracing: true,
    release: appVersion,
    tracesSampleRate: 1
  })
  Sentry.setTag('commit_sha', process.env.VITE_CURRENT_GIT_SHA)
  Sentry.setTag('platform', 'mobile')
}
