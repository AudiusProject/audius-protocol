import { useUser } from '@audius/common/api'
import { ID } from '@audius/common/models'

import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import styles from './FollowsYouBadge.module.css'

const messages = {
  followsYou: 'Follows You'
}

type FollowsYouBadgeProps = {
  userId: ID
  className?: string
  /** For badges appearing in a list, expose a variant with a transparent background */
  variant?: 'standard' | 'list'
}

const FollowsYouBadge = ({
  userId,
  className = '',
  variant = 'standard'
}: FollowsYouBadgeProps) => {
  const wm = useWithMobileStyle(styles.mobile)
  const { data: user } = useUser(userId)

  if (!user?.does_follow_current_user) return null

  return (
    <div
      className={wm(
        styles.badge,
        { [styles.list]: variant === 'list' },
        className
      )}
    >
      {messages.followsYou}
    </div>
  )
}

export default FollowsYouBadge
