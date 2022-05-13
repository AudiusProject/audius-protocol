import React from 'react'

import { ID } from 'common/models/Identifiers'
import { User } from 'common/models/User'
import { formatCount } from 'common/utils/formatUtil'
import Tooltip from 'components/tooltip/Tooltip'

import { ProfilePicture } from './ProfilePicture'
import styles from './UserProfilePictureList.module.css'
import { USER_LENGTH_LIMIT } from './utils'

const messages = {
  viewAllTooltip: 'View All'
}

type UserProfileListProps = {
  users: User[]
  userIds: ID[]
}

export const UserProfilePictureList = (props: UserProfileListProps) => {
  const { users, userIds } = props
  const showUserListModal = userIds.length > USER_LENGTH_LIMIT
  const remainingUsersCount = userIds.length - USER_LENGTH_LIMIT

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
          <div className={styles.profilePictureExtraRoot}>
            <ProfilePicture
              disablePopover
              className={styles.profilePictureExtra}
              user={users[USER_LENGTH_LIMIT]}
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
