import { ReactNode } from 'react'

import { Route, RouteProps } from 'react-router-dom'

import EmptyPage from 'pages/empty-page/EmptyPage'

type DesktopRouteProps = RouteProps & {
  element: ReactNode
  isMobile?: boolean
}

/**
 * Route that only renders on desktop
 */
export const DesktopRoute = ({
  element,
  isMobile,
  ...routeProps
}: DesktopRouteProps) => {
  return <Route {...routeProps} element={isMobile ? <EmptyPage /> : element} />
}
