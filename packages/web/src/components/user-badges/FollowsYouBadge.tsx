import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import styles from './FollowsYouBadge.module.css'
import { trpc } from 'services/trpc'

const messages = {
  followsYou: 'Follows You'
}

type FollowsYouBadgeProps = {
  userId: number
  className?: string
  /** For badges appearing in a list, expose a variant with a transparent background */
  variant?: 'standard' | 'list'
}

const FollowsYouBadge = ({
  userId,
  className = '',
  variant = 'standard'
}: FollowsYouBadgeProps) => {
  const { data } = trpc.me.userRelationship.useQuery(userId.toString())
  const wm = useWithMobileStyle(styles.mobile)

  if (!data?.followsMe) return null

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
