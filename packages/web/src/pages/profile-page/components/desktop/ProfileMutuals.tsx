import { useCallback } from 'react'

import {
  removeNullable,
  accountSelectors,
  cacheUsersSelectors,
  profilePageSelectors
} from '@audius/common'
import {} from '@audius/stems'
import { IconUserFollowing } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'
import { createSelector } from 'reselect'

import { ProfilePageNavSectionTitle } from 'components/profile-page-nav-section-title/ProfilePageNavSectionTitle'
import { ProfilePictureListTile } from 'components/profile-picture-list-tile/ProfilePictureListTile'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'

import styles from './ProfileMutuals.module.css'
const { getFolloweeFollows, getProfileUser, getProfileUserId } =
  profilePageSelectors
const { getUsers } = cacheUsersSelectors
const getUserId = accountSelectors.getUserId

const messages = {
  mutuals: 'Mutuals'
}

const MAX_MUTUALS = 5

const selectMutuals = createSelector(
  [getFolloweeFollows, getUsers],
  (followeeFollows, users) => {
    return (
      followeeFollows?.userIds
        .map(({ id }) => users[id])
        .filter(removeNullable) ?? []
    )
  }
)

export const ProfileMutuals = () => {
  const userId = useSelector(getProfileUserId)
  const accountId = useSelector(getUserId)
  const profile = useSelector(getProfileUser)

  const mutuals = useSelector(selectMutuals)
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

  if (!profile || userId === accountId || mutuals.length === 0) {
    return null
  }

  return (
    <div>
      <ProfilePageNavSectionTitle
        title={messages.mutuals}
        titleIcon={<IconUserFollowing className={styles.followingIcon} />}
      />
      <ProfilePictureListTile
        onClick={handleClick}
        users={mutuals}
        totalUserCount={profile.current_user_followee_follow_count}
        limit={MAX_MUTUALS}
        disableProfileClick
      />
    </div>
  )
}
