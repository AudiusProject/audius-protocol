import React, { ReactNode, useCallback } from 'react'

import { ErrorBoundary, ErrorBoundaryProps } from 'react-error-boundary'
import { useDispatch } from 'react-redux'

import { handleError as handleErrorAction } from 'common/store/errors/actions'
import { Level } from 'common/store/errors/level'

type HandleError = NonNullable<ErrorBoundaryProps['onError']>

type AppErrorBoundaryProps = {
  children: ReactNode
}

export const AppErrorBoundary = ({ children }: AppErrorBoundaryProps) => {
  const dispatch = useDispatch()

  const handleError: HandleError = useCallback(
    (error, errorInfo) => {
      dispatch(
        handleErrorAction({
          name: 'ReactErrorBoundary',
          message: error.message,
          shouldRedirect: true,
          additionalInfo: errorInfo,
          level: Level.Error
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
