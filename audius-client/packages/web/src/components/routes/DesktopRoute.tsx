import React from 'react'

import { Redirect, Route, RouteProps } from 'react-router'

import { TRENDING_PAGE } from 'utils/route'

type BaseDesktopRouteProps = RouteProps & { isMobile: boolean }

const DesktopRoute = <T extends BaseDesktopRouteProps>(props: T) => {
  const from = Array.isArray(props.path) ? props.path[0] : props.path
  return props.isMobile ? (
    <Redirect from={from} to={TRENDING_PAGE} />
  ) : (
    <Route {...props} />
  )
}

export default DesktopRoute
