import { getErrorMessage } from '@audius/common'
import { ErrorLevel, ReportToSentryArgs } from '@audius/common/models'
import { withScope, captureException } from '@sentry/browser'
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
    withScope((scope) => {
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
      captureException(error)
    })
  } catch (error) {
    console.error(`Got error trying to log error: ${getErrorMessage(error)}`)
  }
}
