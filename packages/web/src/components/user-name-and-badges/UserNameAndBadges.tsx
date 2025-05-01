import { MouseEventHandler, useCallback } from 'react'

import { useUser } from '@audius/common/api'
import { UserMetadata } from '@audius/common/models'
import { route } from '@audius/common/utils'
import cn from 'classnames'
import { pick } from 'lodash'

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

export const UserNameAndBadges = (props: UserNameAndBadgesProps) => {
  const { onNavigateAway, classes } = props
  const userId = 'userId' in props ? props.userId : props.user.user_id
  const { data: partialUser } = useUser(userId, {
    select: (user) => pick(user, ['handle', 'name', 'user_id'])
  })

  const user = 'user' in props ? props.user : partialUser

  const navigate = useNavigateToPage()
  const handleClick: MouseEventHandler = useCallback(
    (event) => {
      event.stopPropagation()
      if (user?.handle) {
        navigate(profilePage(user.handle))
        onNavigateAway?.()
      }
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
        <UserBadges userId={user.user_id} className={styles.badges} inline />
      </div>
    </ArtistPopover>
  )
}
