import { route } from '@audius/common/utils'
import { Navigate, useLocation } from 'react-router-dom'

const { TRENDING_PAGE } = route

type MobileRouteProps = {
  isMobile: boolean
  element: React.ReactNode
}

const MobileRoute = ({ isMobile, element }: MobileRouteProps) => {
  const location = useLocation()
  return isMobile ? (
    <>{element}</>
  ) : (
    <Navigate replace to={TRENDING_PAGE} state={{ from: location.pathname }} />
  )
}

export default MobileRoute
