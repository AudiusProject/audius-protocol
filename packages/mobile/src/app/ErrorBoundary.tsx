import type { ReactNode } from 'react'
import { PureComponent, useEffect } from 'react'

import type { Nullable } from '@audius/common/utils'
import * as Sentry from '@sentry/react-native'

import { useToast } from 'app/hooks/useToast'
import { make, track } from 'app/services/analytics'
import { EventNames } from 'app/types/analytics'

type ErrorToastProps = {
  error: Nullable<string>
}

const ErrorToast = (props: ErrorToastProps) => {
  const { error } = props
  // Do nothing other than trigger a toast when error changes
  const { toast } = useToast()

  useEffect(() => {
    if (error) {
      console.error(error)
      toast({ content: 'Something went wrong', type: 'error' })
    }
  }, [toast, error])
  return null
}

type ErrorBoundaryProps = {
  children: ReactNode
}

class ErrorBoundary extends PureComponent<ErrorBoundaryProps> {
  state = {
    error: null
  }

  componentDidCatch(error: Error | null, errorInfo: any) {
    // On catch set the error state so it triggers a toast
    this.setState({ error: error?.message })
    Sentry.withScope((scope) => {
      scope.setExtras(errorInfo)
      Sentry.captureException(error)
    })
    track(
      make({
        eventName: EventNames.APP_ERROR,
        message: error?.message
      })
    )
  }

  render() {
    return (
      <>
        <ErrorToast error={this.state.error} />
        {this.props.children}
      </>
    )
  }
}

export default ErrorBoundary
