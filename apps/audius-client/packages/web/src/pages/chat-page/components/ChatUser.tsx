import { ReactNode } from 'react'

import { User } from '@audius/common'
import cn from 'classnames'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import { ProfilePicture } from 'components/notification/Notification/components/ProfilePicture'
import UserBadges from 'components/user-badges/UserBadges'

import styles from './ChatUser.module.css'

export const ChatUser = ({
  user,
  children,
  textClassName
}: {
  user: User
  children?: ReactNode
  textClassName?: string
}) => (
  <div className={styles.root}>
    <ProfilePicture user={user} className={styles.profilePicture} />
    <div className={cn(styles.text, textClassName)}>
      <ArtistPopover handle={user.handle}>
        <div className={styles.nameAndBadge}>
          <span className={styles.name}>{user.name}</span>
          <UserBadges userId={user.user_id} badgeSize={14} />
        </div>
      </ArtistPopover>
      <ArtistPopover handle={user.handle}>
        <span className={styles.handle}>@{user.handle}</span>
      </ArtistPopover>
    </div>
    {children}
  </div>
)
