import { MouseEventHandler, ReactNode, useCallback } from 'react'

import { useGetUserById } from '@audius/common/api'
import { UserMetadata } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import UserBadges from 'components/user-badges/UserBadges'
import { useGoToRoute } from 'hooks/useGoToRoute'
import { profilePage } from 'utils/route'

import styles from './UserNameAndBadges.module.css'
import { CSSObject } from '@emotion/react'

const { getUserId } = accountSelectors

type BaseUserNameAndBadgesProps = {
  onNavigateAway?: () => void
  renderName?: (name: string) => ReactNode
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
  const { user, onNavigateAway, classes, renderName } = props
  const goToRoute = useGoToRoute()
  const handleClick: MouseEventHandler = useCallback(
    (event) => {
      event.stopPropagation()
      goToRoute(profilePage(user.handle))
      onNavigateAway?.()
    },
    [goToRoute, onNavigateAway, user]
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
        {renderName ? (
          renderName(user.name)
        ) : (
          <span className={cn(styles.name, classes?.name)}>{user.name}</span>
        )}
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
  const currentUserId: number = useSelector(getUserId)!
  const { data: user } = useGetUserById({ id: props.userId, currentUserId })
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
