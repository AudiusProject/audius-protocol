export enum ErrorLevel {
  'Warning' = 'Warning',
  'Fatal' = 'Fatal',
  'Debug' = 'Debug',
  'Error' = 'Error',
  'Info' = 'Info',
  'Log' = 'Log'
}
export type AdditionalErrorReportInfo = Record<string, unknown>

export type ReportToSentryArgs = {
  /**
   * The raw JS `Error` to report to sentry.
   * If using a string, an error will be created for you like this: `new Error(error)`
   */
  error: Error | string
  /**
   * The severity level that we should report to sentry
   */
  level?: ErrorLevel
  /**
   * Any additional info to report (can be any object, but <string, string>)
   * is generally the right way to report.
   */
  additionalInfo?: AdditionalErrorReportInfo
  /**
   * An optional name to assign to the Error
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/name
   */
  name?: string
  /**
   * Attach filterable sentry tags
   * https://docs.sentry.io/platforms/javascript/enriching-events/tags/
   */
  tags?: Record<string, string>
}
