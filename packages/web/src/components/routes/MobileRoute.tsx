import { ReactNode } from 'react'

import { Route, RouteProps } from 'react-router-dom'

import EmptyPage from 'pages/empty-page/EmptyPage'

type MobileRouteProps = RouteProps & {
  element: ReactNode
  isMobile?: boolean
}

/**
 * Route that only renders on mobile
 */
export const MobileRoute = ({
  element,
  isMobile,
  ...routeProps
}: MobileRouteProps) => {
  return <Route {...routeProps} element={!isMobile ? <EmptyPage /> : element} />
}
