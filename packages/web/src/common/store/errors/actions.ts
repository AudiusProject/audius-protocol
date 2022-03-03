import { ERROR_PAGE } from 'utils/route'

import { Level } from './level'
import { AdditionalInfo, ReportToSentryArgs } from './reportToSentry'

export const HANDLE_ERROR = 'ERROR/HANDLE_ERROR'

export type HandleErrorAction = {
  type: typeof HANDLE_ERROR
  name?: string
  message: string
  shouldRedirect: boolean
  // by default the handler redirects to the error page if
  // shouldRedirect is true unless a redirectRoute is passed in
  redirectRoute?: string
  shouldReport: boolean
  shouldToast?: boolean

  additionalInfo?: AdditionalInfo
  level?: Level
}

type HandleActions = HandleErrorAction

type HandleErrorArgs = {
  shouldRedirect: boolean
  redirectRoute?: string
  shouldReport?: boolean
  shouldToast?: boolean
  message: string
} & Omit<ReportToSentryArgs, 'error'>

export const handleError = ({
  name,
  message,
  shouldRedirect,
  redirectRoute = ERROR_PAGE,
  shouldReport = true,
  shouldToast,
  additionalInfo = {},
  level
}: HandleErrorArgs): HandleActions => ({
  type: HANDLE_ERROR,
  name,
  message,
  shouldRedirect,
  redirectRoute,
  shouldReport,
  shouldToast,
  additionalInfo,
  level
})
