import { ErrorLevel } from '@audius/common/models'
import type { ReportToSentryArgs } from '@audius/common/models'
import { getErrorMessage } from '@audius/common/utils'
import { captureException, withScope } from '@sentry/react-native'
import type { SeverityLevel } from '@sentry/types'

import { versionInfo } from './appVersionWithCodepush'

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
  level = ErrorLevel.Error,
  additionalInfo,
  error,
  tags,
  name
}: ReportToSentryArgs) => {
  try {
    withScope((scope) => {
      scope.setExtra('mobileClientVersionInclOTA', versionInfo ?? 'unknown')
      if (level) {
        scope.setLevel(Levels[level])
      }
      if (additionalInfo) {
        scope.setExtras(additionalInfo)
      }
      if (name) {
        error.name = name
      }
      if (tags) {
        scope.setTags(tags)
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
