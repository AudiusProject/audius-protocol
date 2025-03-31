import { PureComponent, ReactNode } from 'react'

import { captureException, captureMessage } from '@sentry/browser'

type ErrorWrapperProps = {
  children: ReactNode
  errorMessage?: string
}

class ErrorWrapper extends PureComponent<ErrorWrapperProps> {
  state = {
    didError: false
  }

  componentDidCatch(error: Error | null, errorInfo: object) {
    this.setState({ didError: true })
    const { errorMessage } = this.props
    if (errorMessage) captureMessage(errorMessage)
    captureException(error)
  }

  render() {
    if (this.state.didError) {
      return null
    }
    return this.props.children
  }
}

export default ErrorWrapper
