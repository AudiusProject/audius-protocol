import { useCallback } from 'react'

import { useMutualFollowers, useUsers } from '@audius/common/api'
import { User } from '@audius/common/models'
import { accountSelectors, profilePageSelectors } from '@audius/common/store'
import { Flex, IconUserFollowing } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'

import { ProfilePageNavSectionTitle } from './ProfilePageNavSectionTitle'
import { ProfilePictureListTile } from './ProfilePictureListTile'

const { getProfileUser, getProfileUserId } = profilePageSelectors
const { getUserId } = accountSelectors

const messages = {
  mutuals: 'Mutuals'
}

const MAX_MUTUALS = 5

export const ProfileMutuals = () => {
  const userId = useSelector(getProfileUserId)
  const accountId = useSelector(getUserId)
  const profile = useSelector(getProfileUser) as User | null
  const { data: mutuals } = useMutualFollowers({
    userId,
    pageSize: MAX_MUTUALS
  })

  const { data: users = [] } = useUsers(mutuals)

  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    if (!userId) return
    dispatch(
      setUsers({
        userListType: UserListType.MUTUAL_FOLLOWER,
        entityType: UserListEntityType.USER,
        id: userId
      })
    )
    dispatch(setVisibility(true))
  }, [dispatch, userId])

  if (!profile || userId === accountId || !mutuals || mutuals.length === 0) {
    return null
  }

  return (
    <Flex column gap='m'>
      <ProfilePageNavSectionTitle
        title={messages.mutuals}
        Icon={IconUserFollowing}
      />
      <ProfilePictureListTile
        onClick={handleClick}
        users={users}
        totalUserCount={profile.current_user_followee_follow_count}
        limit={MAX_MUTUALS}
        disableProfileClick
      />
    </Flex>
  )
}
