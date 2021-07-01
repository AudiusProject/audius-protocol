import React from 'react'

import * as Sentry from '@sentry/browser'

export type ErrorWrapperProps = {
  errorMessage?: string
}

class ErrorWrapper extends React.PureComponent<ErrorWrapperProps> {
  state = {
    didError: false
  }

  componentDidCatch(error: Error | null, errorInfo: object) {
    this.setState({ didError: true })
    const { errorMessage } = this.props
    if (errorMessage) Sentry.captureMessage(errorMessage)
    Sentry.captureException(error)
  }

  render() {
    if (this.state.didError) {
      return null
    }
    return this.props.children
  }
}

export default ErrorWrapper
