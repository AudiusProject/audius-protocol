import { cacheUsersSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { AppState } from 'store/types'
import { getPathname } from 'utils/route'
import { parseUserRoute } from 'utils/route/userRouteParser'

const { getUser } = cacheUsersSelectors

export const useProfileParams = () => {
  const location = useLocation()
  const pathname = getPathname(location)
  const params = parseUserRoute(pathname)
  const handle = params?.handle
  const userId = params?.userId

  return useSelector((state: AppState) => {
    return getUser(state, { handle, id: userId })
  })
}
