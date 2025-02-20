import { useUserByParams } from '@audius/common/src/api/tan-query/useUserByParams'
import { useLocation } from 'react-router-dom'

import { getPathname } from 'utils/route'
import { parseUserRoute } from 'utils/route/userRouteParser'

export const useProfileParams = () => {
  const location = useLocation()
  const pathname = getPathname(location)
  const params = parseUserRoute(pathname)
  const handle = params?.handle ?? undefined
  const userId = params?.userId ?? undefined

  const { data: user } = useUserByParams({ userId, handle })

  return user
}
