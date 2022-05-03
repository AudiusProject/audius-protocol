import React from 'react'

import { User } from 'common/models/User'
import { formatCount } from 'common/utils/formatUtil'
import Tooltip from 'components/tooltip/Tooltip'

import { ProfilePicture } from './ProfilePicture'
import styles from './UserProfilePictureList.module.css'

const messages = {
  viewAllTooltip: 'View All'
}

const USER_LENGTH_LIMIT = 8

type UserProfileListProps = {
  users: Array<User>
}

export const UserProfilePictureList = ({ users }: UserProfileListProps) => {
  const showUserListModal = users.length > USER_LENGTH_LIMIT
  const remainingUsersCount = users.length - USER_LENGTH_LIMIT

  return (
    <div className={styles.root}>
      {users
        .filter(u => !u.is_deactivated)
        .slice(0, USER_LENGTH_LIMIT)
        .map(user => (
          <ProfilePicture
            key={user.user_id}
            className={styles.profilePicture}
            user={user}
          />
        ))}
      {showUserListModal ? (
        <Tooltip text={messages.viewAllTooltip}>
          <div style={{ position: 'relative' }}>
            <ProfilePicture
              disablePopover
              className={styles.profilePictureExtra}
              user={users[users.length - 1]}
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
