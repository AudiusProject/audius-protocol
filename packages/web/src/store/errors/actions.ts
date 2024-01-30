import {
  ErrorLevel,
  AdditionalErrorReportInfo,
  ReportToSentryArgs
} from '@audius/common/models'
import {} from '@audius/common'

export const HANDLE_ERROR = 'ERROR/HANDLE_ERROR'
export const OPEN_ERROR_PAGE = 'ERROR/OPEN_ERROR_PAGE'

export enum UiErrorCode {
  UNKNOWN,
  RELAY_BLOCKED
}

export type HandleErrorAction = {
  type: typeof HANDLE_ERROR
  name?: string
  message: string
  shouldReport: boolean
  shouldRedirect: boolean
  // by default the handler redirects to the error page if
  // shouldRedirect is true unless a redirectRoute is passed in
  shouldToast?: boolean

  additionalInfo?: AdditionalErrorReportInfo
  level?: ErrorLevel
  uiErrorCode: UiErrorCode
}

export type OpenErrorPageAction = {
  type: typeof OPEN_ERROR_PAGE
}

export type HandleErrorArgs = {
  shouldRedirect: boolean
  shouldReport?: boolean
  shouldToast?: boolean
  message: string
  uiErrorCode?: UiErrorCode
} & Omit<ReportToSentryArgs, 'error'>

export const handleError = ({
  name,
  message,
  shouldReport = true,
  shouldRedirect,
  shouldToast,
  additionalInfo = {},
  level,
  uiErrorCode = UiErrorCode.UNKNOWN
}: HandleErrorArgs): HandleErrorAction => ({
  type: HANDLE_ERROR,
  name,
  message,
  shouldRedirect,
  shouldReport,
  shouldToast,
  additionalInfo,
  level,
  uiErrorCode
})

export const openErrorPage = (): OpenErrorPageAction => ({
  type: OPEN_ERROR_PAGE
})
