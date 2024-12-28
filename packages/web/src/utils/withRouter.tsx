import React from 'react'

import { useLocation, useNavigate, useParams } from 'react-router-dom'

export type RouteComponentProps = {
  location: Location
  navigate: (to: string) => void
  params: Record<string, string>
}

// Creates a withRouter HOC that provides location, navigate, and params
export function withRouter<P extends object>(
  Component: React.ComponentType<P>
): React.FC<Omit<P, keyof RouteComponentProps>> {
  return function WithRouterWrapper(props) {
    const location = useLocation()
    const navigate = useNavigate()
    const params = useParams()

    return (
      <Component
        {...(props as P)}
        location={location}
        navigate={navigate}
        params={params}
      />
    )
  }
}
