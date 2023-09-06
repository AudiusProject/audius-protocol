import { useCallback } from 'react'

import { UserMetadata } from '@audius/common'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import UserBadges from 'components/user-badges/UserBadges'
import { useGoToRoute } from 'hooks/useGoToRoute'
import { profilePage } from 'utils/route'

import styles from './UserNameAndBadges.module.css'

type UserNameAndBadgesProps = {
  user: UserMetadata
  onNavigateAway?: () => void
  classes?: {
    name?: string
  }
}

export const UserNameAndBadges = (props: UserNameAndBadgesProps) => {
  const { user, onNavigateAway, classes } = props
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
        <span className={classes?.name}>{user.name}</span>
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
