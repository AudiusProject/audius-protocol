import React from 'react'

import type { History } from 'history'
import { useLocation, useNavigate, useParams, Location } from 'react-router-dom'

import { useHistoryContext } from 'app/HistoryProvider'

export type RouteComponentProps<
  Params extends object = {},
  State extends object | undefined = undefined
> = {
  location: Location<State>
  navigate: (to: string) => void
  params: Params
  history: History
}

// Creates a withRouter HOC that provides location, navigate, and params
export function withRouter<
  Props extends object,
  Params extends object,
  State extends object | undefined
>(
  Component: React.ComponentType<Props>
): React.FC<Omit<Props, keyof RouteComponentProps<Params, State>>> {
  return function WithRouterWrapper(props) {
    const location = useLocation() as Location<State>
    const navigate = useNavigate()
    const { history } = useHistoryContext()
    const params = useParams()

    return (
      <Component
        {...(props as Props)}
        location={location}
        navigate={navigate}
        history={history}
        params={params}
      />
    )
  }
}
