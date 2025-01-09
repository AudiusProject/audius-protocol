import { MouseEventHandler, useCallback } from 'react'

import { useUser } from '@audius/common/api'
import { UserMetadata } from '@audius/common/models'
import { route } from '@audius/common/utils'
import cn from 'classnames'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import UserBadges from 'components/user-badges/UserBadges'
import { useNavigateToPage } from 'hooks/useNavigateToPage'

import styles from './UserNameAndBadges.module.css'

const { profilePage } = route

type BaseUserNameAndBadgesProps = {
  onNavigateAway?: () => void
  classes?: {
    name?: string
  }
}
type UserNameAndBadgesImplProps = BaseUserNameAndBadgesProps & {
  user: UserMetadata
}
type UserNameAndBadgesWithIdProps = BaseUserNameAndBadgesProps & {
  userId: number
}
type UserNameAndBadgesProps =
  | UserNameAndBadgesImplProps
  | UserNameAndBadgesWithIdProps

const UserNameAndBadgesImpl = (props: UserNameAndBadgesImplProps) => {
  const { user, onNavigateAway, classes } = props
  const navigate = useNavigateToPage()
  const handleClick: MouseEventHandler = useCallback(
    (event) => {
      event.stopPropagation()
      navigate(profilePage(user.handle))
      onNavigateAway?.()
    },
    [navigate, onNavigateAway, user]
  )
  if (!user) {
    return null
  }
  return (
    <ArtistPopover
      handle={user.handle}
      component='span'
      onNavigateAway={onNavigateAway}
      containerClassName={styles.container}
    >
      <div className={styles.nameAndBadge} onClick={handleClick}>
        <span className={cn(styles.name, classes?.name)}>{user.name}</span>
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

const LoadUserAndRender = (props: UserNameAndBadgesWithIdProps) => {
  const { data: user } = useUser(props.userId)
  if (!user) return null
  return <UserNameAndBadgesImpl {...props} user={user} />
}

function isIdProps(
  props: UserNameAndBadgesProps
): props is UserNameAndBadgesWithIdProps {
  return (props as UserNameAndBadgesWithIdProps).userId != null
}

export const UserNameAndBadges = (props: UserNameAndBadgesProps) => {
  return isIdProps(props) ? (
    <LoadUserAndRender {...props} />
  ) : (
    <UserNameAndBadgesImpl {...props} />
  )
}
