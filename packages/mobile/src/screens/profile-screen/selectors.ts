import { useContext } from 'react'

import { useCurrentAccountUser } from '@audius/common/api'
import { useProxySelector } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import type { User } from '@audius/common/models'
import { profilePageSelectors } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import { useSelector } from 'react-redux'

import { CollapsibleTabNavigatorContext } from 'app/components/top-tab-bar'
import { useRoute } from 'app/hooks/useRoute'

const { getProfileUser, getProfileStatus, makeGetProfile } =
  profilePageSelectors

/*
 * Selects profile user and ensures rerenders occur only for changes specified in deps
 */
export const useSelectProfileRoot = <K extends keyof User>(
  deps: K[],
  paramsProp?: Record<string, unknown>
) => {
  const { params: paramsRoute } = useRoute<'Profile'>()
  const params = paramsProp ?? paramsRoute
  const { handle } = params
  const isAccountUser = handle === 'accountUser'
  const { data: accountUser } = useCurrentAccountUser()

  const profile = useProxySelector(
    (state) => {
      const profile =
        isAccountUser && accountUser
          ? accountUser
          : getProfileUser(state, params)
      if (!profile) return null

      const profileSlice = {} as Partial<User>
      deps.forEach((dep) => {
        profileSlice[dep] = profile[dep]
      })

      return profileSlice
    },
    [isAccountUser, ...deps, params.handle, params.id]
  )
  return profile as Nullable<Pick<User, K>>
}

/*
 * Assumes existance of user for convenience. To only be used for inner
 * components that wouldn't render if user wasn't present
 */
export const useSelectProfile = <K extends keyof User>(deps: K[]) => {
  const { params } = useContext(CollapsibleTabNavigatorContext)
  return useSelectProfileRoot(deps, params) as Pick<User, K>
}

export const getProfile = makeGetProfile()

export const useIsProfileLoaded = () => {
  const { params } = useRoute<'Profile'>()
  const { handle } = params
  const profileStatus = useSelector((state) =>
    getProfileStatus(state, handle?.toLowerCase())
  )

  return handle === 'accountUser' || profileStatus === Status.SUCCESS
}
