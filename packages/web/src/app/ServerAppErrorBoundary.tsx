import { ReactNode, useCallback } from 'react'

import { ErrorBoundary, ErrorBoundaryProps } from 'react-error-boundary'
import { useDispatch } from 'react-redux'

import { handleError as handleErrorAction } from 'store/errors/actions'

type HandleError = NonNullable<ErrorBoundaryProps['onError']>

type ServerAppErrorBoundaryProps = {
  children: ReactNode
}

enum ErrorLevel {
  'Warning' = 'Warning',
  'Fatal' = 'Fatal',
  'Debug' = 'Debug',
  'Error' = 'Error',
  'Info' = 'Info',
  'Log' = 'Log'
}

export const ServerAppErrorBoundary = ({
  children
}: ServerAppErrorBoundaryProps) => {
  const dispatch = useDispatch()

  const handleError: HandleError = useCallback(
    (error, errorInfo) => {
      dispatch(
        handleErrorAction({
          name: 'ReactErrorBoundary',
          message: error.message,
          shouldRedirect: true,
          additionalInfo: errorInfo,
          level: ErrorLevel.Error
        })
      )
    },
    [dispatch]
  )

  return (
    <ErrorBoundary fallbackRender={() => null} onError={handleError}>
      {children}
    </ErrorBoundary>
  )
}
