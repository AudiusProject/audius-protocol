export const HANDLE_ERROR = 'ERROR/HANDLE_ERROR'

export enum Level {
  'Critical' = 'Critical',
  'Warning' = 'Warning',
  'Fatal' = 'Fatal',
  'Debug' = 'Debug',
  'Error' = 'Error',
  'Info' = 'Info',
  'Log' = 'Log'
}

export type HandleErrorAction = {
  type: typeof HANDLE_ERROR
  message: string
  shouldRedirect: boolean
  shouldReport: boolean
  additionalInfo?: object
  level?: Level
}

type HandleActions = HandleErrorAction

type HandleErrorArgs = {
  message: string
  shouldRedirect: boolean
  shouldReport?: boolean
  additionalInfo?: object
  level?: Level
}

export const handleError = ({
  message,
  shouldRedirect,
  shouldReport = true,
  additionalInfo = {},
  level
}: HandleErrorArgs): HandleActions => ({
  type: HANDLE_ERROR,
  message,
  shouldRedirect,
  shouldReport,
  additionalInfo,
  level
})
