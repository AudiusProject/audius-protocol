import type { CommonState, User } from '@audius/common'
import { accountSelectors, profilePageSelectors } from '@audius/common'
import { isEqual } from 'lodash'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'

import { useRoute } from 'app/hooks/useRoute'
const {
  getProfileUser,
  getProfileUserHandle,
  getProfileUserId,
  makeGetProfile
} = profilePageSelectors
const { getAccountUser, getUserId } = accountSelectors

// TODO: Check if the equality check is still needed to prevent rerenders here
/*
 * Selects profile user and ensures rerenders occur only for changes specified in deps
 */
export const useSelectProfileRoot = (deps: Array<keyof User>) => {
  const { params } = useRoute<'Profile'>()
  const { handle } = params
  const isAccountUser = handle === 'accountUser'

  const profile = useSelector(
    (state: CommonState) =>
      isAccountUser ? getAccountUser(state) : getProfileUser(state, params),
    (a, b) => deps.every((arg) => isEqual(a?.[arg], b?.[arg]))
  )
  return profile as User
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

  const profileHandle = useSelector(getProfileUserHandle)
  const isOwner = useSelector(getIsOwner)
  return (
    profileHandle === params.handle ||
    (params.handle === 'accountUser' && isOwner)
  )
}
