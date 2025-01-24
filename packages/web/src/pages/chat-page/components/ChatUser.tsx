import { ReactNode, useCallback } from 'react'

import { User } from '@audius/common/models'
import { route } from '@audius/common/utils'
import cn from 'classnames'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import { ProfilePicture } from 'components/notification/Notification/components/ProfilePicture'
import UserBadges from 'components/user-badges/UserBadges'
import { useNavigateToPage } from 'hooks/useNavigateToPage'

import styles from './ChatUser.module.css'

const { profilePage } = route

export const ChatUser = ({
  user,
  children,
  textClassName
}: {
  user: User
  children?: ReactNode
  textClassName?: string
}) => {
  const navigate = useNavigateToPage()
  const goToProfile = useCallback(
    () => navigate(profilePage(user.handle)),
    [navigate, user]
  )

  return (
    <div className={styles.root}>
      <ProfilePicture user={user} className={styles.profilePicture} />
      <div className={cn(styles.text, textClassName)}>
        <ArtistPopover handle={user.handle}>
          <div className={styles.nameAndBadge} onClick={goToProfile}>
            <span className={styles.name}>{user.name}</span>
            <UserBadges userId={user.user_id} />
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
