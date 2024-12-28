import { route } from '@audius/common/utils'
import { Navigate, useLocation } from 'react-router-dom'

const { TRENDING_PAGE } = route

type DesktopRouteProps = {
  isMobile: boolean
  element: React.ReactNode
}

const DesktopRoute = ({ isMobile, element }: DesktopRouteProps) => {
  const location = useLocation()
  return isMobile ? (
    <Navigate replace to={TRENDING_PAGE} state={{ from: location.pathname }} />
  ) : (
    <>{element}</>
  )
}

export default DesktopRoute
