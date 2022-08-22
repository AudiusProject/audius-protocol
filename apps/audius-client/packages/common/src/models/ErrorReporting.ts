export enum ErrorLevel {
  'Critical' = 'Critical',
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
   * The raw JS `Error` to report to sentry. If trying to report a string,
   * call this with `new Error(message)`
   */
  error: Error
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
}
