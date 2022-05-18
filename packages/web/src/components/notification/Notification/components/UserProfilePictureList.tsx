import React from 'react'

import { User } from 'common/models/User'
import { formatCount } from 'common/utils/formatUtil'
import Tooltip from 'components/tooltip/Tooltip'

import { USER_LENGTH_LIMIT } from '../utils'

import { ProfilePicture } from './ProfilePicture'
import styles from './UserProfilePictureList.module.css'

const messages = {
  viewAllTooltip: 'View All'
}

type UserProfileListProps = {
  /**
   * Here we have both users and totalUserCount because we need the total number
   * of users which is different that the number users whose profile pictures
   * will show up.
   * Sometimes the total number of users is not available,
   * e.g. for followers and supporters, we have follower_count and supporter_count.
   * When this is the case, we use this totalUserCount prop to inform how many total users there are.
   */
  users: Array<User>
  totalUserCount: number
  limit?: number
  disableProfileClick?: boolean
  disablePopover?: boolean
  stopPropagation?: boolean
}

export const UserProfilePictureList = ({
  users,
  totalUserCount,
  limit = USER_LENGTH_LIMIT,
  disableProfileClick = false,
  disablePopover = false,
  stopPropagation = false
}: UserProfileListProps) => {
  const showUserListModal = totalUserCount > limit
  const remainingUsersCount = totalUserCount - limit

  return (
    <div className={styles.root}>
      {users
        .filter(u => !u.is_deactivated)
        .slice(0, limit)
        .map(user => (
          <ProfilePicture
            key={user.user_id}
            className={styles.profilePicture}
            user={user}
            disableClick={disableProfileClick}
            disablePopover={disablePopover}
            stopPropagation={stopPropagation}
          />
        ))}
      {showUserListModal ? (
        <Tooltip text={messages.viewAllTooltip}>
          <div className={styles.profilePictureExtraRoot}>
            <ProfilePicture
              disablePopover
              className={styles.profilePictureExtra}
              user={users[limit]}
            />
            <span className={styles.profilePictureCount}>
              {`+${formatCount(remainingUsersCount)}`}
            </span>
          </div>
        </Tooltip>
      ) : null}
    </div>
  )
}
