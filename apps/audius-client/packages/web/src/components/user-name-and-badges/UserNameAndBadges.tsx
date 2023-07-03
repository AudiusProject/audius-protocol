import { useCallback } from 'react'

import { UserMetadata } from '@audius/common'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import UserBadges from 'components/user-badges/UserBadges'
import { useGoToRoute } from 'hooks/useGoToRoute'
import { profilePage } from 'utils/route'

import styles from './UserNameAndBadges.module.css'

export const UserNameAndBadges = ({
  user,
  onNavigateAway
}: {
  user: UserMetadata
  onNavigateAway?: () => void
}) => {
  const goToRoute = useGoToRoute()
  const goToProfile = useCallback(() => {
    goToRoute(profilePage(user.handle))
    onNavigateAway?.()
  }, [goToRoute, onNavigateAway, user])
  if (!user) {
    return null
  }
  return (
    <ArtistPopover
      handle={user.handle}
      component='span'
      onNavigateAway={onNavigateAway}
    >
      <div className={styles.nameAndBadge} onClick={goToProfile}>
        <span>{user.name}</span>
        <UserBadges
          userId={user.user_id}
          className={styles.badges}
          badgeSize={14}
          inline
        />
      </div>
    </ArtistPopover>
  )
}
