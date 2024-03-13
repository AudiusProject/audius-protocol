import { ErrorLevel, ReportToSentryArgs } from '@audius/common/models'
import { getErrorMessage } from '@audius/common/utils'
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

type ConsoleLoggingMethod = keyof Pick<
  Console,
  'log' | 'warn' | 'error' | 'info' | 'debug'
>

const jsLoggerMapping: { [level in ErrorLevel]: ConsoleLoggingMethod } = {
  Warning: 'warn',
  Fatal: 'error',
  Debug: 'debug',
  Error: 'error',
  Info: 'info',
  Log: 'log'
}

export const reportToSentry = async ({
  level,
  additionalInfo,
  error: stringOrError,
  name,
  tags
}: ReportToSentryArgs) => {
  try {
    const error =
      typeof stringOrError === 'string'
        ? new Error(stringOrError)
        : stringOrError

    withScope((scope) => {
      if (level) {
        const sentryLevel = Levels[level]
        scope.setLevel(sentryLevel)
      }
      if (additionalInfo) {
        scope.setExtras(additionalInfo)
      }
      if (tags) {
        scope.setTags(tags)
      }
      if (name) {
        error.name = name
      }
      // Call JS console method using the specified level
      const consoleMethod =
        jsLoggerMapping[level || ErrorLevel.Log] || jsLoggerMapping.Log
      // eslint-disable-next-line no-console
      console[consoleMethod](error, { additionalInfo }, { tags })
      captureException(error)
    })
  } catch (error) {
    console.error(`Got error trying to log error: ${getErrorMessage(error)}`)
  }
}
