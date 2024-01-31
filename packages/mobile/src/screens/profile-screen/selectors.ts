import {
  accountSelectors,
  profilePageSelectors,
  CommonState
} from '@audius/common/store'
import { useContext } from 'react'

import type {} from '@audius/common'

import { useProxySelector } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import type { User } from '@audius/common/models'
import type { Nullable } from '@audius/common/utils'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'

import { CollapsibleTabNavigatorContext } from 'app/components/top-tab-bar'
import { useRoute } from 'app/hooks/useRoute'

const { getProfileUser, getProfileStatus, makeGetProfile, getProfileUserId } =
  profilePageSelectors
const { getAccountUser, getUserId } = accountSelectors

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

  const profile = useProxySelector(
    (state) => {
      const profile = isAccountUser
        ? getAccountUser(state)
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

export const getIsOwner = createSelector(
  (state: CommonState, handle: string) => getProfileUserId(state, handle),
  getUserId,
  (profileUserId, accountUserId) => accountUserId === profileUserId
)

export const useIsProfileLoaded = () => {
  const { params } = useRoute<'Profile'>()
  const { handle } = params
  const profileStatus = useSelector((state) =>
    getProfileStatus(state, handle?.toLowerCase())
  )

  return handle === 'accountUser' || profileStatus === Status.SUCCESS
}
