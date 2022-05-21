import React, { useCallback } from 'react'

import { IconTrophy, IconArrow } from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { ID } from 'common/models/Identifiers'
import { User } from 'common/models/User'
import { getUsers } from 'common/store/cache/users/selectors'
import { getProfileUser } from 'common/store/pages/profile/selectors'
import { getSupporters } from 'common/store/tipping/selectors'
import { UserProfilePictureList } from 'components/notification/Notification/components/UserProfilePictureList'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'
import { AppState } from 'store/types'
import { MAX_PROFILE_TOP_SUPPORTERS } from 'utils/constants'

import styles from './Support.module.css'

const messages = {
  topSupporters: 'Top Supporters',
  viewAll: 'View All'
}

export const TopSupporters = () => {
  const dispatch = useDispatch()
  const profile = useSelector(getProfileUser)
  const supportersMap = useSelector(getSupporters)
  const supportersForProfile = profile?.user_id
    ? supportersMap[profile.user_id] ?? {}
    : {}
  const rankedSupporters = useSelector<AppState, User[]>(state => {
    const usersMap = getUsers(state, {
      ids: (Object.keys(supportersForProfile) as unknown) as ID[]
    })
    return Object.keys(supportersForProfile)
      .sort((k1, k2) => {
        return (
          supportersForProfile[(k1 as unknown) as ID].rank -
          supportersForProfile[(k2 as unknown) as ID].rank
        )
      })
      .map(k => usersMap[(k as unknown) as ID])
      .filter(Boolean)
  })

  const handleClick = useCallback(() => {
    if (profile) {
      dispatch(
        setUsers({
          userListType: UserListType.SUPPORTER,
          entityType: UserListEntityType.USER,
          id: profile.user_id
        })
      )
      dispatch(setVisibility(true))
    }
  }, [profile, dispatch])

  return profile && rankedSupporters.length > 0 ? (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <IconTrophy className={styles.trophyIcon} />
        <span className={styles.titleText}>{messages.topSupporters}</span>
        <span className={cn(styles.line, styles.topSupportersLine)} />
      </div>
      <div className={styles.topSupportersContainer} onClick={handleClick}>
        <UserProfilePictureList
          users={rankedSupporters}
          totalUserCount={profile.supporter_count}
          limit={MAX_PROFILE_TOP_SUPPORTERS}
          stopPropagation
        />
        <div className={styles.viewAll}>
          <span>{messages.viewAll}</span>
          <IconArrow className={styles.arrowIcon} />
        </div>
      </div>
    </div>
  ) : null
}
