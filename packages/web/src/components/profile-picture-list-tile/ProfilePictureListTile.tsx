import React from 'react'

import { IconArrowRight } from '@audius/harmony'

import {
  UserProfileListProps,
  UserProfilePictureList
} from 'components/notification/Notification/components/UserProfilePictureList'
import { USER_LENGTH_LIMIT } from 'components/notification/Notification/utils'

import styles from './ProfilePictureListTile.module.css'

const messages = {
  viewAll: 'View All'
}

type ProfilePictureListTileProps = UserProfileListProps & {
  onClick: () => void
}
export const ProfilePictureListTile = ({
  onClick,
  users,
  totalUserCount,
  limit = USER_LENGTH_LIMIT,
  disableProfileClick,
  disablePopover,
  stopPropagation,
  profilePictureClassname
}: ProfilePictureListTileProps) => {
  return (
    <div className={styles.tileContainer} onClick={onClick}>
      <UserProfilePictureList
        users={users}
        totalUserCount={totalUserCount}
        limit={limit}
        disableProfileClick={disableProfileClick}
        disablePopover={disablePopover}
        stopPropagation={stopPropagation}
        profilePictureClassname={profilePictureClassname}
      />
      <div className={styles.viewAll}>
        <span>{messages.viewAll}</span>
        <IconArrowRight className={styles.arrowIcon} />
      </div>
    </div>
  )
}
