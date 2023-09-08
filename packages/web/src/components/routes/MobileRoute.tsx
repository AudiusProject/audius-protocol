import { Redirect, Route, RouteProps } from 'react-router'

import { TRENDING_PAGE } from 'utils/route'

type BaseMobileRouteProps = RouteProps & { isMobile: boolean }

const MobileRoute = <T extends BaseMobileRouteProps>(props: T) => {
  const from = Array.isArray(props.path) ? props.path[0] : props.path
  return props.isMobile ? (
    <Route {...props} />
  ) : (
    <Redirect from={from} to={TRENDING_PAGE} />
  )
}

export default MobileRoute
