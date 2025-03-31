import type { ReactNode } from 'react'
import { PureComponent } from 'react'

import { Feature } from '@audius/common/models'
import * as Sentry from '@sentry/react-native'

type NotificationErrorBoundaryProps = {
  children: ReactNode
}

export class NotificationErrorBoundary extends PureComponent<NotificationErrorBoundaryProps> {
  state = {
    error: null
  }

  componentDidCatch(error: Error | null, errorInfo: any) {
    this.setState({ error: error?.message })

    Sentry.withScope((scope) => {
      scope.setExtras(errorInfo)
      scope.setTag('feature', Feature.Notifications)
      Sentry.captureException(error)
    })
  }

  render() {
    const { error } = this.state
    const { children } = this.props

    if (error) return null
    return <>{children}</>
  }
}
