import type { User } from '@audius/common'
import { accountSelectors, profilePageSelectors } from '@audius/common'
import { isEqual } from 'lodash'
import { createSelector } from 'reselect'

import { useRoute } from 'app/hooks/useRoute'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
const {
  getProfileUser,
  getProfileUserHandle,
  getProfileUserId,
  makeGetProfile
} = profilePageSelectors
const { getAccountUser, getUserId } = accountSelectors

/*
 * Selects profile user and ensures rerenders occur only for changes specified in deps
 */
export const useSelectProfileRoot = (deps: Array<keyof User>) => {
  const { params } = useRoute<'Profile'>()
  const { handle } = params
  const isAccountUser = handle === 'accountUser'

  const profile = useSelectorWeb(
    (state) =>
      isAccountUser ? getAccountUser(state) : getProfileUser(state, params),
    (a, b) => deps.every((arg) => isEqual(a?.[arg], b?.[arg]))
  )
  return profile
}

/*
 * Assumes existance of user for convenience. To only be used for inner
 * components that wouldn't render if user wasn't present
 */
export const useSelectProfile = (deps: Array<keyof User>) => {
  return useSelectProfileRoot(deps) as User
}

export const getProfile = makeGetProfile()

export const getIsSubscribed = createSelector(
  [getProfile],
  (profile) => profile.isSubscribed
)

export const getIsOwner = createSelector(
  [getProfileUserId, getUserId],
  (profileUserId, accountUserId) => profileUserId === accountUserId
)

export const useIsProfileLoaded = () => {
  const { params } = useRoute<'Profile'>()

  const profileHandle = useSelectorWeb(getProfileUserHandle)
  const isOwner = useSelectorWeb(getIsOwner)
  return (
    profileHandle === params.handle ||
    (params.handle === 'accountUser' && isOwner)
  )
}
