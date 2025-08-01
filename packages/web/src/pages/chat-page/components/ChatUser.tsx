import { ReactNode, useCallback } from 'react'

import { User } from '@audius/common/models'
import { route } from '@audius/common/utils'
import cn from 'classnames'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import { UserLink } from 'components/link/UserLink'
import { ProfilePicture } from 'components/notification/Notification/components/ProfilePicture'
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
        <div className={styles.nameAndBadge}>
          <UserLink
            userId={user.user_id}
            popover
            onClick={goToProfile}
            className={styles.name}
            fullWidth
          />
        </div>
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
