import { Level } from './level'
import { AdditionalInfo, ReportToSentryArgs } from './reportToSentry'

export const HANDLE_ERROR = 'ERROR/HANDLE_ERROR'

export type HandleErrorAction = {
  type: typeof HANDLE_ERROR
  name?: string
  message: string
  shouldRedirect: boolean
  shouldReport: boolean
  shouldToast?: boolean

  additionalInfo?: AdditionalInfo
  level?: Level
}

type HandleActions = HandleErrorAction

type HandleErrorArgs = {
  shouldRedirect: boolean
  shouldReport?: boolean
  shouldToast?: boolean
  message: string
} & Omit<ReportToSentryArgs, 'error'>

export const handleError = ({
  name,
  message,
  shouldRedirect,
  shouldReport = true,
  shouldToast,
  additionalInfo = {},
  level
}: HandleErrorArgs): HandleActions => ({
  type: HANDLE_ERROR,
  name,
  message,
  shouldRedirect,
  shouldReport,
  shouldToast,
  additionalInfo,
  level
})
