import * as Sentry from '@sentry/browser'

import { getErrorMessage } from 'utils/error'

import { Level } from './level'

export type AdditionalInfo = Record<string, unknown>

const Levels: { [level in Level]: Sentry.Severity } = {
  Critical: Sentry.Severity.Critical,
  Warning: Sentry.Severity.Warning,
  Fatal: Sentry.Severity.Fatal,
  Debug: Sentry.Severity.Debug,
  Error: Sentry.Severity.Error,
  Info: Sentry.Severity.Info,
  Log: Sentry.Severity.Log
}

export type ReportToSentryArgs = {
  /**
   * The raw JS `Error` to report to sentry. If trying to report a string,
   * call this with `new Error(message)`
   */
  error: Error
  /**
   * The severity level that we should report to sentry
   */
  level?: Level
  /**
   * Any additional info to report (can be any object, but <string, string>)
   * is generally the right way to report.
   */
  additionalInfo?: AdditionalInfo
  /**
   * An optional name to assign to the Error
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/name
   */
  name?: string
}

export const reportToSentry = async ({
  level,
  additionalInfo,
  error,
  name
}: ReportToSentryArgs) => {
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
