import { ReactNode, useCallback } from 'react'

import { User } from '@audius/common/models'
import cn from 'classnames'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import { ProfilePicture } from 'components/notification/Notification/components/ProfilePicture'
import UserBadges from 'components/user-badges/UserBadges'
import { useGoToRoute } from 'hooks/useGoToRoute'
import { profilePage } from 'utils/route'

import styles from './ChatUser.module.css'

export const ChatUser = ({
  user,
  children,
  textClassName
}: {
  user: User
  children?: ReactNode
  textClassName?: string
}) => {
  const goToRoute = useGoToRoute()
  const goToProfile = useCallback(
    () => goToRoute(profilePage(user.handle)),
    [goToRoute, user]
  )

  return (
    <div className={styles.root}>
      <ProfilePicture user={user} className={styles.profilePicture} />
      <div className={cn(styles.text, textClassName)}>
        <ArtistPopover handle={user.handle}>
          <div className={styles.nameAndBadge} onClick={goToProfile}>
            <span className={styles.name}>{user.name}</span>
            <UserBadges userId={user.user_id} badgeSize={14} />
          </div>
        </ArtistPopover>
        <ArtistPopover handle={user.handle}>
          <span className={styles.handle} onClick={goToProfile}>
            @{user.handle}
          </span>
        </ArtistPopover>
      </div>
      {children}
    </div>
  )
}
