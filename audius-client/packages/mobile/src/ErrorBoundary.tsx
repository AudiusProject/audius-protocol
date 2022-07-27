import { PureComponent, useContext, useEffect } from 'react'

import type { Nullable } from '@audius/common'
import * as Sentry from '@sentry/react-native'

import { ToastContext } from './components/toast/ToastContext'

const ErrorToast = ({ error }: { error: Nullable<string> }) => {
  // Do nothing other than trigger a toast when error changes
  const { toast } = useContext(ToastContext)
  useEffect(() => {
    if (error) {
      console.error(error)
      toast({ content: 'Something went wrong', type: 'error' })
    }
  }, [toast, error])
  return null
}

class ErrorBoundary extends PureComponent {
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
