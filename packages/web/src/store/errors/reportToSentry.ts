import { getErrorMessage, ReportToSentryArgs, ErrorLevel } from '@audius/common'
import * as Sentry from '@sentry/browser'
import type { SeverityLevel } from '@sentry/types'

const Levels: { [level in ErrorLevel]: SeverityLevel } = {
  Warning: 'warning',
  Fatal: 'fatal',
  Debug: 'debug',
  Error: 'error',
  Info: 'info',
  Log: 'log'
}

export const reportToSentry = async ({
  level,
  additionalInfo,
  error,
  name
}: ReportToSentryArgs) => {
  console.debug(error, level)
  try {
    Sentry.withScope((scope) => {
      if (level) {
        const sentryLevel = Levels[level]
        scope.setLevel(sentryLevel)
      }
      if (additionalInfo) {
        console.debug(
          `Additional error info: ${JSON.stringify(additionalInfo)}`
        )
        scope.setExtras(additionalInfo)
      }
      if (name) {
        error.name = name
      }
      Sentry.captureException(error)
    })
  } catch (error) {
    console.error(`Got error trying to log error: ${getErrorMessage(error)}`)
  }
}
