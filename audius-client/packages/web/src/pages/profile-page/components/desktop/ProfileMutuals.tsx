import React, { useCallback } from 'react'

import { IconFollowing, IconArrow } from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'
import { createSelector } from 'reselect'

import { getUserId } from 'common/store/account/selectors'
import { getUsers } from 'common/store/cache/users/selectors'
import {
  getFolloweeFollows,
  getProfileUserId
} from 'common/store/pages/profile/selectors'
import { removeNullable } from 'common/utils/typeUtils'
import { UserProfilePictureList } from 'components/notification/Notification/components/UserProfilePictureList'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'

import styles from './ProfileMutuals.module.css'

const messages = {
  mutuals: 'Mutuals',
  viewAll: 'View All'
}

const MAX_MUTUALS = 5

const selectMutuals = createSelector(
  [getFolloweeFollows, getUsers],
  (followeeFollows, users) => {
    return followeeFollows.userIds
      .map(({ id }) => users[id])
      .filter(removeNullable)
  }
)

export const ProfileMutuals = () => {
  const userId = useSelector(getProfileUserId)
  const accountId = useSelector(getUserId)
  // @ts-ignore -- fixed in typescript v4
  const mutuals = useSelector(selectMutuals)
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    dispatch(
      setUsers({
        userListType: UserListType.MUTUAL_FOLLOWER,
        entityType: UserListEntityType.USER,
        id: userId
      })
    )
    dispatch(setVisibility(true))
  }, [dispatch, userId])

  if (userId === accountId || mutuals.length === 0) {
    return null
  }

  return (
    <div className={styles.mutualsContainer}>
      <div className={styles.titleContainer}>
        <IconFollowing className={styles.followingIcon} />
        <span className={styles.titleText}>{messages.mutuals}</span>
        <span className={styles.line} />
      </div>
      <div className={styles.contentContainer} onClick={handleClick}>
        <UserProfilePictureList
          users={mutuals}
          totalUserCount={mutuals.length}
          limit={MAX_MUTUALS}
          profilePictureClassname={styles.profilePictureWrapper}
        />
        <div className={styles.viewAll}>
          <span>{messages.viewAll}</span>
          <IconArrow className={styles.arrowIcon} />
        </div>
      </div>
    </div>
  )
}
