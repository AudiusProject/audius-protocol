import React from 'react'

import type { History, Location } from 'history'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { useHistoryContext } from 'app/HistoryProvider'

export type RouteComponentProps = {
  location: Location
  navigate: (to: string) => void
  params: Record<string, string>
  history: History
}

// Creates a withRouter HOC that provides location, navigate, and params
export function withRouter<P extends object>(
  Component: React.ComponentType<P>
): React.FC<Omit<P, keyof RouteComponentProps>> {
  return function WithRouterWrapper(props) {
    const location = useLocation()
    const navigate = useNavigate()
    const { history } = useHistoryContext()
    const params = useParams()

    return (
      <Component
        {...(props as P)}
        location={location}
        navigate={navigate}
        history={history}
        params={params}
      />
    )
  }
}
