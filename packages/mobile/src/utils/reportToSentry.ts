import { getErrorMessage } from '@audius/common'
import type { ErrorLevel, ReportToSentryArgs } from '@audius/common/models'
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

export const reportToSentry = async ({
  level,
  additionalInfo,
  error,
  name
}: ReportToSentryArgs) => {
  try {
    withScope((scope) => {
      scope.setExtra('mobileClientVersionInclOTA', versionInfo ?? 'unknown')
      if (level) {
        scope.setLevel(Levels[level])
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
